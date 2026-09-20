import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { importSnapshot } from './import-base44.js';

async function fixture(overrides = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'fleshlab-import-'));
  const entities = {
    Brand: [{ id: 'brand-1', name: 'Synthetic Brand', slug: 'synthetic-brand', status: 'active' }],
    Performer: [{ id: 'performer-1', display_name: 'Synthetic Performer', slug: 'synthetic-performer', status: 'active' }],
    Video: [{ id: 'video-1', title: 'Synthetic Video', slug: 'synthetic-video', brand_id: 'brand-1', status: 'draft' }],
    VideoPerformer: [{ video_id: 'video-1', performer_id: 'performer-1', order: 0 }], ...overrides
  };
  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ source: 'synthetic-test', exported_at: '2026-09-20T00:00:00Z' }));
  await Promise.all(Object.entries(entities).map(([name, rows]) => writeFile(path.join(dir, `${name}.json`), JSON.stringify(rows))));
  return dir;
}

test('catalogue export dry run validates preserved relationships', async () => {
  const inputDirectory = await fixture();
  const result = await importSnapshot({ inputDirectory, execute: false, databaseUrl: 'postgres://unused' });
  assert.deepEqual({ brands: result.brands, performers: result.performers, videos: result.videos, credits: result.credits, dry_run: result.dry_run }, { brands: 1, performers: 1, videos: 1, credits: 1, dry_run: true });
});

test('catalogue export refuses an orphaned video-performer relationship', async () => {
  const inputDirectory = await fixture({ VideoPerformer: [{ video_id: 'video-missing', performer_id: 'performer-1' }] });
  await assert.rejects(() => importSnapshot({ inputDirectory, execute: false, databaseUrl: 'postgres://unused' }), /unknown video/);
});
