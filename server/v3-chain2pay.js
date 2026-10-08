import { V3AccessService } from './v3-access.js';
import { HttpError } from './errors.js';

const PROVIDER = 'chain2pay';
const validPurchaseTypes = new Set(['subscription', 'ppv', 'wallet_topup']);
const paymentStatuses = new Set(['created', 'pending', 'processing', 'paid', 'expired', 'failed', 'dispatch_failed', 'manual_review']);
const money = value => Number(value);
const safeMoney = value => Number.isFinite(money(value)) ? money(value) : null;
const cents = value => Math.round(Number(value) * 100);
const iso = value => value ? new Date(value).toISOString() : null;
const statusFromProvider = value => {
  const status = String(value || '').toLowerCase();
  if (status === 'paid' || status === 'succeeded' || status === 'success') return 'paid';
  if (status === 'expired') return 'expired';
  if (status === 'failed') return 'failed';
  if (status === 'dispatch_failed') return 'dispatch_failed';
  if (status === 'processing') return 'processing';
  return 'pending';
};
const providerAmount = payment => safeMoney(payment?.amount ?? payment?.amount_fiat ?? payment?.paid_amount ?? payment?.value_fiat);
const providerCurrency = payment => String(payment?.currency || payment?.fiat_currency || 'USD').toUpperCase();

function requireId(value, name) {
  const id = String(value || '').trim();
  if (!id || id.length > 200) throw new HttpError(422, `${name.toUpperCase()}_REQUIRED`, `${name} is required.`);
  return id;
}

export class V3Chain2PayService {
  constructor(db, chain2pay, config, blob = null) {
    this.db = db;
    this.chain2pay = chain2pay;
    this.config = config;
    this.blob = blob;
  }

  async withTransaction(work) {
    const client = await this.db.connect();
    try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
    catch (error) { try { await client.query('ROLLBACK'); } catch {} throw error; }
    finally { client.release(); }
  }

  async assertCustomer(user) {
    if (!user?.id) throw new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in before starting checkout.');
    if (user.role !== 'customer') throw new HttpError(403, 'CUSTOMER_CHECKOUT_REQUIRED', 'Only customer accounts can purchase public content.');
    const result = await this.db.query('SELECT id,email,account_status FROM app_users WHERE id=$1', [user.id]);
    if (!result.rowCount || result.rows[0].account_status !== 'active') throw new HttpError(403, 'ACCOUNT_NOT_ACTIVE', 'Your customer account is not active.');
    return result.rows[0];
  }

  async executionEnabled() {
    if (!this.chain2pay.isConfigured()) return false;
    const result = await this.db.query(`SELECT
      (SELECT enabled FROM v3_feature_flags WHERE key='v3_commerce_execution' AND environment='all') AS flag_enabled,
      (SELECT configured FROM v3_integration_status WHERE key='payments') AS provider_configured,
      (SELECT status FROM v3_integration_status WHERE key='payments') AS provider_status`);
    const row = result.rows[0] || {};
    return row.flag_enabled === true && row.provider_configured === true && row.provider_status === 'healthy';
  }

  async assertExecutionEnabled() {
    if (!(await this.executionEnabled())) throw new HttpError(503, 'CHAIN2PAY_EXECUTION_DISABLED', 'Chain2Pay checkout is not enabled until protected credentials, provider health, webhook verification and the Commerce execution gate are ready.');
  }

