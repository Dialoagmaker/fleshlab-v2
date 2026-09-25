import crypto from 'node:crypto';
import { HttpError } from './errors.js';

export const performerOperationalStates = new Set(['active', 'inactive', 'archived']);
const text = (value, max = 4000) => value == null ? null : String(value).trim().slice(0, max) || null;
const slugify = value => String(value || '').trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);
const bool = value => value === true || value === false ? value : null;
const page = value => Math.max(1, Number.parseInt(value, 10) || 1);
const limit = value => Math.min(100, Math.max(1, Number.parseInt(value, 10) || 24));

function dateOrNull(value) {
  if (value == null || value === '') return null;
  const parsed = new Date(`${String(value)}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed > new Date()) throw new HttpError(422, 'INVALID_DATE_OF_BIRTH', 'Date of birth must be a past calendar date.');
  return String(value);
}

export class V3PerformerService {
  constructor(db) { this.db = db; }

  async audit(actor, action, performerId, before, after, request) {
    await this.db.query(`INSERT INTO v3_audit_events(actor_id,action,entity_type,entity_id,before_summary,after_summary,domain,result,metadata,ip_address)
      VALUES($1,$2,'performer',$3,$4,$5,'performer','success',$6,$7)`, [actor.id, action, performerId, before, after, { request_id: request?.headers?.['x-request-id'] || null }, request?.socket?.remoteAddress || null]);
  }

  async list(input = {}) {
    const q = String(input.q || '').trim(); const p = page(input.page); const l = limit(input.limit); const values = []; const clauses = [];
    const add = value => { values.push(value); return `$${values.length}`; };
    if (q) { const term = add(`%${q}%`); clauses.push(`(p.display_name ILIKE ${term} OR p.slug ILIKE ${term} OR p.nationality ILIKE ${term})`); }
    if (performerOperationalStates.has(input.operational_status)) clauses.push(`p.operational_status=${add(input.operational_status)}`);
    if (['true', 'false'].includes(String(input.featured))) clauses.push(`p.featured=${add(input.featured === 'true')}`);
    if (['true', 'false'].includes(String(input.verified))) clauses.push(`p.verified=${add(input.verified === 'true')}`);
    if (['true', 'false'].includes(String(input.public_visibility))) clauses.push(`p.public_visibility=${add(input.public_visibility === 'true')}`);
    if (input.account_link === 'linked') clauses.push(`EXISTS (SELECT 1 FROM v3_performer_user_links ul WHERE ul.performer_legacy_id=p.legacy_id) OR EXISTS (SELECT 1 FROM v3_creator_performer_links cl JOIN v3_creator_records cr ON cr.id=cl.creator_id WHERE cl.performer_legacy_id=p.legacy_id AND cr.user_id IS NOT NULL)`);
    if (input.account_link === 'unlinked') clauses.push(`NOT EXISTS (SELECT 1 FROM v3_performer_user_links ul WHERE ul.performer_legacy_id=p.legacy_id) AND NOT EXISTS (SELECT 1 FROM v3_creator_performer_links cl JOIN v3_creator_records cr ON cr.id=cl.creator_id WHERE cl.performer_legacy_id=p.legacy_id AND cr.user_id IS NOT NULL)`);
    if (input.label) clauses.push(`EXISTS (SELECT 1 FROM v3_performer_brand_affiliations pa JOIN catalog_brands lb ON lb.legacy_id=pa.brand_legacy_id WHERE pa.performer_legacy_id=p.legacy_id AND pa.affiliation_status='active' AND lb.slug=$${values.push(String(input.label))} AND lb.status='active' AND lb.v3_lifecycle='active')`);
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const total = await this.db.query(`SELECT count(*)::int total FROM catalog_performers p ${where}`, values);
    const rows = await this.db.query(`SELECT p.legacy_id,p.display_name,p.slug,p.nationality,p.status,p.v3_lifecycle,p.operational_status,p.public_visibility,p.featured,p.verified,p.legacy_profile_image_url,
      COALESCE((SELECT json_agg(json_build_object('id',lb.legacy_id,'name',lb.name,'slug',lb.slug,'status',pa.affiliation_status) ORDER BY lb.name) FROM v3_performer_brand_affiliations pa JOIN catalog_brands lb ON lb.legacy_id=pa.brand_legacy_id WHERE pa.performer_legacy_id=p.legacy_id AND pa.affiliation_status='active' AND lb.status='active' AND lb.v3_lifecycle='active'),'[]'::json) AS labels,
      EXISTS(SELECT 1 FROM v3_creator_performer_links cl WHERE cl.performer_legacy_id=p.legacy_id) AS has_creator_link,
      EXISTS(SELECT 1 FROM v3_performer_user_links ul WHERE ul.performer_legacy_id=p.legacy_id) OR EXISTS(SELECT 1 FROM v3_creator_performer_links cl JOIN v3_creator_records cr ON cr.id=cl.creator_id WHERE cl.performer_legacy_id=p.legacy_id AND cr.user_id IS NOT NULL) AS has_user_link,
      COALESCE((SELECT iv.status FROM v3_creator_performer_links cl JOIN v3_creator_identity_verifications iv ON iv.creator_id=cl.creator_id WHERE cl.performer_legacy_id=p.legacy_id ORDER BY iv.updated_at DESC LIMIT 1),'not_started') AS kyc_status,
      CASE WHEN p.operational_status='archived' THEN 'archived' WHEN p.operational_status='inactive' THEN 'inactive' WHEN p.public_visibility=false THEN 'private' ELSE 'review_required' END AS compliance_state
      FROM catalog_performers p ${where} ORDER BY p.imported_at DESC,p.display_name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, l, (p - 1) * l]);
    return { records: rows.rows, page: p, limit: l, total: total.rows[0].total, pages: Math.max(1, Math.ceil(total.rows[0].total / l)) };
  }

  async detail(id) {
    const performer = await this.db.query(`SELECT p.*,
      COALESCE((SELECT json_agg(json_build_object('id',lb.legacy_id,'name',lb.name,'slug',lb.slug,'status',pa.affiliation_status) ORDER BY lb.name) FROM v3_performer_brand_affiliations pa JOIN catalog_brands lb ON lb.legacy_id=pa.brand_legacy_id WHERE pa.performer_legacy_id=p.legacy_id AND pa.affiliation_status='active' AND lb.status='active' AND lb.v3_lifecycle='active'),'[]'::json) AS labels,
      COALESCE((SELECT json_agg(json_build_object('id',c.id,'name',a.full_name,'lifecycle',c.lifecycle,'user_id',c.user_id)) FROM v3_creator_performer_links cl JOIN v3_creator_records c ON c.id=cl.creator_id JOIN performer_applications a ON a.id=c.application_id WHERE cl.performer_legacy_id=p.legacy_id),'[]'::json) AS creators,
      COALESCE((SELECT json_agg(json_build_object('user_id',linked.user_id,'email',linked.email,'role',linked.role,'account_status',linked.account_status,'source',linked.source)) FROM (
        SELECT u.id AS user_id,u.email,u.role,u.account_status,'direct'::text AS source
        FROM v3_performer_user_links ul JOIN app_users u ON u.id=ul.user_id
        WHERE ul.performer_legacy_id=p.legacy_id
        UNION
        SELECT u.id AS user_id,u.email,u.role,u.account_status,'creator'::text AS source
        FROM v3_creator_performer_links cl JOIN v3_creator_records c ON c.id=cl.creator_id JOIN app_users u ON u.id=c.user_id
        WHERE cl.performer_legacy_id=p.legacy_id AND c.user_id IS NOT NULL
      ) linked),'[]'::json) AS users,
      COALESCE((SELECT iv.status FROM v3_creator_performer_links cl JOIN v3_creator_identity_verifications iv ON iv.creator_id=cl.creator_id WHERE cl.performer_legacy_id=p.legacy_id ORDER BY iv.updated_at DESC LIMIT 1),'not_started') AS kyc_status
      FROM catalog_performers p WHERE p.legacy_id=$1`, [id]);
    if (!performer.rowCount) throw new HttpError(404, 'PERFORMER_NOT_FOUND', 'Performer was not found.');
    const [videos, productions, earnings, audit] = await Promise.all([
      this.db.query(`SELECT v.legacy_id,v.title,v.slug,v.status,v.v3_lifecycle,x.role_name,x.display_order FROM catalog_video_performers x JOIN catalog_videos v ON v.legacy_id=x.video_legacy_id WHERE x.performer_legacy_id=$1 ORDER BY v.release_date DESC NULLS LAST,v.imported_at DESC`, [id]),
      this.db.query(`SELECT DISTINCT p.id,p.title,p.reference,p.status,p.updated_at FROM v3_production_participant_assignments pa JOIN v3_productions p ON p.id=pa.production_id WHERE pa.performer_legacy_id=$1 ORDER BY p.updated_at DESC LIMIT 30`, [id]),
      this.db.query(`SELECT id,event_type,source_type,performer_amount_minor,original_currency,settlement_period_start,settlement_period_end,created_at FROM v3_earnings_ledger WHERE performer_legacy_id=$1 ORDER BY created_at DESC LIMIT 30`, [id]),
      this.db.query(`SELECT id,action,before_summary,after_summary,created_at FROM v3_audit_events WHERE entity_type='performer' AND entity_id=$1 ORDER BY created_at DESC LIMIT 50`, [id])
    ]);
    return { performer: performer.rows[0], videos: videos.rows, productions: productions.rows, earnings: earnings.rows, audit: audit.rows };
  }

  async assertMedia(id) {
    if (!id) return null;
    const media = await this.db.query(`SELECT id FROM v3_media_assets WHERE id=$1 AND visibility='public' AND processing_state='ready' AND mime_type LIKE 'image/%'`, [id]);
    if (!media.rowCount) throw new HttpError(422, 'PERFORMER_MEDIA_NOT_PUBLIC_READY', 'Performer media must be a ready public image asset.');
    return id;
  }

  async create(input, actor, request) {
    const displayName = text(input.display_name, 180); const slug = slugify(input.slug || displayName);
    if (!displayName || !slug) throw new HttpError(422, 'INVALID_PERFORMER', 'Display name and a valid unique slug are required.');
    const duplicate = await this.db.query('SELECT 1 FROM catalog_performers WHERE slug=$1', [slug]);
    if (duplicate.rowCount) throw new HttpError(409, 'PERFORMER_SLUG_EXISTS', 'A performer already uses this slug.');
    const operationalStatus = performerOperationalStates.has(input.operational_status) ? input.operational_status : 'active';
    const publicVisibility = bool(input.public_visibility) ?? false;
    const profileAsset = await this.assertMedia(input.profile_media_asset_id || null); const coverAsset = await this.assertMedia(input.cover_media_asset_id || null);
    const id = `performer_${crypto.randomUUID()}`;
    const result = await this.db.query(`INSERT INTO catalog_performers(legacy_id,display_name,slug,bio,nationality,status,featured,verified,source_payload,imported_at,v3_lifecycle,operational_status,public_visibility,date_of_birth,internal_admin_notes,availability_notes,profile_media_asset_id,cover_media_asset_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`, [id, displayName, slug, text(input.bio), text(input.nationality, 120), input.catalogue_status === 'inactive' ? 'inactive' : 'active', bool(input.featured) ?? false, bool(input.verified) ?? false, { origin: 'v3_manual', created_by: actor.id }, 'active', operationalStatus, publicVisibility, dateOrNull(input.date_of_birth), text(input.internal_admin_notes), text(input.availability_notes), profileAsset, coverAsset]);
    await this.audit(actor, 'performer.created', id, null, result.rows[0], request);
    return this.detail(id);
  }

  async update(id, input, actor, request) {
    const before = await this.detail(id); const current = before.performer;
    const next = {
      display_name: Object.hasOwn(input, 'display_name') ? text(input.display_name, 180) : current.display_name,
      slug: Object.hasOwn(input, 'slug') ? slugify(input.slug) : current.slug,
      bio: Object.hasOwn(input, 'bio') ? text(input.bio) : current.bio,
      nationality: Object.hasOwn(input, 'nationality') ? text(input.nationality, 120) : current.nationality,
      date_of_birth: Object.hasOwn(input, 'date_of_birth') ? dateOrNull(input.date_of_birth) : current.date_of_birth,
      operational_status: Object.hasOwn(input, 'operational_status') ? input.operational_status : current.operational_status,
      public_visibility: Object.hasOwn(input, 'public_visibility') ? bool(input.public_visibility) : current.public_visibility,
      featured: Object.hasOwn(input, 'featured') ? bool(input.featured) : current.featured,
      verified: Object.hasOwn(input, 'verified') ? bool(input.verified) : current.verified,
      internal_admin_notes: Object.hasOwn(input, 'internal_admin_notes') ? text(input.internal_admin_notes) : current.internal_admin_notes,
      availability_notes: Object.hasOwn(input, 'availability_notes') ? text(input.availability_notes) : current.availability_notes,
      profile_media_asset_id: Object.hasOwn(input, 'profile_media_asset_id') ? await this.assertMedia(input.profile_media_asset_id || null) : current.profile_media_asset_id,
      cover_media_asset_id: Object.hasOwn(input, 'cover_media_asset_id') ? await this.assertMedia(input.cover_media_asset_id || null) : current.cover_media_asset_id
    };
    if (!next.display_name || !next.slug || !performerOperationalStates.has(next.operational_status) || next.public_visibility == null || next.featured == null || next.verified == null) throw new HttpError(422, 'INVALID_PERFORMER', 'Performer profile values are invalid.');
    const duplicate = await this.db.query('SELECT 1 FROM catalog_performers WHERE slug=$1 AND legacy_id<>$2', [next.slug, id]);
    if (duplicate.rowCount) throw new HttpError(409, 'PERFORMER_SLUG_EXISTS', 'A performer already uses this slug.');
    const result = await this.db.query(`UPDATE catalog_performers SET display_name=$2,slug=$3,bio=$4,nationality=$5,date_of_birth=$6,operational_status=$7,public_visibility=$8,featured=$9,verified=$10,internal_admin_notes=$11,availability_notes=$12,profile_media_asset_id=$13,cover_media_asset_id=$14 WHERE legacy_id=$1 RETURNING *`, [id,next.display_name,next.slug,next.bio,next.nationality,next.date_of_birth,next.operational_status,next.public_visibility,next.featured,next.verified,next.internal_admin_notes,next.availability_notes,next.profile_media_asset_id,next.cover_media_asset_id]);
    const action = current.operational_status !== next.operational_status ? 'performer.operational_status_changed' : current.public_visibility !== next.public_visibility ? 'performer.visibility_changed' : 'performer.updated';
    await this.audit(actor, action, id, current, result.rows[0], request);
    return this.detail(id);
  }

  async updateLabels(id, input, actor, request) {
    if (!Array.isArray(input?.brand_ids) || !input.brand_ids.every(value => typeof value === 'string')) throw new HttpError(422, 'INVALID_LABELS', 'brand_ids must be an array of label identifiers.');
    const brandIds = [...new Set(input.brand_ids.map(value => value.trim()).filter(Boolean))].slice(0, 12);
    const before = await this.detail(id);
    const available = brandIds.length ? await this.db.query("SELECT legacy_id FROM catalog_brands WHERE legacy_id=ANY($1::text[]) AND status='active' AND v3_lifecycle='active'", [brandIds]) : { rows: [] };
    if (available.rows.length !== brandIds.length) throw new HttpError(422, 'INVALID_LABELS', 'Only active public labels may be assigned.');
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query("UPDATE v3_performer_brand_affiliations SET affiliation_status='inactive',updated_at=now() WHERE performer_legacy_id=$1", [id]);
      for (const brandId of brandIds) await client.query(`INSERT INTO v3_performer_brand_affiliations(performer_legacy_id,brand_legacy_id,affiliation_status,source)
        VALUES($1,$2,'active','admin') ON CONFLICT(performer_legacy_id,brand_legacy_id) DO UPDATE SET affiliation_status='active',source='admin',updated_at=now()`, [id, brandId]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    const after = await this.detail(id);
    await this.audit(actor, 'performer.labels.updated', id, before.performer.labels || [], after.performer.labels || [], request);
    return after;
  }
}
