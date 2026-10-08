import { HttpError } from './errors.js';

const page = (value) => Math.max(1, Number.parseInt(value, 10) || 1);
const limit = (value) => Math.min(48, Math.max(1, Number.parseInt(value, 10) || 24));
const sortFields = new Map([['newest','v.release_date DESC NULLS LAST, v.imported_at DESC, v.legacy_id ASC'],['title','v.title ASC, v.legacy_id ASC'],['oldest','v.release_date ASC NULLS LAST, v.imported_at ASC, v.legacy_id ASC']]);
const HIDDEN_PUBLIC_VIDEO_SLUGS = Object.freeze(['acceptance-v3-flow-20260923']);
const publicAsset = (row) => row ? { id: row.id, type: row.asset_type, url: row.legacy_url || (row.storage_reference ? `/api/v3/public/media/${row.id}/file` : null), processing_state: row.processing_state, ...(Number(row.duration_seconds) > 0 ? { duration_seconds: Number(row.duration_seconds) } : {}) } : null;
const HOME_SECTIONS = ['featured_videos','new_releases','performers','collections','creator_cta','trust'];
// These legacy labels remain in the private/catalogue data for historical
// relationships, but are intentionally not exposed as public label pages.
const HIDDEN_PUBLIC_BRAND_SLUGS = Object.freeze(['afterdark', 'pinkboys', 'the-fitmaster']);
const DEFAULT_HOME = Object.freeze({
  hero_eyebrow: 'FLESHLAB / INDEPENDENT STUDIO', hero_title: 'Stories with presence.',
  hero_summary: 'Creator-led films, real chemistry and a catalogue made with intention.',
  hero_cta_label: 'Explore videos', hero_cta_target: '/v3/videos', featured_video_ids: [], featured_performer_ids: [], featured_collection_ids: [],
  section_visibility: Object.fromEntries(HOME_SECTIONS.map(key => [key, true]))
});
const text = (value, maximum) => String(value ?? '').trim().slice(0, maximum);
const ids = (value, maximum = 12) => [...new Set((Array.isArray(value) ? value : []).map(item => String(item || '').trim()).filter(Boolean))].slice(0, maximum);
const safeRoute = (value) => /^\/v3(?:\/(?:videos|performers|brands)(?:\/[a-z0-9-]+)?|\/collections(?:\/[a-z0-9-]+)?)?$/i.test(String(value || ''));

export function normalizePublicAccessState(item = {}) {
  const options = Array.isArray(item.access_options) ? item.access_options : [];
  const owned = options.some(option => option?.label === 'WATCH NOW' || option?.access === 'active');
  const ppv = options.some(option => option?.purchase_type === 'ppv');
  const membership = options.some(option => option?.purchase_type === 'subscription' && (option.membership_included || !option.product_id));
  const external = /^https?:\/\//i.test(String(item.external_distribution?.url || ''));
  const preview = Boolean(item.trailer_url || item.preview_url || item.preview_available);
  const available = [];
  if (owned) available.push('full_access_owned');
  if (preview) available.push('free_preview');
  if (ppv) available.push('fleshlab_ppv');
  if (membership) available.push('fleshlab_membership');
  if (external) available.push('external_distribution');
  return {
    primary: owned ? 'full_access_owned' : ppv ? 'fleshlab_ppv' : membership ? 'fleshlab_membership' : external ? 'external_distribution' : preview ? 'free_preview' : 'unavailable',
    available,
    full_access_owned: owned,
    free_preview: preview,
    fleshlab_ppv: ppv,
    fleshlab_membership: membership,
    external_distribution: external
  };
}

const publicDistributionSql = `(SELECT jsonb_build_object('id',d.id,'channel',d.channel,'url',COALESCE(d.external_url,d.destination_url),'external_reference',d.external_reference)
  FROM v3_growth_distribution_records d
  WHERE d.video_legacy_id=v.legacy_id AND d.channel='faphouse' AND d.status='published'
    AND COALESCE(d.external_url,d.destination_url) ~ '^https?://'
  ORDER BY d.published_at DESC NULLS LAST,d.updated_at DESC LIMIT 1)`;
