import crypto from 'node:crypto';
import { HttpError } from './errors.js';
import { normalizePerformerId, performerIdCandidates } from '../shared/performer-identifiers.js';

export const performerOperationalStates = new Set(['active', 'inactive', 'archived']);
const text = (value, max = 4000) => value == null ? null : String(value).trim().slice(0, max) || null;
const slugify = value => String(value || '').trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);
const bool = value => value === true || value === false ? value : null;
const page = value => Math.max(1, Number.parseInt(value, 10) || 1);
const limit = value => Math.min(100, Math.max(1, Number.parseInt(value, 10) || 24));
const privateAddressKeys = ['line1', 'line2', 'postal_code', 'city', 'region', 'country'];

function privateAddress(input, current = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return current || {};
  return Object.fromEntries(privateAddressKeys
    .filter(key => Object.hasOwn(input, key))
    .map(key => [key, text(input[key], 180)])
    .filter(([, value]) => value));
}

function privateProfile(input, current = {}) {
  const previous = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
  const next = { ...previous };
  if (Object.hasOwn(input, 'legal_name')) next.legal_name = text(input.legal_name, 180);
  if (Object.hasOwn(input, 'address')) next.address = privateAddress(input.address, previous.address || {});
  return next;
}

function normalizedEmail(value) {
  const result = String(value || '').trim().toLowerCase();
  if (result && !/^\S+@\S+\.\S+$/.test(result)) throw new HttpError(422, 'INVALID_CONTACT_EMAIL', 'A valid private contact email is required.');
  return result || null;
}

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
      COALESCE((SELECT COALESCE(a.legacy_url,'/api/v3/public/media/' || a.id || '/file') FROM v3_media_assets a WHERE a.id=p.profile_media_asset_id AND a.asset_type='thumbnail' AND a.visibility='public' AND a.processing_state='ready' AND a.review_status='approved'),p.legacy_profile_image_url) AS profile_image_url,
      COALESCE((SELECT json_agg(json_build_object('id',lb.legacy_id,'name',lb.name,'slug',lb.slug,'status',pa.affiliation_status) ORDER BY lb.name) FROM v3_performer_brand_affiliations pa JOIN catalog_brands lb ON lb.legacy_id=pa.brand_legacy_id WHERE pa.performer_legacy_id=p.legacy_id AND pa.affiliation_status='active' AND lb.status='active' AND lb.v3_lifecycle='active'),'[]'::json) AS labels,
      EXISTS(SELECT 1 FROM v3_creator_performer_links cl WHERE cl.performer_legacy_id=p.legacy_id) AS has_creator_link,
      EXISTS(SELECT 1 FROM v3_performer_user_links ul WHERE ul.performer_legacy_id=p.legacy_id) OR EXISTS(SELECT 1 FROM v3_creator_performer_links cl JOIN v3_creator_records cr ON cr.id=cl.creator_id WHERE cl.performer_legacy_id=p.legacy_id AND cr.user_id IS NOT NULL) AS has_user_link,
      COALESCE((SELECT iv.status FROM v3_creator_performer_links cl JOIN v3_creator_identity_verifications iv ON iv.creator_id=cl.creator_id WHERE cl.performer_legacy_id=p.legacy_id ORDER BY iv.updated_at DESC LIMIT 1),'not_started') AS kyc_status,
      CASE WHEN p.operational_status='archived' THEN 'archived' WHEN p.operational_status='inactive' THEN 'inactive' WHEN p.public_visibility=false THEN 'private' ELSE 'review_required' END AS compliance_state
      FROM catalog_performers p ${where} ORDER BY p.imported_at DESC,p.display_name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, l, (p - 1) * l]);
    return { records: rows.rows, page: p, limit: l, total: total.rows[0].total, pages: Math.max(1, Math.ceil(total.rows[0].total / l)) };
  }

  async resolveId(input) {
    const candidates = performerIdCandidates(input);
    if (!candidates.length) throw new HttpError(404, 'PERFORMER_NOT_FOUND', 'Performer was not found.');
    const result = await this.db.query('SELECT legacy_id FROM catalog_performers WHERE legacy_id=ANY($1::text[]) LIMIT 1', [candidates]);
    if (!result.rowCount) throw new HttpError(404, 'PERFORMER_NOT_FOUND', 'Performer was not found.');
    return normalizePerformerId(result.rows[0].legacy_id);
  }

  async detail(id) {
    id = await this.resolveId(id);
    const performer = await this.db.query(`SELECT p.*,
      COALESCE((SELECT COALESCE(a.legacy_url,'/api/v3/public/media/' || a.id || '/file') FROM v3_media_assets a WHERE a.id=p.profile_media_asset_id AND a.asset_type='thumbnail' AND a.visibility='public' AND a.processing_state='ready' AND a.review_status='approved'),p.legacy_profile_image_url) AS profile_image_url,
      COALESCE((SELECT json_agg(json_build_object('id',lb.legacy_id,'name',lb.name,'slug',lb.slug,'status',pa.affiliation_status) ORDER BY lb.name) FROM v3_performer_brand_affiliations pa JOIN catalog_brands lb ON lb.legacy_id=pa.brand_legacy_id WHERE pa.performer_legacy_id=p.legacy_id AND pa.affiliation_status='active' AND lb.status='active' AND lb.v3_lifecycle='active'),'[]'::json) AS labels,
      COALESCE((SELECT json_agg(json_build_object('id',c.id,'name',a.full_name,'full_name',a.full_name,'email',a.email,'country',a.country,'lifecycle',c.lifecycle,'user_id',c.user_id,'application_id',c.application_id,'private_profile',c.private_profile,'preferred_name',cp.preferred_name,'contact_email',cp.contact_email,'contact_phone',cp.contact_phone))
        FROM v3_creator_performer_links cl JOIN v3_creator_records c ON c.id=cl.creator_id JOIN performer_applications a ON a.id=c.application_id
        LEFT JOIN v3_creator_profiles cp ON cp.creator_id=c.id WHERE cl.performer_legacy_id=p.legacy_id),'[]'::json) AS creators,
      COALESCE((SELECT json_agg(json_build_object('user_id',linked.user_id,'email',linked.email,'username',linked.username,'role',linked.role,'account_status',linked.account_status,'must_change_password',linked.must_change_password,'last_login_at',linked.last_login_at,'password_status',CASE WHEN linked.must_change_password THEN 'temporary' ELSE 'changed' END,'source',linked.source)) FROM (
        SELECT u.id AS user_id,u.email,u.username,u.role,u.account_status,u.must_change_password,u.last_login_at,'direct'::text AS source
        FROM v3_performer_user_links ul JOIN app_users u ON u.id=ul.user_id
        WHERE ul.performer_legacy_id=p.legacy_id
        UNION
        SELECT u.id AS user_id,u.email,u.username,u.role,u.account_status,u.must_change_password,u.last_login_at,'creator'::text AS source
        FROM v3_creator_performer_links cl JOIN v3_creator_records c ON c.id=cl.creator_id JOIN app_users u ON u.id=c.user_id
        WHERE cl.performer_legacy_id=p.legacy_id AND c.user_id IS NOT NULL
      ) linked),'[]'::json) AS users,
      COALESCE((SELECT iv.status FROM v3_creator_performer_links cl JOIN v3_creator_identity_verifications iv ON iv.creator_id=cl.creator_id WHERE cl.performer_legacy_id=p.legacy_id ORDER BY iv.updated_at DESC LIMIT 1),'not_started') AS kyc_status
      FROM catalog_performers p WHERE p.legacy_id=$1`, [id]);
    if (!performer.rowCount) throw new HttpError(404, 'PERFORMER_NOT_FOUND', 'Performer was not found.');
    const [videos, productions, earnings, contracts, audit] = await Promise.all([
      this.db.query(`SELECT v.legacy_id,v.title,v.slug,v.status,v.v3_lifecycle,x.role_name,x.display_order FROM catalog_video_performers x JOIN catalog_videos v ON v.legacy_id=x.video_legacy_id WHERE x.performer_legacy_id=$1 ORDER BY v.release_date DESC NULLS LAST,v.imported_at DESC`, [id]),
      this.db.query(`SELECT DISTINCT p.id,p.title,p.reference,p.status,p.updated_at FROM v3_production_participant_assignments pa JOIN v3_productions p ON p.id=pa.production_id WHERE pa.performer_legacy_id=$1 ORDER BY p.updated_at DESC LIMIT 30`, [id]),
      this.db.query(`SELECT id,event_type,source_type,performer_amount_minor,original_currency,settlement_period_start,settlement_period_end,created_at FROM v3_earnings_ledger WHERE performer_legacy_id=$1 ORDER BY created_at DESC LIMIT 30`, [id]),
      this.db.query(`SELECT i.id,i.contract_number,i.status,i.creator_id,i.creator_legal_name,i.performer_name,i.issued_at,i.viewed_at,i.signed_at,i.source,t.title,t.contract_type,v.version
        FROM v3_contract_instances i
        LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id
        LEFT JOIN v3_contract_templates t ON t.id=v.template_id
        WHERE i.performer_legacy_id=$1 OR EXISTS (SELECT 1 FROM v3_creator_performer_links l WHERE l.performer_legacy_id=$1 AND l.creator_id=i.creator_id)
        ORDER BY i.issued_at DESC NULLS LAST LIMIT 50`, [id]),
      this.db.query(`SELECT id,action,before_summary,after_summary,created_at FROM v3_audit_events WHERE entity_type='performer' AND entity_id=$1 ORDER BY created_at DESC LIMIT 50`, [id])
    ]);
    return { performer: performer.rows[0], videos: videos.rows, productions: productions.rows, earnings: earnings.rows, contracts: contracts.rows, audit: audit.rows };
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

  async accountOptions(q = '') {
    const term = String(q || '').trim();
    const result = await this.db.query(`SELECT id,email,role,account_status,created_at
      FROM app_users
      WHERE role='performer' AND ($1='' OR email ILIKE $2)
      ORDER BY email LIMIT 50`, [term, `%${term}%`]);
    return { records: result.rows };
  }

  async prepareWorkspace(id, input, actor, request) {
    const performer = await this.db.query('SELECT legacy_id,display_name FROM catalog_performers WHERE legacy_id=$1', [id]);
    if (!performer.rowCount) throw new HttpError(404, 'PERFORMER_NOT_FOUND', 'Performer was not found.');
    const existing = await this.db.query(`SELECT c.id FROM v3_creator_records c
      JOIN v3_creator_performer_links l ON l.creator_id=c.id WHERE l.performer_legacy_id=$1 LIMIT 1`, [id]);
    if (existing.rowCount) throw new HttpError(409, 'PERFORMER_WORKSPACE_EXISTS', 'A private performer workspace is already linked.');
    const fullName = text(input.full_name || performer.rows[0].display_name, 180);
    const email = normalizedEmail(input.email);
    const country = text(input.country, 120);
    if (!fullName || !email || !country) throw new HttpError(422, 'PRIVATE_IDENTITY_REQUIRED', 'Full name, private email and country are required to prepare a workspace.');
    const client = await this.db.connect();
    let creatorId;
    try {
      await client.query('BEGIN');
      const application = await client.query(`INSERT INTO performer_applications
        (full_name,email,country,age_confirmed,consent_confirmed,answers,status,idempotency_key,continuation_token_hash,continuation_expires_at,admin_notes)
        VALUES($1,$2,$3,false,false,$4,'draft',$5,$6,now() + interval '10 years',$7) RETURNING id`, [
        fullName, email, country,
        { origin: 'v3_manual_performer_workspace', performer_legacy_id: id },
        `v3-manual-${id}-${crypto.randomUUID()}`,
        crypto.createHash('sha256').update(crypto.randomUUID()).digest('hex'),
        { source: 'admin_provisioned', note: 'Private workspace prepared by Admin; age/consent/compliance remain incomplete until reviewed.' }
      ]);
      const profile = await client.query(`INSERT INTO performer_profiles(application_id,status) VALUES($1,'pending_contract') RETURNING id`, [application.rows[0].id]);
      const created = await client.query(`INSERT INTO v3_creator_records(application_id,performer_profile_id,lifecycle,private_profile)
        VALUES($1,$2,'onboarding',$3) RETURNING id`, [application.rows[0].id, profile.rows[0].id, privateProfile({ legal_name: fullName, address: input.address || {} })]);
      creatorId = created.rows[0].id;
      for (const requirement of ['profile', 'private_upload', 'contract', 'account_link']) {
        await client.query(`INSERT INTO v3_creator_onboarding_items(creator_id,requirement_key,state,note)
          VALUES($1,$2,'incomplete','Prepared from Admin Performer Operations; evidence is still required.')`, [creatorId, requirement]);
      }
      await client.query(`INSERT INTO v3_creator_profiles(creator_id,preferred_name,contact_email,contact_phone)
        VALUES($1,$2,$3,$4)`, [creatorId, performer.rows[0].display_name, email, text(input.contact_phone, 80)]);
      await client.query(`INSERT INTO v3_creator_performer_links(creator_id,performer_legacy_id,linked_by) VALUES($1,$2,$3)`, [creatorId, id, actor.id]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
    await this.audit(actor, 'performer.workspace.prepared', id, null, { creator_id: creatorId, private_fields: ['full_name', 'email', 'country', 'address'] }, request);
    return this.detail(id);
  }

  async updateWorkspace(id, input, actor, request) {
    const current = await this.db.query(`SELECT c.id,c.private_profile,c.application_id,a.full_name,a.email,a.country
      FROM v3_creator_records c JOIN v3_creator_performer_links l ON l.creator_id=c.id
      JOIN performer_applications a ON a.id=c.application_id WHERE l.performer_legacy_id=$1 ORDER BY c.updated_at DESC LIMIT 1`, [id]);
    if (!current.rowCount) throw new HttpError(404, 'PERFORMER_WORKSPACE_NOT_FOUND', 'Prepare a private performer workspace before editing private identity data.');
    const row = current.rows[0];
    const nextName = Object.hasOwn(input, 'full_name') ? text(input.full_name, 180) : row.full_name;
    const nextEmail = Object.hasOwn(input, 'email') ? normalizedEmail(input.email) : row.email;
    const nextCountry = Object.hasOwn(input, 'country') ? text(input.country, 120) : row.country;
    if (!nextName || !nextEmail || !nextCountry) throw new HttpError(422, 'PRIVATE_IDENTITY_REQUIRED', 'Full name, private email and country are required.');
    const nextPrivate = privateProfile(input, row.private_profile);
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE performer_applications SET full_name=$1,email=$2,country=$3,updated_at=now() WHERE id=$4', [nextName, nextEmail, nextCountry, row.application_id]);
      await client.query('UPDATE v3_creator_records SET private_profile=$1,updated_at=now() WHERE id=$2', [nextPrivate, row.id]);
      if (Object.hasOwn(input, 'contact_phone')) await client.query(`INSERT INTO v3_creator_profiles(creator_id,contact_phone,updated_at) VALUES($1,$2,now())
        ON CONFLICT(creator_id) DO UPDATE SET contact_phone=EXCLUDED.contact_phone,updated_at=now()`, [row.id, text(input.contact_phone, 80)]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    const after = await this.detail(id);
    await this.audit(actor, 'performer.workspace.updated', id, { creator_id: row.id }, { creator_id: row.id, private_fields: ['full_name', 'email', 'country', 'address'] }, request);
    return after;
  }

  async linkCreator(id, creatorId, actor, request) {
    const performer = await this.db.query('SELECT legacy_id FROM catalog_performers WHERE legacy_id=$1', [id]);
    if (!performer.rowCount) throw new HttpError(404, 'PERFORMER_NOT_FOUND', 'Performer was not found.');
    const creator = await this.db.query('SELECT id FROM v3_creator_records WHERE id=$1', [creatorId]);
    if (!creator.rowCount) throw new HttpError(404, 'CREATOR_NOT_FOUND', 'Creator was not found.');
    await this.db.query(`INSERT INTO v3_creator_performer_links(creator_id,performer_legacy_id,linked_by)
      VALUES($1,$2,$3) ON CONFLICT(creator_id,performer_legacy_id) DO NOTHING`, [creatorId, id, actor.id]);
    await this.audit(actor, 'performer.creator.linked', id, null, { creator_id: creatorId }, request);
    return this.detail(id);
  }

  async linkAccount(id, userId, actor, request) {
    const linked = await this.db.query(`SELECT c.id FROM v3_creator_records c JOIN v3_creator_performer_links l ON l.creator_id=c.id
      WHERE l.performer_legacy_id=$1 ORDER BY c.updated_at DESC LIMIT 1`, [id]);
    if (!linked.rowCount) throw new HttpError(409, 'PERFORMER_WORKSPACE_REQUIRED', 'Prepare or link a private performer workspace first.');
    const account = await this.db.query(`SELECT id,email,role,account_status FROM app_users WHERE id=$1 AND role='performer'`, [userId]);
    if (!account.rowCount) throw new HttpError(422, 'PERFORMER_ACCOUNT_REQUIRED', 'Select an existing performer-compatible account.');
    if (account.rows[0].account_status !== 'active') throw new HttpError(409, 'PERFORMER_ACCOUNT_INACTIVE', 'Only an active performer account can enter the Performer Portal.');
    const conflict = await this.db.query('SELECT id FROM v3_creator_records WHERE user_id=$1 AND id<>$2', [userId, linked.rows[0].id]);
    if (conflict.rowCount) throw new HttpError(409, 'ACCOUNT_ALREADY_LINKED', 'This account is already linked to another Creator record.');
    await this.db.query('UPDATE v3_creator_records SET user_id=$1,lifecycle=CASE WHEN lifecycle=\'onboarding\' THEN lifecycle ELSE lifecycle END,updated_at=now() WHERE id=$2', [userId, linked.rows[0].id]);
    await this.db.query('UPDATE performer_profiles SET user_id=$1 WHERE application_id=(SELECT application_id FROM v3_creator_records WHERE id=$2)', [userId, linked.rows[0].id]);
    await this.db.query(`UPDATE v3_creator_onboarding_items SET state='complete',reviewed_by=$1,reviewed_at=now(),updated_at=now() WHERE creator_id=$2 AND requirement_key='account_link'`, [actor.id, linked.rows[0].id]);
    await this.db.query(`INSERT INTO v3_performer_user_links(performer_legacy_id,user_id,linked_by) VALUES($1,$2,$3)
      ON CONFLICT(performer_legacy_id) DO UPDATE SET user_id=EXCLUDED.user_id,linked_by=EXCLUDED.linked_by,updated_at=now()`, [id, userId, actor.id]);
    await this.audit(actor, 'performer.account.linked', id, null, { creator_id: linked.rows[0].id, user_id: userId }, request);
    return this.detail(id);
  }

  async replaceVideos(id, videoIds, actor, request) {
    if (!Array.isArray(videoIds) || !videoIds.every(value => typeof value === 'string')) throw new HttpError(422, 'INVALID_VIDEO_RELATIONSHIPS', 'video_ids must be an array of video identifiers.');
    const ids = [...new Set(videoIds.map(value => value.trim()).filter(Boolean))].slice(0, 200);
    const performer = await this.db.query('SELECT legacy_id FROM catalog_performers WHERE legacy_id=$1', [id]);
    if (!performer.rowCount) throw new HttpError(404, 'PERFORMER_NOT_FOUND', 'Performer was not found.');
    if (ids.length) {
      const videos = await this.db.query('SELECT legacy_id FROM catalog_videos WHERE legacy_id=ANY($1::text[])', [ids]);
      if (videos.rowCount !== ids.length) throw new HttpError(422, 'VIDEO_NOT_FOUND', 'One or more selected catalogue videos do not exist.');
    }
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM catalog_video_performers WHERE performer_legacy_id=$1 AND NOT (video_legacy_id=ANY($2::text[]))', [id, ids]);
      for (let index = 0; index < ids.length; index++) await client.query(`INSERT INTO catalog_video_performers(video_legacy_id,performer_legacy_id,display_order)
        VALUES($1,$2,$3) ON CONFLICT(video_legacy_id,performer_legacy_id) DO UPDATE SET display_order=EXCLUDED.display_order`, [ids[index], id, index]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    const after = await this.detail(id);
    await this.audit(actor, 'performer.videos.replaced', id, null, { video_ids: ids }, request);
    return after;
  }
}
