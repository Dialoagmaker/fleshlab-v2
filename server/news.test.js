import test from 'node:test';
import assert from 'node:assert/strict';
import { NewsService } from './news.js';

test('news service publishes only dated published records publicly', async () => {
  const calls = [];
  const db = { query: async (sql, values = []) => { calls.push({ sql, values }); return { rows: [{ id: 'article-1', title: 'News', slug: 'news', status: 'published', published_at: '2026-09-21T00:00:00Z', tags: [] }], rowCount: 1 }; } };
  const service = new NewsService(db);
  const records = await service.list({ publicOnly: true });
  assert.equal(records[0].slug, 'news');
  assert.match(calls[0].sql, /status='published'/);
  assert.match(calls[0].sql, /published_at<=now/);
});

test('news service requires title and slug and uses parameterized admin writes', async () => {
  const db = { query: async (sql, values = []) => ({ rows: [{ id: 'article-1', ...Object.fromEntries(values.slice(0, 2).map((value, index) => [index ? 'slug' : 'title', value])) }], rowCount: 1 }) };
  const service = new NewsService(db);
  await assert.rejects(() => service.save(null, { title: 'Missing slug' }), { code: 'NEWS_INVALID' });
  const record = await service.save(null, { title: 'News', slug: 'news', status: 'draft', tags: ['studio'] });
  assert.equal(record.title, 'News');
});
