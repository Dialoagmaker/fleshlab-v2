import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fetchAllLoyalFansCataloguePages, normalizeLoyalFansCatalogueItem } from './loyalfans-catalogue.js';
import { LoyalFansProviderClient } from './loyalfans-provider-client.js';
import { LoyalFansCatalogueSyncService } from './loyalfans-catalogue-sync.js';
import { createLoyalFansMediaCopier } from './loyalfans-catalogue-media.js';

const memberUid = 'creator_UID_000000000000000000000000000';
const fakeCookie = 'NEXOSESSION=test-cookie';
const fakeBearer = 'test-bearer';
const fakeXsrf = 'test-xsrf';
const mediaHosts = ['cdn.loyalfans.com'];
const JPEG_BYTES = Buffer.from([0xff,0xd8,0xff,0xe0,0,0x10,0x4a,0x46,0x49,0x46,0,0]);
const PNG_BYTES = Buffer.from([137,80,78,71,13,10,26,10]);

function mp4Bytes(brand = 'isom') {
  return Buffer.concat([Buffer.from([0,0,0,20]), Buffer.from('ftyp'), Buffer.from(brand), Buffer.from([0,0,0,0]), Buffer.from(brand)]);
}

function observedItem(index, overrides = {}) {
  const suffix = String(index).padStart(4, '0');
  return {
    uid: `post_UID_${suffix}_000000000000000000000000`,
    short_url: `https://tinylf.com/short-${suffix}`,
    slug: `observed-product-${suffix}`,
    owner: { uid: memberUid },
    title: `Observed title ${suffix}`,
    content: `Description ${suffix}`,
    clean_content: `Clean description ${suffix}`,
    hashtags: ['observed', 'catalogue'],
    created_at: '2026-08-23T10:00:00.000Z',
    updated_at: '2026-08-24T10:00:00.000Z',
    video: true,
    video_object: {
      video_trailer: `https://cdn.loyalfans.com/trailer-${suffix}.mp4?Signature=ephemeral-${suffix}`,
      poster: `https://cdn.loyalfans.com/poster-${suffix}.jpg?Signature=ephemeral-${suffix}`,
      uid: `video_UID_${suffix}_00000000000000000000000`,
      duration: 732.5,
      mime: 'video/mp4',
      views: 18,
      preview_option: 'trailer',
      orientation: 'landscape',
      size: { height: 1080, width: 1920 },
      downloadable_video_meta: { resolution: '1080p', format: 'mp4', size: 123456789 }
    },
    privacy: { privacy_rule: 'ppv' },
    downloadable: true,
    price: '1.99',
    old_price: '2.99',
    discount_expire_at: '2026-12-31T23:59:59Z',
    discount_percent: 33.44,
    is_bought: Boolean(index % 2),
    can_see: true,
    can_buy: true,
    image_placeholder: null,
    ...overrides
  };
}

function observedPage(page, total = 116, perPage = 12) {
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const from = (page - 1) * perPage;
  const to = Math.min(from + perPage, total);
  return {
    success: true,
    httpCode: 200,
    creator: { uid: memberUid },
    list: Array.from({ length: to - from }, (_unused, index) => observedItem(from + index)),
    page_meta: { total, per_page: perPage, current_page: page, last_page: lastPage, from, to }
  };
}