const performerMediaSql = (alias = 'p') => `
  COALESCE((SELECT COALESCE(a.legacy_url,'/api/v3/public/media/' || a.id || '/file') FROM v3_media_assets a WHERE a.id=${alias}.profile_media_asset_id AND a.asset_type='thumbnail' AND a.visibility='public' AND a.processing_state='ready' AND a.review_status='approved'),${alias}.legacy_profile_image_url) profile_image_url,
  COALESCE((SELECT COALESCE(a.legacy_url,'/api/v3/public/media/' || a.id || '/file') FROM v3_media_assets a WHERE a.id=${alias}.cover_media_asset_id AND a.asset_type IN ('thumbnail','poster') AND a.visibility='public' AND a.processing_state='ready' AND a.review_status='approved'),${alias}.legacy_cover_image_url) cover_image_url`;

export class V3PublicService {
  constructor(db, blob = null) { this.db = db; this.blob = blob; }

  async loyalFansCatalogueForVideos(videoIds = []) {
    const videoLegacyIds = ids(videoIds, 100);
    const result = new Map(videoLegacyIds.map(id => [id, null]));
    if (!videoLegacyIds.length) return result;
    const rows = await this.db.query(`SELECT p.video_legacy_id,p.loyalfans_post_uid,p.loyalfans_video_uid,p.owner_uid,p.slug,p.title,p.description,
      p.current_price_minor,p.old_price_minor,p.currency,p.discount_percent,p.discount_expire_at,p.duration_seconds,
      p.width,p.height,p.mime_type,p.preview_option,p.orientation,p.downloadable_resolution,p.downloadable_format,p.downloadable,
      p.video_available,p.availability_state,p.source_created_at,p.source_updated_at,p.last_synced_at,
      a.id poster_id,a.asset_type poster_type,a.legacy_url poster_legacy_url,a.storage_reference poster_storage_reference,
      t.id trailer_id,t.asset_type trailer_type,t.legacy_url trailer_legacy_url,t.storage_reference trailer_storage_reference
      FROM v3_loyalfans_catalogue_products p
      JOIN v3_catalogue_external_content_mappings m ON m.provider='loyalfans' AND m.external_content_uid=p.loyalfans_post_uid
        AND m.video_legacy_id=p.video_legacy_id AND m.status='active'
      LEFT JOIN v3_media_assets a ON a.id=p.poster_media_asset_id AND a.visibility='public' AND a.processing_state='ready' AND a.review_status='approved'
      LEFT JOIN v3_media_assets t ON t.id=p.trailer_media_asset_id AND t.visibility='public' AND t.processing_state='ready' AND t.review_status='approved'
      WHERE p.sync_status='active' AND p.video_legacy_id=ANY($1::text[])`, [videoLegacyIds]);
    for (const row of rows.rows) {
      result.set(row.video_legacy_id, {
        provider: 'loyalfans', post_uid: row.loyalfans_post_uid, video_uid: row.loyalfans_video_uid,
        owner_uid: row.owner_uid, slug: row.slug, title: row.title, description: row.description,
        current_price_minor: Number(row.current_price_minor),
        old_price_minor: row.old_price_minor == null ? null : Number(row.old_price_minor), currency: row.currency,
        discount_percent: row.discount_percent == null ? null : Number(row.discount_percent),
        discount_expire_at: row.discount_expire_at, duration_seconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
        width: row.width, height: row.height, mime_type: row.mime_type, preview_option: row.preview_option,
        orientation: row.orientation, resolution: row.downloadable_resolution,
        format: row.downloadable_format, downloadable: row.downloadable, video_available: row.video_available,
        availability: row.availability_state,
        source_created_at: row.source_created_at, source_updated_at: row.source_updated_at, last_synced_at: row.last_synced_at,
        poster: row.poster_id ? { id: row.poster_id, type: row.poster_type, url: row.poster_legacy_url || `/api/v3/public/media/${row.poster_id}/file` } : null,
        trailer: row.trailer_id ? { id: row.trailer_id, type: row.trailer_type, url: row.trailer_legacy_url || `/api/v3/public/media/${row.trailer_id}/file` } : null
      });
    }
    return result;
  }

