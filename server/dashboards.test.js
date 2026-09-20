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

test('admin dashboard includes only database-backed catalogue metrics', async () => {
  const calls = [];
  const db = {
    query: async (sql) => {
      calls.push(sql);
      if (calls.length === 1) return { rows: [{ applications_total: 2, applications_pending: 1, active_performers: 1, active_accounts: 3, active_brands: 5, catalogue_performers: 16, published_videos: 101, catalogue_credits: 105 }] };
      return { rows: [] };
    }
  };
  const result = await new DashboardService(db).admin({ ...customer, role: 'admin' });
  assert.equal(result.metrics.published_videos, 101);
  assert.equal(result.metrics.catalogue_credits, 105);
  assert.equal(result.migration.catalog, 'migrated');
  assert.match(calls[0], /catalog_videos/);
  assert.match(calls[0], /catalog_video_performers/);
});
