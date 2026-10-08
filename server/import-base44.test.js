import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { importEntities, importSnapshot, snapshotFromExports } from './import-base44.js';

async function fixture(overrides = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'fleshlab-import-'));
  const entities = {
    Brand: [{ id: 'brand-1', name: 'Synthetic Brand', slug: 'synthetic-brand', status: 'active' }],
    Performer: [{ id: 'performer-1', display_name: 'Synthetic Performer', slug: 'synthetic-performer', status: 'active' }],
    Video: [{ id: 'video-1', title: 'Synthetic Video', slug: 'synthetic-video', brand_id: 'brand-1', status: 'draft' }],
    VideoPerformer: [{ video_id: 'video-1', performer_id: 'performer-1', order: 0 }], ...overrides
  };
  await Promise.all(Object.entries(entities).map(([name, rows]) => writeFile(path.join(dir, `${name}_export_2026-09-20.json`), JSON.stringify({ entity: name, exported_at: '2026-09-20T00:00:00Z', count: rows.length, records: rows }))));
  return dir;
}

test('catalogue export dry run validates preserved relationships', async () => {
  const inputDirectory = await fixture();
  const result = await importSnapshot({ inputDirectory, execute: false, databaseUrl: 'postgres://unused' });
  assert.deepEqual({ brands: result.brands, performers: result.performers, videos: result.videos, credits: result.credits, dry_run: result.dry_run }, { brands: 1, performers: 1, videos: 1, credits: 1, dry_run: true });
});

test('catalogue export imports complete records and reports orphaned video-performer relationships', async () => {
  const inputDirectory = await fixture({ VideoPerformer: [{ video_id: 'video-missing', performer_id: 'performer-1' }] });
  const result = await importSnapshot({ inputDirectory, execute: false, databaseUrl: 'postgres://unused' });
  assert.equal(result.credits, 0);
  assert.equal(result.skipped_credits, 1);
  assert.deepEqual(result.unresolved_credits[0].missing, [{ entity: 'Video', id: 'video-missing' }]);
});

test('Base44 browser export envelopes are accepted without a filesystem export', () => {
  const snapshot = snapshotFromExports({
    Brand: { entity: 'Brand', exported_at: '2026-09-20T00:00:00Z', records: [{ id: 'brand-1', name: 'Synthetic Brand', slug: 'synthetic-brand' }] },
    Performer: { entity: 'Performer', exported_at: '2026-09-20T00:00:00Z', records: [{ id: 'performer-1', display_name: 'Synthetic Performer', slug: 'synthetic-performer' }] },
    Video: { entity: 'Video', exported_at: '2026-09-20T00:00:00Z', records: [{ id: 'video-1', title: 'Synthetic Video', slug: 'synthetic-video', brand_id: 'brand-1' }] },
    VideoPerformer: { entity: 'VideoPerformer', exported_at: '2026-09-20T00:00:00Z', records: [{ video_id: 'video-1', performer_id: 'performer-1' }] }
  });
  assert.equal(snapshot.entities.Video.length, 1);
  assert.equal(snapshot.manifest.source, 'base44-data-export');
});

test('Base44 browser export surfaces a safe validation error for incomplete records', () => {
  const snapshot = snapshotFromExports({
    Brand: { entity: 'Brand', exported_at: '2026-09-20T00:00:00Z', records: [{ id: 'brand-1', name: 'Synthetic Brand', slug: 'synthetic-brand' }] },
    Performer: { entity: 'Performer', exported_at: '2026-09-20T00:00:00Z', records: [{ id: 'performer-1', display_name: '', slug: 'synthetic-performer' }] },
    Video: { entity: 'Video', exported_at: '2026-09-20T00:00:00Z', records: [] },
    VideoPerformer: { entity: 'VideoPerformer', exported_at: '2026-09-20T00:00:00Z', records: [] }
  });
  return assert.rejects(() => importEntities({ snapshot, execute: false }), (error) => error.code === 'IMPORT_INVALID' && /Performer\.display_name/.test(error.message));
});
