import test from 'node:test';
import assert from 'node:assert/strict';
import { DataExportService } from './data-export.js';

const db = {
  query: async (sql) => {
    if (sql.includes('catalog_brands')) return { rows: [{ legacy_id: 'brand-1', source_payload: { id: 'stale-brand', name: 'Brand' } }] };
    if (sql.includes('catalog_performers')) return { rows: [{ legacy_id: 'performer-1', source_payload: { display_name: 'Performer' } }] };
    if (sql.includes('catalog_videos')) return { rows: [{ legacy_id: 'video-1', source_payload: { title: 'Video' } }] };
    return { rows: [{ video_legacy_id: 'video-1', performer_legacy_id: 'performer-1', role_name: 'lead', display_order: 1, featured: true, lead_performer: true }] };
  }
};

test('admin data export returns all four PostgreSQL-backed envelopes', async () => {
  const result = await new DataExportService(db).exports();
  assert.deepEqual(Object.keys(result), ['Brand', 'Performer', 'Video', 'VideoPerformer']);
  assert.equal(result.Brand.count, 1);
  assert.equal(result.Brand.records[0].id, 'brand-1');
  assert.equal(result.VideoPerformer.records[0].id, 'video-1:performer-1');
  assert.equal(result.VideoPerformer.records[0].video_id, 'video-1');
});

test('admin data export can select a single entity and rejects unknown names', async () => {
  const service = new DataExportService(db);
  const result = await service.exports('Video');
  assert.deepEqual(Object.keys(result), ['Video']);
  await assert.rejects(() => service.exports('Wallet'), { code: 'EXPORT_ENTITY_INVALID' });
});

