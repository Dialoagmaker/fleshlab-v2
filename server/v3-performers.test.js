import test from 'node:test';
import assert from 'node:assert/strict';
import { performerOperationalStates, V3PerformerService } from './v3-performers.js';
import { hasPermission } from './v3-system.js';

test('performer operations use controlled independent operational states and permissions', () => {
  assert.deepEqual([...performerOperationalStates].sort(), ['active', 'archived', 'inactive']);
  assert.equal(hasPermission({ role: 'admin' }, 'performer.create'), true);
  assert.equal(hasPermission({ role: 'staff' }, 'performer.read'), true);
  assert.equal(hasPermission({ role: 'staff' }, 'performer.update'), false);
  assert.equal(hasPermission({ role: 'performer' }, 'performer.read'), false);
});

test('manual performer creation rejects malformed profile input before persistence', async () => {
  const service = new V3PerformerService({ query: async () => { throw new Error('database should not be called'); } });
  await assert.rejects(() => service.create({ display_name: '', slug: '' }, { id: 'admin' }), { code: 'INVALID_PERFORMER' });
});

test('performer operations migration is additive and preserves separate public, operational and account state', async () => {
  const fs = await import('node:fs/promises');
  const sql = await fs.readFile(new URL('../migrations/0031_v3_performer_operations.sql', import.meta.url), 'utf8');
  assert.match(sql, /ADD COLUMN IF NOT EXISTS operational_status/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS public_visibility/);
  assert.match(sql, /v3_performer_user_links/);
  assert.doesNotMatch(sql, /DROP TABLE|DELETE FROM/i);
});

test('admin video assignment uses the canonical catalogue relationship and is auditable', async () => {
  const queries = [];
  const client = { query: async sql => { queries.push(sql); return { rows: [], rowCount: 0 }; }, release() {} };
  const db = {
    query: async sql => {
      if (sql.includes('SELECT legacy_id FROM catalog_performers')) return { rows: [{ legacy_id: 'performer-1' }], rowCount: 1 };
      if (sql.includes('SELECT legacy_id FROM catalog_videos')) return { rows: [{ legacy_id: 'video-1' }], rowCount: 1 };
      throw new Error(`unexpected query: ${sql}`);
    },
    connect: async () => client
  };
  const service = new V3PerformerService(db);
  service.detail = async () => ({ performer: { legacy_id: 'performer-1' }, videos: [{ legacy_id: 'video-1' }], productions: [], earnings: [], contracts: [], audit: [] });
  service.audit = async () => {};
  const result = await service.replaceVideos('performer-1', ['video-1'], { id: 'admin-1' }, {});
  assert.deepEqual(result.videos.map(video => video.legacy_id), ['video-1']);
  assert.ok(queries.some(sql => sql.includes('DELETE FROM catalog_video_performers')));
  assert.ok(queries.some(sql => sql.includes('INSERT INTO catalog_video_performers')));
});

test('private performer address is kept in the creator workspace and not in public performer projections', async () => {
  const fs = await import('node:fs/promises');
  const adminSource = await fs.readFile(new URL('./v3-performers.js', import.meta.url), 'utf8');
  const publicSource = await fs.readFile(new URL('./v3-public.js', import.meta.url), 'utf8');
  assert.match(adminSource, /private_profile/);
  assert.match(adminSource, /address/);
  assert.doesNotMatch(publicSource, /private_profile/);
  assert.doesNotMatch(publicSource, /internal_admin_notes/);
});

test('performer workspace UI exposes account, private identity, media, videos and contracts without a second data store', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(new URL('../v3/src/performers.jsx', import.meta.url), 'utf8');
  assert.match(source, /Prepare private performer workspace/);
  assert.match(source, /Private address/);
  assert.match(source, /\/admin\/performers\/\$\{performerId\}\/videos/);
  assert.match(source, /PRIVATE MEDIA REVIEW/);
  assert.match(source, /\/admin\/creators\/records\/\$\{creator\.id\}\/media\/\$\{asset\.id\}\/view/);
  assert.match(source, /<img src=\{preview\}/);
  assert.match(source, /<video controls preload="none" src=\{preview\}/);
  assert.match(source, /Refresh previews/);
  assert.match(source, /Approve and set as profile/);
  assert.match(source, /Set as profile/);
  assert.match(source, /profile_image_url/);
  assert.match(source, /Open Contract Center for this performer/);
  assert.match(source, /\/admin\/performers\/\$\{performerId\}\/account-link/);
});
