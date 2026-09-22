import test from 'node:test'; import assert from 'node:assert/strict'; import { V3CatalogueService } from './v3-catalogue.js';
test('V3 catalogue rejects unsafe lifecycle values before mutation',async()=>{const service=new V3CatalogueService({query:async()=>({rows:[{legacy_id:'v',title:'V',slug:'v',performers:[]}],rowCount:1})});await assert.rejects(()=>service.update('video','v',{v3_lifecycle:'unsafe'},{id:'a'}),{code:'INVALID_LIFECYCLE'});});
test('V3 publish contract exposes real missing-field blockers',()=>{const service=new V3CatalogueService({});const result=service.publishCheck({title:'V',slug:'v',performers:[]});assert.equal(result.publishable,false);assert.ok(result.blockers.includes('missing_brand'));assert.ok(result.blockers.includes('missing_performer'));});
test('V3 publish readiness blocks private and missing public media', async () => {
  const db = { query: async (sql) => {
    if (sql.includes('SELECT v.*,b.status')) return { rowCount: 1, rows: [{ legacy_id: 'v1', title: 'Video', slug: 'video', brand_legacy_id: 'b1', brand_status: 'active', brand_lifecycle: 'active', status: 'draft' }] };
    if (sql.includes('SELECT 1 FROM catalog_videos')) return { rowCount: 0, rows: [] };
    if (sql.includes('SELECT p.legacy_id')) return { rowCount: 1, rows: [{ legacy_id: 'p1', status: 'active', v3_lifecycle: 'active' }] };
    if (sql.includes('FROM v3_media_assets a JOIN v3_media_asset_links')) return { rowCount: 1, rows: [{ id: 'a1', asset_type: 'source', visibility: 'private', processing_state: 'ready', is_primary: true }] };
    if (sql.includes('validation_snapshot')) return { rowCount: 0, rows: [] };
    throw new Error(`unexpected query: ${sql}`);
  } };
  const result = await new V3CatalogueService(db).publishReadiness('v1');
  assert.equal(result.publishable, false);
  assert.ok(result.blockers.includes('missing_public_thumbnail'));
  assert.ok(result.blockers.includes('missing_public_playback'));
});

test('V3 Phase 2 migration defines editable metadata and media assignment indexes', async () => {
  const fs = await import('node:fs/promises');
  const sql = await fs.readFile(new URL('../migrations/0022_v3_catalogue_operations.sql', import.meta.url), 'utf8');
  assert.match(sql, /v3_catalogue_video_meta/);
  assert.match(sql, /validation_snapshot/);
  assert.match(sql, /v3_media_video_primary_idx/);
});
