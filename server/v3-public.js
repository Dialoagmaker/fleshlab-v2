import { HttpError } from './errors.js';

const page = (value) => Math.max(1, Number.parseInt(value, 10) || 1);
const limit = (value) => Math.min(48, Math.max(1, Number.parseInt(value, 10) || 24));
const sortFields = new Map([['newest','v.release_date DESC NULLS LAST, v.imported_at DESC'],['title','v.title ASC'],['oldest','v.release_date ASC NULLS LAST, v.imported_at ASC']]);
const publicAsset = (row) => row ? { id: row.id, type: row.asset_type, url: row.legacy_url, processing_state: row.processing_state } : null;

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
    const where = [`v3_lifecycle='active'`, "status='active'"]; if (q) { values.push(`%${q}%`); where.push(`${column} ILIKE $${values.length}`); }
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
    const r = await this.db.query(`SELECT id,title,slug,description,cover_asset_reference FROM v3_catalogue_collections WHERE slug=$1 AND visibility='public'`, [slug]);
    if (!r.rowCount) throw new HttpError(404,'NOT_FOUND','Published collection was not found.');
    const videos = await this.db.query(`SELECT v.slug FROM v3_catalogue_collection_videos i JOIN catalog_videos v ON v.legacy_id=i.video_legacy_id WHERE i.collection_id=$1 AND v.v3_lifecycle='published' AND v.status='published' ORDER BY i.display_order,v.title`, [r.rows[0].id]);
    const records=[]; for (const item of videos.rows) { try { records.push((await this.video(item.slug)).record); } catch {} }
    return { record:r.rows[0], videos:records };
  }

  async media(id) {
    const r = await this.db.query(`SELECT id,asset_type,legacy_url,processing_state,visibility FROM v3_media_assets WHERE id=$1`, [id]);
    if (!r.rowCount || r.rows[0].visibility !== 'public' || r.rows[0].processing_state !== 'ready') throw new HttpError(404,'NOT_FOUND','Public media was not found.');
    return publicAsset(r.rows[0]);
  }
}