  async listVideos(input = {}) {
    const p = page(input.page); const l = limit(input.limit); const q = String(input.q || '').trim();
    const sort = sortFields.get(String(input.sort || 'newest')) || sortFields.get('newest');
    const values = []; const clauses = ["v.v3_lifecycle='published'", "v.status='published'"];
    const add = (value) => { values.push(value); return `$${values.length}`; };
    if (q) { const n = add(`%${q}%`); clauses.push(`(v.title ILIKE ${n} OR v.slug ILIKE ${n} OR v.short_summary ILIKE ${n})`); }
    if (input.brand) clauses.push(`v.brand_legacy_id=${add(String(input.brand))}`);
    if (input.performer) clauses.push(`EXISTS (SELECT 1 FROM catalog_video_performers rf WHERE rf.video_legacy_id=v.legacy_id AND rf.performer_legacy_id=${add(String(input.performer))})`);
    if (Array.isArray(input.ids) && input.ids.length) clauses.push(`v.legacy_id = ANY(${add(ids(input.ids, 24))}::text[])`);
    clauses.push(`v.slug <> ALL(${add(HIDDEN_PUBLIC_VIDEO_SLUGS)}::text[])`);
    const where = clauses.join(' AND '); const count = await this.db.query(`SELECT count(*)::int AS total FROM catalog_videos v WHERE ${where}`, values);
    const offset = (p - 1) * l; const rows = await this.db.query(`
      SELECT v.legacy_id id,v.title,v.slug,v.short_summary,v.description,v.release_date,v.duration_seconds full_duration_seconds,v.duration_seconds,
        b.name brand_name,b.slug brand_slug,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id',p2.legacy_id,'name',p2.display_name,'slug',p2.slug)) FILTER (WHERE p2.legacy_id IS NOT NULL),'[]') performers,
        (SELECT a.legacy_url FROM v3_media_assets a JOIN v3_media_asset_links ml ON ml.asset_id=a.id WHERE ml.video_legacy_id=v.legacy_id AND a.asset_type='thumbnail' AND a.visibility='public' AND a.processing_state='ready' AND a.review_status='approved' ORDER BY ml.is_primary DESC LIMIT 1) thumbnail_url,
        (SELECT a.legacy_url FROM v3_media_assets a JOIN v3_media_asset_links ml ON ml.asset_id=a.id WHERE ml.video_legacy_id=v.legacy_id AND a.asset_type='trailer' AND a.visibility='public' AND a.processing_state='ready' AND a.review_status='approved' ORDER BY ml.is_primary DESC LIMIT 1) trailer_url,
        (SELECT a.duration_seconds FROM v3_media_assets a JOIN v3_media_asset_links ml ON ml.asset_id=a.id WHERE ml.video_legacy_id=v.legacy_id AND a.asset_type='trailer' AND a.visibility='public' AND a.processing_state='ready' AND a.review_status='approved' ORDER BY ml.is_primary DESC LIMIT 1) preview_duration_seconds,
        ${publicDistributionSql} external_distribution
      FROM catalog_videos v LEFT JOIN catalog_brands b ON b.legacy_id=v.brand_legacy_id AND b.v3_lifecycle='active'
      LEFT JOIN catalog_video_performers r ON r.video_legacy_id=v.legacy_id LEFT JOIN catalog_performers p2 ON p2.legacy_id=r.performer_legacy_id AND p2.v3_lifecycle='active' AND p2.status='active' AND p2.public_visibility=true AND p2.operational_status='active'
      WHERE ${where} GROUP BY v.legacy_id,b.name,b.slug ORDER BY ${sort} LIMIT ${l} OFFSET ${offset}`, values);
    return { records: rows.rows, page: p, limit: l, total: count.rows[0].total, pages: Math.ceil(count.rows[0].total / l) };
  }