function makeDatabase({ mappedUids = [], existingProducts = [], failMediaTypes = [], failProvenanceCount = 0 } = {}) {
  const maps = new Map(mappedUids.map(([uid, video]) => [uid, { id: `map-${uid}`, provider: 'loyalfans', external_content_uid: uid, video_legacy_id: video, status: 'active' }]));
  const videos = new Set(mappedUids.map(([, video]) => video));
  const products = new Map(existingProducts.map(row => [row.loyalfans_post_uid, { ...row }]));
  const media = new Map();
  const links = new Set();
  const runs = [];
  const runItems = new Map();
  const calls = [];
  let mediaId = 0;
  const query = async (sql, values = []) => {
    calls.push({ sql, values });
    if(sql.includes('SELECT loyalfans_post_uid,source_page FROM v3_loyalfans_catalogue_sync_items')){
      return{rows:[...runItems.values()].filter(item=>item.run_id===values[0] && values[1].includes(item.loyalfans_post_uid))};
    }
    if (sql.includes('SELECT * FROM v3_loyalfans_catalogue_sync_runs WHERE status IN')) {
      const row = runs.find(run => ['running','failed'].includes(run.status));
      return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes('INSERT INTO v3_loyalfans_catalogue_sync_runs')) {
      const row = { id: `run-${runs.length + 1}`, status: 'running', next_page: 1, expected_total: null,
        expected_per_page: null, expected_last_page: null, scanned: 0, created: 0, updated: 0, unchanged: 0, conflicted: 0, failed: 0 };
      runs.push(row);
      return { rows: [{ ...row }], rowCount: 1 };
    }
    if (sql.includes('SELECT * FROM v3_loyalfans_catalogue_sync_runs WHERE id=$1')) {
      const row = runs.find(run => run.id === values[0]);
      return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes('UPDATE v3_loyalfans_catalogue_sync_runs SET')) {
      const row = runs.find(run => run.id === values[0]);
      if (row && sql.includes('expected_total=$2')) Object.assign(row, { expected_total: values[1], expected_per_page: values[2],
        expected_last_page: values[3], next_page: values[4], scanned: values[5], created: values[6], updated: values[7],
        unchanged: values[8], conflicted: values[9], failed: values[10], unmapped: values[11], status: values[12] });
      else if (row && sql.includes("status='failed'")) { row.status = 'failed'; row.last_error_code = values[1]; }
      else if (row && sql.includes("status='running'")) row.status = 'running';
      else if (row && sql.includes("status='abandoned'")) row.status = 'abandoned';
      return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes('SELECT metadata_fingerprint,status,source_page,action,mapped FROM v3_loyalfans_catalogue_sync_items')) {
      const row = runItems.get(`${values[0]}:${values[1]}`);
      return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes('INSERT INTO v3_loyalfans_catalogue_sync_items')) {
      const row = { run_id: values[0], loyalfans_post_uid: values[1], loyalfans_video_uid: values[2], title: values[3],
        current_price_minor: values[4], currency: values[5], source_page: values[6], metadata_fingerprint: values[7],
        status: 'processing', mapped: false, action: null };
      runItems.set(`${values[0]}:${values[1]}`, row);
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes('UPDATE v3_loyalfans_catalogue_sync_items SET status=$3')) {
      const row = runItems.get(`${values[0]}:${values[1]}`);
      if (row) Object.assign(row, { status: values[2], error_code: values[3], action: values[8] || row.action, mapped: values[9] === true });
      return { rows: [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes("UPDATE v3_loyalfans_catalogue_sync_items SET status='synced'")) {
      const row = runItems.get(`${values[0]}:${values[1]}`);
      if (row) Object.assign(row, { status: 'synced', action: values[2], mapped: values[3] === true });
      return { rows: [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes("UPDATE v3_loyalfans_catalogue_sync_items SET status='conflict'")) {
      const row = runItems.get(`${values[0]}:${values[1]}`);
      if (row) Object.assign(row, { status: 'conflict', error_code: 'DUPLICATE_CATALOGUE_UID_CONFLICT' });
      return { rows: [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes("UPDATE v3_loyalfans_catalogue_sync_items SET status='failed'")) return { rows: [], rowCount: 0 };
    if (sql.includes('UPDATE v3_loyalfans_catalogue_products SET sync_status=')) return { rows: [], rowCount: 1 };
    if (sql.includes('FROM v3_catalogue_external_content_mappings') && sql.includes('external_content_uid=$2')) {
      const row = maps.get(values[1]);
      return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes('FROM v3_catalogue_external_content_mappings') && sql.includes('external_content_uid=$1')) {
      const row = maps.get(values[0]);
      const matches = row && row.video_legacy_id === values[1] ? [row] : [];
      return { rows: matches, rowCount: matches.length };
    }
    if (sql.includes('SELECT legacy_id FROM catalog_videos')) {
      const row = videos.has(values[0]) ? { legacy_id: values[0] } : null;
      return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes('SELECT * FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1')) {
      const row = products.get(values[0]);
      return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes('SELECT loyalfans_post_uid FROM v3_loyalfans_catalogue_products WHERE video_legacy_id=$1')) {
      const rows = [...products.values()].filter(row => row.video_legacy_id === values[0] && row.loyalfans_post_uid !== values[1]);
      return { rows: rows.map(row => ({ loyalfans_post_uid: row.loyalfans_post_uid })), rowCount: rows.length };
    }
    if (sql.includes('SELECT pg_advisory_xact_lock')) return { rows: [], rowCount: 0 };
    if (sql.includes('FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1 FOR UPDATE')) {
      const row = products.get(values[0]);
      return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes('FROM v3_loyalfans_catalogue_products WHERE video_legacy_id=$1')) {
      const rows = [...products.values()].filter(row => row.video_legacy_id === values[0] && row.loyalfans_post_uid !== values[1]);
      return { rows: rows.map(row => ({ loyalfans_post_uid: row.loyalfans_post_uid })), rowCount: rows.length };
    }
    if (sql.includes('INSERT INTO v3_media_assets')) {
      if (failMediaTypes.includes(values[0])) throw Object.assign(new Error('synthetic media row failure'), { code: 'TEST_MEDIA_ROW_FAILURE' });
      const id = `asset-${++mediaId}`;
      media.set(id, { id, asset_type: values[0], storage_reference: values[1], mime_type: values[2], byte_size: values[3], content_hash: values[4], processing_state: 'ready' });
      return { rows: [{ id }], rowCount: 1 };
    }
    if (sql.includes('SELECT mime_type,byte_size,content_hash FROM v3_media_assets WHERE id=$1')) {
      const row = media.get(values[0]);
      return { rows: row ? [{ mime_type: row.mime_type, byte_size: row.byte_size, content_hash: row.content_hash }] : [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes("UPDATE v3_loyalfans_catalogue_products SET\n        promo_media_state='partial'")) {
      const row = products.get(values[0]);
      if (row) Object.assign(row, { promo_media_state: 'partial', poster_error_code: values[1] || row.poster_error_code,
        trailer_error_code: values[2] || row.trailer_error_code });
      return { rows: [], rowCount: row ? 1 : 0 };
    }
    if (sql.includes('UPDATE v3_media_assets SET')) {
      const id = values[0];
      media.set(id, { id, asset_type: values[1], storage_reference: values[2], mime_type: values[3], byte_size: values[4], content_hash: values[5] });
      return { rows: [{ id }], rowCount: 1 };
    }
    if (sql.includes('INSERT INTO v3_media_asset_links')) {
      links.add(`${values[0]}:${values[1]}`);
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes('INSERT INTO v3_loyalfans_catalogue_products')) {
      const [loyalfans_post_uid,loyalfans_video_uid,short_url,video_legacy_id,owner_uid,slug,title,description,clean_description,hashtags,
        current_price_minor,old_price_minor,currency,discount_percent,discount_expire_at,duration_seconds,width,height,mime_type,preview_option,orientation,
        downloadable_resolution,downloadable_format,downloadable_size_bytes,video_available,downloadable,can_buy,can_see,availability_state,
        privacy_rule,source_created_at,source_updated_at,poster_media_asset_id,trailer_media_asset_id,poster_source_fingerprint,
        trailer_source_fingerprint,metadata_fingerprint,sync_status,downloadable_size_display] = values;
      products.set(loyalfans_post_uid, { loyalfans_post_uid,loyalfans_video_uid,short_url,video_legacy_id,owner_uid,slug,title,description,
        clean_description,hashtags:JSON.parse(hashtags),current_price_minor,old_price_minor,currency,discount_percent,
        discount_expire_at,duration_seconds,width,height,mime_type,preview_option,orientation,downloadable_resolution,downloadable_format,
        downloadable_size_bytes,video_available,downloadable,can_buy,can_see,availability_state,privacy_rule,source_created_at,
        source_updated_at,poster_media_asset_id,trailer_media_asset_id,poster_source_fingerprint,
        trailer_source_fingerprint,metadata_fingerprint,sync_status,downloadable_size_display,
        metadata_sync_state:values[39],promo_media_state:values[40],poster_ingest_state:values[41],poster_error_code:values[42],
        trailer_ingest_state:values[43],trailer_error_code:values[44] });
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes('INSERT INTO v3_loyalfans_catalogue_price_history') || sql.includes('UPDATE v3_loyalfans_catalogue_sync_items')) return { rows: [], rowCount: 1 };
    if (sql.includes('INSERT INTO v3_loyalfans_catalogue_media_provenance')) {
      if (!products.has(values[0])) throw Object.assign(new Error('synthetic FK order failure'), { code: '23503' });
      if (failProvenanceCount > 0) { failProvenanceCount -= 1; throw Object.assign(new Error('synthetic provenance failure'), { code: 'TEST_PROVENANCE_FAILURE' }); }
      return { rows: [], rowCount: 1 };
    }
    if (/^(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)/.test(sql)) return { rows: [], rowCount: 0 };
    throw new Error(`Unexpected SQL in fixture database: ${sql}`);
  };
  return { maps, videos, products, media, links, runs, runItems, calls, query, connect: async () => ({ query, release() {} }) };
}

function clientOptions(overrides = {}) {
  return { enabled: true, environment: 'test', cookieHeader: fakeCookie, xsrfToken: fakeXsrf, bearerToken: fakeBearer,
    cataloguePath: 'videos-store?ngsw-bypass=true', cataloguePageParameter: 'page', ...overrides };
}

test('parses the observed videos-store metadata and never retains is_bought or a signed media URL', () => {
  const normalized = normalizeLoyalFansCatalogueItem(observedItem(1), { currency: 'USD' });
  assert.equal(normalized.metadata.post_uid, observedItem(1).uid);
  assert.equal(normalized.metadata.video_uid, observedItem(1).video_object.uid);
  assert.equal(normalized.metadata.current_price_minor, 199);
  assert.equal(normalized.metadata.old_price_minor, 299);
  assert.equal(normalized.metadata.discount_percent, 33.44);
  assert.equal(normalized.metadata.duration_seconds, 732.5);
  assert.equal(normalized.metadata.width, 1920);
  assert.equal(normalized.metadata.height, 1080);
  assert.equal(normalized.metadata.mime_type, 'video/mp4');
  assert.equal(normalized.metadata.downloadable_format, 'mp4');
  assert.equal(normalized.metadata.video_available, true);
  assert.equal(normalized.metadata.downloadable, true);
  assert.equal(normalized.metadata.availability_state, 'available');
  assert.equal('is_bought' in normalized.metadata, false);
  assert.equal(JSON.stringify(normalized.metadata).includes('Signature='), false);
  assert.equal(normalized.media.poster.source_fingerprint.length, 64);
  assert.match(normalized.media.poster.url, /Signature=ephemeral-0001/);
});

test('116-item live-shape catalogue dry-run accepts object timestamps across four pages without writes',async()=>{
  const db=makeDatabase();let mediaFetches=0;
  const provider={listAllCatalogue:async()=>{throw Error('unexpected fallback');},listCataloguePage:async({page})=>{
    const payload=observedPage(page,116,36);
    payload.list=payload.list.map(item=>({...item,
      created_at:{date:'2026-07-22 20:24:19',timezone_type:3,timezone:'UTC'},
      updated_at:{date:'2026-07-23 20:24:19',timezone_type:3,timezone:'UTC'},discount_expire_at:null}));
    return payload;
  }};
  const service=new LoyalFansCatalogueSyncService({db,provider,currency:'USD',syncEnabled:false,
    fetchImpl:async()=>{mediaFetches++;throw Error('media forbidden');}});
  const result=await service.sync({dryRun:true});
  assert.equal(result.unique,116);assert.equal(result.created,116);assert.equal(result.conflicted,0);assert.equal(result.failed,0);
  assert.deepEqual(result.page_meta,{total:116,per_page:36,last_page:4});assert.equal(mediaFetches,0);
  assert.equal(db.calls.some(call=>/^\s*(INSERT|UPDATE|DELETE)\b/i.test(call.sql)),false);
  const metadata=normalizeLoyalFansCatalogueItem(observedItem(1,{created_at:{date:'2026-07-22 20:24:19',timezone_type:3,timezone:'UTC'}}),{currency:'USD'}).metadata;
  assert.equal(metadata.source_created_at,'2026-07-22T20:24:19.000Z');
  assert.throws(()=>normalizeLoyalFansCatalogueItem(observedItem(1,{created_at:{}}),{currency:'USD'}),{code:'INVALID_CATALOGUE_TIMESTAMP'});
});

test('collects all ten pages from the observed 116 item page_meta structure', async () => {
  const requests = [];
  const result = await fetchAllLoyalFansCataloguePages(async ({ page }) => {
    requests.push(page);
    return observedPage(page);
  });
  assert.equal(result.page_meta.total, 116);
  assert.equal(result.page_meta.per_page, 12);
  assert.equal(result.page_meta.last_page, 10);
  assert.equal(result.records.length, 116);
  assert.deepEqual(requests, [1,2,3,4,5,6,7,8,9,10]);
});

test('additive migration stores unique exact identities and normalized commercial fields without purchase state or source URLs', async () => {
  const migration = await fs.readFile(new URL('../migrations/0059_v3_loyalfans_catalogue_products.sql', import.meta.url), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS v3_loyalfans_catalogue_products/);
  assert.match(migration, /loyalfans_post_uid text PRIMARY KEY/);
  assert.match(migration, /video_legacy_id text UNIQUE REFERENCES catalog_videos/);
  assert.match(migration, /short_url text/);
  assert.match(migration, /current_price_minor bigint NOT NULL/);
  assert.match(migration, /old_price_minor bigint/);
  assert.match(migration, /poster_media_asset_id uuid UNIQUE REFERENCES v3_media_assets/);
  assert.match(migration, /trailer_media_asset_id uuid UNIQUE REFERENCES v3_media_assets/);
  assert.doesNotMatch(migration.replace(/^--.*$/gm, ''), /is_bought|poster_url|trailer_url|video_url/i);
});

test('operations migration adds resumable sync, price history, media provenance, and pending fulfillment without applying it', async () => {
  const migration = await fs.readFile(new URL('../migrations/0060_v3_loyalfans_catalogue_operations.sql', import.meta.url), 'utf8');
  assert.match(migration, /v3_loyalfans_catalogue_sync_runs/);
  assert.match(migration, /v3_loyalfans_catalogue_sync_items/);
  assert.match(migration, /v3_loyalfans_catalogue_price_history/);
  assert.match(migration, /v3_loyalfans_catalogue_media_provenance/);
  assert.match(migration, /v3_loyalfans_media_ingestion_jobs/);
  assert.match(migration, /'media_pending'/);
  assert.match(migration, /transaction_type text/);
  assert.doesNotMatch(migration.replace(/^--.*$/gm, ''), /cookie|authorization|signed_url|source_url/i);
});

test('provider uses configured relative path and keeps pagination query construction inside the provider boundary', async () => {
  const calls = [];
  const provider = new LoyalFansProviderClient(clientOptions({ fetchImpl: async url => {
    calls.push(url);
    const page = Number(new URL(url).searchParams.get('page') || 1);
    return new Response(JSON.stringify(observedPage(page, 24, 12)), { status: 200 });
  } }));
  await provider.listAllCatalogue();
  assert.equal(calls[0], 'https://www.loyalfans.com/videos-store?ngsw-bypass=true');
  assert.equal(calls[1], 'https://www.loyalfans.com/videos-store?ngsw-bypass=true&page=2');
  assert.equal(calls.some(url => url.includes('/api/v2/')), false);

  const noPagination = new LoyalFansProviderClient(clientOptions({ cataloguePageParameter: '', fetchImpl: async () => new Response(JSON.stringify(observedPage(1, 24, 12)), { status: 200 }) }));
  await assert.rejects(() => noPagination.listAllCatalogue(), { code: 'LOYALFANS_CATALOGUE_PAGINATION_NOT_CONFIGURED' });
});

test('fails closed on page totals that change or do not match the item count', async () => {
  let calls = 0;
  await assert.rejects(() => fetchAllLoyalFansCataloguePages(async ({ page }) => {
    calls += 1;
    return page === 1 ? observedPage(1, 24, 12) : observedPage(2, 25, 12);
  }), { code: 'INCONSISTENT_LOYALFANS_CATALOGUE_PAGES' });
  assert.equal(calls, 2);
  await assert.rejects(() => fetchAllLoyalFansCataloguePages(async () => ({ ...observedPage(1, 12, 12), list: [] })), { code: 'INVALID_LOYALFANS_CATALOGUE_PAGINATION' });
});

test('dry-run plans all 116 mapped items without media download or database writes', async () => {
  const records = Array.from({ length: 116 }, (_unused, index) => observedItem(index));
  const mappings = records.map((item, index) => [item.uid, `fleshlab-video-${index}`]);
  const db = makeDatabase({ mappedUids: mappings });
  let mediaRequests = 0;
  const provider = { listAllCatalogue: async () => ({ records, page_meta: { total: 116, per_page: 12, last_page: 10 } }) };
  const service = new LoyalFansCatalogueSyncService({ db, provider, currency: 'USD', mediaHosts, fetchImpl: async () => { mediaRequests += 1; throw new Error('dry-run must not fetch media'); } });
  const result = await service.sync({ dryRun: true });
  assert.equal(result.scanned, 116);
  assert.equal(result.unique, 116);
  assert.equal(result.created, 116);
  assert.equal(result.conflicted, 0);
  assert.equal(result.trailer_ingestion_disabled, 116);
  assert.equal(db.products.size, 0);
  assert.equal(mediaRequests, 0);
  assert.equal(db.calls.some(call => /^(INSERT|UPDATE|DELETE)/i.test(call.sql.trim())), false);
});

test('sync persists unmatched products for explicit admin mapping and never creates FLESHLAB video masters', async () => {
  const item = observedItem(1);
  const db = makeDatabase();
  const blob = { uploadStream: async (_key, stream) => { for await (const _chunk of stream) {} } };
  const service = new LoyalFansCatalogueSyncService({ db, provider: { listAllCatalogue: async () => ({ records: [item] }) },
    currency: 'USD', blob, mediaHosts, syncEnabled: true,
    fetchImpl: async () => new Response(Buffer.from([0xff,0xd8,0xff,0xe0,0,0x10,0x4a,0x46,0x49,0x46,0,0]), { status: 200, headers: { 'content-type': 'image/jpeg' } }) });
  const result = await service.syncItems([item], { dryRun: false });
  assert.equal(result.created, 1);
  assert.equal(result.unmapped, 1);
  assert.equal(result.conflicted, 0);
  assert.equal(db.products.get(item.uid).video_legacy_id, null);
  assert.equal(db.products.get(item.uid).sync_status, 'unmapped');
  assert.equal(db.videos.size, 0);
});

test('a live persistent sync lease prevents a second run from reprocessing the same pages', async () => {
  const db = makeDatabase();
  db.runs.push({ id: 'active-run', status: 'running', next_page: 2, lease_expires_at: new Date(Date.now() + 60_000),
    expected_total: 116, expected_per_page: 12, expected_last_page: 10, scanned: 12, created: 12, updated: 0,
    unchanged: 0, conflicted: 0, failed: 0, unmapped: 0 });
  const service = new LoyalFansCatalogueSyncService({ db,
    provider: { listAllCatalogue: async () => ({ records: [] }) }, currency: 'USD' });
  await assert.rejects(() => service.startOrResumeRun(), { code: 'LOYALFANS_CATALOGUE_SYNC_IN_PROGRESS' });
  assert.equal(db.runs[0].next_page, 2);
});

test('paged sync resumes after an upstream interruption without replaying completed item effects', async () => {
  const item0 = observedItem(0);
  const item1 = observedItem(1);
  const db = makeDatabase({ mappedUids: [[item0.uid, 'video-master-0'], [item1.uid, 'video-master-1']] });
  let failSecond = true;
  const provider = {
    listAllCatalogue: async () => { throw new Error('the paged path should be used'); },
    listCataloguePage: async ({ page }) => {
      if (page === 2 && failSecond) { failSecond = false; throw Object.assign(new Error('upstream unavailable'), { code: 'LOYALFANS_REQUEST_FAILED' }); }
      return observedPage(page, 2, 1);
    }
  };
  const blob = { uploadStream: async (_key, stream) => { for await (const _chunk of stream) {} } };
  const service = new LoyalFansCatalogueSyncService({ db, provider, blob, currency: 'USD', mediaHosts, syncEnabled: true,
    fetchImpl: async () => new Response(Buffer.from([0xff,0xd8,0xff,0xe0,0,0x10,0x4a,0x46,0x49,0x46,0,0]), { status: 200, headers: { 'content-type': 'image/jpeg' } }) });
  await assert.rejects(() => service.sync({ dryRun: false, maxPages: 2 }), { code: 'LOYALFANS_REQUEST_FAILED' });
  assert.equal(db.runs[0].status, 'failed');
  assert.equal(db.runs[0].next_page, 2);
  assert.equal(db.products.size, 1);
  const resumed = await service.sync({ dryRun: false, maxPages: 2 });
  assert.equal(resumed.scanned, 2);
  assert.equal(resumed.created, 2);
  assert.equal(db.runs[0].status, 'complete');
  assert.equal(db.runs[0].next_page, 3);
  assert.equal(db.products.size, 2);
  assert.equal([...db.runItems.values()].filter(item => item.status === 'synced' && item.action === 'created').length, 2);
});

function storePostProvider({total=77,limit=36,transform=payload=>payload}={}){
  const requests=[];
  const provider=new LoyalFansProviderClient({enabled:true,environment:'test',cookieHeader:fakeCookie,bearerToken:fakeBearer,xsrfToken:fakeXsrf,
    catalogueCreatorSlug:'neutralcreator',catalogueLimit:limit,fetchImpl:async(_url,request)=>{
      const body=JSON.parse(request.body);requests.push(body);
      return new Response(JSON.stringify(transform(observedPage(Number(body.page),total,limit))),{status:200});
    }});
  return{provider,requests};
}

test('resumable sync dry-run traverses the confirmed 116/36/4 snapshot with the default request limit',async()=>{
  const db=makeDatabase();const requests=[];
  const provider=new LoyalFansProviderClient({enabled:true,environment:'test',cookieHeader:fakeCookie,bearerToken:fakeBearer,xsrfToken:fakeXsrf,
    catalogueCreatorSlug:'neutralcreator',fetchImpl:async(_url,request)=>{
      const body=JSON.parse(request.body);requests.push(body);
      const payload=observedPage(Number(body.page),116,36);
      if(body.page==='2')assert.deepEqual(payload.page_meta,{total:116,per_page:36,current_page:2,last_page:4,from:36,to:72});
      return new Response(JSON.stringify(payload),{status:200});
    }});
  const service=new LoyalFansCatalogueSyncService({db,provider,currency:'USD',fetchImpl:async()=>{throw Error('dry-run must not ingest');}});
  const result=await service.sync({dryRun:true});
  assert.deepEqual(requests.map(body=>body.page),['1','2','3','4']);
  assert.equal(requests.every(body=>body.limit===36),true);
  assert.equal(result.scanned,116);assert.equal(result.created,116);assert.equal(result.failed,0);
  assert.deepEqual(result.page_meta,{total:116,per_page:36,last_page:4});
  assert.equal(db.calls.some(call=>/^(INSERT|UPDATE|DELETE)/i.test(call.sql.trim())),false);
  assert.equal(db.calls.some(call=>/entitlement|v3_commerce_orders/.test(call.sql)),false);
});

for(const limit of [7,36,48])test(`paged dry-run uses observed POST and dynamic limit ${limit} without media or entitlement writes`,async()=>{
  const db=makeDatabase();const h=storePostProvider({total:77,limit});
  const service=new LoyalFansCatalogueSyncService({db,provider:h.provider,currency:'USD',fetchImpl:async()=>{throw Error('dry-run must not ingest');}});
  const result=await service.sync({dryRun:true});
  assert.equal(result.scanned,77);assert.equal(result.created,77);assert.equal(result.failed,0);
  assert.equal(result.page_meta.per_page,limit);
  assert.equal(h.requests.length,result.page_meta.last_page);
  assert.deepEqual(h.requests.map(body=>body.page),Array.from({length:result.page_meta.last_page},(_,i)=>String(i+1)));
  assert.equal(db.products.size,0);assert.equal(db.media.size,0);
  assert.equal(db.calls.some(call=>/^(INSERT|UPDATE|DELETE)/i.test(call.sql.trim())),false);
  assert.equal(db.calls.some(call=>/entitlement|v3_commerce_orders/.test(call.sql)),false);
});

test('paged dry-run rejects duplicate external UID before processing the duplicate page',async()=>{
  const db=makeDatabase();const h=storePostProvider({transform:payload=>{
    if(payload.page_meta.current_page===2)payload.list[0]=observedItem(0);return payload;
  }});
  const service=new LoyalFansCatalogueSyncService({db,provider:h.provider,currency:'USD'});
  await assert.rejects(service.sync({dryRun:true}),{code:'REPEATED_LOYALFANS_CATALOGUE_ITEM'});
  assert.equal(h.requests.length,2);assert.equal(db.products.size,0);
});

test('resumed observed Store sync rejects duplicate UID from an already persisted page',async()=>{
  const db=makeDatabase();let interrupted=true;let duplicate=false;
  const h=storePostProvider({total:37,transform:payload=>{
    if(payload.page_meta.current_page===2 && interrupted){interrupted=false;throw Object.assign(Error('neutral test interruption'),{code:'LOYALFANS_REQUEST_FAILED'});}
    if(payload.page_meta.current_page===2 && duplicate)payload.list[0]=observedItem(0);
    return payload;
  }});
  let copies=0;
  const service=new LoyalFansCatalogueSyncService({db,provider:h.provider,currency:'USD',syncEnabled:true,mediaHosts,
    blob:{uploadStream:async(_key,stream)=>{for await(const _chunk of stream){/* Drain synthetic fixture stream. */}copies++;}},
    fetchImpl:async()=>new Response(Buffer.from([0xff,0xd8,0xff,0xe0,0,0x10,0x4a,0x46,0x49,0x46,0,0]),{headers:{'content-type':'image/jpeg'}})});
  await assert.rejects(service.sync({dryRun:false}),{code:'LOYALFANS_REQUEST_FAILED'});
  assert.equal(db.runs[0].next_page,2);assert.equal(db.products.size,36);assert.equal(copies,36);
  duplicate=true;
  await assert.rejects(service.sync({dryRun:false}),{code:'REPEATED_LOYALFANS_CATALOGUE_ITEM'});
  assert.equal(db.products.size,36);assert.equal(copies,36);assert.equal(db.runs[0].status,'failed');
  duplicate=false;
  const result=await service.sync({dryRun:false});
  assert.equal(result.scanned,37);assert.equal(result.created,37);
  assert.equal(db.products.size,37);assert.equal(copies,37);assert.equal(db.runs[0].status,'complete');
  assert.equal(db.calls.some(call=>/v3_commerce_content_entitlements|v3_commerce_orders/.test(call.sql)),false);
});

test('paged sync honors maximum item bound before metadata or media writes',async()=>{
  const db=makeDatabase();const h=storePostProvider();
  const service=new LoyalFansCatalogueSyncService({db,provider:h.provider,currency:'USD'});
  await assert.rejects(service.sync({dryRun:true,maxItems:20}),{code:'INCOMPLETE_LOYALFANS_CATALOGUE'});
  assert.equal(h.requests.length,1);assert.equal(db.products.size,0);
});

test('persistent sync is idempotent, updates prices, copies poster once, and does not create entitlements', async () => {
  const item = observedItem(1);
  const db = makeDatabase({ mappedUids: [[item.uid, 'video-master-1']] });
  let mediaRequests = 0;
  const uploads = [];
  const blob = { uploadStream: async (key, stream, contentType) => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    uploads.push({ key, bytes: Buffer.concat(chunks).toString(), contentType });
  } };
  const fetchImpl = async (_url, options) => {
    mediaRequests += 1;
    assert.equal(Object.keys(options.headers).some(name => /authorization|cookie|xsrf/i.test(name)), false);
    return new Response(Buffer.from([0xff,0xd8,0xff,0xe0,0,0x10,0x4a,0x46,0x49,0x46,0,0]), { status: 200, headers: { 'content-type': 'image/jpeg', 'content-length': '12' } });
  };
  const service = new LoyalFansCatalogueSyncService({ db, provider: { listAllCatalogue: async () => ({ records: [item] }) },
    blob, currency: 'USD', mediaHosts, syncEnabled: true, fetchImpl });
  const first = await service.syncItems([item], { dryRun: false });
  const second = await service.syncItems([item], { dryRun: false });
  assert.equal(first.created, 1);
  assert.equal(first.posters_copied, 1);
  assert.equal(second.unchanged, 1);
  assert.equal(db.products.size, 1);
  assert.equal(db.media.size, 1);
  assert.equal(db.links.size, 1);
  const productUpsert = db.calls.find(call => call.sql.includes('INSERT INTO v3_loyalfans_catalogue_products'));
  assert.equal(productUpsert.values.length, 45);
  assert.equal(Math.max(...[...productUpsert.sql.matchAll(/\$(\d+)/g)].map(match => Number(match[1]))), 45);
  assert.equal(mediaRequests, 1);
  assert.match(uploads[0].key, new RegExp(`^loyalfans/catalogue/${item.uid}/poster/[0-9a-f]{64}\\.jpg$`));
  assert.equal(db.products.get(item.uid).current_price_minor, 199);

  const changedPrice = observedItem(1, { price: '2.49' });
  const third = await service.syncItems([changedPrice], { dryRun: false });
  assert.equal(third.updated, 1);
  assert.equal(db.products.get(item.uid).current_price_minor, 249);
  assert.equal(mediaRequests, 1);
  assert.equal(db.calls.some(call => /v3_commerce_content_entitlements|v3_commerce_orders/.test(call.sql)), false);
  assert.equal(JSON.stringify([...db.products.values()]).includes('Signature='), false);

  const changedPoster = observedItem(1, { video_object: { ...item.video_object,
    poster: 'https://cdn.loyalfans.com/poster-updated.jpg?Signature=rotated' } });
  const fourth = await service.syncItems([changedPoster], { dryRun: false });
  assert.equal(fourth.updated, 1);
  assert.equal(db.media.size, 2);
  assert.equal(db.links.size, 2);
  assert.equal(mediaRequests, 2);
  assert.notEqual(uploads[1].key, uploads[0].key);
});

test('trailer ingestion is separately gated and stores only the FLESHLAB object key', async () => {
  const item = observedItem(2);
  const db = makeDatabase({ mappedUids: [[item.uid, 'video-master-2']] });
  const storedKeys = [];
  const blob = { uploadStream: async (key, stream) => { for await (const _chunk of stream) {} storedKeys.push(key); } };
  const service = new LoyalFansCatalogueSyncService({ db, provider: { listAllCatalogue: async () => ({ records: [item] }) },
    blob, currency: 'USD', mediaHosts, trailerIngestionEnabled: true, syncEnabled: true,
    fetchImpl: async url => new Response(url.includes('trailer') ? mp4Bytes() : JPEG_BYTES, { status: 200,
      headers: { 'content-type': url.includes('trailer') ? 'video/mp4' : 'image/jpeg' } }) });
  const result = await service.syncItems([item], { dryRun: false });
  assert.equal(result.trailers_copied, 1);
  assert.ok(storedKeys.some(key => /\/trailer\/[0-9a-f]{64}\.mp4$/.test(key)));
  assert.equal([...db.media.values()].some(row => row.storage_reference.includes('Signature')), false);
});

function promoService({ item = observedItem(31), db = makeDatabase(), trailerIngestionEnabled = false,
  posterResponse = new Response(JPEG_BYTES, { status: 200, headers: { 'content-type': 'image/jpeg' } }),
  trailerResponse = new Response(mp4Bytes(), { status: 200, headers: { 'content-type': 'video/mp4' } }),
  diagnostics = [] } = {}) {
  const blob = { uploadStream: async (_key, stream) => { for await (const _chunk of stream) { /* Drain the neutral media fixture. */ } } };
  return { db, service: new LoyalFansCatalogueSyncService({ db, provider: { listAllCatalogue: async () => ({ records: [item] }) },
    blob, currency: 'USD', mediaHosts, syncEnabled: true, trailerIngestionEnabled,
    onMediaDiagnostic: entry => diagnostics.push(entry), fetchImpl: async url => url.includes('trailer') ? trailerResponse : posterResponse }) };
}

test('unsupported poster MIME/bytes do not prevent metadata and price persistence', async () => {
  const item = observedItem(31);
  const { db, service } = promoService({ item, posterResponse: new Response('<html>not media</html>', { status: 200, headers: { 'content-type': 'image/gif' } }) });
  const result = await service.syncItems([item], { dryRun: false });
  const saved = db.products.get(item.uid);
  assert.equal(result.created, 1);
  assert.equal(result.failed, 0);
  assert.equal(result.poster_failures, 1);
  assert.equal(saved.metadata_sync_state, 'synced');
  assert.equal(saved.poster_ingest_state, 'failed');
  assert.equal(saved.poster_error_code, 'CATALOGUE_MEDIA_TYPE_UNSUPPORTED');
  assert.equal(saved.current_price_minor, 199);
  assert.ok(db.calls.some(call => call.sql.includes('INSERT INTO v3_loyalfans_catalogue_price_history')));
});

test('invalid promotional source URL is an asset failure and does not invalidate catalogue metadata', async () => {
  const base = observedItem(30);
  const item = { ...base, video_object: { ...base.video_object, poster: 'http://cdn.loyalfans.com/poster.jpg?Signature=temporary', video_trailer: null } };
  const { db, service } = promoService({ item });
  const result = await service.syncItems([item], { dryRun: false });
  const saved = db.products.get(item.uid);
  assert.equal(result.created, 1);
  assert.equal(result.failed, 0);
  assert.equal(result.poster_failures, 1);
  assert.equal(saved.metadata_sync_state, 'synced');
  assert.equal(saved.poster_error_code, 'CATALOGUE_MEDIA_URL_INVALID');
  assert.equal(saved.current_price_minor, 199);
});

test('unsupported trailer MIME/bytes do not prevent metadata and price persistence', async () => {
  const item = observedItem(32, { video_object: { ...observedItem(32).video_object, poster: null } });
  const { db, service } = promoService({ item, trailerIngestionEnabled: true,
    trailerResponse: new Response('<html>not media</html>', { status: 200, headers: { 'content-type': 'video/mp4' } }) });
  const result = await service.syncItems([item], { dryRun: false });
  const saved = db.products.get(item.uid);
  assert.equal(result.created, 1);
  assert.equal(result.failed, 0);
  assert.equal(result.trailer_failures, 1);
  assert.equal(saved.metadata_sync_state, 'synced');
  assert.equal(saved.trailer_ingest_state, 'failed');
  assert.equal(saved.trailer_error_code, 'CATALOGUE_MEDIA_TYPE_UNSUPPORTED');
  assert.equal(saved.current_price_minor, 199);
  assert.ok(db.calls.some(call => call.sql.includes('INSERT INTO v3_loyalfans_catalogue_price_history')));
});

test('poster success and trailer failure persist metadata and retain the copied poster', async () => {
  const item = observedItem(33);
  const { db, service } = promoService({ item, trailerIngestionEnabled: true,
    trailerResponse: new Response('invalid container', { status: 200, headers: { 'content-type': 'video/mp4' } }) });
  const result = await service.syncItems([item], { dryRun: false });
  const saved = db.products.get(item.uid);
  assert.equal(result.created, 1);
  assert.equal(result.poster_failures, 0);
  assert.equal(result.trailer_failures, 1);
  assert.ok(saved.poster_media_asset_id);
  assert.equal(saved.trailer_media_asset_id, null);
  assert.equal(saved.poster_ingest_state, 'ready');
  assert.equal(saved.trailer_ingest_state, 'failed');
  assert.equal(saved.promo_media_state, 'partial');
});

test('poster failure and trailer success persist metadata and retain the copied trailer', async () => {
  const base = observedItem(34);
  const item = { ...base, video_object: { ...base.video_object, poster: 'https://cdn.loyalfans.com/poster-0034.jpg?Signature=temporary' } };
  const { db, service } = promoService({ item, trailerIngestionEnabled: true,
    posterResponse: new Response('invalid image', { status: 200, headers: { 'content-type': 'application/octet-stream' } }) });
  const result = await service.syncItems([item], { dryRun: false });
  const saved = db.products.get(item.uid);
  assert.equal(result.created, 1);
  assert.equal(result.poster_failures, 1);
  assert.equal(result.trailer_failures, 0);
  assert.equal(saved.poster_media_asset_id, null);
  assert.ok(saved.trailer_media_asset_id);
  assert.equal(saved.poster_ingest_state, 'failed');
  assert.equal(saved.trailer_ingest_state, 'ready');
  assert.equal(saved.metadata_sync_state, 'synced');
});

test('both promotional asset failures preserve the valid catalogue product and price', async () => {
  const item = observedItem(35);
  const { db, service } = promoService({ item, trailerIngestionEnabled: true,
    posterResponse: new Response('invalid poster', { status: 200, headers: { 'content-type': 'text/html' } }),
    trailerResponse: new Response('invalid trailer', { status: 200, headers: { 'content-type': 'application/octet-stream' } }) });
  const result = await service.syncItems([item], { dryRun: false });
  const saved = db.products.get(item.uid);
  assert.equal(result.created, 1);
  assert.equal(result.failed, 0);
  assert.equal(result.poster_failures, 1);
  assert.equal(result.trailer_failures, 1);
  assert.equal(result.promo_partial, 1);
  assert.equal(saved.current_price_minor, 199);
  assert.equal(saved.metadata_sync_state, 'synced');
  assert.equal(saved.promo_media_state, 'partial');
});

test('promotional media database-record failure is isolated with a savepoint', async () => {
  const item = observedItem(37);
  const db = makeDatabase({ failMediaTypes: ['thumbnail'] });
  const diagnostics = [];
  const { service } = promoService({ item, db, diagnostics, trailerIngestionEnabled: true });
  const result = await service.syncItems([item], { dryRun: false });
  const saved = db.products.get(item.uid);
  assert.equal(result.created, 1);
  assert.equal(result.failed, 0);
  assert.equal(result.poster_failures, 1);
  assert.equal(saved.metadata_sync_state, 'synced');
  assert.equal(saved.poster_ingest_state, 'failed');
  assert.equal(saved.poster_error_code, 'CATALOGUE_MEDIA_RECORD_FAILED');
  assert.equal(saved.trailer_ingest_state, 'ready');
  assert.ok(saved.trailer_media_asset_id);
  assert.ok(db.calls.some(call => call.sql === 'ROLLBACK TO SAVEPOINT poster_promo_asset'));
  assert.equal(diagnostics[0].error_code, 'CATALOGUE_MEDIA_RECORD_FAILED');
});

test('media provenance is stored after its product and retries without another upload', async () => {
  const base = observedItem(38);
  const item = { ...base, video_object: { ...base.video_object, video_trailer: null } };
  const db = makeDatabase({ failProvenanceCount: 1 });
  let uploads = 0;
  const diagnostics = [];
  const blob = { uploadStream: async (_key, stream) => { uploads += 1; for await (const _chunk of stream) { /* Drain fixture. */ } } };
  const service = new LoyalFansCatalogueSyncService({ db, provider: { listAllCatalogue: async () => ({ records: [item] }) },
    blob, currency: 'USD', mediaHosts, syncEnabled: true, onMediaDiagnostic: entry => diagnostics.push(entry),
    fetchImpl: async () => new Response(JPEG_BYTES, { status: 200, headers: { 'content-type': 'image/jpeg' } }) });
  const first = await service.syncItems([item], { dryRun: false });
  assert.equal(first.poster_failures, 1);
  assert.equal(db.products.get(item.uid).poster_error_code, 'CATALOGUE_MEDIA_RECORD_FAILED');
  assert.ok(db.products.get(item.uid).poster_media_asset_id);
  const second = await service.syncItems([item], { dryRun: false });
  assert.equal(second.updated, 1);
  assert.equal(second.poster_failures, 0);
  assert.equal(db.products.get(item.uid).poster_error_code, null);
  assert.equal(db.products.get(item.uid).promo_media_state, 'complete');
  assert.equal(uploads, 1);
  assert.equal(diagnostics.length, 1);
});

test('failed promotional refresh preserves existing local poster and trailer references and fingerprints', async () => {
  const item = observedItem(36);
  const prior = { loyalfans_post_uid: item.uid, poster_media_asset_id: 'local-poster-ready', trailer_media_asset_id: 'local-trailer-ready',
    poster_source_fingerprint: 'a'.repeat(64), trailer_source_fingerprint: 'b'.repeat(64), metadata_fingerprint: 'previous-snapshot' };
  const db = makeDatabase({ existingProducts: [prior] });
  const { service } = promoService({ item, db, trailerIngestionEnabled: true,
    posterResponse: new Response('broken', { status: 200, headers: { 'content-type': 'image/jpeg' } }),
    trailerResponse: new Response('broken', { status: 200, headers: { 'content-type': 'video/mp4' } }) });
  await service.syncItems([item], { dryRun: false });
  const saved = db.products.get(item.uid);
  assert.equal(saved.poster_media_asset_id, 'local-poster-ready');
  assert.equal(saved.trailer_media_asset_id, 'local-trailer-ready');
  assert.equal(saved.poster_source_fingerprint, 'a'.repeat(64));
  assert.equal(saved.trailer_source_fingerprint, 'b'.repeat(64));
  assert.equal(saved.poster_ingest_state, 'failed');
  assert.equal(saved.trailer_ingest_state, 'failed');
});

test('media copier rejects non-allowlisted hosts and unsupported MIME types', async () => {
  let calls = 0;
  const copy = createLoyalFansMediaCopier({ blob: { uploadStream: async () => {} }, allowedHosts: mediaHosts,
    fetchImpl: async () => { calls += 1; return new Response('html', { status: 200, headers: { 'content-type': 'text/html' } }); } });
  await assert.rejects(() => copy({ url: 'https://evil.invalid/poster.jpg', postUid: observedItem(1).uid, assetType: 'poster' }), { code: 'CATALOGUE_MEDIA_HOST_NOT_ALLOWED' });
  await assert.rejects(() => copy({ url: 'https://cdn.loyalfans.com/poster.jpg', postUid: observedItem(1).uid, assetType: 'poster' }), { code: 'CATALOGUE_MEDIA_TYPE_UNSUPPORTED' });
  assert.equal(calls, 1);
});

async function copyNeutralMedia({ bytes, contentType, assetType = 'poster', blob = null, onDiagnostic = null } = {}) {
  const uploaded = [];
  const storage = blob || { uploadStream: async (key, stream, mime) => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    uploaded.push({ key, mime, bytes: Buffer.concat(chunks) });
  } };
  const copy = createLoyalFansMediaCopier({ blob: storage, allowedHosts: mediaHosts, onDiagnostic,
    fetchImpl: async (_url, options) => {
      assert.equal(options.redirect, 'error');
      return new Response(bytes, { status: 200, headers: contentType === undefined ? {} : { 'content-type': contentType } });
    } });
  const result = await copy({ url: `https://cdn.loyalfans.com/neutral.${assetType === 'poster' ? 'jpg' : 'mp4'}?Signature=synthetic-secret`,
    sourceFingerprint: 'c'.repeat(64), postUid: observedItem(40).uid, assetType });
  return { result, uploaded };
}

test('generic application/octet-stream with JPEG signature is accepted and canonicalized', async () => {
  const { result, uploaded } = await copyNeutralMedia({ bytes: JPEG_BYTES, contentType: 'application/octet-stream' });
  assert.equal(result.mime_type, 'image/jpeg');
  assert.match(result.object_key, /\.jpg$/);
  assert.equal(uploaded[0].mime, 'image/jpeg');
});

test('missing Content-Type with PNG signature is accepted and canonicalized', async () => {
  const { result, uploaded } = await copyNeutralMedia({ bytes: PNG_BYTES });
  assert.equal(result.mime_type, 'image/png');
  assert.match(result.object_key, /\.png$/);
  assert.equal(uploaded[0].mime, 'image/png');
});

test('misleading JPEG header with HTML bytes is rejected before upload', async () => {
  let uploads = 0;
  await assert.rejects(() => copyNeutralMedia({ bytes: Buffer.from('<html>'), contentType: 'image/jpeg', blob: {
    uploadStream: async () => { uploads += 1; }
  } }), { code: 'CATALOGUE_MEDIA_TYPE_UNSUPPORTED' });
  assert.equal(uploads, 0);
});

test('generic content type with unsupported bytes fails closed', async () => {
  await assert.rejects(() => copyNeutralMedia({ bytes: Buffer.from('not a media container'), contentType: 'application/octet-stream' }),
    { code: 'CATALOGUE_MEDIA_TYPE_UNSUPPORTED' });
});

test('AVIF poster signature is recognized using ISO-BMFF ftyp brand validation', async () => {
  const { result, uploaded } = await copyNeutralMedia({ bytes: mp4Bytes('avif'), contentType: 'application/octet-stream' });
  assert.equal(result.mime_type, 'image/avif');
  assert.match(result.object_key, /\.avif$/);
  assert.equal(uploaded[0].mime, 'image/avif');
});

test('trailer signatures distinguish supported MP4, QuickTime and WebM containers', async () => {
  const quickTime = mp4Bytes('qt  ');
  const webm = Buffer.from([0x1a,0x45,0xdf,0xa3,0x87,0x42,0x82,0x84,0x77,0x65,0x62,0x6d]);
  const mp4 = await copyNeutralMedia({ bytes: mp4Bytes(), contentType: 'application/octet-stream', assetType: 'trailer' });
  const mov = await copyNeutralMedia({ bytes: quickTime, contentType: '', assetType: 'trailer' });
  const webmCopy = await copyNeutralMedia({ bytes: webm, contentType: undefined, assetType: 'trailer' });
  assert.equal(mp4.result.mime_type, 'video/mp4');
  assert.equal(mov.result.mime_type, 'video/quicktime');
  assert.equal(webmCopy.result.mime_type, 'video/webm');
});

test('signed source is absent from persistence and structured diagnostics', async () => {
  const item = observedItem(41);
  const diagnostics = [];
  const { db, service } = promoService({ item, diagnostics,
    posterResponse: new Response('<html>not media</html>', { status: 200,
      headers: { 'content-type': 'image/jpeg', 'content-length': '20' } }) });
  const result = await service.syncItems([item], { dryRun: false });
  const persisted = JSON.stringify(db.calls.map(call => call.values));
  assert.equal(result.created, 1);
  assert.doesNotMatch(persisted, /Signature=|ephemeral-|temporary/);
  assert.equal(diagnostics.length, 1);
  assert.deepEqual(Object.keys(diagnostics[0]).sort(), ['asset_type','content_length','declared_content_type','detected_mime_type','error_code','http_status','normalized_hostname'].sort());
  assert.deepEqual(diagnostics[0], { asset_type: 'poster', normalized_hostname: 'cdn.loyalfans.com', http_status: 200,
    declared_content_type: 'image/jpeg', detected_mime_type: null, content_length: 20, error_code: 'CATALOGUE_MEDIA_TYPE_UNSUPPORTED' });
  assert.doesNotMatch(JSON.stringify(diagnostics), /Signature=|ephemeral-|temporary/);
});

test('signed URLs embedded in fetch errors or invalid length headers are redacted from diagnostics', async () => {
  const diagnostics = [];
  const url = 'https://cdn.loyalfans.com/poster.jpg?Signature=synthetic-private-value';
  const failing = createLoyalFansMediaCopier({ blob: { uploadStream: async () => {} }, allowedHosts: mediaHosts,
    onDiagnostic: value => diagnostics.push(value), fetchImpl: async value => { throw new Error(`request failed for ${value}`); } });
  await assert.rejects(() => failing({ url, postUid: observedItem(43).uid, assetType: 'poster' }),
    error => error.code === 'CATALOGUE_MEDIA_FETCH_FAILED' && !error.message.includes('Signature='));
  const malformedLength = createLoyalFansMediaCopier({ blob: { uploadStream: async () => {} }, allowedHosts: mediaHosts,
    onDiagnostic: value => diagnostics.push(value), fetchImpl: async () => new Response('x', { status: 200,
      headers: { 'content-length': 'Signature=synthetic-private-value' } }) });
  await assert.rejects(() => malformedLength({ url, postUid: observedItem(44).uid, assetType: 'poster' }),
    { code: 'CATALOGUE_MEDIA_LENGTH_INVALID' });
  assert.equal(diagnostics.length, 2);
  assert.equal(diagnostics[0].normalized_hostname, 'cdn.loyalfans.com');
  assert.equal(diagnostics[1].content_length, 'invalid');
  assert.doesNotMatch(JSON.stringify(diagnostics), /Signature=|synthetic-private-value/);
});

test('full-video source metadata is not used by promotional catalogue ingestion', async () => {
  const base = observedItem(42);
  const item = { ...base, video_object: { ...base.video_object, video_url: 'https://cdn.loyalfans.com/full.mp4?Signature=full-video-secret' } };
  const requested = [];
  const { service, db } = promoService({ item });
  service.copyMedia = async input => { requested.push(input.assetType); throw Object.assign(new Error('neutral failure'), { code: 'CATALOGUE_MEDIA_TYPE_UNSUPPORTED' }); };
  await service.syncItems([item], { dryRun: false });
  assert.deepEqual(requested, ['poster']);
  assert.doesNotMatch(JSON.stringify(db.calls.map(call => call.values)), /full-video-secret|full\.mp4/);
});

test('completed failed run is skipped and restart false creates a new run', async () => {
  const db = makeDatabase();
  db.runs.push({ id: 'completed-run', status: 'complete', next_page: 5, lease_expires_at: null, started_at: new Date(0) });
  const h = storePostProvider({ total: 1 });
  const service = new LoyalFansCatalogueSyncService({ db, provider: h.provider, currency: 'USD', syncEnabled: true });
  const next = await service.startOrResumeRun({ restart: false });
  assert.equal(next.id, 'run-2');
  assert.equal(db.runs[0].status, 'complete');
  assert.equal(db.runs.length, 2);
});

test('promo media status migration is additive and retry outcomes are durable', async () => {
  const migration = await fs.readFile(new URL('../migrations/0064_v3_loyalfans_catalogue_promo_media_status.sql', import.meta.url), 'utf8');
  assert.match(migration, /ADD COLUMN IF NOT EXISTS metadata_sync_state/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS promo_media_state/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS poster_ingest_state/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS poster_error_code/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS trailer_ingest_state/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS trailer_error_code/);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS v3_loyalfans_catalogue_promo_state_idx/);
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM|v3_commerce_content_entitlements/);
});


test('catalogue operations report generic media jobs instead of the retired worker queue', async () => {
  let genericQuery = false;
  const db = { query: async sql => {
    assert.equal(sql.includes('v3_loyalfans_media_ingestion_jobs'), false);
    if (sql.includes('FROM v3_provider_media_jobs')) {
      genericQuery = true;
      assert.match(sql, /provider='loyalfans'/);
      return { rows: [{ pending: 2, ingesting: 1, failed: 3 }] };
    }
    return { rows: [] };
  } };
  db.connect = async () => db;
  const status = await new LoyalFansCatalogueSyncService({ db, provider: { listAllCatalogue: async () => ({ records: [] }) } }).status();
  assert.equal(genericQuery, true);
  assert.deepEqual(status.media_ingestion_jobs, { pending: 2, ingesting: 1, failed: 3 });
});


test('116 neutral products with rounded display sizes traverse and dry-run without metadata conflicts or writes',async()=>{
  const sizes=['262.41MB','1.13GB','84.34MB','16.61MB'];let normalized=0;
  const provider={listAllCatalogue:async()=>{},listCataloguePage:async({page})=>{
    const payload=observedPage(page,116,36);
    for(const [index,item] of payload.list.entries()){
      const display=sizes[(payload.page_meta.from+index)%sizes.length];
      item.video_object.downloadable_video_meta.size=display;
      item.created_at={date:'2026-07-22 20:24:19',timezone_type:3,timezone:'UTC'};
      item.updated_at={date:'2026-07-23 20:24:19',timezone_type:3,timezone:'UTC'};
      const result=normalizeLoyalFansCatalogueItem(item,{currency:'USD'});
      assert.equal(result.metadata.downloadable_size_display,display);assert.equal(result.metadata.downloadable_size_bytes,null);
      assert.equal(result.metadata.width,1920);assert.equal(result.metadata.height,1080);
      assert.equal(result.metadata.current_price_minor,199);assert.equal(result.metadata.old_price_minor,299);
      assert.equal(result.metadata.duration_seconds,732.5);assert.equal(result.metadata.mime_type,'video/mp4');
      assert.equal(result.metadata.downloadable_format,'mp4');assert.equal(result.metadata.owner_uid,memberUid);
      assert.equal(result.metadata.post_uid,item.uid);assert.equal(result.metadata.video_uid,item.video_object.uid);
      assert.doesNotMatch(JSON.stringify(result.metadata),/Signature=|ephemeral-|https:\/\/cdn/);
      normalized++;
    }
    return payload;
  }};
  const db=makeDatabase();const service=new LoyalFansCatalogueSyncService({db,provider,currency:'USD',
    fetchImpl:async()=>{throw new Error('MEDIA_FETCH_FORBIDDEN');}});
  const result=await service.sync({dryRun:true});
  assert.equal(normalized,116);assert.equal(result.created,116);assert.equal(result.unique,116);
  assert.equal(result.conflicted,0);assert.equal(result.failed,0);assert.deepEqual(result.conflicts,[]);
  assert.equal(db.products.size,0);assert.equal(db.media.size,0);assert.equal(db.runs.length,0);
  assert.equal(db.calls.some(c=>/^\s*(INSERT|UPDATE|DELETE)\b/i.test(c.sql)),false);
});

test('display size is durably retained and resync is idempotent without rounding into exact bytes',async()=>{
  const item=observedItem(700);item.video_object.downloadable_video_meta.size='262.41MB';
  delete item.video_object.poster;delete item.video_object.video_trailer;
  const db=makeDatabase();const service=new LoyalFansCatalogueSyncService({db,provider:{listAllCatalogue:async()=>{}},currency:'USD'});
  const normalized=normalizeLoyalFansCatalogueItem(item,{currency:'USD'});
  assert.equal((await service.syncItem(normalized,{dryRun:false})).action,'created');
  const stored=db.products.get(item.uid);assert.equal(stored.downloadable_size_display,'262.41MB');assert.equal(stored.downloadable_size_bytes,null);
  assert.equal((await service.syncItem(normalized,{dryRun:false})).action,'unchanged');
  item.video_object.downloadable_video_meta.size='1.13GB';
  assert.equal((await service.syncItem(normalizeLoyalFansCatalogueItem(item,{currency:'USD'}),{dryRun:false})).action,'updated');
  assert.equal(db.products.size,1);assert.equal(db.products.get(item.uid).downloadable_size_display,'1.13GB');
  assert.equal(db.products.get(item.uid).downloadable_size_bytes,null);
});
