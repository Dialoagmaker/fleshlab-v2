import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
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
  const id = '11111111-1111-4111-8111-111111111111';
  const db = { query: async () => ({ rowCount: 1, rows: [{ id, asset_type: 'thumbnail', legacy_url: 'https://cdn.example/thumb.jpg', processing_state: 'ready', visibility: 'public', storage_reference: 'private/key' }] }) };
  const result = await new V3PublicService(db).media(id);
  assert.deepEqual(result, { id, type: 'thumbnail', url: 'https://cdn.example/thumb.jpg', processing_state: 'ready' });
  assert.equal('storage_reference' in result, false);
});

test('malformed public media ids are rejected before reaching PostgreSQL', async () => {
  let queried = false;
  const db = { query: async () => { queried = true; return { rowCount: 0, rows: [] }; } };
  await assert.rejects(() => new V3PublicService(db).media('not-a-uuid'), { code: 'NOT_FOUND' });
  assert.equal(queried, false);
});

test('valid missing public media ids return not found', async () => {
  const db = { query: async () => ({ rowCount: 0, rows: [] }) };
  await assert.rejects(() => new V3PublicService(db).media('11111111-1111-4111-8111-111111111111'), { code: 'NOT_FOUND' });
});

test('homepage configuration defaults to safe visible sections when no curation row is available', async () => {
  const service = new V3PublicService({ query: async () => ({ rows: [] }) });
  const config = await service.homeConfig();
  assert.equal(config.hero_cta_target, '/v3/videos');
  assert.equal(config.section_visibility.featured_videos, true);
  assert.deepEqual(config.featured_video_ids, []);
});

test('homepage curation rejects external CTA targets before persistence', async () => {
  let writes = 0;
  const db = { query: async sql => {
    if (sql.startsWith('SELECT * FROM v3_public_homepage_config')) return { rows: [] };
    if (sql.startsWith('UPDATE v3_public_homepage_config')) writes += 1;
    return { rows: [] };
  } };
  await assert.rejects(() => new V3PublicService(db).updateHomepage({ hero_cta_target: 'https://unsafe.example' }, { id: 'admin-1' }), { code: 'INVALID_HOMEPAGE_CONFIG' });
  assert.equal(writes, 0);
});

test('homepage curation refuses draft or inactive selections server-side', async () => {
  const db = { query: async sql => sql.startsWith('SELECT * FROM v3_public_homepage_config') ? { rows: [] } : { rows: [] } };
  await assert.rejects(() => new V3PublicService(db).updateHomepage({ featured_video_ids: ['draft-video'] }, { id: 'admin-1' }), { code: 'HOMEPAGE_SELECTION_NOT_PUBLIC' });
});

test('homepage curation is audited and keeps only bounded curated ids', async () => {
  const calls = [];
  const db = { query: async (sql, values) => {
    calls.push({ sql, values });
    if (sql.startsWith('SELECT * FROM v3_public_homepage_config')) return { rows: [] };
    if (sql.includes('FROM catalog_videos WHERE legacy_id')) return { rows: [{ id: 'video-1' }] };
    if (sql.startsWith('UPDATE v3_public_homepage_config')) return { rows: [{ singleton: true, hero_title: 'A real hero', featured_video_ids: ['video-1'], section_visibility: { featured_videos: false } }] };
    return { rows: [] };
  } };
  const result = await new V3PublicService(db).updateHomepage({ hero_title: 'A real hero', featured_video_ids: ['video-1', 'video-1'], section_visibility: { featured_videos: false } }, { id: 'admin-1' }, { headers: {} });
  assert.equal(result.config.hero_title, 'A real hero');
  const update = calls.find(call => call.sql.startsWith('UPDATE v3_public_homepage_config'));
  assert.deepEqual(update.values[8], ['video-1']);
  assert.equal(calls.some(call => call.sql.includes("'public_homepage.updated'")), true);
});

test('homepage public query is backed only by published videos and active performers', async () => {
  const calls = [];
  const db = { query: async (sql, values) => {
    calls.push({ sql, values });
    if (sql.startsWith('SELECT count(*)')) return { rows: [{ total: 0 }] };
    if (sql.includes('v3_public_homepage_config')) return { rows: [] };
    return { rows: [] };
  } };
  await new V3PublicService(db).homepage();
  assert.equal(calls.some(call => /v\.v3_lifecycle='published'/.test(call.sql) && /v\.status='published'/.test(call.sql)), true);
  assert.equal(calls.some(call => /v3_lifecycle='active'/.test(call.sql) && /status='active'/.test(call.sql)), true);
});

test('public homepage UI keeps SEO, lazy imagery and no storage references', async () => {
  const source = await fs.readFile(new URL('../v3/src/public.jsx', import.meta.url), 'utf8');
  assert.match(source, /application\/ld\+json/);
  assert.match(source, /loading=\{eager \? 'eager' : 'lazy'\}/);
  assert.doesNotMatch(source, /storage_reference|private_profile|audit/);
});

test('Phase 6A homepage migration is additive and configures a singleton curator record', async () => {
  const migration = await fs.readFile(new URL('../migrations/0029_v3_public_homepage.sql', import.meta.url), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS v3_public_homepage_config/);
  assert.match(migration, /INSERT INTO v3_public_homepage_config/);
  assert.doesNotMatch(migration, /\bDROP\s+(TABLE|DATABASE)|\bDELETE\s+FROM/i);
});
