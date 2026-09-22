import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { V3ProductionService, productionStatuses } from './v3-production.js';

const migration = fs.readFileSync(new URL('../migrations/0024_v3_production_domain.sql', import.meta.url), 'utf8');

test('Phase 4 migration defines the production lifecycle and lineage tables', () => {
  for (const name of ['v3_productions','v3_production_shoots','v3_production_scenes','v3_production_participant_assignments','v3_production_assets','v3_production_qa_checks','v3_production_render_jobs','v3_production_catalogue_links','v3_production_events']) assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${name}`));
  assert.match(migration, /ready_to_publish/);
  assert.match(migration, /source_asset_id uuid REFERENCES v3_production_assets/);
});

test('production lifecycle exposes controlled states', () => {
  assert.equal(productionStatuses.has('shooting'), true);
  assert.equal(productionStatuses.has('published'), true);
  assert.equal(productionStatuses.has('delete'), false);
});

test('production creation validates required identity', async () => {
  const service = new V3ProductionService({ query: async () => ({ rows: [] }) });
  await assert.rejects(() => service.create({ title: '', reference: '' }, { id: 'admin' }), { code: 'PRODUCTION_REQUIRED' });
});

test('private assets cannot fill public production roles', async () => {
  const db = { query: async (sql) => {
    if (sql.toLowerCase().includes('v3_productions')) return { rowCount: 1, rows: [{ id: 'p1' }] };
    if (sql.toLowerCase().includes('v3_media_assets')) return { rowCount: 1, rows: [{ id: 'a1', visibility: 'private', processing_state: 'ready' }] };
    return { rows: [] };
  } };
  const service = new V3ProductionService(db);
  await assert.rejects(() => service.asset('p1', { asset_id: 'a1', asset_role: 'edited_master' }, { id: 'admin' }), { code: 'PRIVATE_ASSET_NOT_PUBLIC_READY' });
});

test('scene requires a positive deterministic number and title', async () => {
  const service = new V3ProductionService({ query: async (sql) => sql.toLowerCase().includes('v3_productions') ? { rowCount: 1, rows: [{ id: 'p1' }] } : { rowCount: 0, rows: [] } });
  await assert.rejects(() => service.scene('p1', { scene_number: 0, title: '' }, { id: 'admin' }), { code: 'SCENE_REQUIRED' });
});

test('creator production projection is ownership-scoped', async () => {
  let statement = ''; let parameter;
  const service = new V3ProductionService({ query: async (sql, values) => { statement = sql; parameter = values[0]; return { rows: [] }; } });
  await service.creatorProductions({ id: 'creator-user-a' });
  assert.match(statement, /c\.user_id=\$1/);
  assert.equal(parameter, 'creator-user-a');
});