  async video(slug) {
    const r = await this.db.query(`SELECT v.legacy_id id,v.title,v.slug,v.description,v.short_summary,v.release_date,v.duration_seconds full_duration_seconds,v.duration_seconds,b.name brand_name,b.slug brand_slug,
      COALESCE(json_agg(DISTINCT jsonb_build_object('id',p.legacy_id,'name',p.display_name,'slug',p.slug)) FILTER (WHERE p.legacy_id IS NOT NULL),'[]') performers
      ,(SELECT a.duration_seconds FROM v3_media_assets a JOIN v3_media_asset_links ml ON ml.asset_id=a.id WHERE ml.video_legacy_id=v.legacy_id AND a.asset_type='trailer' AND a.visibility='public' AND a.processing_state='ready' AND a.review_status='approved' ORDER BY ml.is_primary DESC LIMIT 1) preview_duration_seconds,
      ${publicDistributionSql} external_distribution
      FROM catalog_videos v LEFT JOIN catalog_brands b ON b.legacy_id=v.brand_legacy_id AND b.v3_lifecycle='active'
      LEFT JOIN catalog_video_performers r ON r.video_legacy_id=v.legacy_id LEFT JOIN catalog_performers p ON p.legacy_id=r.performer_legacy_id AND p.v3_lifecycle='active' AND p.status='active' AND p.public_visibility=true AND p.operational_status='active'
      WHERE v.slug=$1 AND v.v3_lifecycle='published' AND v.status='published' AND v.slug <> ALL($2::text[]) GROUP BY v.legacy_id,b.name,b.slug`, [slug, HIDDEN_PUBLIC_VIDEO_SLUGS]);
    if (!r.rowCount) throw new HttpError(404,'NOT_FOUND','Published video was not found.');
    const item = r.rows[0];
    const assets = await this.db.query(`SELECT a.id,a.asset_type,a.legacy_url,a.storage_reference,a.processing_state,a.duration_seconds FROM v3_media_assets a JOIN v3_media_asset_links l ON l.asset_id=a.id WHERE l.video_legacy_id=$1 AND a.visibility='public' AND a.processing_state='ready' AND a.review_status='approved'`, [item.id]);
    const related = await this.listVideos({ brand: item.brand_slug ? (await this.db.query('SELECT legacy_id FROM catalog_brands WHERE slug=$1',[item.brand_slug])).rows[0]?.legacy_id : '', limit: 8 });
    return { record: item, assets: assets.rows.map(publicAsset), related: related.records.filter((v) => v.slug !== item.slug) };
  }

