import crypto from 'node:crypto';
import { HttpError } from './errors.js';

const PLAN_INTERVALS = new Set(['one_time', 'week', 'month', 'year']);
const SUBSCRIPTION_STATES = new Set(['created', 'inactive', 'trialing', 'active', 'paused', 'past_due', 'failed', 'cancelled', 'expired']);
const SETTLEMENT_STATES = new Set(['open', 'calculated', 'reviewed', 'approved', 'payable', 'paid', 'cancelled', 'reversed']);
const PAYOUT_STATES = new Set(['disabled', 'requested', 'under_review', 'approved', 'processing', 'paid', 'failed', 'rejected', 'cancelled']);
const SECRET_KEYS = /password|passwd|hash|secret|token|cookie|authorization|private.?key|credential|sas|storage.?key|payload/i;

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [SECRET_KEYS.test(key) ? '[REDACTED]' : redact(child)]));
}
function safeNumber(value, fallback = 0) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }
function limitOffset(input = {}) { return { limit: Math.min(Math.max(safeNumber(input.limit, 50), 1), 100), offset: Math.max(safeNumber(input.offset, 0), 0) }; }
function like(value) { return `%${String(value || '').trim()}%`; }

export class V3CommerceService {
  constructor(db) { this.db = db; }

  async audit(actor, action, entityType, entityId, before = null, after = null, request = null, result = 'success') {
    await this.db.query(
      `INSERT INTO v3_audit_events(actor_id,action,entity_type,entity_id,before_summary,after_summary,domain,result,metadata,ip_address)
       VALUES($1,$2,$3,$4,$5,$6,'commerce',$7,$8,$9)`,
      [actor?.id || null, action, entityType, String(entityId), redact(before), redact(after), result,
        redact({ request_id: request?.headers?.['x-request-id'] || null, user_agent: String(request?.headers?.['user-agent'] || '').slice(0, 200) || null }), request?.socket?.remoteAddress || null]
    );
  }

  async overview() {
    const result = await this.db.query(`SELECT
      (SELECT count(*)::int FROM v3_commerce_customers) customers,
      (SELECT count(*)::int FROM v3_commerce_orders) orders,
      (SELECT count(*)::int FROM v3_commerce_subscriptions) subscriptions,
      (SELECT count(*)::int FROM v3_commerce_subscriptions WHERE status='active') active_subscriptions,
      (SELECT count(*)::int FROM v3_commerce_subscriptions WHERE status IN ('cancelled','expired')) inactive_subscriptions,
      (SELECT count(*)::int FROM v3_commerce_payments) payments,
      (SELECT count(*)::int FROM v3_commerce_payments WHERE status='succeeded') succeeded_payments,
      (SELECT count(*)::int FROM v3_commerce_payments WHERE status='failed') failed_payments,
      (SELECT count(*)::int FROM v3_commerce_wallets) wallets,
      (SELECT count(*)::int FROM v3_earnings_ledger) ledger_entries,
      (SELECT count(*)::int FROM v3_compensation_settlements) settlements,
      (SELECT count(*)::int FROM v3_compensation_settlements WHERE status IN ('open','calculated','reviewed','approved','payable')) open_settlements,
      (SELECT count(*)::int FROM v3_payout_requests) payout_requests,
      (SELECT count(*)::int FROM v3_payout_requests WHERE status IN ('requested','under_review','approved','processing')) open_payouts,
      (SELECT count(*)::int FROM v3_commerce_provider_events) provider_events,
      (SELECT count(*)::int FROM v3_commerce_reconciliation_records WHERE state <> 'matched') reconciliation_attention`);
    const counts = result.rows[0] || {};
    const provider = await this.db.query(`SELECT key,configured,status,safe_metadata,last_checked_at,last_success_at FROM v3_integration_status WHERE key='payments'`);
    const flag = await this.db.query(`SELECT enabled FROM v3_feature_flags WHERE key='v3_commerce_execution' AND environment='all'`);
    const paymentProvider = provider.rows[0] || { key: 'payments', configured: false, status: 'not_configured', safe_metadata: {} };
    const executionEnabled = Boolean(flag.rows[0]?.enabled) && Boolean(paymentProvider.configured) && paymentProvider.status === 'healthy';
    const hasFinancialRows = Number(counts.payments || 0) > 0 || Number(counts.ledger_entries || 0) > 0 || Number(counts.payout_requests || 0) > 0;
    return {
      record_counts: counts,
      metrics_state: hasFinancialRows ? 'OBSERVED_DATA' : 'NO_MIGRATED_DATA',
      provider_readiness: { ...paymentProvider, execution_enabled: executionEnabled, state: executionEnabled ? 'READY_FOR_CONTROLLED_EXECUTION' : 'DISABLED_NOT_CONFIGURED' },
      financial_execution: { enabled: executionEnabled, reason: executionEnabled ? 'Provider and high-risk flag are enabled.' : 'Provider execution is disabled until credentials, webhook verification, idempotency and reconciliation are verified.' },
      historical_data: hasFinancialRows ? 'OBSERVED' : 'NOT_MIGRATED',
      requirements: ['Verified provider credentials in protected runtime configuration', 'Authentic webhook verification and replay protection', 'Idempotent provider and ledger mutations', 'Reconciliation and failure handling exercised in a test environment', 'Separate approval and execution permissions']
    };
  }

