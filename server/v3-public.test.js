import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { V3PublicService, normalizePublicAccessState } from './v3-public.js';

test('public access state normalizes preview, FLESHLAB offers, external distribution and owned access', () => {
  const state = normalizePublicAccessState({
    trailer_url: 'https://cdn.example/preview.mp4',
    external_distribution: { channel: 'faphouse', url: 'https://faphouse.example/title' },
    access_options: [
      { purchase_type: 'ppv', label: 'BUY NOW' },
      { purchase_type: 'subscription', membership_included: true, label: 'SUBSCRIBE' }
    ]
  });
  assert.equal(state.primary, 'fleshlab_ppv');
  assert.deepEqual(state.available, ['free_preview', 'fleshlab_ppv', 'fleshlab_membership', 'external_distribution']);
  assert.equal(normalizePublicAccessState({ access_options: [{ label: 'WATCH NOW', access: 'active' }] }).primary, 'full_access_owned');
  assert.equal(normalizePublicAccessState({ trailer_url: 'https://cdn.example/preview.mp4' }).primary, 'free_preview');
  assert.equal(normalizePublicAccessState({ external_distribution: { channel: 'faphouse', url: 'javascript:bad' } }).external_distribution, false);
});

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
  assert.deepEqual(calls[0].values, ['%published%', ['acceptance-v3-flow-20260923']]);
});

test('acceptance-only video records are excluded from public discovery and detail routes', async () => {
  const calls = [];
  const db = { query: async (sql, values) => {
    calls.push({ sql, values });
    if (sql.includes('count(*)')) return { rows: [{ total: 0 }] };
    return { rows: [] };
  } };
  const service = new V3PublicService(db);
  await service.listVideos();
  assert.equal(calls.every(call => call.sql.includes("v.slug <> ALL")), true);
  await assert.rejects(() => service.video('acceptance-v3-flow-20260923'), { code: 'NOT_FOUND' });
  assert.match(calls.at(-1).sql, /v\.slug <> ALL\(\$2::text\[\]\)/);
});

test('public media projection never exposes private or storage references', async () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const db = { query: async () => ({ rowCount: 1, rows: [{ id, asset_type: 'thumbnail', legacy_url: 'https://cdn.example/thumb.jpg', processing_state: 'ready', visibility: 'public', storage_reference: 'private/key' }] }) };
  const result = await new V3PublicService(db).media(id);
  assert.deepEqual(result, { id, type: 'thumbnail', url: 'https://cdn.example/thumb.jpg', processing_state: 'ready' });
  assert.equal('storage_reference' in result, false);
});

test('public LoyalFans catalogue projection exposes commercial metadata and only approved FLESHLAB media routes', async () => {
  const db = { query: async sql => {
    assert.match(sql, /v3_loyalfans_catalogue_products/);
    assert.match(sql, /review_status='approved'/);
    assert.match(sql, /v3_catalogue_external_content_mappings/);
    return { rows: [{ video_legacy_id: 'video-1', loyalfans_post_uid: 'post-uid-0000000001', loyalfans_video_uid: 'video-uid-00000001',
      owner_uid: 'owner-uid', slug: 'catalogue-slug', description: 'Catalogue description', title: 'Catalogue title', current_price_minor: '199', old_price_minor: '299', currency: 'USD', discount_percent: '33.44',
      discount_expire_at: null, duration_seconds: '732.5', width: 1920, height: 1080, mime_type: 'video/mp4',
      preview_option: 'trailer', orientation: 'landscape',
      downloadable_resolution: '1080p', downloadable_format: 'mp4', downloadable: true, video_available: true, availability_state: 'available',
      source_created_at: '2026-10-05T10:00:00.000Z', source_updated_at: '2026-10-06T10:00:00.000Z',
      last_synced_at: '2026-10-06T10:00:00.000Z', poster_id: 'poster-asset', poster_type: 'thumbnail',
      poster_legacy_url: null, poster_storage_reference: 'private/poster', trailer_id: null }] };
  } };
  const result = await new V3PublicService(db).loyalFansCatalogueForVideos(['video-1']);
  assert.deepEqual(result.get('video-1'), {
    provider: 'loyalfans', post_uid: 'post-uid-0000000001', video_uid: 'video-uid-00000001', owner_uid: 'owner-uid',
    slug: 'catalogue-slug', title: 'Catalogue title', description: 'Catalogue description',
    current_price_minor: 199, old_price_minor: 299, currency: 'USD', discount_percent: 33.44, discount_expire_at: null,
    duration_seconds: 732.5, width: 1920, height: 1080, mime_type: 'video/mp4', preview_option: 'trailer', orientation: 'landscape',
    resolution: '1080p', format: 'mp4',
    downloadable: true, video_available: true, availability: 'available', source_created_at: '2026-10-05T10:00:00.000Z',
    source_updated_at: '2026-10-06T10:00:00.000Z', last_synced_at: '2026-10-06T10:00:00.000Z',
    poster: { id: 'poster-asset', type: 'thumbnail', url: '/api/v3/public/media/poster-asset/file' }, trailer: null
  });
  assert.equal(JSON.stringify(result.get('video-1')).includes('private/poster'), false);
  assert.equal(JSON.stringify(result.get('video-1')).includes('is_bought'), false);
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
  assert.match(source, /parts\[0\]\s*===\s*'home'/);
  assert.match(source, /function RawHero/);
  assert.match(source, /function TapeCard/);
  assert.match(source, /BECOME A/);
  assert.match(source, /FLESHLAB PERFORMER/);
  assert.match(source, /performer-application/);
  assert.match(source, /SUBMIT APPLICATION/);
  assert.match(source, /AMATEUR/);
  assert.doesNotMatch(source, /editorial-spotlight|brand-story|final-brand-cta/);
  assert.match(source, /https:\/\/earn\.fleshlab\.online/);
  assert.doesNotMatch(source, /storage_reference|private_profile|audit/);
});

