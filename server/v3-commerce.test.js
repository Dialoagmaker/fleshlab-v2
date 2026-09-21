import test from 'node:test';
import assert from 'node:assert/strict';
import { V3CommerceService } from './v3-commerce.js';

test('V3 commerce represents absent financial data as readiness, not zero-value KPIs', async () => {
  const service = new V3CommerceService({ query: async () => ({ rows: [{ customers: 0, orders: 0, subscriptions: 0, payments: 0, wallets: 0, creator_earnings: 0, payout_requests: 0 }] }) });
  const result = await service.overview();
  assert.equal(result.readiness.find(item => item.key === 'subscriptions').state, 'NO_MIGRATED_DATA');
  assert.equal(result.readiness.find(item => item.key === 'payouts').state, 'DISABLED');
  assert.equal(result.providers.every(provider => provider.state === 'NOT_CONFIGURED'), true);
});