  async sitemapEntries() {
    const [videos, performers, brands, collections, news] = await Promise.all([
      this.db.query(`SELECT v.slug,v.imported_at AS lastmod FROM catalog_videos v
        WHERE v.v3_lifecycle='published' AND v.status='published' AND v.slug <> ALL($1::text[])
        ORDER BY v.slug`, [HIDDEN_PUBLIC_VIDEO_SLUGS]),
      this.db.query(`SELECT p.slug,p.imported_at AS lastmod FROM catalog_performers p
        WHERE p.v3_lifecycle='active' AND p.status='active' AND p.public_visibility=true AND p.operational_status='active'
        ORDER BY p.slug`),
      this.db.query(`SELECT b.slug,b.imported_at AS lastmod FROM catalog_brands b
        WHERE b.v3_lifecycle='active' AND b.status='active' AND b.slug <> ALL($1::text[])
        ORDER BY b.slug`, [HIDDEN_PUBLIC_BRAND_SLUGS]),
      this.db.query(`SELECT slug,updated_at AS lastmod FROM v3_catalogue_collections
        WHERE visibility='public' ORDER BY slug`),
      this.db.query(`SELECT slug,updated_at AS lastmod FROM news_articles
        WHERE status='published' AND published_at<=now() ORDER BY slug`)
    ]);

    const toEntries = (result, prefix) => result.rows.flatMap(row => {
      const slug = row?.slug;
      if (typeof slug !== 'string' || !slug || slug === '.' || slug === '..' || /[\\/?#]/.test(slug)) return [];
      return [{ path: `${prefix}/${encodeURIComponent(slug)}`, lastmod: row.lastmod || null }];
    });

    return [
      ...toEntries(videos, '/v3/videos'),
      ...toEntries(performers, '/v3/performers'),
      ...toEntries(brands, '/v3/brands'),
      ...toEntries(collections, '/v3/collections'),
      ...toEntries(news, '/news')
    ];
  }

  async performers(input = {}) { return this.entityList('performer', input); }
  async brands(input = {}) { return this.entityList('brand', input); }

  async entityList(kind, input = {}) {
    const isPerformer = kind === 'performer'; const p = page(input.page); const l = limit(input.limit); const q = String(input.q || '').trim(); const values = [];
    const table = isPerformer ? 'catalog_performers' : 'catalog_brands'; const alias = isPerformer ? 'p' : 'b'; const column = isPerformer ? 'display_name' : 'name';
    const add = value => { values.push(value); return `$${values.length}`; };
    const where = ["v3_lifecycle='active'", "status='active'", isPerformer ? "public_visibility=true AND operational_status='active'" : 'true'];
    if (q) where.push(`${alias}.${column} ILIKE ${add(`%${q}%`)}`);
    if (Array.isArray(input.ids) && input.ids.length) where.push(`${alias}.legacy_id = ANY(${add(ids(input.ids, 24))}::text[])`);
    if (!isPerformer) where.push(`${alias}.slug <> ALL(${add(HIDDEN_PUBLIC_BRAND_SLUGS)}::text[])`);
    if (isPerformer && input.label) where.push(`EXISTS (SELECT 1 FROM v3_performer_brand_affiliations pa JOIN catalog_brands lb ON lb.legacy_id=pa.brand_legacy_id WHERE pa.performer_legacy_id=p.legacy_id AND pa.affiliation_status='active' AND lb.slug=${add(String(input.label))} AND lb.status='active' AND lb.v3_lifecycle='active')`);
    const whereSql = where.join(' AND '); const total = await this.db.query(`SELECT count(*)::int total FROM ${table} ${alias} WHERE ${whereSql}`, values); const offset=(p-1)*l;
    const fields = isPerformer
      ? `p.legacy_id id,p.display_name,p.slug,p.bio,p.nationality,trim(p.nationality) public_location,p.legacy_profile_image_url,p.legacy_cover_image_url,${performerMediaSql('p')},
        COALESCE((SELECT json_agg(json_build_object('id',lb.legacy_id,'name',lb.name,'slug',lb.slug) ORDER BY lb.name) FROM v3_performer_brand_affiliations pa JOIN catalog_brands lb ON lb.legacy_id=pa.brand_legacy_id WHERE pa.performer_legacy_id=p.legacy_id AND pa.affiliation_status='active' AND lb.status='active' AND lb.v3_lifecycle='active'),'[]'::json) labels`
      : 'b.legacy_id id,b.name,b.slug,b.description,b.legacy_logo_url,b.legacy_cover_image_url';
    const rows = await this.db.query(`SELECT ${fields} FROM ${table} ${alias} WHERE ${whereSql} ORDER BY ${alias}.${column} ASC LIMIT ${l} OFFSET ${offset}`, values);
    return { records: rows.rows, page:p, limit:l, total:total.rows[0].total, pages:Math.ceil(total.rows[0].total/l) };
  }

  async performer(slug) { return this.profile('performer', slug); }
  async brand(slug) { return this.profile('brand', slug); }

  async profile(kind, slug) {
    const isPerformer = kind === 'performer'; const table = isPerformer ? 'catalog_performers p' : 'catalog_brands b';
    const fields = isPerformer
      ? `p.legacy_id id,p.display_name,p.slug,p.bio,p.nationality,trim(p.nationality) public_location,p.legacy_profile_image_url,p.legacy_cover_image_url,${performerMediaSql('p')},
        COALESCE((SELECT json_agg(json_build_object('id',lb.legacy_id,'name',lb.name,'slug',lb.slug) ORDER BY lb.name) FROM v3_performer_brand_affiliations pa JOIN catalog_brands lb ON lb.legacy_id=pa.brand_legacy_id WHERE pa.performer_legacy_id=p.legacy_id AND pa.affiliation_status='active' AND lb.status='active' AND lb.v3_lifecycle='active'),'[]'::json) labels`
      : 'b.legacy_id id,b.name,b.slug,b.description,b.legacy_logo_url,b.legacy_cover_image_url';
    const profileValues = isPerformer ? [slug] : [slug, HIDDEN_PUBLIC_BRAND_SLUGS];
    const hiddenBrandClause = isPerformer ? '' : ' AND b.slug <> ALL($2::text[])';
    const r = await this.db.query(`SELECT ${fields} FROM ${table} WHERE ${isPerformer ? 'p' : 'b'}.slug=$1 AND ${isPerformer ? 'p' : 'b'}.v3_lifecycle='active' AND ${isPerformer ? 'p' : 'b'}.status='active'${isPerformer ? " AND p.public_visibility=true AND p.operational_status='active'" : hiddenBrandClause}`, profileValues);
    if (!r.rowCount) throw new HttpError(404,'NOT_FOUND',`Published ${kind} was not found.`); const record = r.rows[0];
    const filter = kind === 'performer' ? 'EXISTS (SELECT 1 FROM catalog_video_performers x WHERE x.video_legacy_id=v.legacy_id AND x.performer_legacy_id=$1)' : 'v.brand_legacy_id=$1';
    const videos = await this.listVideos({ limit: 48, [kind === 'performer' ? 'performer' : 'brand']: record.id });
    return { record, videos: videos.records };
  }

  async collection(slug) {
    if (slug === 'new-releases') {
      const videos = await this.listVideos({ limit: 12, sort: 'newest' });
      return { record: { id: 'new-releases', title: 'New Releases', slug, description: 'The latest published FLESHLAB productions.' }, videos: videos.records };
    }
    const r = await this.db.query(`SELECT id,title,slug,description,cover_asset_reference FROM v3_catalogue_collections WHERE slug=$1 AND visibility='public'`, [slug]);
    if (!r.rowCount) throw new HttpError(404,'NOT_FOUND','Published collection was not found.');
    const videos = await this.db.query(`SELECT v.slug FROM v3_catalogue_collection_videos i JOIN catalog_videos v ON v.legacy_id=i.video_legacy_id WHERE i.collection_id=$1 AND v.v3_lifecycle='published' AND v.status='published' ORDER BY i.display_order,v.title`, [r.rows[0].id]);
    const records=[]; for (const item of videos.rows) { try { records.push((await this.video(item.slug)).record); } catch {} }
    return { record:r.rows[0], videos:records };
  }

  async collections() {
    const rows = await this.db.query(`SELECT c.id,c.title,c.slug,c.description,c.cover_asset_reference,count(i.video_legacy_id)::int video_count
      FROM v3_catalogue_collections c LEFT JOIN v3_catalogue_collection_videos i ON i.collection_id=c.id
      LEFT JOIN catalog_videos v ON v.legacy_id=i.video_legacy_id AND v.v3_lifecycle='published' AND v.status='published'
      WHERE c.visibility='public' GROUP BY c.id ORDER BY c.display_order,c.title`);
    const newest = await this.listVideos({ limit: 1 });
    return { records: [{ id: 'new-releases', title: 'New Releases', slug: 'new-releases', description: 'The latest published FLESHLAB productions.', video_count: newest.total }, ...rows.rows] };
  }

  async homeConfig() {
    const result = await this.db.query('SELECT * FROM v3_public_homepage_config WHERE singleton=true');
    const row = result.rows[0] || {};
    return { ...DEFAULT_HOME, ...row, featured_video_ids: ids(row.featured_video_ids), featured_performer_ids: ids(row.featured_performer_ids), featured_collection_ids: ids(row.featured_collection_ids), section_visibility: { ...DEFAULT_HOME.section_visibility, ...(row.section_visibility || {}) } };
  }

  async featuredPerformers(selected) {
    const result = await this.entityList('performer', { ids: selected, limit: 12 });
    const ordered = selected.length ? selected.map(id => result.records.find(row => row.id === id)).filter(Boolean) : result.records;
    return Promise.all(ordered.slice(0, 6).map(async performer => ({ ...performer, video_count: (await this.listVideos({ performer: performer.id, limit: 1 })).total })));
  }

  async homepage() {
    const config = await this.homeConfig();
    const [curatedVideos, newReleases, performers, collections] = await Promise.all([
      this.listVideos({ ids: config.featured_video_ids, limit: 8 }), this.listVideos({ limit: 8, sort: 'newest' }),
      this.featuredPerformers(config.featured_performer_ids), this.collections()
    ]);
    const orderedVideos = config.featured_video_ids.length ? config.featured_video_ids.map(id => curatedVideos.records.find(row => row.id === id)).filter(Boolean) : curatedVideos.records;
    const collectionRecords = config.featured_collection_ids.length ? config.featured_collection_ids.map(id => collections.records.find(row => row.id === id)).filter(Boolean) : collections.records;
    let hero = null; let heroKind = null;
    if (config.hero_video_legacy_id) { hero = (await this.listVideos({ ids: [config.hero_video_legacy_id], limit: 1 })).records[0] || null; heroKind = hero ? 'video' : null; }
    if (!hero && config.hero_performer_legacy_id) { hero = (await this.entityList('performer', { ids: [config.hero_performer_legacy_id], limit: 1 })).records[0] || null; heroKind = hero ? 'performer' : null; }
    if (!hero && config.hero_collection_id) { hero = collectionRecords.find(row => row.id === config.hero_collection_id) || null; heroKind = hero ? 'collection' : null; }
    if (!hero) { hero = orderedVideos[0] || newReleases.records[0] || performers[0] || null; heroKind = hero?.title ? 'video' : hero?.display_name ? 'performer' : null; }
    const heroImage = hero?.thumbnail_url || hero?.trailer_url || hero?.legacy_cover_image_url || hero?.legacy_profile_image_url || (typeof hero?.cover_asset_reference === 'string' ? hero.cover_asset_reference : null);
    return {
      hero: hero ? { kind: heroKind, record: hero, image: heroImage, eyebrow: config.hero_eyebrow, title: config.hero_title, summary: config.hero_summary, cta_label: config.hero_cta_label, cta_target: config.hero_cta_target } : null,
      featured_videos: orderedVideos.slice(0, 6), new_releases: newReleases.records.slice(0, 8), featured_performers: performers,
      featured_collections: collectionRecords.filter(item => item.slug !== 'new-releases' || collections.records.length === 1).slice(0, 4),
      sections: config.section_visibility
    };
  }

  async adminHomepage() {
    const [config, videos, performers, collections] = await Promise.all([this.homeConfig(), this.listVideos({ limit: 24, sort: 'newest' }), this.entityList('performer', { limit: 24 }), this.collections()]);
    return { config, candidates: { videos: videos.records, performers: performers.records, collections: collections.records.filter(item => item.slug !== 'new-releases') } };
  }

  async assertPublicHomepageSelections(next) {
    const videoIds = ids([next.hero_video_legacy_id, ...next.featured_video_ids], 25);
    const performerIds = ids([next.hero_performer_legacy_id, ...next.featured_performer_ids], 25);
    const collectionIds = ids([next.hero_collection_id, ...next.featured_collection_ids], 25);
    const verify = async (requested, sql, kind) => {
      if (!requested.length) return;
      const result = await this.db.query(sql, [requested]);
      const available = new Set(result.rows.map(row => String(row.id)));
      if (requested.some(id => !available.has(id))) throw new HttpError(422, 'HOMEPAGE_SELECTION_NOT_PUBLIC', `Selected ${kind} records must be public and active.`);
    };
    await Promise.all([
      verify(videoIds, "SELECT legacy_id AS id FROM catalog_videos WHERE legacy_id = ANY($1::text[]) AND v3_lifecycle='published' AND status='published'", 'video'),
      verify(performerIds, "SELECT legacy_id AS id FROM catalog_performers WHERE legacy_id = ANY($1::text[]) AND v3_lifecycle='active' AND status='active' AND public_visibility=true AND operational_status='active'", 'performer'),
      verify(collectionIds, "SELECT id::text AS id FROM v3_catalogue_collections WHERE id::text = ANY($1::text[]) AND visibility='public'", 'collection')
    ]);
  }

  async updateHomepage(input = {}, actor, request) {
    const current = await this.homeConfig();
    const visibility = { ...current.section_visibility };
    if (input.section_visibility != null) {
      if (!input.section_visibility || typeof input.section_visibility !== 'object' || Array.isArray(input.section_visibility)) throw new HttpError(422, 'INVALID_HOME_SECTIONS', 'Homepage section visibility must be an object.');
      for (const key of HOME_SECTIONS) if (Object.hasOwn(input.section_visibility, key)) { if (typeof input.section_visibility[key] !== 'boolean') throw new HttpError(422, 'INVALID_HOME_SECTIONS', 'Homepage section visibility must use booleans.'); visibility[key] = input.section_visibility[key]; }
    }
    const next = {
      hero_video_legacy_id: input.hero_video_legacy_id == null ? current.hero_video_legacy_id : text(input.hero_video_legacy_id, 200) || null,
      hero_performer_legacy_id: input.hero_performer_legacy_id == null ? current.hero_performer_legacy_id : text(input.hero_performer_legacy_id, 200) || null,
      hero_collection_id: input.hero_collection_id == null ? current.hero_collection_id : text(input.hero_collection_id, 64) || null,
      hero_eyebrow: input.hero_eyebrow == null ? current.hero_eyebrow : text(input.hero_eyebrow, 80),
      hero_title: input.hero_title == null ? current.hero_title : text(input.hero_title, 120),
      hero_summary: input.hero_summary == null ? current.hero_summary : text(input.hero_summary, 360),
      hero_cta_label: input.hero_cta_label == null ? current.hero_cta_label : text(input.hero_cta_label, 48),
      hero_cta_target: input.hero_cta_target == null ? current.hero_cta_target : text(input.hero_cta_target, 220),
      featured_video_ids: input.featured_video_ids == null ? current.featured_video_ids : ids(input.featured_video_ids),
      featured_performer_ids: input.featured_performer_ids == null ? current.featured_performer_ids : ids(input.featured_performer_ids),
      featured_collection_ids: input.featured_collection_ids == null ? current.featured_collection_ids : ids(input.featured_collection_ids), section_visibility: visibility
    };
    if (!next.hero_eyebrow || !next.hero_title || !next.hero_summary || !next.hero_cta_label || !safeRoute(next.hero_cta_target)) throw new HttpError(422, 'INVALID_HOMEPAGE_CONFIG', 'Homepage copy and CTA target are invalid.');
    await this.assertPublicHomepageSelections(next);
    const result = await this.db.query(`UPDATE v3_public_homepage_config SET hero_video_legacy_id=$1,hero_performer_legacy_id=$2,hero_collection_id=$3,hero_eyebrow=$4,hero_title=$5,hero_summary=$6,hero_cta_label=$7,hero_cta_target=$8,featured_video_ids=$9,featured_performer_ids=$10,featured_collection_ids=$11,section_visibility=$12,updated_by=$13,updated_at=now() WHERE singleton=true RETURNING *`, [next.hero_video_legacy_id,next.hero_performer_legacy_id,next.hero_collection_id,next.hero_eyebrow,next.hero_title,next.hero_summary,next.hero_cta_label,next.hero_cta_target,next.featured_video_ids,next.featured_performer_ids,next.featured_collection_ids,next.section_visibility,actor.id]);
    await this.db.query(`INSERT INTO v3_audit_events(actor_id,action,entity_type,entity_id,before_summary,after_summary,domain,result,metadata,ip_address) VALUES($1,'public_homepage.updated','public_homepage','singleton',$2,$3,'catalogue','success',$4,$5)`, [actor.id, current, { ...next, updated_by: actor.id }, { request_id: request?.headers?.['x-request-id'] || null }, request?.socket?.remoteAddress || null]);
    return { config: { ...DEFAULT_HOME, ...result.rows[0], section_visibility: visibility } };
  }

  async media(id) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id || ''))) throw new HttpError(404,'NOT_FOUND','Public media was not found.');
    const r = await this.db.query(`SELECT id,asset_type,legacy_url,storage_reference,processing_state,review_status,visibility,duration_seconds FROM v3_media_assets WHERE id=$1`, [id]);
    if (!r.rowCount || r.rows[0].visibility !== 'public' || r.rows[0].processing_state !== 'ready' || (r.rows[0].review_status && r.rows[0].review_status !== 'approved')) throw new HttpError(404,'NOT_FOUND','Public media was not found.');
    return publicAsset(r.rows[0]);
  }

  async publicMediaFile(id) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id || ''))) throw new HttpError(404, 'NOT_FOUND', 'Public media was not found.');
    const r = await this.db.query(`SELECT id,storage_reference,mime_type,byte_size FROM v3_media_assets WHERE id=$1 AND visibility='public' AND processing_state='ready' AND review_status='approved'`, [id]);
    if (!r.rowCount || !r.rows[0].storage_reference || !this.blob) throw new HttpError(404, 'NOT_FOUND', 'Public media was not found.');
    const media = await this.blob.downloadStream(r.rows[0].storage_reference);
    return { ...media, content_type: r.rows[0].mime_type || media.contentType, file_name: `fleshlab-media-${id}` };
  }
}
