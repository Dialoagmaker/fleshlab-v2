import test from 'node:test';
import assert from 'node:assert/strict';
import { V3PublicService } from './v3-public.js';

test('public video listing is server-filtered to published records and paginated', async () => {
  const calls = [];
  const db = { query: async (sql, values) => {
    calls.push({ sql, values });
    if (sql.includes('count(*)')) return { rows: [{ total: 1 }] };
    return { rows: [{ id: 'v1', title: 'Published', slug: 'published', performers: [], thumbnail_url: null, trailer_url: null }] };
  } };
  const result = await new V3PublicService(db).listVideos({ q: 'published', page: 2, limit: 12, sort: 'title' });
  assert.equal(result.total, 1);
  assert.equal(result.page, 2);
  assert.match(calls[0].sql, /v\.v3_lifecycle='published'/);
  assert.match(calls[0].sql, /v\.status='published'/);
  assert.match(calls[1].sql, /LIMIT 12 OFFSET 12/);
  assert.deepEqual(calls[0].values, ['%published%']);
});

test('public media projection never exposes private or storage references', async () => {
  const db = { query: async () => ({ rowCount: 1, rows: [{ id: 'a1', asset_type: 'thumbnail', legacy_url: 'https://cdn.example/thumb.jpg', processing_state: 'ready', visibility: 'public', storage_reference: 'private/key' }] }) };
  const result = await new V3PublicService(db).media('a1');
  assert.deepEqual(result, { id: 'a1', type: 'thumbnail', url: 'https://cdn.example/thumb.jpg', processing_state: 'ready' });
  assert.equal('storage_reference' in result, false);
});