  async offerByInput(input) {
    const purchaseType = String(input.purchase_type || '').trim();
    if (!validPurchaseTypes.has(purchaseType)) throw new HttpError(422, 'INVALID_PURCHASE_TYPE', 'A supported purchase type is required.');
    const offerId = requireId(input.offer_id, 'offer_id');
    const result = await this.db.query(`SELECT o.id offer_id,o.purchase_type,o.product_id,o.active offer_active,
      p.id plan_id,p.plan_key,p.name,p.description,p.amount_minor,p.currency,p.interval,p.active plan_active
      FROM v3_commerce_plan_offers o JOIN v3_commerce_plans p ON p.id=o.plan_id
      WHERE o.id=$1 AND o.purchase_type=$2 AND o.active=true AND p.active=true`, [offerId, purchaseType]);
    if (!result.rowCount) throw new HttpError(404, 'OFFER_NOT_FOUND', 'This payment offer is not available.');
    const offer = result.rows[0];
    if (purchaseType === 'ppv') {
      if (String(input.product_id || '') !== String(offer.product_id || '')) throw new HttpError(409, 'PRODUCT_MISMATCH', 'The selected content does not match this offer.');
      const video = await this.db.query(`SELECT legacy_id FROM catalog_videos WHERE legacy_id=$1 AND v3_lifecycle='published' AND status='published'`, [offer.product_id]);
      if (!video.rowCount) throw new HttpError(422, 'PRODUCT_NOT_PUBLIC', 'Only published public content can be purchased.');
    }
    if (purchaseType === 'subscription' && offer.interval === 'one_time') throw new HttpError(422, 'SUBSCRIPTION_INTERVAL_INVALID', 'A subscription offer must have a recurring entitlement period.');
    if (purchaseType === 'wallet_topup' && offer.interval !== 'one_time') throw new HttpError(422, 'WALLET_PLAN_INVALID', 'A wallet top-up offer must be one-time.');
    return offer;
  }

  safeOrder(row) {
    if (!row) return null;
    return {
      id: row.id, purchase_type: row.purchase_type, product_id: row.product_id, subscription_plan_id: row.subscription_plan_id,
      amount_minor: Number(row.total_minor), currency: row.currency, status: row.status, fulfillment_status: row.fulfillment_status,
      processor: row.processor, processor_payment_id: row.processor_payment_id, processor_provider: row.processor_provider,
      checkout_url: row.checkout_url, paid_amount: row.paid_amount == null ? null : Number(row.paid_amount), paid_coin: row.paid_coin,
      tx_hash: row.tx_hash, created_at: row.created_at, paid_at: row.paid_at, expires_at: row.expires_at,
      subscription_start: row.subscription_start, subscription_end: row.subscription_end, failure_reason: row.failure_reason,
      provider_status: row.last_provider_status
    };
  }