test('recruitment hub exposes distinct public creator journeys with safe application conversion', async () => {
  const source = await fs.readFile(new URL('../v3/src/public.jsx', import.meta.url), 'utf8');
  const sitemap = await fs.readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  for (const route of ['become-a-creator', 'new-creators', 'existing-creators', 'escorts', 'live-cam', 'international-creators', 'gay-creators', 'male-performers', 'creator-management', 'content-distribution']) {
    assert.match(source, new RegExp(route));
    assert.match(sitemap, new RegExp(route === 'become-a-creator' ? `/v3/${route}` : `/v3/become-a-creator/${route}`));
  }
  assert.match(source, /creator_page_view/);
  assert.match(source, /creator_application_complete/);
  assert.match(source, /FAQPage/);
  assert.match(source, /18\+ ONLY/);
  assert.doesNotMatch(source, /Guaranteed money|easy money|GET RICH FAST/i);
});

test('public video cards use only the assigned trailer for controlled previews', async () => {
  const source = await fs.readFile(new URL('../v3/src/public.jsx', import.meta.url), 'utf8');
  assert.match(source, /video\.trailer_url \|\| video\.preview_url/);
  assert.match(source, /setTimeout\(\(\) => \{ if \(hoveringRef\.current\) startPreview\(\); \}, 250\)/);
  assert.match(source, /muted playsInline loop preload="none"/);
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /tape-preview-button/);
  assert.match(source, /Array\.isArray\(record\.access_options\)/);
  assert.doesNotMatch(source, /source_video_url/);
});

test('public video metadata separates full runtime, preview state and commerce access', async () => {
  const source = await fs.readFile(new URL('../v3/src/public.jsx', import.meta.url), 'utf8');
  assert.match(source, /full_duration_seconds/);
  assert.match(source, /FULL LENGTH UNAVAILABLE/);
  assert.match(source, /INCLUDED WITH MEMBERSHIP/);
  assert.match(source, /onLoadedMetadata/);
  assert.match(source, /PREVIEW/);
  assert.doesNotMatch(source, /`00:\$\{duration\}`/);
});

test('public video detail links performers and tracks preview conversion without blocking playback', async () => {
  const source = await fs.readFile(new URL('../v3/src/public.jsx', import.meta.url), 'utf8');
  assert.match(source, /function PerformerLinks/);
  assert.match(source, /performerHref\(performer\)/);
  assert.match(source, /preview_started/);
  assert.match(source, /preview_completed/);
  assert.match(source, /onPlay=\{onPreviewStarted\}/);
  assert.match(source, /onEnded=\{onPreviewCompleted\}/);
  assert.match(source, /\.catch\(\(\) => \{\}\)/);
  assert.match(source, /full_access_owned/);
  assert.match(source, /WATCH ON FAPHOUSE/);
  assert.match(source, /const conversionEvent/);
  assert.match(source, /video_membership_cta_click/);
  assert.match(source, /video_ppv_cta_click/);
});

test('public player keeps preview duration separate from full runtime', async () => {
  const source = await fs.readFile(new URL('../v3/src/public.jsx', import.meta.url), 'utf8');
  assert.match(source, /preview_duration_seconds/);
  assert.match(source, /FULL RUNTIME/);
  assert.match(source, /PREVIEW/);
  assert.match(source, /preview-conversion/);
  assert.doesNotMatch(source, /preview_duration_seconds[^\n]+full_duration_seconds/);
});

test('public projections use V3 performer media with legacy fallback and expose preview metadata without leaking access_tier', async () => {
  const source = await fs.readFile(new URL('./v3-public.js', import.meta.url), 'utf8');
  assert.match(source, /profile_media_asset_id/);
  assert.match(source, /profile_image_url/);
  assert.match(source, /legacy_profile_image_url/);
  assert.match(source, /preview_duration_seconds/);
  assert.match(source, /duration_seconds/);
  assert.doesNotMatch(source.slice(source.indexOf('async listVideos'), source.indexOf('async performers')), /v\.access_tier/);
});

