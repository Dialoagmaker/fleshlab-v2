import { HttpError } from './errors.js';

const page = (value) => Math.max(1, Number.parseInt(value, 10) || 1);
const limit = (value) => Math.min(48, Math.max(1, Number.parseInt(value, 10) || 24));
const sortFields = new Map([['newest','v.release_date DESC NULLS LAST, v.imported_at DESC'],['title','v.title ASC'],['oldest','v.release_date ASC NULLS LAST, v.imported_at ASC']]);
const publicAsset = (row) => row ? { id: row.id, type: row.asset_type, url: row.legacy_url, processing_state: row.processing_state } : null;
const HOME_SECTIONS = ['featured_videos','new_releases','performers','collections','creator_cta','trust'];
const DEFAULT_HOME = Object.freeze({
  hero_eyebrow: 'FLESHLAB / INDEPENDENT STUDIO', hero_title: 'Stories with presence.',
  hero_summary: 'Creator-led films, real chemistry and a catalogue made with intention.',
  hero_cta_label: 'Explore videos', hero_cta_target: '/v3/videos', featured_video_ids: [], featured_performer_ids: [], featured_collection_ids: [],
  section_visibility: Object.fromEntries(HOME_SECTIONS.map(key => [key, true]))
});
const text = (value, maximum) => String(value ?? '').trim().slice(0, maximum);
const ids = (value, maximum = 12) => [...new Set((Array.isArray(value) ? value : []).map(item => String(item || '').trim()).filter(Boolean))].slice(0, maximum);
const safeRoute = (value) => /^\/v3(?:\/(?:videos|performers|brands)(?:\/[a-z0-9-]+)?|\/collections(?:\/[a-z0-9-]+)?)?$/i.test(String(value || ''));

export class V3PublicService {
  constructor(db) { this.db = db; }

  async listVideos(input = {}) {
    const p = page(input.page); const l = limit(input.limit); const q = String(input.q || '').trim();
    const sort = sortFields.get(String(input.sort || 'newest')) || sortFields.get('newest');
    const values = []; const clauses = ["v.v3_lifecycle='published'", "v.status='published'"];
    const add = (value) => { values.push(value); return `$${values.length}`; };
    if (q) { const n = add(`%${q}%`); clauses.push(`(v.title ILIKE ${n} OR v.slug ILIKE ${n} OR v.short_summary ILIKE ${n})`); }
    if (input.brand) clauses.push(`v.brand_legacy_id=${add(String(input.brand))}`);
    if (input.performer) clauses.push(`EXISTS (SELECT 1 FROM catalog_video_performers rf WHERE rf.video_legacy_id=v.legacy_id AND rf.performer_legacy_id=${add(String(input.performer))})`);
    if (Array.isArray(input.ids) && input.ids.length) clauses.push(`v.legacy_id = ANY(${add(ids(input.ids, 24))}::text[])`);
    const where = clauses.join(' AND '); const count = await this.db.query(`SELECT count(*)::int AS total FROM catalog_videos v WHERE ${where}`, values);
    const offset = (p - 1) * l; const rows = await this.db.query(`
      SELECT v.legacy_id id,v.title,v.slug,v.short_summary,v.description,v.release_date,v.duration_seconds,v.access_tier,
        b.name brand_name,b.slug brand_slug,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id',p2.legacy_id,'name',p2.display_name,'slug',p2.slug)) FILTER (WHERE p2.legacy_id IS NOT NULL),'[]') performers,
        (SELECT a.legacy_url FROM v3_media_assets a JOIN v3_media_asset_links ml ON ml.asset_id=a.id WHERE ml.video_legacy_id=v.legacy_id AND a.asset_type='thumbnail' AND a.visibility='public' AND a.processing_state='ready' ORDER BY ml.is_primary DESC LIMIT 1) thumbnail_url,
        (SELECT a.legacy_url FROM v3_media_assets a JOIN v3_media_asset_links ml ON ml.asset_id=a.id WHERE ml.video_legacy_id=v.legacy_id AND a.asset_type='trailer' AND a.visibility='public' AND a.processing_state='ready' ORDER BY ml.is_primary DESC LIMIT 1) trailer_url
      FROM catalog_videos v LEFT JOIN catalog_brands b ON b.legacy_id=v.brand_legacy_id AND b.v3_lifecycle='active'
      LEFT JOIN catalog_video_performers r ON r.video_legacy_id=v.legacy_id LEFT JOIN catalog_performers p2 ON p2.legacy_id=r.performer_legacy_id AND p2.v3_lifecycle='active'
      WHERE ${where} GROUP BY v.legacy_id,b.name,b.slug ORDER BY ${sort} LIMIT ${l} OFFSET ${offset}`, values);
    return { records: rows.rows, page: p, limit: l, total: count.rows[0].total, pages: Math.ceil(count.rows[0].total / l) };
  }

