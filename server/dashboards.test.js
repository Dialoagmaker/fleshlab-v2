import test from 'node:test';
import assert from 'node:assert/strict';
import { DashboardService } from './dashboards.js';

function dbWith(rows = []) { return { query: async () => ({ rows }) }; }
const customer = { id: '00000000-0000-0000-0000-000000000001', email: 'customer@example.test', role: 'customer', account_status: 'active' };

test('customer dashboard does not invent commerce or media data', async () => {
  const dashboard = new DashboardService(dbWith([]));
  const result = await dashboard.customer(customer);
  assert.deepEqual(result.subscriptions, []);
  assert.deepEqual(result.payments, []);
  assert.equal(result.migration.commerce, 'not_migrated');
});

test('performer dashboard refuses a customer session', async () => {
  await assert.rejects(() => new DashboardService(dbWith()).performer(customer), { code: 'FORBIDDEN' });
});

test('admin dashboard refuses a customer session', async () => {
  await assert.rejects(() => new DashboardService(dbWith()).admin(customer), { code: 'FORBIDDEN' });
});