  async plans({ q = '', active = '', ...input } = {}) {
    const { limit, offset } = limitOffset(input); const values = []; const where = [];
    if (q) { values.push(like(q)); where.push(`(plan_key ILIKE $${values.length} OR name ILIKE $${values.length})`); }
    if (active === 'true' || active === 'false') { values.push(active === 'true'); where.push(`active=$${values.length}`); }
    values.push(limit, offset);
    const result = await this.db.query(`SELECT id,plan_key,name,description,amount_minor,currency,interval,active,provider,provider_price_ref,effective_from,effective_until,created_by,updated_by,created_at,updated_at FROM v3_commerce_plans ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: result.rows, limit, offset };
  }

  validatePlan(input) {
    const plan = { plan_key: String(input.plan_key || '').trim(), name: String(input.name || '').trim(), description: input.description == null ? null : String(input.description).slice(0, 1000), amount_minor: Math.round(safeNumber(input.amount_minor, -1)), currency: String(input.currency || '').toUpperCase(), interval: String(input.interval || ''), active: Boolean(input.active), provider: input.provider ? String(input.provider).slice(0, 80) : null, provider_price_ref: input.provider_price_ref ? String(input.provider_price_ref).slice(0, 200) : null, effective_from: input.effective_from || null, effective_until: input.effective_until || null };
    if (!/^[a-z0-9][a-z0-9_-]{1,80}$/.test(plan.plan_key) || !plan.name || plan.amount_minor < 0 || !/^[A-Z]{3}$/.test(plan.currency) || !PLAN_INTERVALS.has(plan.interval)) throw new HttpError(422, 'INVALID_PLAN', 'Plan key, name, non-negative amount, ISO currency and interval are required.');
    return plan;
  }

  async savePlan(id, input, actor, request) {
    const plan = this.validatePlan(input);
    if (id) {
      const current = await this.db.query('SELECT * FROM v3_commerce_plans WHERE id=$1', [id]);
      if (!current.rowCount) throw new HttpError(404, 'PLAN_NOT_FOUND', 'Plan was not found.');
      const result = await this.db.query(`UPDATE v3_commerce_plans SET plan_key=$2,name=$3,description=$4,amount_minor=$5,currency=$6,interval=$7,active=$8,provider=$9,provider_price_ref=$10,effective_from=$11,effective_until=$12,updated_by=$13,updated_at=now() WHERE id=$1 RETURNING id,plan_key,name,description,amount_minor,currency,interval,active,provider,provider_price_ref,effective_from,effective_until,created_at,updated_at`, [id, plan.plan_key, plan.name, plan.description, plan.amount_minor, plan.currency, plan.interval, plan.active, plan.provider, plan.provider_price_ref, plan.effective_from, plan.effective_until, actor.id]);
      await this.audit(actor, 'plan.updated', 'commerce_plan', id, current.rows[0], result.rows[0], request);
      return result.rows[0];
    }
    const result = await this.db.query(`INSERT INTO v3_commerce_plans(plan_key,name,description,amount_minor,currency,interval,active,provider,provider_price_ref,effective_from,effective_until,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12) RETURNING id,plan_key,name,description,amount_minor,currency,interval,active,provider,provider_price_ref,effective_from,effective_until,created_at,updated_at`, [plan.plan_key, plan.name, plan.description, plan.amount_minor, plan.currency, plan.interval, plan.active, plan.provider, plan.provider_price_ref, plan.effective_from, plan.effective_until, actor.id]);
    await this.audit(actor, 'plan.created', 'commerce_plan', result.rows[0].id, null, result.rows[0], request);
    return result.rows[0];
  }

  async subscriptions({ q = '', status = '', ...input } = {}) {
    const { limit, offset } = limitOffset(input); const values = []; const where = [];
    if (q) { values.push(like(q)); where.push(`(s.provider_subscription_id ILIKE $${values.length} OR s.plan_key ILIKE $${values.length} OR c.external_reference ILIKE $${values.length})`); }
    if (SUBSCRIPTION_STATES.has(status)) { values.push(status); where.push(`s.status=$${values.length}`); }
    values.push(limit, offset);
    const result = await this.db.query(`SELECT s.id,s.customer_id,s.user_id,s.provider,s.provider_subscription_id,s.plan_id,s.plan_key,s.amount_minor,s.currency,s.status,s.current_period_start,s.current_period_end,s.cancel_at_period_end,s.cancelled_at,s.expires_at,s.created_at,s.updated_at,c.user_id AS customer_user_id FROM v3_commerce_subscriptions s LEFT JOIN v3_commerce_customers c ON c.id=s.customer_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY s.updated_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: result.rows, limit, offset };
  }

