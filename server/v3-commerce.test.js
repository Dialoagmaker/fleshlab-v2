import test from 'node:test';
import assert from 'node:assert/strict';
import { V3CommerceService } from './v3-commerce.js';

test('V3 commerce represents absent financial data as observed absence, not fabricated KPIs', async () => {
  const service = new V3CommerceService({ query: async sql => {
    if (sql.includes('FROM v3_commerce_customers')) return { rows: [{ customers: 0, orders: 0, subscriptions: 0, active_subscriptions: 0, inactive_subscriptions: 0, payments: 0, succeeded_payments: 0, failed_payments: 0, wallets: 0, ledger_entries: 0, settlements: 0, open_settlements: 0, payout_requests: 0, open_payouts: 0, provider_events: 0, reconciliation_attention: 0 }] };
    return { rows: [] };
  } });
  const result = await service.overview();
  assert.equal(result.metrics_state, 'NO_MIGRATED_DATA');
  assert.equal(result.historical_data, 'NOT_MIGRATED');
  assert.equal(result.provider_readiness.execution_enabled, false);
  assert.equal(result.financial_execution.enabled, false);
});

test('commerce provider execution is fail-closed when the integration or flag is absent', async () => {
  const service = new V3CommerceService({ query: async sql => {
    if (sql.includes('FROM v3_integration_status')) return { rows: [] };
    if (sql.includes('FROM v3_payout_requests WHERE id')) return { rows: [{ id: 'payout-1', status: 'approved' }] };
    return { rows: [] };
  } });
  await assert.rejects(() => service.transitionPayout('payout-1', 'processing', { id: 'admin-1' }), { code: 'COMMERCE_EXECUTION_DISABLED' });
});

test('provider event ingestion is idempotent and never returns payload data', async () => {
  let inserted = false;
  const service = new V3CommerceService({ query: async (sql, values) => {
    if (sql.includes('WHERE provider=$1 AND provider_event_id=$2') && values[1] === 'evt-1') return { rowCount: 1, rows: [{ id: 'event-1', provider: 'sandbox', provider_event_id: 'evt-1', payload: { secret: 'hidden' }, payload_hash: 'hash' }] };
    if (sql.startsWith('INSERT INTO v3_commerce_provider_events')) { inserted = true; return { rows: [{ id: 'event-2', provider: 'sandbox', provider_event_id: 'evt-2', status: 'received' }] }; }
    return { rows: [] };
  } });
  const duplicate = await service.recordProviderEvent({ provider: 'sandbox', event_id: 'evt-1', payload: { secret: 'hidden' } }, { id: 'admin-1' });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.record.payload, undefined);
  const first = await service.recordProviderEvent({ provider: 'sandbox', event_id: 'evt-2', payload: { reference: 'safe' } }, { id: 'admin-1' });
  assert.equal(first.duplicate, false);
  assert.equal(first.record.payload, undefined);
});

test('payout idempotency rejects a reused key with different financial data', async () => {
  const service = new V3CommerceService({ query: async sql => sql.includes('WHERE idempotency_key=$1') ? { rowCount: 1, rows: [{ creator_id: 'creator-1', amount_minor: 5000, currency: 'USD' }] } : { rows: [] } });
  await assert.rejects(() => service.requestPayout({ amount_minor: 7000, currency: 'USD', idempotency_key: 'request-key-1' }, { id: 'creator-user' }, 'creator-1'), { code: 'IDEMPOTENCY_CONFLICT' });
});

test('plans validate currency, interval and non-negative amount before persistence', async () => {
  const service = new V3CommerceService({ query: async () => ({ rows: [] }) });
  await assert.rejects(() => service.savePlan(null, { plan_key: 'adult', name: 'Adult', amount_minor: -1, currency: 'USD', interval: 'month' }, { id: 'admin-1' }), { code: 'INVALID_PLAN' });
  await assert.rejects(() => service.savePlan(null, { plan_key: 'adult', name: 'Adult', amount_minor: 100, currency: 'US', interval: 'month' }, { id: 'admin-1' }), { code: 'INVALID_PLAN' });
});

test('ledger adjustments create a new immutable entry instead of editing history', async () => {
  const queries = [];
  const service = new V3CommerceService({ query: async (sql) => {
    queries.push(sql);
    if (sql.includes('SELECT id,creator_id,performer_legacy_id,original_currency')) return { rowCount: 1, rows: [{ id: 'ledger-1', creator_id: 'creator-1', performer_legacy_id: 'perf-1', original_currency: 'USD' }] };
    if (sql.includes('SELECT * FROM v3_earnings_ledger WHERE idempotency_key')) return { rowCount: 0, rows: [] };
    if (sql.startsWith('INSERT INTO v3_earnings_ledger')) return { rows: [{ id: 'adjustment-1', event_type: 'adjustment', performer_amount_minor: -100 }] };
    return { rows: [] };
  } });
  const result = await service.addAdjustment({ adjustment_of: 'ledger-1', creator_id: 'creator-1', performer_amount_minor: -100, reason: 'Refund correction', idempotency_key: 'adjustment-1' }, { id: 'admin-1' });
  assert.equal(result.event_type, 'adjustment');
  assert.equal(queries.some(sql => sql.includes('UPDATE v3_earnings_ledger')), false);
});

test('payment record mutation is idempotent and rejects mismatched retries', async () => {
  const service = new V3CommerceService({ query: async (sql) => sql.includes('WHERE idempotency_key=$1') ? { rowCount: 1, rows: [{ provider: 'sandbox', amount_minor: 1000, currency: 'USD' }] } : { rows: [] } });
  await assert.rejects(() => service.recordPayment({ provider: 'sandbox', provider_payment_id: 'pay-1', amount_minor: 2000, currency: 'USD', idempotency_key: 'payment-key' }, { id: 'admin-1' }), { code: 'IDEMPOTENCY_CONFLICT' });
});
