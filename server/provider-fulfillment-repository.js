import { mediaError } from './provider-media-ingestion.js';
import { assertFulfillmentTransition } from './provider-transaction-fulfillment.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class PostgresProviderFulfillmentRepository {
  constructor(db) { this.db = db; }

  async withOrder(orderId, run) {
    if (!UUID.test(orderId || '')) throw mediaError('MEDIA_ORDER_INVALID');
    const client = await this.db.connect();
    const key = `provider-fulfillment:${orderId}`;
    let broken = false;
    try {
      await client.query('SELECT pg_advisory_lock(hashtextextended($1,0))',[key]);
      return await run(new PostgresProviderFulfillmentRepository(client));
    } finally {
      try { await client.query('SELECT pg_advisory_unlock(hashtextextended($1,0))',[key]); }
      catch { broken = true; }
      client.release(broken);
    }
  }

  async atomic(run) {
    await this.db.query('BEGIN');
    try { const result = await run(this.db); await this.db.query('COMMIT'); return result; }
    catch(error) { await this.db.query('ROLLBACK'); throw error; }
  }

  async order(id) {
    const result = await this.db.query(`SELECT o.id,o.user_id,o.product_id,o.processor,o.external_content_uid,
      o.total_minor,o.currency,o.created_at,o.provider_fulfillment_state,b.provider_member_uid,b.status AS buyer_status,
      t.provider_transaction_id
      FROM v3_commerce_orders o LEFT JOIN v3_commerce_buyer_links b ON b.provider=o.processor AND b.user_id=o.user_id
      LEFT JOIN v3_commerce_provider_transactions t ON t.order_id=o.id AND t.provider=o.processor
      WHERE o.id=$1`, [id]);
    if (!result.rowCount) return null;
    const row = result.rows[0];
    return { id: row.id,userId: row.user_id,videoId: row.product_id,provider: row.processor,
      contentUid: row.external_content_uid,amountMinor: Number(row.total_minor),currency: row.currency,
      buyerUid: row.provider_member_uid,buyerVerified: row.buyer_status === 'verified',transactionType: null,
      createdAt:row.created_at,providerTransactionId:row.provider_transaction_id,
      state: row.provider_fulfillment_state || 'VERIFICATION_PENDING' };
  }

  async transition(id, state) {
    return this.atomic(async client => {
      const row = (await client.query(`SELECT provider_fulfillment_state FROM v3_commerce_orders WHERE id=$1 FOR UPDATE`,[id])).rows[0];
      if (!row) throw mediaError('MEDIA_ORDER_NOT_FOUND');
      assertFulfillmentTransition(row.provider_fulfillment_state || 'VERIFICATION_PENDING',state);
      await client.query(`UPDATE v3_commerce_orders SET provider_fulfillment_state=$2,updated_at=now() WHERE id=$1`,[id,state]);
    });
  }

  async bindTransaction(order, sale) {
    return this.atomic(async client => {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
        [JSON.stringify(['provider-sale',sale.provider,sale.transactionId])]);
      const mapping = await client.query(`SELECT video_legacy_id FROM v3_catalogue_external_content_mappings
        WHERE provider=$1 AND external_content_uid=$2 AND status='active'`, [sale.provider,sale.contentUid]);
      if (mapping.rowCount !== 1 || mapping.rows[0].video_legacy_id !== order.videoId) throw mediaError('MEDIA_MAPPING_INVALID');
      const reversals = await client.query(`SELECT 1 FROM v3_provider_reversal_observations
        WHERE provider=$1 AND original_transaction_id=$2 AND authority_verified=true`, [sale.provider,sale.transactionId]);
      if (reversals.rowCount) throw mediaError('MEDIA_TRANSACTION_REVERSED');
      const prior = await client.query(`SELECT order_id,provider_content_uid,provider_buyer_uid,amount_minor,currency,status
        FROM v3_commerce_provider_transactions WHERE provider=$1 AND provider_transaction_id=$2 FOR UPDATE`, [sale.provider,sale.transactionId]);
      if (prior.rowCount) {
        const p = prior.rows[0];
        if (p.order_id !== order.id || p.provider_content_uid !== sale.contentUid || p.provider_buyer_uid !== sale.buyerUid ||
            Number(p.amount_minor) !== sale.amountMinor || p.currency !== sale.currency || p.status !== 'paid') throw mediaError('MEDIA_TRANSACTION_CONFLICT');
        await client.query(`UPDATE v3_commerce_provider_transactions SET finality_evidence='POSTED',transaction_type=$3,
          provider_transaction_timestamp=$4,external_media_uid=$5,verified_at=now()
          WHERE provider=$1 AND provider_transaction_id=$2`,[sale.provider,sale.transactionId,sale.transactionType,
          sale.timestamp || null,sale.media?.uid || null]);
      } else {
        await client.query(`INSERT INTO v3_commerce_provider_transactions(provider,provider_transaction_id,order_id,user_id,
          video_legacy_id,provider_content_uid,provider_buyer_uid,amount_minor,currency,status,revision,transaction_type,finality_evidence,
          provider_transaction_timestamp,external_media_uid)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'paid',0,$10,'POSTED',$11,$12)`,
        [sale.provider,sale.transactionId,order.id,order.userId,order.videoId,sale.contentUid,sale.buyerUid,sale.amountMinor,sale.currency,sale.transactionType,
          sale.timestamp || null,sale.media?.uid || null]);
      }
      await client.query(`UPDATE v3_commerce_orders SET status='paid',fulfillment_status='media_pending',
        provider_fulfillment_state='VERIFICATION_PENDING',verified_buyer_uid=$2,updated_at=now() WHERE id=$1`, [order.id,sale.buyerUid]);
    });
  }

  async markReady(order,sale,assetId) {
    return this.atomic(async client => {
      const asset = await client.query(`SELECT 1 FROM v3_provider_media_jobs j JOIN v3_media_assets a ON a.id=j.asset_id
        JOIN v3_provider_media_transactions t ON t.job_id=j.id AND t.provider=j.provider AND t.external_content_uid=j.external_content_uid
        WHERE j.provider=$1 AND j.external_content_uid=$2 AND t.provider_transaction_id=$3 AND a.id=$4
          AND j.state='MEDIA_READY' AND a.processing_state='ready' AND a.visibility='private' AND a.asset_type='source'
          AND a.storage_reference IS NOT NULL`, [sale.provider,sale.contentUid,sale.transactionId,assetId]);
      if (asset.rowCount !== 1) throw mediaError('MEDIA_NOT_READY');
      const mappings = await client.query(`SELECT video_legacy_id FROM v3_catalogue_external_content_mappings
        WHERE provider=$1 AND external_content_uid=$2 AND status='active' FOR SHARE`,[sale.provider,sale.contentUid]);
      if (mappings.rowCount !== 1 || mappings.rows[0].video_legacy_id !== order.videoId) throw mediaError('MEDIA_MAPPING_INVALID');
      await client.query('SELECT legacy_id FROM catalog_videos WHERE legacy_id=$1 FOR UPDATE',[order.videoId]);
      const existing = await client.query(`SELECT a.id FROM v3_media_asset_links l JOIN v3_media_assets a ON a.id=l.asset_id
        WHERE l.video_legacy_id=$1 AND l.is_primary=true AND a.asset_type='source' AND a.id<>$2`,[order.videoId,assetId]);
      if (existing.rowCount) throw mediaError('MEDIA_EXISTING_MASTER_CONFLICT');
      await client.query(`INSERT INTO v3_media_asset_links(asset_id,video_legacy_id,is_primary) VALUES($1,$2,true)
        ON CONFLICT DO NOTHING`,[assetId,order.videoId]);
      const state = (await client.query(`SELECT provider_fulfillment_state FROM v3_commerce_orders WHERE id=$1 FOR UPDATE`,[order.id])).rows[0];
      assertFulfillmentTransition(state?.provider_fulfillment_state,'MEDIA_READY');
      await client.query(`UPDATE v3_commerce_orders SET provider_fulfillment_state='MEDIA_READY',updated_at=now() WHERE id=$1`,[order.id]);
    });
  }

  async complete(id,transactionId,transactionType) {
    return this.atomic(async client => {
      const provider = (await client.query('SELECT processor FROM v3_commerce_orders WHERE id=$1',[id])).rows[0]?.processor;
      if (!provider) throw mediaError('MEDIA_ORDER_NOT_FOUND');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
        [JSON.stringify(['provider-sale',provider,transactionId])]);
      const result = await client.query(`SELECT o.id,o.user_id,o.product_id,o.provider_fulfillment_state,t.provider,
        t.provider_content_uid FROM v3_commerce_orders o JOIN v3_commerce_provider_transactions t ON t.order_id=o.id
        JOIN v3_commerce_buyer_links b ON b.provider=t.provider AND b.user_id=o.user_id AND b.status='verified'
          AND b.provider_member_uid=t.provider_buyer_uid
        JOIN v3_catalogue_external_content_mappings m ON m.provider=t.provider AND m.external_content_uid=t.provider_content_uid
          AND m.video_legacy_id=o.product_id AND m.status='active'
        JOIN catalog_videos v ON v.legacy_id=o.product_id AND v.status='published' AND v.v3_lifecycle='published'
        WHERE o.id=$1 AND t.provider_transaction_id=$2 AND o.status='paid' AND t.status='paid' AND t.finality_evidence='POSTED'
          AND t.provider=o.processor AND t.video_legacy_id=o.product_id AND t.provider_content_uid=o.external_content_uid
          AND t.amount_minor=o.total_minor AND t.currency=o.currency AND t.transaction_type=$3
          AND EXISTS(SELECT 1 FROM v3_provider_media_jobs j JOIN v3_media_asset_links l ON l.asset_id=j.asset_id
            JOIN v3_media_assets a ON a.id=j.asset_id WHERE j.provider=t.provider AND j.external_content_uid=t.provider_content_uid
              AND j.state='MEDIA_READY' AND l.video_legacy_id=o.product_id AND l.is_primary=true
              AND a.processing_state='ready' AND a.visibility='private' AND a.asset_type='source' AND a.storage_reference IS NOT NULL)
          AND NOT EXISTS(SELECT 1 FROM v3_provider_reversal_observations r WHERE r.provider=t.provider
            AND r.original_transaction_id=t.provider_transaction_id AND r.authority_verified=true)
        FOR UPDATE OF o,t FOR SHARE OF b,m,v`, [id,transactionId,transactionType]);
      if (result.rowCount !== 1) throw mediaError('MEDIA_ENTITLEMENT_PRECONDITION_FAILED');
      const row = result.rows[0];
      if (row.provider_fulfillment_state === 'FULFILLED') return;
      assertFulfillmentTransition(row.provider_fulfillment_state,'FULFILLED');
      // LoyalFans download permission comes from the exact mapped catalogue;
      // other providers retain the conservative generic default.
      const existing = await client.query(`SELECT user_id,video_legacy_id,status FROM v3_commerce_content_entitlements
        WHERE order_id=$1 FOR UPDATE`,[row.id]);
      if (existing.rowCount && (existing.rows[0].user_id!==row.user_id || existing.rows[0].video_legacy_id!==row.product_id ||
          existing.rows[0].status!=='active')) throw mediaError('MEDIA_ENTITLEMENT_CONFLICT');
      await client.query(`INSERT INTO v3_commerce_content_entitlements(user_id,video_legacy_id,order_id,status,download_allowed)
        VALUES($1,$2,$3,'active',CASE WHEN $4='loyalfans' THEN EXISTS(
          SELECT 1 FROM v3_loyalfans_catalogue_products p WHERE p.loyalfans_post_uid=$5
            AND p.video_legacy_id=$2 AND p.sync_status='active' AND p.downloadable=true)
          ELSE false END) ON CONFLICT(order_id) DO NOTHING`,
      [row.user_id,row.product_id,row.id,row.provider,row.provider_content_uid]);
      await client.query(`UPDATE v3_commerce_orders SET fulfillment_status='fulfilled',provider_fulfillment_state='FULFILLED',updated_at=now()
        WHERE id=$1`,[id]);
    });
  }

  async fail(id) {
    await this.db.query(`UPDATE v3_commerce_orders SET provider_fulfillment_state='FAILED',fulfillment_status='failed',updated_at=now()
      WHERE id=$1 AND provider_fulfillment_state IS DISTINCT FROM 'FULFILLED'`,[id]);
  }

  async reversal(observation) {
    const client = await this.db.connect();
    try {
      const scoped = new PostgresProviderFulfillmentRepository(client);
      return await scoped.atomic(async db => {
        await db.query(`INSERT INTO v3_provider_reversal_observations(provider,observation_id,observation_type,original_transaction_id,authority_verified)
          VALUES($1,$2,$3,$4,$5) ON CONFLICT(provider,observation_id) DO NOTHING`,
        [observation.provider,observation.id,observation.type,observation.originalTransactionId,observation.authorityVerified]);
        const stored = (await db.query(`SELECT * FROM v3_provider_reversal_observations WHERE provider=$1 AND observation_id=$2`,
          [observation.provider,observation.id])).rows[0];
        if (stored && stored.observation_type && (stored.observation_type !== observation.type ||
            (stored.original_transaction_id && observation.originalTransactionId &&
              stored.original_transaction_id !== observation.originalTransactionId))) throw mediaError('MEDIA_REVERSAL_CONFLICT');
        if (stored && observation.authorityVerified && (!stored.authority_verified ||
            (!stored.original_transaction_id && observation.originalTransactionId))) {
          await db.query(`UPDATE v3_provider_reversal_observations SET authority_verified=true,
            original_transaction_id=COALESCE(original_transaction_id,$3) WHERE provider=$1 AND observation_id=$2`,
          [observation.provider,observation.id,observation.originalTransactionId]);
          stored.authority_verified=true;
          stored.original_transaction_id ||= observation.originalTransactionId;
        }
        if (!stored?.authority_verified || !stored.original_transaction_id) return { linked: false,revoked: false };
        await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
          [JSON.stringify(['provider-sale',stored.provider,stored.original_transaction_id])]);
        const sale = await db.query(`SELECT order_id FROM v3_commerce_provider_transactions WHERE provider=$1 AND provider_transaction_id=$2 FOR UPDATE`,
          [stored.provider,stored.original_transaction_id]);
        if (!sale.rowCount) return { linked: false,revoked: false };
        const orderId = sale.rows[0].order_id;
        await db.query(`UPDATE v3_commerce_provider_transactions SET status='reversed',finality_evidence='REVERSED',revision=revision+1
          WHERE provider=$1 AND provider_transaction_id=$2 AND status<>'reversed'`,[stored.provider,stored.original_transaction_id]);
        await db.query(`UPDATE v3_commerce_content_entitlements SET status='revoked',revoked_at=COALESCE(revoked_at,now()),
          revocation_reason=$2,updated_at=now() WHERE order_id=$1`,[orderId,stored.observation_type]);
        await db.query(`UPDATE v3_commerce_orders SET provider_fulfillment_state='FAILED',fulfillment_status='failed',updated_at=now() WHERE id=$1`,[orderId]);
        await db.query(`UPDATE v3_provider_reversal_observations SET linked_order_id=$3 WHERE provider=$1 AND observation_id=$2`,
          [stored.provider,stored.observation_id,orderId]);
        return { linked: true,revoked: true };
      });
    } finally { client.release(); }
  }
}
