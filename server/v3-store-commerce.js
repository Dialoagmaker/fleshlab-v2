import { matchesVerifiedBuyer, exactPurchaseContent, classifyLoyalFansObservation } from './loyalfans-ppv-protocol.js';
import { randomUUID } from 'node:crypto';
import { loyalFansPurchaseDestination } from './loyalfans-purchase-evidence.js';
import { V3BuyerLinkRepository } from './v3-buyer-links.js';
import { HttpError } from './errors.js';
import { V3ExternalContentMappingRepository } from './v3-external-content-mappings.js';
const conflict = () => { throw new HttpError(409, 'PAYMENT_REQUIRES_REVIEW', 'This payment requires review.'); };
export function validateVerifiedTransaction(order, transaction, mapping) {
  const t = transaction;
  // LoyalFans' observed buy request carries no FLESHLAB correlation. A claim
  // therefore needs an explicit server-verified provider transaction bound to
  // the already verified member UID. Client buy success never qualifies.
  const verifiedClaim = order.processor === 'loyalfans' && t.claimVerified === true &&
    t.finalityVerified === true && t.correlation == null && t.buyerUid === order.linked_buyer_uid;
  const correlated = Boolean(order.verified_buyer_uid && order.commerce_correlation) && t.buyerUid === order.verified_buyer_uid &&
    t.correlation === order.commerce_correlation;
  if (t.verified !== true || t.buyerVerified !== true || (!correlated && !verifiedClaim)) conflict();
  if (order.processor === 'loyalfans' && (t.finalityVerified !== true ||
      t.transactionType !== 'clip_store' ||
      !/^[A-Za-z0-9_-]{16,255}$/.test(t.transactionId || '') ||
      !/^[A-Za-z0-9_-]{16,255}$/.test(order.external_content_uid || ''))) conflict();
  if ((order.external_content_uid && t.contentUid !== order.external_content_uid) || t.provider !== order.processor || !t.transactionId || !t.contentUid || mapping?.video_legacy_id !== order.product_id || order.purchase_type !== 'ppv') conflict();
  if (!Number.isSafeInteger(t.amountMinor) || t.amountMinor !== Number(order.total_minor) || !/^[A-Z]{3}$/.test(t.currency || '') || t.currency !== order.currency) conflict();
  if (!Number.isSafeInteger(t.revision) || t.revision < 0 || !['pending','paid','failed','refunded','chargeback','reversed'].includes(t.status)) conflict();
}
export function publicCommerceOrder(row) {
  return { id: row.id, product_id: row.product_id, purchase_type: row.purchase_type, amount_minor: Number(row.total_minor), currency: row.currency, status: row.status, fulfillment_status: row.fulfillment_status, verification_state: row.verification_state || 'waiting_for_purchase', purchase_launch_url: row.purchase_destination && row.status==='pending' ? '/api/v3/commerce/orders/' + encodeURIComponent(row.id) + '/purchase' : null };
}
export class V3StoreCommerceService {
  constructor(db, registry, access, offers, provider = 'loyalfans') { Object.assign(this, { db, registry, access, offers, provider }); }
  async checkout(user, input, request = {}) {
    await this.access.customer(user);
    const adapter = this.registry.get(this.provider);
    if (adapter.capabilities?.hostedPurchase !== true) throw new HttpError(503,'CHECKOUT_UNAVAILABLE','Checkout is unavailable.');
    if (this.provider === 'loyalfans') return this.checkoutLoyalFans(user, input, request);
    const offer = await this.offers.offerByInput(input);
    if (offer.purchase_type !== 'ppv') throw new HttpError(422,'OFFER_UNAVAILABLE','This offer is unavailable.');
    const mappings = (await new V3ExternalContentMappingRepository(this.db).findByVideoId(offer.product_id)).filter(m => m.provider===this.provider && m.status==='active');
    if (mappings.length!==1) throw new HttpError(409,'PURCHASE_MAPPING_REQUIRED','This purchase is unavailable.');
    const mapping=mappings[0]; const destination=loyalFansPurchaseDestination(mapping.public_url);
    const key=String(request.headers?.['idempotency-key'] || input.idempotency_key || '');
    if(!/^[A-Za-z0-9._:-]{12,160}$/.test(key)) throw new HttpError(422,'IDEMPOTENCY_KEY_REQUIRED','A checkout key is required.');
    const client=await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[key]);
      const prior=(await client.query('SELECT * FROM v3_commerce_orders WHERE idempotency_key=$1',[key])).rows[0];
      if(prior) { if(prior.user_id!==user.id || prior.product_id!==offer.product_id || prior.processor!==this.provider) conflict(); await client.query('COMMIT'); return {order:publicCommerceOrder(prior)}; }
      const customer=(await client.query(`INSERT INTO v3_commerce_customers(user_id,external_reference) VALUES($1,$1) ON CONFLICT(user_id) DO UPDATE SET updated_at=now() RETURNING id`,[user.id])).rows[0];
      const row=(await client.query(`INSERT INTO v3_commerce_orders(customer_id,user_id,purchase_type,product_id,subscription_plan_id,processor,status,currency,total_minor,idempotency_key,commerce_correlation,external_content_uid,purchase_destination,fulfillment_status) VALUES($1,$2,'ppv',$3,$4,$5,'pending',$6,$7,$8,$9,$10,$11,'pending') RETURNING *`,[customer.id,user.id,offer.product_id,offer.plan_id,this.provider,offer.currency,offer.amount_minor,key,randomUUID(),mapping.external_content_uid,destination])).rows[0];
      await client.query('COMMIT'); return {order:publicCommerceOrder(row)};
    } catch(error) { await client.query('ROLLBACK').catch(()=>{}); throw error; } finally { client.release(); }
  }
  async checkoutLoyalFans(user, input, request = {}) {
    const adapter = this.registry.get('loyalfans');
    if (adapter.capabilities?.buyerIdentity !== true || adapter.capabilities?.authoritativeVerification !== true ||
        adapter.status?.().status !== 'CONNECTED') {
      throw new HttpError(503,'LOYALFANS_BRIDGE_NOT_READY','LoyalFans checkout is unavailable until server-side buyer verification and transaction reconciliation are ready.');
    }
    const productId = String(input.product_id || '').trim();
    if (!productId || productId.length > 200) throw new HttpError(422,'PRODUCT_ID_REQUIRED','A FLESHLAB video is required.');
    const mappings = (await new V3ExternalContentMappingRepository(this.db).findByVideoId(productId))
      .filter(mapping => mapping.provider === 'loyalfans' && mapping.status === 'active');
    if (mappings.length !== 1) throw new HttpError(409,'PURCHASE_MAPPING_REQUIRED','This purchase requires one exact active LoyalFans post mapping.');
    const mapping = mappings[0];
    const catalogue = await this.db.query(`SELECT p.loyalfans_post_uid,p.video_legacy_id,p.current_price_minor,p.currency,p.title,p.source_updated_at
      FROM v3_loyalfans_catalogue_products p
      JOIN v3_catalogue_external_content_mappings m ON m.provider='loyalfans' AND m.external_content_uid=p.loyalfans_post_uid
        AND m.video_legacy_id=p.video_legacy_id AND m.status='active'
      JOIN catalog_videos v ON v.legacy_id=p.video_legacy_id AND v.status='published' AND v.v3_lifecycle='published'
      WHERE p.loyalfans_post_uid=$1 AND p.video_legacy_id=$2 AND p.sync_status='active'
        AND p.availability_state='available' AND p.can_buy=true`, [mapping.external_content_uid, productId]);
    if (!catalogue.rowCount) throw new HttpError(422,'LOYALFANS_PRODUCT_UNAVAILABLE','This LoyalFans Store item is not currently available for purchase.');
    const product = catalogue.rows[0];
    const amountMinor = Number(product.current_price_minor);
    const currency = String(product.currency || '').trim().toUpperCase();
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 0 || !/^[A-Z]{3}$/.test(currency)) throw new HttpError(503,'LOYALFANS_PRICE_UNAVAILABLE','The synchronized LoyalFans price is unavailable.');
    const destination = loyalFansPurchaseDestination(mapping.public_url);
    const key=String(request.headers?.['idempotency-key'] || input.idempotency_key || '');
    if(!/^[A-Za-z0-9._:-]{12,160}$/.test(key)) throw new HttpError(422,'IDEMPOTENCY_KEY_REQUIRED','A checkout key is required.');
    const client=await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`loyalfans:checkout:${key}`]);
      const prior=(await client.query('SELECT * FROM v3_commerce_orders WHERE idempotency_key=$1 FOR UPDATE',[key])).rows[0];
      if(prior) {
        if(prior.user_id!==user.id || prior.product_id!==productId || prior.processor!=='loyalfans' || prior.external_content_uid!==product.loyalfans_post_uid) conflict();
        await client.query('COMMIT');
        return {order:publicCommerceOrder(prior)};
      }
      const customer=(await client.query(`INSERT INTO v3_commerce_customers(user_id,external_reference) VALUES($1,$1)
        ON CONFLICT(user_id) DO UPDATE SET updated_at=now() RETURNING id`,[user.id])).rows[0];
      const metadata={loyalfans_post_uid:product.loyalfans_post_uid,loyalfans_title:product.title,
        price_snapshot_minor:amountMinor,currency,source_updated_at:product.source_updated_at};
      const row=(await client.query(`INSERT INTO v3_commerce_orders(customer_id,user_id,purchase_type,product_id,subscription_plan_id,
        processor,status,currency,total_minor,idempotency_key,commerce_correlation,external_content_uid,purchase_destination,
        fulfillment_status,metadata)
        VALUES($1,$2,'ppv',$3,NULL,'loyalfans','pending',$4,$5,$6,$7,$8,$9,'pending',$10::jsonb) RETURNING *`,
      [customer.id,user.id,productId,currency,amountMinor,key,randomUUID(),product.loyalfans_post_uid,destination,JSON.stringify(metadata)])).rows[0];
      await client.query('COMMIT');
      return {order:publicCommerceOrder(row)};
    } catch(error) { await client.query('ROLLBACK').catch(()=>{}); throw error; }
    finally { client.release(); }
  }
  async purchaseLaunch(user,id) {
    await this.order(user,id);
    const row=(await this.db.query('SELECT * FROM v3_commerce_orders WHERE id=$1 AND user_id=$2',[id,user.id])).rows[0];
    if(row.status!=='pending' || !row.purchase_destination) throw new HttpError(409,'PURCHASE_UNAVAILABLE','This purchase window is unavailable.');
    return loyalFansPurchaseDestination(row.purchase_destination);
  }
  async checkPurchase(user,id) {
    await this.order(user,id); // ownership checked before adapter invocation
    const row=(await this.db.query('SELECT * FROM v3_commerce_orders WHERE id=$1 AND user_id=$2',[id,user.id])).rows[0];
    if (!['pending','paid'].includes(row.status)) return this.order(user,id);
    const adapter=this.registry.get(row.processor);
    if(adapter.capabilities?.authoritativeVerification === true) {
      // Existing internal verifier enforces correlation, currency and finality.
      const link=await new V3BuyerLinkRepository(this.db).find(row.processor,user.id);
      if (link.status === 'verified' && link.user_id === user.id) {
        try { await this.reconcile(id); return this.order(user,id); }
        catch (error) {
          if(error?.code?.startsWith('MEDIA_'))return{...(await this.order(user,id)),verification_state:'manual_verification',
            message:'Your purchase needs verification before access opens.'};
          if (error?.code !== 'PAYMENT_REQUIRES_REVIEW') throw error;
        }
      }
    }
    const observations=adapter.capabilities?.transactionLookup === true ? await adapter.observeTransactions(row) : [];
    const link=await new V3BuyerLinkRepository(this.db).find(row.processor,user.id);
    const matches=observations.filter(t=>t.provider===row.processor && t.transaction_type==='clip_store' && exactPurchaseContent(row.external_content_uid,t.provider_content_uid));
    const reversals=observations.filter(t=>t.provider===row.processor && classifyLoyalFansObservation(t).category==='reversal' && exactPurchaseContent(row.external_content_uid,t.provider_content_uid));
    for(const t of [...matches,...reversals]) {
      if(!t.provider_transaction_id || !t.provider_member_uid) continue;
      await this.db.query(`INSERT INTO v3_commerce_reconciliation_observations(order_id,provider,provider_transaction_id,provider_member_uid,external_content_uid,amount_minor,currency,purchased_at,observation_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(order_id,provider,provider_transaction_id) DO NOTHING`,[id,row.processor,t.provider_transaction_id,t.provider_member_uid,t.provider_content_uid,t.gross_amount_minor,t.currency,t.purchased_at,t.transaction_type ?? t.type]);
    }
    const linkedMemberMatches=matches.some(t=>matchesVerifiedBuyer(link,user.id,t.provider_member_uid));
    const state=reversals.length>0 || matches.length>1 ? 'manual_verification' : !matchesVerifiedBuyer(link,user.id,link.provider_member_uid) ? 'buyer_verification_pending' : matches.length>0 && !linkedMemberMatches ? 'buyer_verification_pending' : 'payment_verification_pending';
    await this.db.query("UPDATE v3_commerce_orders SET verification_state=$3,updated_at=now() WHERE id=$1 AND user_id=$2 AND status='pending'",[id,user.id,state]);
    return { ...(await this.order(user,id)), verification_state:state, message:'Your purchase needs verification before access opens.' };
  }
  async order(user, id) {
    await this.access.customer(user);
    const r = await this.db.query('SELECT * FROM v3_commerce_orders WHERE id=$1 AND user_id=$2', [id, user.id]);
    if (!r.rowCount) throw new HttpError(404, 'ORDER_NOT_FOUND', 'Order was not found.');
    return { order: publicCommerceOrder(r.rows[0]), fulfilled: r.rows[0].status === 'paid' && r.rows[0].fulfillment_status === 'fulfilled' };
  }
  // Internal only: no browser event/transaction endpoint. Always fetch verified
  // evidence from the registered adapter, never accept client claims.
  async reconcile(orderId) {
    const initial = await this.db.query('SELECT * FROM v3_commerce_orders WHERE id=$1', [orderId]);
    if (!initial.rowCount) throw new HttpError(404, 'ORDER_NOT_FOUND', 'Order was not found.');
    const sourceOrder = { ...initial.rows[0] };
    const adapter=this.registry.get(sourceOrder.processor);
    if(sourceOrder.processor==='loyalfans' && typeof adapter.reconcileOrder==='function')return adapter.reconcileOrder(orderId);
    if (sourceOrder.processor === 'loyalfans') {
      const link = await new V3BuyerLinkRepository(this.db).find('loyalfans', sourceOrder.user_id);
      if (link.verification_method !== 'comment_challenge' || !matchesVerifiedBuyer(link, sourceOrder.user_id, link.provider_member_uid)) conflict();
      sourceOrder.linked_buyer_uid = link.provider_member_uid;
    }
    const transaction = await this.registry.get(sourceOrder.processor).verifyTransaction(sourceOrder);
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const order = (await client.query('SELECT * FROM v3_commerce_orders WHERE id=$1 FOR UPDATE', [orderId])).rows[0];
      if (order.processor === 'loyalfans') {
        const link = await new V3BuyerLinkRepository(client).find('loyalfans', order.user_id);
        if (link.verification_method !== 'comment_challenge' || !matchesVerifiedBuyer(link, order.user_id, transaction.buyerUid)) conflict();
        order.linked_buyer_uid = link.provider_member_uid;
      }
      // Also serialize transactions shared by conflicting orders.
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [transaction.provider + ':' + transaction.transactionId]);
      const mapping = await new V3ExternalContentMappingRepository(client).findByExternalContentId(transaction.provider, transaction.contentUid);
      validateVerifiedTransaction(order, transaction, mapping);
      let catalogueProduct = null;
      let playbackReady = false;
      let videoPublished = false;
      if (order.processor === 'loyalfans') {
        const catalogue = await client.query(`SELECT loyalfans_post_uid,video_legacy_id,downloadable
          FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1 AND video_legacy_id=$2 AND sync_status='active' FOR SHARE`,
        [transaction.contentUid, mapping.video_legacy_id]);
        if (!catalogue.rowCount) conflict();
        catalogueProduct = catalogue.rows[0];
        const media = await client.query(`SELECT EXISTS(
            SELECT 1 FROM v3_media_assets a JOIN v3_media_asset_links l ON l.asset_id=a.id
            WHERE l.video_legacy_id=$1 AND l.is_primary=true AND a.asset_type='source' AND a.visibility='private'
              AND a.processing_state='ready' AND a.storage_reference IS NOT NULL) AS source_ready,
          EXISTS(SELECT 1 FROM catalog_videos v WHERE v.legacy_id=$1 AND v.v3_lifecycle='published' AND v.status='published') AS published`,
        [mapping.video_legacy_id]);
        playbackReady = media.rows[0]?.source_ready === true;
        videoPublished = media.rows[0]?.published === true;
      }
      for (const reversal of transaction.reversalObservations || []) {
        await client.query(`INSERT INTO v3_commerce_reconciliation_observations
          (order_id,provider,provider_transaction_id,provider_member_uid,external_content_uid,amount_minor,currency,purchased_at,observation_type)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT(order_id,provider,provider_transaction_id) DO NOTHING`,
        [order.id, transaction.provider, reversal.provider_transaction_id, reversal.provider_member_uid,
          reversal.provider_content_uid, reversal.gross_amount_minor, reversal.currency,
          reversal.purchased_at, reversal.transaction_type]);
      }
      const existing = (await client.query('SELECT * FROM v3_commerce_provider_transactions WHERE (provider=$1 AND provider_transaction_id=$2) OR order_id=$3 FOR UPDATE', [transaction.provider, transaction.transactionId, orderId])).rows;
      for (const row of existing) {
        if (row.order_id !== order.id || row.user_id !== order.user_id || row.provider_transaction_id !== transaction.transactionId || row.provider_buyer_uid !== transaction.buyerUid || row.provider_content_uid !== transaction.contentUid) conflict();
        if (row.status !== 'pending' && transaction.status === 'pending') conflict();
        if (transaction.revision < Number(row.revision)) { await client.query('COMMIT'); return { ignored: true }; }
        if (transaction.revision === Number(row.revision)) {
          if (row.status !== transaction.status) conflict();
          await client.query('COMMIT'); return { duplicate: true };
        }
        if (['refunded','chargeback','reversed','failed'].includes(row.status) && transaction.status === 'paid' && transaction.restorationVerified !== true) conflict();
      }
      await client.query(`INSERT INTO v3_commerce_provider_transactions(provider,provider_transaction_id,order_id,user_id,video_legacy_id,provider_content_uid,provider_buyer_uid,amount_minor,currency,status,revision,transaction_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(provider,provider_transaction_id) DO UPDATE SET status=EXCLUDED.status,revision=EXCLUDED.revision,transaction_type=EXCLUDED.transaction_type,verified_at=now()`, [transaction.provider, transaction.transactionId, order.id, order.user_id, order.product_id, transaction.contentUid, transaction.buyerUid, transaction.amountMinor, transaction.currency, transaction.status, transaction.revision, transaction.transactionType || null]);
      let fulfillmentStatus = transaction.status === 'pending' ? 'pending' : 'failed';
      if (transaction.status === 'paid') {
        if (order.processor !== 'loyalfans' || (playbackReady && videoPublished)) {
          await client.query(`INSERT INTO v3_commerce_content_entitlements(user_id,video_legacy_id,order_id,status,starts_at,download_allowed) VALUES($1,$2,$3,'active',now(),$4) ON CONFLICT(order_id) DO UPDATE SET status='active',revoked_at=NULL,revocation_reason=NULL,download_allowed=EXCLUDED.download_allowed,updated_at=now()`, [order.user_id, order.product_id, order.id, order.processor === 'loyalfans' && catalogueProduct?.downloadable === true]);
          fulfillmentStatus = 'fulfilled';
        } else if (!playbackReady) {
          await client.query(`INSERT INTO v3_loyalfans_media_ingestion_jobs(loyalfans_post_uid,video_legacy_id,job_type,status)
            VALUES($1,$2,'full_video','blocked') ON CONFLICT(loyalfans_post_uid,job_type) DO NOTHING`, [transaction.contentUid, mapping.video_legacy_id]);
          await client.query(`UPDATE v3_loyalfans_media_ingestion_jobs SET last_error_code='LOYALFANS_ORIGINAL_MEDIA_NOT_SUPPORTED',updated_at=now()
            WHERE loyalfans_post_uid=$1 AND job_type='full_video' AND status='blocked'`, [transaction.contentUid]);
          fulfillmentStatus = 'media_pending';
        } else {
          fulfillmentStatus = 'manual_review';
        }
      } else if (transaction.status !== 'pending') {
        await client.query(`UPDATE v3_commerce_content_entitlements SET status='revoked',revoked_at=now(),revocation_reason=$2,updated_at=now() WHERE order_id=$1`, [order.id, transaction.status]);
      }
      const status = transaction.status === 'chargeback' || transaction.status === 'reversed' ? 'refunded' : transaction.status;
      await client.query('UPDATE v3_commerce_orders SET status=$2,fulfillment_status=$3,updated_at=now() WHERE id=$1', [order.id, status, fulfillmentStatus]);
      await client.query('COMMIT'); return { fulfilled: fulfillmentStatus === 'fulfilled',
        ...(fulfillmentStatus === 'media_pending' ? { media_pending: true } : {}) };
    } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; } finally { client.release(); }
  }
  async reconcileBatch({ limit = 20, cursor = null } = {}) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new HttpError(422,'INVALID_RECONCILIATION_LIMIT','Invalid batch limit.');
    if (cursor !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cursor)) throw new HttpError(422,'INVALID_RECONCILIATION_CURSOR','Invalid batch cursor.');
    const rows = await this.db.query(`SELECT id FROM v3_commerce_orders WHERE processor='loyalfans'
      AND status IN ('pending','paid')
      AND ($1::uuid IS NULL OR id>$1::uuid) ORDER BY id LIMIT $2`, [cursor,limit]);
    const result = { examined: rows.rows.length, fulfilled: 0, duplicate: 0, pending_review: 0,
      provider_error: 0, next_cursor: rows.rows.length === limit ? rows.rows.at(-1).id : null };
    for (const row of rows.rows) {
      try {
        await this.captureReversalObservations(row.id);
        const outcome = await this.reconcile(row.id);
        if (outcome.fulfilled) result.fulfilled += 1;
        if (outcome.duplicate) result.duplicate += 1;
      } catch (error) {
        if (['PAYMENT_REQUIRES_REVIEW','BUYER_VERIFICATION_REQUIRED'].includes(error?.code)) result.pending_review += 1;
        else result.provider_error += 1;
      }
    }
    return result;
  }
  async captureReversalObservations(orderId) {
    const order = (await this.db.query('SELECT * FROM v3_commerce_orders WHERE id=$1', [orderId])).rows[0];
    if (!order || order.processor !== 'loyalfans') return 0;
    const link = await new V3BuyerLinkRepository(this.db).find('loyalfans',order.user_id);
    if (link.verification_method !== 'comment_challenge' || !matchesVerifiedBuyer(link,order.user_id,link.provider_member_uid)) return 0;
    const adapter = this.registry.get('loyalfans');
    if (adapter.capabilities?.transactionLookup !== true) return 0;
    const observations = await adapter.observeTransactions(order);
    let stored = 0;
    for (const reversal of observations) {
      if (classifyLoyalFansObservation(reversal).category !== 'reversal' ||
          !exactPurchaseContent(order.external_content_uid,reversal.provider_content_uid) ||
          reversal.provider_member_uid !== link.provider_member_uid ||
          !/^[A-Za-z0-9_-]{16,255}$/.test(reversal.provider_transaction_id || '')) continue;
      await this.db.query(`INSERT INTO v3_commerce_reconciliation_observations
        (order_id,provider,provider_transaction_id,provider_member_uid,external_content_uid,amount_minor,currency,purchased_at,observation_type)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT(order_id,provider,provider_transaction_id) DO NOTHING`,
      [order.id,'loyalfans',reversal.provider_transaction_id,reversal.provider_member_uid,
        reversal.provider_content_uid,reversal.gross_amount_minor,reversal.currency,reversal.purchased_at,
        reversal.transaction_type]);
      stored += 1;
    }
    return stored;
  }
}