  async transitionSubscription(id, status, actor, request) {
    if (!SUBSCRIPTION_STATES.has(status)) throw new HttpError(422, 'INVALID_SUBSCRIPTION_STATUS', 'Unsupported subscription status.');
    const current = await this.db.query('SELECT * FROM v3_commerce_subscriptions WHERE id=$1', [id]);
    if (!current.rowCount) throw new HttpError(404, 'SUBSCRIPTION_NOT_FOUND', 'Subscription was not found.');
    const result = await this.db.query(`UPDATE v3_commerce_subscriptions SET status=$2,cancelled_at=CASE WHEN $2='cancelled' THEN coalesce(cancelled_at,now()) ELSE cancelled_at END,updated_at=now() WHERE id=$1 RETURNING *`, [id, status]);
    await this.audit(actor, 'subscription.transitioned', 'subscription', id, { status: current.rows[0].status }, { status }, request);
    return result.rows[0];
  }

  async payments({ status = '', q = '', ...input } = {}) {
    const { limit, offset } = limitOffset(input); const values = []; const where = [];
    if (q) { values.push(like(q)); where.push(`(p.provider_payment_id ILIKE $${values.length} OR p.provider ILIKE $${values.length})`); }
    if (status) { values.push(status); where.push(`p.status=$${values.length}`); }
    values.push(limit, offset);
    const result = await this.db.query(`SELECT p.id,p.payment_intent_id,p.customer_id,p.subscription_id,p.provider,p.provider_payment_id,p.status,p.amount_minor,p.currency,p.failure_reason,p.paid_at,p.refunded_at,p.disputed_at,p.idempotency_key,p.created_at FROM v3_commerce_payments p ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY p.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: result.rows, limit, offset };
  }

  async paymentIntents({ status = '', ...input } = {}) {
    const { limit, offset } = limitOffset(input); const values = []; const where = [];
    if (status) { values.push(status); where.push(`status=$${values.length}`); }
    values.push(limit, offset);
    const result = await this.db.query(`SELECT id,order_id,customer_id,subscription_id,provider,provider_intent_id,status,amount_minor,currency,failure_reason,idempotency_key,created_at,updated_at FROM v3_commerce_payment_intents ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: result.rows, limit, offset };
  }