test('public video projection exposes title-specific FapHouse only when active and published', async () => {
  const source = await fs.readFile(new URL('./v3-public.js', import.meta.url), 'utf8');
  assert.match(source, /d\.video_legacy_id=v\.legacy_id/);
  assert.match(source, /d\.channel='faphouse'/);
  assert.match(source, /d\.status='published'/);
  assert.match(source, /COALESCE\(d\.external_url,d\.destination_url\)/);
});

test('public access migration is additive and stores media duration plus title distribution linkage', async () => {
  const migration = await fs.readFile(new URL('../migrations/0037_v3_public_access_and_distribution.sql', import.meta.url), 'utf8');
  assert.match(migration, /ADD COLUMN IF NOT EXISTS duration_seconds/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS video_legacy_id/);
  assert.match(migration, /v3_growth_distribution_video_idx/);
  assert.doesNotMatch(migration, /\bDROP\s+(TABLE|DATABASE)|\bTRUNCATE\b|\bDELETE\s+FROM/i);
});

test('public pricing page explains PPV and membership and is crawlable', async () => {
  const source = await fs.readFile(new URL('../v3/src/public.jsx', import.meta.url), 'utf8');
  const sitemap = await fs.readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const robots = await fs.readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
  assert.match(source, /function PricingPage/);
  assert.match(source, /membership-offers/);
  assert.match(source, /video_ppv_cta_click/);
  assert.match(source, /video_membership_cta_click/);
  assert.match(source, /pricing_comparison_view/);
  assert.match(source, /pricing_faq_interaction/);
  assert.match(sitemap, /https:\/\/fleshlab\.online\/v3\/pricing/);
  assert.match(robots, /Allow: \/v3\/pricing\$/);
});

test('public performer projections require public visibility and active operational state', async () => {
  const calls = [];
  const db = { query: async (sql, values) => {
    calls.push({ sql, values });
    return sql.includes('count(*)') ? { rows: [{ total: 0 }] } : { rows: [] };
  } };
  await new V3PublicService(db).performers();
  assert.equal(calls.some(call => /public_visibility=true AND operational_status='active'/.test(call.sql)), true);
});

test('hidden legacy labels stay in catalogue data but are excluded from public label list and detail', async () => {
  const listCalls = [];
  const listDb = { query: async (sql, values) => {
    listCalls.push({ sql, values });
    return sql.includes('count(*)') ? { rows: [{ total: 0 }] } : { rows: [] };
  } };
  await new V3PublicService(listDb).brands();
  assert.equal(listCalls.some(call => call.sql.includes('slug <> ALL') && call.values.some(value => Array.isArray(value) && value.includes('afterdark') && value.includes('pinkboys') && value.includes('the-fitmaster'))), true);

  let detailCall;
  const detailDb = { query: async (sql, values) => {
    detailCall = { sql, values };
    return { rowCount: 0, rows: [] };
  } };
  await assert.rejects(() => new V3PublicService(detailDb).brand('afterdark'), { code: 'NOT_FOUND' });
  assert.match(detailCall.sql, /b\.slug <> ALL\(\$2::text\[\]\)/);
  assert.deepEqual(detailCall.values[1], ['afterdark', 'pinkboys', 'the-fitmaster']);
});

test('approved public label descriptors are targeted and non-destructive', async () => {
  const migration = await fs.readFile(new URL('../migrations/0034_v3_public_label_descriptors.sql', import.meta.url), 'utf8');
  assert.match(migration, /fleshlabasia/);
  assert.match(migration, /Asian twinks\. Real places\. Always amateur\./);
  assert.match(migration, /International twinks\. Different faces\. Same energy\./);
  assert.match(migration, /Adult twinks\. Real chemistry\. Without condoms\./);
  assert.match(migration, /WHERE slug IN/);
  assert.doesNotMatch(migration, /\bDROP\s+(TABLE|DATABASE)|\bDELETE\s+FROM/i);
});

test('public labels use supplied marks and dedicated label presentation', async () => {
  const source = await fs.readFile(new URL('../v3/src/public.jsx', import.meta.url), 'utf8');
  assert.match(source, /asia_Transparent\.png/);
  assert.match(source, /twinkglobal_transparent\.png/);
  assert.match(source, /barebacktwinks_transparent\.png/);
  assert.match(source, /fleshlab-asia-brand-motif\.png/);
  assert.match(source, /fleshlab-twinks-global-brand-motif\.png/);
  assert.match(source, /fleshlab-bareback-twinks-brand-motif\.png/);
  assert.match(source, /function BrandArtwork/);
  assert.match(source, /function BrandSheet/);
  assert.match(source, /function BrandDetail/);
  assert.match(source, /kind === 'brands' \? <div className="brand-index"/);
  assert.doesNotMatch(source, /storage_reference|private_profile|internal_admin_notes/);
});

test('Phase 6A homepage migration is additive and configures a singleton curator record', async () => {
  const migration = await fs.readFile(new URL('../migrations/0029_v3_public_homepage.sql', import.meta.url), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS v3_public_homepage_config/);
  assert.match(migration, /INSERT INTO v3_public_homepage_config/);
  assert.doesNotMatch(migration, /\bDROP\s+(TABLE|DATABASE)|\bDELETE\s+FROM/i);
});