  async video(slug) {
    const r = await this.db.query(`SELECT v.legacy_id id,v.title,v.slug,v.description,v.short_summary,v.release_date,v.duration_seconds,v.access_tier,b.name brand_name,b.slug brand_slug,
      COALESCE(json_agg(DISTINCT jsonb_build_object('id',p.legacy_id,'name',p.display_name,'slug',p.slug)) FILTER (WHERE p.legacy_id IS NOT NULL),'[]') performers
      FROM catalog_videos v LEFT JOIN catalog_brands b ON b.legacy_id=v.brand_legacy_id AND b.v3_lifecycle='active'
      LEFT JOIN catalog_video_performers r ON r.video_legacy_id=v.legacy_id LEFT JOIN catalog_performers p ON p.legacy_id=r.performer_legacy_id AND p.v3_lifecycle='active'
      WHERE v.slug=$1 AND v.v3_lifecycle='published' AND v.status='published' GROUP BY v.legacy_id,b.name,b.slug`, [slug]);
    if (!r.rowCount) throw new HttpError(404,'NOT_FOUND','Published video was not found.');
    const item = r.rows[0];
    const assets = await this.db.query(`SELECT a.id,a.asset_type,a.legacy_url,a.processing_state FROM v3_media_assets a JOIN v3_media_asset_links l ON l.asset_id=a.id WHERE l.video_legacy_id=$1 AND a.visibility='public' AND a.processing_state='ready'`, [item.id]);
    const related = await this.listVideos({ brand: item.brand_slug ? (await this.db.query('SELECT legacy_id FROM catalog_brands WHERE slug=$1',[item.brand_slug])).rows[0]?.legacy_id : '', limit: 8 });
    return { record: item, assets: assets.rows.map(publicAsset), related: related.records.filter((v) => v.slug !== item.slug) };
  }

  async performers(input = {}) { return this.entityList('performer', input); }
  async brands(input = {}) { return this.entityList('brand', input); }

  async entityList(kind, input = {}) {
    const p = page(input.page); const l = limit(input.limit); const q = String(input.q || '').trim(); const values = []; const column = kind === 'performer' ? 'display_name' : 'name'; const table = kind === 'performer' ? 'catalog_performers' : 'catalog_brands';
    const where = [`v3_lifecycle='active'`, "status='active'"]; if (q) { values.push(`%${q}%`); where.push(`${column} ILIKE $${values.length}`); } if (Array.isArray(input.ids) && input.ids.length) { values.push(ids(input.ids, 24)); where.push(`legacy_id = ANY($${values.length}::text[])`); }
    const total = await this.db.query(`SELECT count(*)::int total FROM ${table} WHERE ${where.join(' AND ')}`, values); const offset=(p-1)*l;
    const fields = kind === 'performer' ? 'legacy_id id,display_name,slug,bio,nationality,legacy_profile_image_url,legacy_cover_image_url' : 'legacy_id id,name,slug,description,legacy_logo_url,legacy_cover_image_url';
    const rows = await this.db.query(`SELECT ${fields} FROM ${table} WHERE ${where.join(' AND ')} ORDER BY ${column} ASC LIMIT ${l} OFFSET ${offset}`, values);
    return { records: rows.rows, page:p, limit:l, total:total.rows[0].total, pages:Math.ceil(total.rows[0].total/l) };
  }

  async performer(slug) { return this.profile('performer', slug); }
  async brand(slug) { return this.profile('brand', slug); }

  async profile(kind, slug) {
    const table = kind === 'performer' ? 'catalog_performers' : 'catalog_brands'; const idColumn = kind === 'performer' ? 'display_name' : 'name';
    const fields = kind === 'performer' ? 'legacy_id id,display_name,slug,bio,nationality,legacy_profile_image_url,legacy_cover_image_url' : 'legacy_id id,name,slug,description,legacy_logo_url,legacy_cover_image_url';
    const r = await this.db.query(`SELECT ${fields} FROM ${table} WHERE slug=$1 AND v3_lifecycle='active' AND status='active'`, [slug]);
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
      verify(performerIds, "SELECT legacy_id AS id FROM catalog_performers WHERE legacy_id = ANY($1::text[]) AND v3_lifecycle='active' AND status='active'", 'performer'),
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
    const r = await this.db.query(`SELECT id,asset_type,legacy_url,processing_state,visibility FROM v3_media_assets WHERE id=$1`, [id]);
    if (!r.rowCount || r.rows[0].visibility !== 'public' || r.rows[0].processing_state !== 'ready') throw new HttpError(404,'NOT_FOUND','Public media was not found.');
    return publicAsset(r.rows[0]);
  }
}