  async createCheckout(user, input, request) {
    await this.assertExecutionEnabled();
    const account = await this.assertCustomer(user);
    const offer = await this.offerByInput(input);
    const idempotencyKey = String(input.idempotency_key || request?.headers?.['idempotency-key'] || '').trim();
    if (!/^[A-Za-z0-9._:-]{12,160}$/.test(idempotencyKey)) throw new HttpError(422, 'IDEMPOTENCY_KEY_REQUIRED', 'A valid idempotency key is required.');
    const existing = await this.db.query('SELECT * FROM v3_commerce_orders WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.rowCount) {
      if (String(existing.rows[0].user_id) !== String(account.id)) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'This checkout key belongs to another account.');
      return { duplicate: true, order: this.safeOrder(existing.rows[0]) };
    }
    const customer = await this.db.query(`INSERT INTO v3_commerce_customers(user_id,external_reference) VALUES($1,$1)
      ON CONFLICT(user_id) DO UPDATE SET updated_at=now() RETURNING id`, [account.id]);
    const order = await this.db.query(`INSERT INTO v3_commerce_orders(customer_id,user_id,purchase_type,product_id,subscription_plan_id,processor,status,currency,total_minor,idempotency_key,customer_email,metadata,fulfillment_status)
      VALUES($1,$2,$3,$4,$5,$6,'draft',$7,$8,$9,$10,$11,'pending') RETURNING *`, [customer.rows[0].id, account.id, offer.purchase_type, offer.product_id || null, offer.plan_id, PROVIDER, offer.currency, offer.amount_minor, idempotencyKey, account.email, { offer_id: offer.offer_id, plan_key: offer.plan_key, purchase_type: offer.purchase_type, product_id: offer.product_id || null, subscription_plan_id: offer.plan_id }]);
    const row = order.rows[0];
    try {
      const payment = await this.chain2pay.createPayment({ amountMinor: Number(offer.amount_minor), currency: offer.currency, callbackUrl: this.config.chain2payCallbackUrl, customerEmail: account.email, metadata: { internal_order_id: row.id, purchase_type: offer.purchase_type, user_id: account.id, product_id: offer.product_id || null, subscription_plan_id: offer.plan_id } });
      const providerId = requireId(payment.id || payment.order_id, 'chain2pay_order_id');
      await this.withTransaction(async client => {
        await client.query(`UPDATE v3_commerce_orders SET status='pending',processor_payment_id=$2,processor_provider=$3,checkout_url=$4,expires_at=$5,last_provider_status=$6,updated_at=now() WHERE id=$1`, [row.id, providerId, payment.provider || payment.selected_provider?.id || 'multihosted', payment.checkout_url || null, payment.expires_at || null, payment.status || 'pending']);
        await client.query(`INSERT INTO v3_commerce_payment_intents(order_id,customer_id,provider,provider_intent_id,status,amount_minor,currency,idempotency_key) VALUES($1,$2,$3,$4,'pending',$5,$6,$7) ON CONFLICT(provider,provider_intent_id) DO UPDATE SET status=EXCLUDED.status,updated_at=now()`, [row.id, customer.rows[0].id, PROVIDER, providerId, offer.amount_minor, offer.currency, `chain2pay:${row.id}`]);
      });
      const fresh = await this.db.query('SELECT * FROM v3_commerce_orders WHERE id=$1', [row.id]);
      return { duplicate: false, order: this.safeOrder(fresh.rows[0]) };
    } catch (error) {
      await this.db.query(`UPDATE v3_commerce_orders SET status='failed',failure_reason=$2,updated_at=now() WHERE id=$1`, [row.id, String(error.message || 'Chain2Pay checkout failed').slice(0, 500)]).catch(() => {});
      throw error;
    }
  }

  async orderForRequest(id, userId = null) {
    const result = await this.db.query(`SELECT o.*,p.plan_key,p.name plan_name,p.interval
      FROM v3_commerce_orders o LEFT JOIN v3_commerce_plans p ON p.id=o.subscription_plan_id WHERE o.id=$1`, [id]);
    if (!result.rowCount) throw new HttpError(404, 'ORDER_NOT_FOUND', 'Payment order was not found.');
    if (userId && String(result.rows[0].user_id) !== String(userId)) throw new HttpError(404, 'ORDER_NOT_FOUND', 'Payment order was not found.');
    return result.rows[0];
  }

  async ensurePaymentRecords(client, order, payment) {
    const providerId = order.processor_payment_id;
    const intent = await client.query(`INSERT INTO v3_commerce_payment_intents(order_id,customer_id,provider,provider_intent_id,status,amount_minor,currency,idempotency_key)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(provider,provider_intent_id) DO UPDATE SET status=EXCLUDED.status,updated_at=now() RETURNING id`, [order.id, order.customer_id, PROVIDER, providerId, statusFromProvider(payment.status) === 'paid' ? 'succeeded' : statusFromProvider(payment.status), order.total_minor, order.currency, `chain2pay:${order.id}`]);
    const intentId = intent.rows[0]?.id || (await client.query('SELECT id FROM v3_commerce_payment_intents WHERE provider=$1 AND provider_intent_id=$2', [PROVIDER, providerId])).rows[0].id;
    await client.query(`INSERT INTO v3_commerce_payments(payment_intent_id,order_id,customer_id,provider,processor_provider,provider_payment_id,status,amount_minor,currency,paid_amount,paid_coin,tx_hash,customer_email,paid_at,idempotency_key)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,CASE WHEN $7='succeeded' THEN now() ELSE NULL END,$14)
      ON CONFLICT(provider,provider_payment_id) DO UPDATE SET status=EXCLUDED.status,paid_amount=EXCLUDED.paid_amount,paid_coin=EXCLUDED.paid_coin,tx_hash=EXCLUDED.tx_hash,paid_at=COALESCE(v3_commerce_payments.paid_at,EXCLUDED.paid_at)`, [intentId, order.id, order.customer_id, PROVIDER, payment.provider || order.processor_provider, providerId, statusFromProvider(payment.status) === 'paid' ? 'succeeded' : String(payment.status || 'pending'), order.total_minor, order.currency, providerAmount(payment), payment.paid_coin || payment.coin || null, payment.tx_hash || payment.txid_out || null, order.customer_email, `chain2pay:${order.id}`]);
  }

  async fulfill(client, order) {
    if (order.purchase_type === 'ppv') {
      await client.query(`INSERT INTO v3_commerce_content_entitlements(user_id,video_legacy_id,order_id,status,starts_at)
        VALUES($1,$2,$3,'active',now()) ON CONFLICT(order_id) DO NOTHING`, [order.user_id, order.product_id, order.id]);
      return { fulfillment_status: 'fulfilled', entitlement: 'content' };
    }
    if (order.purchase_type === 'wallet_topup') {
      const wallet = await client.query(`INSERT INTO v3_commerce_wallets(customer_id,currency,status) VALUES($1,$2,'active') ON CONFLICT(customer_id) DO UPDATE SET status='active' RETURNING id`, [order.customer_id, order.currency]);
      await client.query(`INSERT INTO v3_commerce_ledger_entries(wallet_id,direction,amount_minor,currency,reference_type,reference_id,idempotency_key)
        VALUES($1,'credit',$2,$3,'chain2pay_order',$4,$5) ON CONFLICT(idempotency_key) DO NOTHING`, [wallet.rows[0].id, order.total_minor, order.currency, order.id, `chain2pay:${order.id}`]);
      return { fulfillment_status: 'fulfilled', entitlement: 'wallet_credit' };
    }
    const plan = await client.query('SELECT * FROM v3_commerce_plans WHERE id=$1', [order.subscription_plan_id]);
    if (!plan.rowCount) throw new HttpError(422, 'SUBSCRIPTION_PLAN_NOT_FOUND', 'The subscription plan no longer exists.');
    const interval = plan.rows[0].interval; const months = interval === 'month' ? 1 : interval === 'year' ? 12 : interval === 'week' ? 0 : 0;
    const days = interval === 'week' ? 7 : months ? null : 0;
    if (!days && !months) throw new HttpError(422, 'SUBSCRIPTION_PLAN_INVALID', 'The selected plan has no supported entitlement period.');
    const existing = await client.query(`SELECT * FROM v3_commerce_subscriptions WHERE user_id=$1 AND plan_id=$2 AND status IN ('active','trialing','paused','past_due') ORDER BY current_period_end DESC NULLS LAST LIMIT 1 FOR UPDATE`, [order.user_id, order.subscription_plan_id]);
    const currentEnd = existing.rows[0]?.current_period_end && new Date(existing.rows[0].current_period_end) > new Date() ? new Date(existing.rows[0].current_period_end) : new Date();
    const end = new Date(currentEnd); if (days) end.setUTCDate(end.getUTCDate() + days); else end.setUTCMonth(end.getUTCMonth() + months);
    let subscription;
    if (existing.rowCount) {
      subscription = await client.query(`UPDATE v3_commerce_subscriptions SET status='active',amount_minor=$2,currency=$3,current_period_end=$4,expires_at=$4,updated_at=now() WHERE id=$1 RETURNING id,current_period_start,current_period_end`, [existing.rows[0].id, order.total_minor, order.currency, end]);
    } else {
      subscription = await client.query(`INSERT INTO v3_commerce_subscriptions(customer_id,user_id,provider,provider_subscription_id,plan_id,plan_key,amount_minor,currency,status,current_period_start,current_period_end,expires_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,'active',now(),$9,$9,now()) RETURNING id,current_period_start,current_period_end`, [order.customer_id, order.user_id, PROVIDER, `chain2pay:${order.id}`, order.subscription_plan_id, plan.rows[0].plan_key, order.total_minor, order.currency, end]);
    }
    const result = subscription.rows[0];
    await client.query(`UPDATE v3_commerce_orders SET subscription_id=$2,subscription_start=$3,subscription_end=$4 WHERE id=$1`, [order.id, result.id, result.current_period_start, result.current_period_end]);
    return { fulfillment_status: 'fulfilled', entitlement: 'subscription', subscription_id: result.id, subscription_end: result.current_period_end };
  }

  async verifyAndFulfill(orderId, userId = null) {
    let order = await this.orderForRequest(orderId, userId);
    if (!order.processor_payment_id) throw new HttpError(409, 'PAYMENT_NOT_STARTED', 'This payment session has not reached Chain2Pay yet.');
    if (order.status === 'paid' && order.fulfillment_status === 'fulfilled') return { order: this.safeOrder(order), fulfilled: true };
    const providerPayment = await this.chain2pay.getPayment(order.processor_payment_id);
    const state = statusFromProvider(providerPayment.status);
    const expectedAmount = Number(order.total_minor);
    const actualAmount = providerAmount(providerPayment);
    const amountMatches = actualAmount != null && cents(actualAmount) === expectedAmount;
    const currencyMatches = providerCurrency(providerPayment) === String(order.currency).toUpperCase();
    if (state === 'paid' && (!amountMatches || !currencyMatches)) {
      await this.db.query(`UPDATE v3_commerce_orders SET status='manual_review',fulfillment_status='manual_review',failure_reason=$2,last_provider_status=$3,updated_at=now() WHERE id=$1`, [order.id, `Chain2Pay amount/currency mismatch: expected ${expectedAmount} ${order.currency}, received ${actualAmount ?? 'unknown'} ${providerCurrency(providerPayment)}`, providerPayment.status || 'paid']);
      throw new HttpError(409, 'PAYMENT_REQUIRES_REVIEW', 'Payment was received but its amount or currency requires manual review.');
    }
    if (state !== 'paid') {
      await this.db.query(`UPDATE v3_commerce_orders SET status=$2,last_provider_status=$3,expires_at=COALESCE($4,expires_at),updated_at=now() WHERE id=$1`, [order.id, state, providerPayment.status || state, providerPayment.expires_at || null]);
      const fresh = await this.orderForRequest(order.id, userId);
      return { order: this.safeOrder(fresh), fulfilled: false, provider_status: providerPayment.status || state };
    }
    const result = await this.withTransaction(async client => {
      const locked = await client.query('SELECT * FROM v3_commerce_orders WHERE id=$1 FOR UPDATE', [order.id]);
      if (!locked.rowCount) throw new HttpError(404, 'ORDER_NOT_FOUND', 'Payment order was not found.');
      const current = locked.rows[0];
      if (current.status === 'paid' && current.fulfillment_status === 'fulfilled') return { duplicate: true, order: this.safeOrder(current), fulfilled: true };
      await this.ensurePaymentRecords(client, current, providerPayment);
      const fulfillment = await this.fulfill(client, current);
      const updated = await client.query(`UPDATE v3_commerce_orders SET status='paid',fulfillment_status=$2,paid_amount=$3,paid_coin=$4,tx_hash=$5,paid_at=COALESCE(paid_at,now()),last_provider_status=$6,updated_at=now() WHERE id=$1 RETURNING *`, [current.id, fulfillment.fulfillment_status, actualAmount, providerPayment.paid_coin || providerPayment.coin || null, providerPayment.tx_hash || providerPayment.txid_out || null, providerPayment.status || 'paid']);
      return { duplicate: false, order: this.safeOrder(updated.rows[0]), fulfilled: true, fulfillment };
    });
    return result;
  }

  webhookUrl(request) {
    const callbackOrigin = new URL(this.config.chain2payCallbackUrl);
    return `${callbackOrigin.protocol}//${callbackOrigin.host}${request.url}`;
  }

  async handleWebhook(request, url) {
    if (!this.chain2pay.verifyWebhook(this.webhookUrl(request), request.headers['x-chain2pay-signature'])) throw new HttpError(401, 'INVALID_CHAIN2PAY_SIGNATURE', 'The Chain2Pay webhook signature is invalid.');
    const chainId = requireId(url.searchParams.get('chain2pay_order_id'), 'chain2pay_order_id');
    const row = await this.db.query('SELECT id FROM v3_commerce_orders WHERE processor=$1 AND processor_payment_id=$2', [PROVIDER, chainId]);
    if (!row.rowCount) {
      if (this.config.chain2payEnv === 'sandbox') return { received: true, payment_id: null, status: 'ignored_unknown_sandbox_payment', fulfilled: false };
      throw new HttpError(404, 'PAYMENT_NOT_FOUND', 'The Chain2Pay order is not associated with a FLESHLAB payment.');
    }
    const result = await this.verifyAndFulfill(row.rows[0].id);
    return { received: true, payment_id: row.rows[0].id, status: result.order.status, fulfilled: result.fulfilled };
  }

  async status(orderId, user) {
    await this.assertCustomer(user);
    return this.verifyAndFulfill(requireId(orderId, 'order_id'), user.id);
  }

  async playback(user, videoId) { return new V3AccessService(this.db, this.blob).media(user, videoId); }

  async sandboxConfirm(orderId, actor) {
    if (actor?.role !== 'admin') throw new HttpError(403, 'FORBIDDEN', 'Only an administrator may run a sandbox confirmation.');
    const order = await this.orderForRequest(orderId);
    if (!order.processor_payment_id) throw new HttpError(409, 'PAYMENT_NOT_STARTED', 'The order has no Chain2Pay payment ID.');
    await this.chain2pay.sandboxConfirm(order.processor_payment_id);
    return this.verifyAndFulfill(order.id);
  }

  async publicOffers(productId, userId = null) {
    const id = String(productId || '').trim();
    if (!id) return [];
    if (!(await this.executionEnabled())) return [];
    const rows = await this.db.query(`SELECT o.id offer_id,o.purchase_type,o.product_id,p.id plan_id,p.plan_key,p.name,p.description,p.amount_minor,p.currency,p.interval
      FROM v3_commerce_plan_offers o JOIN v3_commerce_plans p ON p.id=o.plan_id
      WHERE o.active=true AND p.active=true AND ((o.purchase_type='ppv' AND o.product_id=$1) OR (o.purchase_type='subscription' AND (o.product_id=$1 OR o.product_id IS NULL OR o.product_id='')))
      ORDER BY CASE WHEN o.purchase_type='ppv' THEN 1 ELSE 2 END,p.amount_minor`, [id]);
    let entitled = false;
    if (userId) {
      const access = await this.db.query(`SELECT 1 FROM v3_commerce_content_entitlements e WHERE e.user_id=$1 AND e.video_legacy_id=$2 AND e.status='active' AND e.revoked_at IS NULL AND e.starts_at<=now() AND (e.ends_at IS NULL OR e.ends_at>now())
        UNION ALL SELECT 1 FROM v3_commerce_subscriptions s WHERE s.user_id=$1 AND s.status='active' AND s.current_period_start<=now() AND s.current_period_end>now() AND EXISTS (SELECT 1 FROM v3_commerce_plan_offers so WHERE so.plan_id=s.plan_id AND so.purchase_type='subscription' AND so.active=true AND (so.product_id=$2 OR so.product_id IS NULL)) LIMIT 1`, [userId, id]);
      entitled = Boolean(access.rowCount);
    }
    if (entitled) return [{ label: 'WATCH NOW', href: '#watch', access: 'active' }];
    return rows.rows.map(row => ({ offer_id: row.offer_id, purchase_type: row.purchase_type, product_id: row.product_id, membership_included: row.purchase_type === 'subscription' && !row.product_id, plan_key: row.plan_key, name: row.name, description: row.description, amount_minor: Number(row.amount_minor), currency: row.currency, interval: row.interval, label: row.purchase_type === 'ppv' ? 'BUY NOW' : 'SUBSCRIBE', href: `/v3/checkout?offer=${encodeURIComponent(row.offer_id)}&type=${encodeURIComponent(row.purchase_type)}&product=${encodeURIComponent(id)}`, availability: 'Payment options appear in FLESHLAB checkout.' }));
  }

  async publicMembershipOffers() {
    if (!(await this.executionEnabled())) return [];
    const rows = await this.db.query(`SELECT o.id offer_id,o.purchase_type,o.product_id,p.plan_key,p.name,p.description,p.amount_minor,p.currency,p.interval
      FROM v3_commerce_plan_offers o JOIN v3_commerce_plans p ON p.id=o.plan_id
      WHERE o.active=true AND p.active=true AND o.purchase_type='subscription' AND (o.product_id IS NULL OR o.product_id='')
      ORDER BY p.amount_minor,p.interval`);
    return rows.rows.map(row => ({ offer_id: row.offer_id, purchase_type: row.purchase_type, product_id: null, membership_included: true, plan_key: row.plan_key, name: row.name, description: row.description, amount_minor: Number(row.amount_minor), currency: row.currency, interval: row.interval, label: 'SUBSCRIBE', href: `/v3/checkout?offer=${encodeURIComponent(row.offer_id)}&type=subscription`, availability: 'Payment options appear in FLESHLAB checkout.' }));
  }

  async publicOffersForProducts(productIds = []) {
    const ids = [...new Set((Array.isArray(productIds) ? productIds : []).map(value => String(value || '').trim()).filter(Boolean))];
    const result = new Map(ids.map(id => [id, []]));
    if (!ids.length || !(await this.executionEnabled())) return result;
    const rows = await this.db.query(`SELECT o.id offer_id,o.purchase_type,o.product_id,p.plan_key,p.name,p.description,p.amount_minor,p.currency,p.interval
      FROM v3_commerce_plan_offers o JOIN v3_commerce_plans p ON p.id=o.plan_id
      WHERE o.active=true AND p.active=true AND ((o.purchase_type='ppv' AND o.product_id=ANY($1::text[])) OR (o.purchase_type='subscription' AND (o.product_id=ANY($1::text[]) OR o.product_id IS NULL OR o.product_id='')))
      ORDER BY CASE WHEN o.purchase_type='ppv' THEN 1 ELSE 2 END,p.amount_minor`, [ids]);
    for (const row of rows.rows) {
      const targetIds = row.purchase_type === 'subscription' && !row.product_id ? ids : [String(row.product_id)];
      const offer = { offer_id: row.offer_id, purchase_type: row.purchase_type, product_id: row.product_id, membership_included: row.purchase_type === 'subscription' && !row.product_id, plan_key: row.plan_key, name: row.name, description: row.description, amount_minor: Number(row.amount_minor), currency: row.currency, interval: row.interval, label: row.purchase_type === 'ppv' ? 'BUY NOW' : 'SUBSCRIBE', href: `/v3/checkout?offer=${encodeURIComponent(row.offer_id)}&type=${encodeURIComponent(row.purchase_type)}`, availability: 'Payment options appear in FLESHLAB checkout.' };
      for (const id of targetIds) if (result.has(id)) result.get(id).push({ ...offer, href: `${offer.href}&product=${encodeURIComponent(id)}` });
    }
    return result;
  }

  async adminSnapshot() {
    const [plans, offers, orders, videos] = await Promise.all([
      this.db.query(`SELECT id,plan_key,name,amount_minor,currency,interval,active FROM v3_commerce_plans ORDER BY created_at DESC`),
      this.db.query(`SELECT o.id,o.purchase_type,o.product_id,o.active,o.plan_id,p.plan_key,p.name,p.amount_minor,p.currency,p.interval,v.title video_title,v.slug video_slug
        FROM v3_commerce_plan_offers o JOIN v3_commerce_plans p ON p.id=o.plan_id LEFT JOIN catalog_videos v ON v.legacy_id=o.product_id ORDER BY o.created_at DESC`),
      this.db.query(`SELECT o.id,o.user_id,o.purchase_type,o.product_id,o.subscription_plan_id,o.total_minor,o.currency,o.status,o.fulfillment_status,o.processor_payment_id,o.processor_provider,o.tx_hash,o.paid_amount,o.paid_coin,o.created_at,o.paid_at,u.email,p.plan_key,p.name plan_name,v.title product_title
        FROM v3_commerce_orders o LEFT JOIN app_users u ON u.id=o.user_id LEFT JOIN v3_commerce_plans p ON p.id=o.subscription_plan_id LEFT JOIN catalog_videos v ON v.legacy_id=o.product_id WHERE o.processor='chain2pay' ORDER BY o.created_at DESC LIMIT 100`),
      this.db.query(`SELECT legacy_id id,title,slug FROM catalog_videos WHERE v3_lifecycle='published' AND status='published' ORDER BY title LIMIT 500`)
    ]);
    let providers = { status: this.chain2pay.isConfigured() ? 'unavailable' : 'not_configured', records: [] };
    if (this.chain2pay.isConfigured()) { try { providers = { status: 'available', records: this.chain2pay.providerRows(await this.chain2pay.providers()) }; } catch (error) { providers = { status: 'error', message: error.message, records: [] }; } }
    return { environment: this.config.chain2payEnv, configured: this.chain2pay.isConfigured(), execution_enabled: await this.executionEnabled(), provider_mode: this.config.chain2payProviderMode, blocked_providers: this.config.chain2payBlockedProviders, providers, plans: plans.rows, offers: offers.rows, orders: orders.rows, videos: videos.rows };
  }

  async saveOffer(input, actor) {
    const purchaseType = String(input.purchase_type || '').trim(); if (!validPurchaseTypes.has(purchaseType)) throw new HttpError(422, 'INVALID_PURCHASE_TYPE', 'Unsupported purchase type.');
    const planId = requireId(input.plan_id, 'plan_id'); const productId = input.product_id ? String(input.product_id).trim() : (purchaseType === 'subscription' ? '' : null);
    if (purchaseType === 'ppv' && !productId) throw new HttpError(422, 'PRODUCT_REQUIRED', 'PPV offers require a published video.');
    const plan = await this.db.query('SELECT id,interval FROM v3_commerce_plans WHERE id=$1', [planId]); if (!plan.rowCount) throw new HttpError(404, 'PLAN_NOT_FOUND', 'Plan was not found.');
    if (purchaseType === 'subscription' && plan.rows[0].interval === 'one_time') throw new HttpError(422, 'SUBSCRIPTION_INTERVAL_INVALID', 'A subscription offer needs a period plan.');
    if (purchaseType === 'wallet_topup' && plan.rows[0].interval !== 'one_time') throw new HttpError(422, 'WALLET_PLAN_INVALID', 'A wallet top-up offer needs a one-time plan.');
    if (productId) { const video = await this.db.query(`SELECT legacy_id FROM catalog_videos WHERE legacy_id=$1 AND v3_lifecycle='published' AND status='published'`, [productId]); if (!video.rowCount) throw new HttpError(422, 'PRODUCT_NOT_PUBLIC', 'Only a published public video can be linked to this offer.'); }
    const result = await this.db.query(`INSERT INTO v3_commerce_plan_offers(plan_id,purchase_type,product_id,active,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$5)
      ON CONFLICT(plan_id,purchase_type,product_id) DO UPDATE SET active=EXCLUDED.active,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING *`, [planId, purchaseType, productId, input.active !== false, actor.id]);
    return result.rows[0];
  }

  async deleteOffer(id) {
    const result = await this.db.query('DELETE FROM v3_commerce_plan_offers WHERE id=$1 RETURNING id', [requireId(id, 'offer_id')]);
    if (!result.rowCount) throw new HttpError(404, 'OFFER_NOT_FOUND', 'Offer was not found.');
    return { deleted: true, id: result.rows[0].id };
  }
}