  async recordPayment(input, actor, request) {
    const provider = String(input.provider || '').trim(); const providerPaymentId = String(input.provider_payment_id || '').trim(); const key = String(input.idempotency_key || '').trim();
    const amount = Math.round(safeNumber(input.amount_minor, -1)); const currency = String(input.currency || '').toUpperCase(); const status = String(input.status || 'pending');
    if (!provider || !providerPaymentId || !key || amount < 0 || !/^[A-Z]{3}$/.test(currency) || !['initiated','pending','succeeded','failed','refunded','disputed','cancelled'].includes(status)) throw new HttpError(422, 'INVALID_PAYMENT', 'Provider reference, idempotency key, non-negative amount, currency and valid status are required.');
    const existing = await this.db.query('SELECT * FROM v3_commerce_payments WHERE idempotency_key=$1', [key]);
    if (existing.rowCount) {
      const row = existing.rows[0];
      if (Number(row.amount_minor) !== amount || row.currency !== currency || row.provider !== provider) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'The payment idempotency key is already used for different payment data.');
      return { duplicate: true, record: row };
    }
    const result = await this.db.query(`INSERT INTO v3_commerce_payments(payment_intent_id,customer_id,subscription_id,provider,provider_payment_id,status,amount_minor,currency,failure_reason,paid_at,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,CASE WHEN $6='succeeded' THEN now() ELSE NULL END,$10) RETURNING id,payment_intent_id,customer_id,subscription_id,provider,provider_payment_id,status,amount_minor,currency,failure_reason,paid_at,idempotency_key,created_at`, [input.payment_intent_id || null, input.customer_id || null, input.subscription_id || null, provider, providerPaymentId, status, amount, currency, input.failure_reason ? String(input.failure_reason).slice(0, 500) : null, key]);
    await this.audit(actor, 'payment.recorded', 'payment', result.rows[0].id, null, { provider, provider_payment_id: providerPaymentId, status, amount_minor: amount, currency }, request);
    return { duplicate: false, record: result.rows[0] };
  }

  async providerEvents({ provider = '', status = '', ...input } = {}) {
    const { limit, offset } = limitOffset(input); const values = []; const where = [];
    if (provider) { values.push(String(provider)); where.push(`provider=$${values.length}`); }
    if (status) { values.push(String(status)); where.push(`status=$${values.length}`); }
    values.push(limit, offset);
    const result = await this.db.query(`SELECT id,provider,provider_event_id,event_type,received_at,processed_at,status,processing_result,processing_error FROM v3_commerce_provider_events ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY received_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: result.rows, limit, offset };
  }

  async recordProviderEvent(input, actor, request) {
    const provider = String(input.provider || '').trim(); const eventId = String(input.event_id || input.provider_event_id || '').trim(); const eventType = String(input.event_type || 'unknown').slice(0, 120);
    if (!provider || !eventId) throw new HttpError(422, 'PROVIDER_EVENT_ID_REQUIRED', 'Provider and event ID are required.');
    const existing = await this.db.query('SELECT * FROM v3_commerce_provider_events WHERE provider=$1 AND provider_event_id=$2', [provider, eventId]);
    if (existing.rowCount) return { duplicate: true, record: { ...existing.rows[0], payload: undefined } };
    const safePayload = redact(input.payload || {}); const payloadHash = crypto.createHash('sha256').update(JSON.stringify(input.payload || {})).digest('hex');
    const result = await this.db.query(`INSERT INTO v3_commerce_provider_events(provider,provider_event_id,event_type,payload,payload_hash,status,processing_result) VALUES($1,$2,$3,$4,$5,'received','recorded_only') RETURNING id,provider,provider_event_id,event_type,received_at,processed_at,status,processing_result`, [provider, eventId, eventType, safePayload, payloadHash]);
    await this.audit(actor, 'provider_event.recorded', 'provider_event', result.rows[0].id, null, { provider, event_type: eventType, status: 'received' }, request);
    return { duplicate: false, record: result.rows[0] };
  }

  async earnings({ creatorId = '', ...input } = {}) {
    const { limit, offset } = limitOffset(input); const values = []; const where = [];
    if (creatorId) { values.push(creatorId); where.push(`l.creator_id=$${values.length}`); }
    values.push(limit, offset);
    const result = await this.db.query(`SELECT l.id,l.event_type,l.source_type,l.source_reference,l.performer_legacy_id,l.creator_id,l.original_currency,l.original_amount_minor,l.converted_usd_amount_minor,l.eligible_revenue_minor,l.revenue_share_base_minor,l.performer_share_percentage,l.performer_amount_minor,l.adjustment_reason,l.adjustment_of,l.settlement_period_start,l.settlement_period_end,l.compensation_plan_id,l.audit_reference,l.created_at FROM v3_earnings_ledger l ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY l.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: result.rows, limit, offset, immutable: true };
  }

  async settlements({ creatorId = '', status = '', ...input } = {}) {
    const { limit, offset } = limitOffset(input); const values = []; const where = [];
    if (creatorId) { values.push(creatorId); where.push(`creator_id=$${values.length}`); }
    if (SETTLEMENT_STATES.has(status)) { values.push(status); where.push(`status=$${values.length}`); }
    values.push(limit, offset);
    const result = await this.db.query(`SELECT id,creator_id,performer_legacy_id,plan_id,period_start,period_end,frequency,currency,eligible_revenue_minor,revenue_share_base_minor,performer_amount_minor,carry_forward_minor,payable_amount_minor,status,reviewer_id,reviewed_at,approved_by,approved_at,paid_at,idempotency_key,paid_event_reference,created_at FROM v3_compensation_settlements ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY period_end DESC,created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: result.rows, limit, offset };
  }

  async transitionSettlement(id, status, actor, request) {
    if (!SETTLEMENT_STATES.has(status)) throw new HttpError(422, 'INVALID_SETTLEMENT_STATUS', 'Unsupported settlement status.');
    const current = await this.db.query('SELECT * FROM v3_compensation_settlements WHERE id=$1', [id]);
    if (!current.rowCount) throw new HttpError(404, 'SETTLEMENT_NOT_FOUND', 'Settlement was not found.');
    const result = await this.db.query(`UPDATE v3_compensation_settlements SET status=$2,reviewer_id=CASE WHEN $2='reviewed' THEN $3 ELSE reviewer_id END,reviewed_at=CASE WHEN $2='reviewed' THEN now() ELSE reviewed_at END,approved_by=CASE WHEN $2='approved' THEN $3 ELSE approved_by END,approved_at=CASE WHEN $2='approved' THEN now() ELSE approved_at END,paid_at=CASE WHEN $2='paid' THEN now() ELSE paid_at END WHERE id=$1 RETURNING *`, [id, status, actor.id]);
    await this.audit(actor, 'settlement.transitioned', 'settlement', id, { status: current.rows[0].status }, { status }, request);
    return result.rows[0];
  }

  async calculateSettlement(id, actor, request) {
    const current = await this.db.query('SELECT * FROM v3_compensation_settlements WHERE id=$1', [id]);
    if (!current.rowCount) throw new HttpError(404, 'SETTLEMENT_NOT_FOUND', 'Settlement was not found.');
    const settlement = current.rows[0];
    const ledger = await this.db.query(`SELECT COALESCE(SUM(eligible_revenue_minor),0)::bigint AS eligible,COALESCE(SUM(revenue_share_base_minor),0)::bigint AS share_base,COALESCE(SUM(performer_amount_minor),0)::bigint AS performer FROM v3_earnings_ledger WHERE (($1::uuid IS NOT NULL AND creator_id=$1) OR ($2::text IS NOT NULL AND performer_legacy_id=$2)) AND created_at::date >= $3 AND created_at::date <= $4`, [settlement.creator_id, settlement.performer_legacy_id, settlement.period_start, settlement.period_end]);
    const amounts = ledger.rows[0] || { eligible: 0, share_base: 0, performer: 0 };
    const result = await this.db.query(`UPDATE v3_compensation_settlements SET eligible_revenue_minor=$2,revenue_share_base_minor=$3,performer_amount_minor=$4,payable_amount_minor=$4+carry_forward_minor,status='calculated' WHERE id=$1 RETURNING *`, [id, amounts.eligible, amounts.share_base, amounts.performer]);
    await this.audit(actor, 'settlement.calculated', 'settlement', id, { status: settlement.status }, { status: 'calculated', eligible_revenue_minor: amounts.eligible, performer_amount_minor: amounts.performer }, request);
    return result.rows[0];
  }

  async addAdjustment(input, actor, request) {
    const parentId = String(input.adjustment_of || '').trim(); const creatorId = input.creator_id || null; const performerId = input.performer_legacy_id || null; const key = String(input.idempotency_key || '').trim(); const amount = Math.round(safeNumber(input.performer_amount_minor, 0));
    if (!parentId || !creatorId && !performerId || !key || key.length < 8 || !String(input.reason || '').trim() || amount === 0) throw new HttpError(422, 'INVALID_ADJUSTMENT', 'A source ledger entry, owner, reason, non-zero amount and idempotency key are required.');
    const parent = await this.db.query('SELECT id,creator_id,performer_legacy_id,original_currency FROM v3_earnings_ledger WHERE id=$1', [parentId]);
    if (!parent.rowCount) throw new HttpError(404, 'LEDGER_ENTRY_NOT_FOUND', 'The source ledger entry was not found.');
    const existing = await this.db.query('SELECT * FROM v3_earnings_ledger WHERE idempotency_key=$1', [key]);
    if (existing.rowCount) return existing.rows[0];
    const currency = String(input.currency || parent.rows[0].original_currency || 'USD').toUpperCase();
    const result = await this.db.query(`INSERT INTO v3_earnings_ledger(event_type,source_type,source_reference,performer_legacy_id,creator_id,original_currency,original_amount_minor,converted_usd_amount_minor,eligible_revenue_minor,revenue_share_base_minor,performer_share_percentage,performer_amount_minor,adjustment_reason,adjustment_of,idempotency_key,created_by) VALUES('adjustment','adjustment',$1,$2,$3,$4,$5,$5,0,0,0,$5,$6,$7,$8,$9) RETURNING *`, [String(input.source_reference || parentId).slice(0, 200), performerId || parent.rows[0].performer_legacy_id, creatorId || parent.rows[0].creator_id, currency, amount, String(input.reason).slice(0, 500), parentId, key, actor.id]);
    await this.audit(actor, 'earnings.adjustment_created', 'earnings_ledger', result.rows[0].id, null, { adjustment_of: parentId, performer_amount_minor: amount, currency, reason: String(input.reason).slice(0, 200) }, request);
    return result.rows[0];
  }

  async payouts({ creatorId = '', status = '', ...input } = {}) {
    const { limit, offset } = limitOffset(input); const values = []; const where = [];
    if (creatorId) { values.push(creatorId); where.push(`p.creator_id=$${values.length}`); }
    if (PAYOUT_STATES.has(status)) { values.push(status); where.push(`p.status=$${values.length}`); }
    values.push(limit, offset);
    const result = await this.db.query(`SELECT p.id,p.creator_id,p.currency,p.amount_minor,p.status,p.reviewer_id,p.reviewed_at,p.approved_by,p.approved_at,p.processed_by,p.processed_at,p.provider,p.provider_payout_ref,p.failure_reason,p.idempotency_key,p.created_at,a.full_name AS creator_name FROM v3_payout_requests p LEFT JOIN v3_creator_records c ON c.id=p.creator_id LEFT JOIN performer_applications a ON a.id=c.application_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY p.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: result.rows, limit, offset };
  }

  async transitionPayout(id, status, actor, request) {
    if (!PAYOUT_STATES.has(status)) throw new HttpError(422, 'INVALID_PAYOUT_STATUS', 'Unsupported payout status.');
    if (['processing', 'paid'].includes(status)) {
      const readiness = await this.db.query(`SELECT i.configured,i.status,f.enabled FROM v3_integration_status i LEFT JOIN v3_feature_flags f ON f.key='v3_commerce_execution' AND f.environment='all' WHERE i.key='payments'`);
      const row = readiness.rows[0];
      if (!row || !row.configured || row.status !== 'healthy' || !row.enabled) throw new HttpError(503, 'COMMERCE_EXECUTION_DISABLED', 'Provider-backed payout execution is disabled until the payment integration and high-risk execution flag are verified.');
    }
    const current = await this.db.query('SELECT * FROM v3_payout_requests WHERE id=$1', [id]);
    if (!current.rowCount) throw new HttpError(404, 'PAYOUT_NOT_FOUND', 'Payout request was not found.');
    const result = await this.db.query(`UPDATE v3_payout_requests SET status=$2,reviewer_id=CASE WHEN $2='under_review' THEN $3 ELSE reviewer_id END,reviewed_at=CASE WHEN $2='under_review' THEN now() ELSE reviewed_at END,approved_by=CASE WHEN $2='approved' THEN $3 ELSE approved_by END,approved_at=CASE WHEN $2='approved' THEN now() ELSE approved_at END,processed_by=CASE WHEN $2 IN ('processing','paid','failed') THEN $3 ELSE processed_by END,processed_at=CASE WHEN $2 IN ('processing','paid','failed') THEN now() ELSE processed_at END WHERE id=$1 RETURNING *`, [id, status, actor.id]);
    await this.audit(actor, 'payout.transitioned', 'payout_request', id, { status: current.rows[0].status }, { status }, request);
    return result.rows[0];
  }

  async requestPayout(input, user, creatorId, request) {
    const amount = Math.round(safeNumber(input.amount_minor, -1)); const currency = String(input.currency || 'USD').toUpperCase(); const key = String(input.idempotency_key || '').trim();
    if (amount <= 0 || !/^[A-Z]{3}$/.test(currency) || key.length < 8 || key.length > 160) throw new HttpError(422, 'INVALID_PAYOUT_REQUEST', 'A positive amount, ISO currency and idempotency key are required.');
    const existing = await this.db.query('SELECT * FROM v3_payout_requests WHERE idempotency_key=$1', [key]);
    if (existing.rowCount) {
      const row = existing.rows[0];
      if (String(row.creator_id) !== String(creatorId) || Number(row.amount_minor) !== amount || row.currency !== currency) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'The idempotency key is already used for another payout request.');
      return { duplicate: true, record: row };
    }
    const result = await this.db.query(`INSERT INTO v3_payout_requests(creator_id,currency,amount_minor,status,idempotency_key) VALUES($1,$2,$3,'requested',$4) RETURNING *`, [creatorId, currency, amount, key]);
    await this.audit(user, 'payout.requested', 'payout_request', result.rows[0].id, null, { creator_id: creatorId, amount_minor: amount, currency, status: 'requested' }, request);
    return { duplicate: false, record: result.rows[0] };
  }

  async wallets({ creatorId = '', ...input } = {}) {
    const { limit, offset } = limitOffset(input); const values = []; const where = [];
    if (creatorId) { values.push(creatorId); where.push(`w.creator_id=$${values.length}`); }
    values.push(limit, offset);
    const result = await this.db.query(`SELECT w.id,w.customer_id,w.creator_id,w.currency,w.status,w.created_at,COALESCE(SUM(CASE WHEN l.direction='credit' THEN l.amount_minor ELSE 0 END),0)::bigint AS credited_minor,COALESCE(SUM(CASE WHEN l.direction='debit' THEN l.amount_minor ELSE 0 END),0)::bigint AS debited_minor,COALESCE(SUM(CASE WHEN l.direction='credit' THEN l.amount_minor ELSE -l.amount_minor END),0)::bigint AS available_minor FROM v3_commerce_wallets w LEFT JOIN v3_commerce_ledger_entries l ON l.wallet_id=w.id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} GROUP BY w.id ORDER BY w.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: result.rows.map(row => ({ ...row, balance_source: 'ledger', editable: false })), limit, offset };
  }

  async reconciliation({ domain = '', state = '', ...input } = {}) {
    const { limit, offset } = limitOffset(input); const values = []; const where = [];
    if (domain) { values.push(domain); where.push(`domain=$${values.length}`); }
    if (state) { values.push(state); where.push(`state=$${values.length}`); }
    values.push(limit, offset);
    const result = await this.db.query(`SELECT id,domain,provider,local_reference,provider_reference,state,local_amount_minor,provider_amount_minor,currency,details,reviewed_by,reviewed_at,created_at,updated_at FROM v3_commerce_reconciliation_records ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY updated_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: result.rows.map(row => ({ ...row, details: redact(row.details) })), limit, offset, correction_policy: 'No automatic financial correction. Use an auditable adjustment entry after review.' };
  }

  async createReconciliation(input, actor, request) {
    const domain = String(input.domain || ''); const state = String(input.state || 'needs_review');
    if (!['payment','subscription','settlement','payout','provider_event'].includes(domain) || !['matched','missing_local','missing_provider','amount_mismatch','currency_mismatch','status_mismatch','orphan_event','needs_review'].includes(state)) throw new HttpError(422, 'INVALID_RECONCILIATION', 'Unsupported reconciliation domain or state.');
    const result = await this.db.query(`INSERT INTO v3_commerce_reconciliation_records(domain,provider,local_reference,provider_reference,state,local_amount_minor,provider_amount_minor,currency,details) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(domain,provider,local_reference,provider_reference) DO UPDATE SET state=EXCLUDED.state,details=EXCLUDED.details,updated_at=now() RETURNING *`, [domain, input.provider || null, input.local_reference || null, input.provider_reference || null, state, input.local_amount_minor ?? null, input.provider_amount_minor ?? null, input.currency ? String(input.currency).toUpperCase() : null, redact(input.details || {})]);
    await this.audit(actor, 'reconciliation.recorded', 'reconciliation', result.rows[0].id, null, { domain, state, local_reference: input.local_reference || null, provider_reference: input.provider_reference || null }, request);
    return { ...result.rows[0], details: redact(result.rows[0].details) };
  }

  async integrations() {
    const result = await this.db.query(`SELECT key,label,category,configured,status,safe_metadata,last_checked_at,last_success_at FROM v3_integration_status WHERE category IN ('commerce','payments') OR key='payments' ORDER BY key`);
    const flag = await this.db.query(`SELECT enabled FROM v3_feature_flags WHERE key='v3_commerce_execution' AND environment='all'`);
    return { records: result.rows.map(row => ({ ...row, safe_metadata: redact(row.safe_metadata), execution_enabled: row.key === 'payments' && Boolean(row.configured) && row.status === 'healthy' && Boolean(flag.rows[0]?.enabled) })), feature_flag: { key: 'v3_commerce_execution', enabled: Boolean(flag.rows[0]?.enabled) } };
  }

  async updatePayoutProfile(input, creatorId, actor, request) {
    const method = String(input.method || ''); const status = String(input.status || 'pending_review'); const last4 = input.account_last4 == null ? null : String(input.account_last4).replace(/[^0-9A-Za-z]/g, '').slice(-4);
    if (!['paypal','bank_transfer','gcash','other'].includes(method) || !['missing','pending_review','verified','disabled'].includes(status)) throw new HttpError(422, 'INVALID_PAYOUT_PROFILE', 'Unsupported payout method or status.');
    const result = await this.db.query(`INSERT INTO v3_payout_profiles(creator_id,method,account_last4,status,safe_metadata,updated_by) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(creator_id) DO UPDATE SET method=EXCLUDED.method,account_last4=EXCLUDED.account_last4,status=EXCLUDED.status,safe_metadata=EXCLUDED.safe_metadata,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING id,creator_id,method,account_last4,status,safe_metadata,updated_at`, [creatorId, method, last4, status, redact(input.safe_metadata || {}), actor.id]);
    await this.audit(actor, 'payout_profile.updated', 'payout_profile', result.rows[0].id, null, { creator_id: creatorId, method, account_last4: last4, status }, request);
    return { ...result.rows[0], safe_metadata: redact(result.rows[0].safe_metadata) };
  }

  async creatorOverview(user) {
    const creator = await this.db.query('SELECT c.id,a.full_name,c.lifecycle FROM v3_creator_records c JOIN performer_applications a ON a.id=c.application_id WHERE c.user_id=$1', [user.id]);
    if (!creator.rowCount) throw new HttpError(404, 'CREATOR_NOT_LINKED', 'No creator record is linked to this account.');
    const creatorId = creator.rows[0].id;
    const [earnings, settlements, payouts, wallets, profile] = await Promise.all([
      this.earnings({ creatorId, limit: 100 }), this.settlements({ creatorId, limit: 100 }), this.payouts({ creatorId, limit: 100 }), this.wallets({ creatorId, limit: 10 }),
      this.db.query('SELECT id,method,account_last4,status,safe_metadata,updated_at FROM v3_payout_profiles WHERE creator_id=$1', [creatorId])
    ]);
    return { creator: creator.rows[0], earnings, settlements, payouts, wallets, payout_profile: profile.rows[0] ? { ...profile.rows[0], safe_metadata: redact(profile.rows[0].safe_metadata) } : null, historical_data: earnings.records.length || settlements.records.length ? 'OBSERVED' : 'NOT_MIGRATED' };
  }
}
