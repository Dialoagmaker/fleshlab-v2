import test from 'node:test';
import assert from 'node:assert/strict';
import { CatalogueService } from './catalog.js';

const rows = {
  brands: [{ legacy_id: 'brand-1', name: 'Brand One', slug: 'brand-one', status: 'active', source_payload: {}, imported_at: '2026-09-20T00:00:00Z' }],
  performers: [{ legacy_id: 'performer-1', display_name: 'Performer One', slug: 'performer-one', status: 'active', source_payload: { verified: true }, imported_at: '2026-09-20T00:00:00Z' }],
  videos: [{ legacy_id: 'video-1', title: 'Video One', slug: 'video-one', description: null, short_summary: null, brand_legacy_id: 'brand-1', status: 'published', access_tier: 'free', release_date: '2026-09-20', duration_seconds: 60, legacy_thumbnail_url: 'https://example.test/thumb.jpg', legacy_trailer_url: 'https://example.test/trailer.mp4', source_payload: { source_video_url: 'https://private.example.test/original.mp4' }, imported_at: '2026-09-20T00:00:00Z' }],
  credits: [{ video_legacy_id: 'video-1', performer_legacy_id: 'performer-1' }]
};
const db = { query: async (sql) => ({ rows: sql.includes('catalog_brands') ? rows.brands : sql.includes('catalog_performers') ? rows.performers : sql.includes('catalog_videos') ? rows.videos : rows.credits }) };

test('public catalogue returns imported public records without raw source media URLs', async () => {
  const service = new CatalogueService(db);
  const result = await service.dispatch('getPublicVideoDetail', { slug: 'video-one' });
  assert.equal(result.video.title, 'Video One');
  assert.deepEqual(result.video.performer_ids, ['performer-1']);
  assert.equal(Object.hasOwn(result.video, 'source_video_url'), false);
  assert.equal(result.performers[0].display_name, 'Performer One');
});

test('public catalogue exposes only published videos', async () => {
  const service = new CatalogueService(db);
  const result = await service.dispatch('getPublicVideos', { limit: 24 });
  assert.equal(result.total, 1);
  assert.equal(result.videos[0].slug, 'video-one');
});
