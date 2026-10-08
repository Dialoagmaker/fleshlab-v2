import test from 'node:test';
import assert from 'node:assert/strict';
import { DiscoveryService } from './discovery.js';

test('discovery refuses a customer session', async () => {
  await assert.rejects(() => new DiscoveryService({ query: async () => ({ rows: [] }) }).snapshot({ role: 'customer' }), { code: 'FORBIDDEN' });
});

test('discovery reports only self-hosted recruitment and catalogue signals', async () => {
  const calls = [];
  const db = { query: async (sql) => {
    calls.push(sql);
    if (calls.length === 1) return { rows: [{ review_queue: 2, applications_last_30_days: 3, stale_reviews: 1, active_performers: 16, published_videos: 101, videos_missing_description: 4, videos_missing_thumbnail: 2 }] };
    if (calls.length === 2) return { rows: [{ id: 'app-1', full_name: 'Test', country: 'DE', status: 'submitted' }] };
    return { rows: [{ brand: 'FLESHLAB', published_videos: 10 }] };
  }};
  const result = await new DiscoveryService(db).snapshot({ role: 'admin' });
  assert.equal(result.metrics.published_videos, 101);
  assert.equal(result.review_queue[0].id, 'app-1');
  assert.equal(result.sources.external_analytics, 'not_migrated');
  assert.equal(calls.length, 3);
  assert.match(calls[0], /catalog_videos/);
  assert.match(calls[1], /performer_applications/);
});
