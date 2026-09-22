import crypto from 'node:crypto';
import { HttpError } from './errors.js';
import { RecruitingService } from './recruiting.js';

export const creatorLifecycle = new Set(['onboarding','active','inactive','blocked']);
export const applicationReviewStates = new Set(['submitted','under_review','needs_information','rejected','approved','withdrawn']);
export const creatorOnboardingStates = new Set(['complete','incomplete','needs_review','blocked']);
export const creatorDocumentStates = new Set(['needs_review','accepted','rejected']);
const slug = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const page = value => Math.max(1, Number.parseInt(value, 10) || 1);
const limit = value => Math.min(100, Math.max(1, Number.parseInt(value, 10) || 24));
export const applicationTransitions = {
  draft: new Set(['submitted','withdrawn']),
  submitted: new Set(['under_review','needs_information','withdrawn']),
  under_review: new Set(['needs_information','approved','rejected','withdrawn']),
  needs_information: new Set(['under_review','withdrawn']),
  approved: new Set(),
  rejected: new Set(['under_review','withdrawn']),
  withdrawn: new Set()
};

export function publicDocument(row) {
  const { object_key, upload_session_hash, etag, storage_reference, ...safe } = row;
  return safe;
}

export function assertCreatorOwner(actor, record) {
  if (actor?.role !== 'performer' || actor.id !== record.user_id) throw new HttpError(403, 'FORBIDDEN', 'Creator records are private.');
}

export class V3CreatorService {
  constructor(db, blob = null) { this.db = db; this.blob = blob; }

  async audit(user, action, entityType, entityId, before = null, after = null) {
    await this.db.query(
      'INSERT INTO v3_audit_events(actor_id,action,entity_type,entity_id,before_summary,after_summary) VALUES($1,$2,$3,$4,$5,$6)',
      [user.id, action, entityType, String(entityId), before, after]
    );
  }

  async overview() {
    const result = await this.db.query(`SELECT
      (SELECT count(*)::int FROM performer_applications WHERE status IN ('submitted','under_review')) AS awaiting_review,
      (SELECT count(*)::int FROM performer_applications WHERE status='approved') AS approved_unconverted,
      (SELECT count(*)::int FROM v3_creator_records WHERE lifecycle='onboarding') AS onboarding_incomplete,
      (SELECT count(*)::int FROM v3_creator_documents WHERE review_state='needs_review') AS documents_needing_review,
      (SELECT count(*)::int FROM v3_contract_instances WHERE status='signed') AS signed_contracts,
      (SELECT count(*)::int FROM v3_creator_records WHERE lifecycle='active') AS active_creators`);
    return { metrics: result.rows[0] };
  }

  async applications({ status, q, page: rawPage, limit: rawLimit } = {}) {
    const values = []; const where = [];
    if (status) { values.push(status); where.push(`a.status=$${values.length}`); }
    if (q) { values.push(`%${String(q).trim()}%`); where.push(`(a.full_name ILIKE $${values.length} OR a.email ILIKE $${values.length})`); }
    const p = page(rawPage), l = limit(rawLimit), offset = (p - 1) * l;
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = await this.db.query(`SELECT count(*)::int FROM performer_applications a ${clause}`, values);
    values.push(l, offset);
    const rows = await this.db.query(`SELECT a.id,a.full_name,a.email,a.country,a.status,a.answers->>'recruitment_campaign_id' AS campaign_id,a.created_at,a.updated_at,c.id AS creator_id,c.lifecycle
      FROM performer_applications a LEFT JOIN v3_creator_records c ON c.application_id=a.id ${clause}
      ORDER BY a.created_at DESC,a.id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: rows.rows, page: p, limit: l, total: total.rows[0].count };
  }

  async application(id) {
    const result = await this.db.query(`SELECT a.id,a.full_name,a.email,a.country,a.age_confirmed,a.consent_confirmed,a.answers,a.status,a.admin_notes,a.created_at,a.updated_at,
      c.id AS creator_id,c.lifecycle,c.user_id,c.private_profile,
      p.id AS performer_profile_id,p.status AS performer_profile_status
      FROM performer_applications a
      LEFT JOIN v3_creator_records c ON c.application_id=a.id
      LEFT JOIN performer_profiles p ON p.application_id=a.id
      WHERE a.id=$1`, [id]);
    if (!result.rowCount) throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application was not found.');
    const application = result.rows[0];
    const [uploads, contract, links, history] = await Promise.all([
      this.db.query(`SELECT d.id,d.document_type,d.classification,d.review_state,d.reviewed_at,d.expires_at,d.note,d.created_at,u.id AS upload_id,u.file_name,u.content_type,u.byte_size,u.status AS upload_status,u.confirmed_at
        FROM application_uploads u LEFT JOIN v3_creator_documents d ON d.application_upload_id=u.id WHERE u.application_id=$1 ORDER BY u.created_at`, [id]),
      this.db.query(`SELECT i.id,i.status,i.contract_number,i.issued_at,i.viewed_at,i.signed_at,v.version,t.title FROM v3_contract_instances i JOIN v3_creator_records c ON c.id=i.creator_id LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id WHERE c.application_id=$1 ORDER BY i.issued_at DESC LIMIT 1`, [id]),
      this.db.query(`SELECT l.performer_legacy_id,p.display_name,p.slug,l.linked_at FROM v3_creator_performer_links l JOIN v3_creator_records c ON c.id=l.creator_id JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id WHERE c.application_id=$1`, [id]),
      this.history('creator.application', id)
    ]);
    return { application, documents: uploads.rows.map(publicDocument), contract: contract.rows[0] || null, performers: links.rows, history };
  }

  async updateApplication(id, input, user) {
    const before = await this.application(id);
    const data = {};
    if (Object.hasOwn(input, 'status')) {
      if (!applicationReviewStates.has(input.status)) throw new HttpError(422, 'INVALID_REVIEW_STATUS', 'This review state is not supported.');
      if (!(applicationTransitions[before.application.status] || new Set()).has(input.status)) throw new HttpError(409, 'INVALID_REVIEW_TRANSITION', `Cannot move an application from ${before.application.status} to ${input.status}.`);
      data.status = input.status;
    }
    if (Object.hasOwn(input, 'admin_notes')) data.admin_notes = input.admin_notes && typeof input.admin_notes === 'object' ? input.admin_notes : null;
    if (!Object.keys(data).length) throw new HttpError(422, 'INVALID_INPUT', 'No allowed review field supplied.');
    const keys = Object.keys(data);
    const result = await this.db.query(`UPDATE performer_applications SET ${keys.map((key, index) => `${key}=$${index + 1}`).join(',')},updated_at=now() WHERE id=$${keys.length + 1} RETURNING id,status,updated_at`, [...keys.map(key => data[key]), id]);
    if (!result.rowCount) throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application was not found.');
    await this.audit(user, 'creator.application.review', 'creator.application', id, { status: before.application.status }, result.rows[0]);
    return result.rows[0];
  }

  async linkAccount(applicationId, performerUserId, user) {
    const recruiting = new RecruitingService(this.db, { });
    const assigned = await recruiting.assignPerformer(applicationId, performerUserId);
    const profile = await this.db.query('SELECT id,user_id FROM performer_profiles WHERE application_id=$1', [applicationId]);
    if (!profile.rowCount) throw new HttpError(404, 'PERFORMER_PROFILE_NOT_FOUND', 'The performer profile was not found.');
    const updated = await this.db.query(`UPDATE v3_creator_records SET user_id=$1,updated_at=now() WHERE application_id=$2 RETURNING id`, [profile.rows[0].user_id, applicationId]);
    if (!updated.rowCount) throw new HttpError(409, 'CREATOR_NOT_CONVERTED', 'Convert the approved application before linking its account.');
    await this.db.query(`UPDATE v3_creator_onboarding_items SET state='complete',reviewed_by=$1,reviewed_at=now(),updated_at=now() WHERE creator_id=$2 AND requirement_key='account_link'`, [user.id, updated.rows[0].id]);
    await this.audit(user, 'creator.identity.link', 'creator.application', applicationId, null, { creator_id: updated.rows[0].id, performer_user_id: performerUserId });
    return { ...assigned, creator_id: updated.rows[0].id };
  }

  async ensureCreator(applicationId, user) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const app = await client.query('SELECT id,status FROM performer_applications WHERE id=$1 FOR UPDATE', [applicationId]);
      if (!app.rowCount) throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application was not found.');
      if (app.rows[0].status !== 'approved') throw new HttpError(409, 'APPLICATION_NOT_APPROVED', 'Approve the application before creating a creator record.');
      await client.query(`INSERT INTO performer_profiles(application_id,status) VALUES($1,'pending_contract') ON CONFLICT(application_id) DO NOTHING`, [applicationId]);
      const created = await client.query(`INSERT INTO v3_creator_records(application_id,performer_profile_id)
        SELECT p.application_id,p.id FROM performer_profiles p WHERE p.application_id=$1
        ON CONFLICT(application_id) DO UPDATE SET performer_profile_id=EXCLUDED.performer_profile_id,updated_at=now() RETURNING *`, [applicationId]);
      const creator = created.rows[0];
      for (const requirement of ['profile','private_upload','contract','account_link']) await client.query(`INSERT INTO v3_creator_onboarding_items(creator_id,requirement_key,state) VALUES($1,$2,'incomplete') ON CONFLICT(creator_id,requirement_key) DO NOTHING`, [creator.id, requirement]);
      await client.query('COMMIT');
      await this.audit(user, 'creator.record.ensure', 'creator.application', applicationId, null, { creator_id: creator.id });
      return creator;
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async linkPerformer(applicationId, input, user) {
    const creator = await this.ensureCreator(applicationId, user);
    let performerId = String(input.performer_legacy_id || '');
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      if (input.create_performer) {
        const name = String(input.display_name || '').trim(); const performerSlug = slug(input.slug || name);
        if (!name || !performerSlug) throw new HttpError(422, 'PERFORMER_REQUIRED', 'A performer name and slug are required.');
        const existing = await client.query('SELECT legacy_id FROM catalog_performers WHERE slug=$1 OR lower(display_name)=lower($2)', [performerSlug, name]);
        if (existing.rowCount) throw new HttpError(409, 'POSSIBLE_DUPLICATE', 'A matching catalogue performer already exists; link that record instead.');
        performerId = `v3:${crypto.randomUUID()}`;
        await client.query(`INSERT INTO catalog_performers(legacy_id,display_name,slug,status,source_payload,v3_lifecycle) VALUES($1,$2,$3,'pending',$4,'draft')`, [performerId, name, performerSlug, { v3_created_from_application: applicationId }]);
      }
      const found = await client.query('SELECT legacy_id FROM catalog_performers WHERE legacy_id=$1', [performerId]);
      if (!found.rowCount) throw new HttpError(422, 'PERFORMER_NOT_FOUND', 'The requested performer does not exist.');
      await client.query(`INSERT INTO v3_creator_performer_links(creator_id,performer_legacy_id,linked_by) VALUES($1,$2,$3) ON CONFLICT(creator_id,performer_legacy_id) DO NOTHING`, [creator.id, performerId, user.id]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    await this.audit(user, 'creator.performer.link', 'creator.application', applicationId, null, { performer_legacy_id: performerId });
    return this.application(applicationId);
  }

  async creators({ q, page: rawPage, limit: rawLimit } = {}) {
    const p = page(rawPage), l = limit(rawLimit), offset = (p - 1) * l; const values = [];
    const filter = q ? `WHERE a.full_name ILIKE $1 OR a.email ILIKE $1` : '';
    if (q) values.push(`%${String(q).trim()}%`);
    const total = await this.db.query(`SELECT count(*)::int FROM v3_creator_records c JOIN performer_applications a ON a.id=c.application_id ${filter}`, values);
    values.push(l, offset);
    const rows = await this.db.query(`SELECT c.id,c.lifecycle,c.user_id,c.created_at,c.updated_at,a.full_name,a.email,a.country,a.status AS application_status,
      count(DISTINCT l.performer_legacy_id)::int performer_count,
      count(DISTINCT oi.id) FILTER (WHERE oi.state<>'complete')::int onboarding_open
      FROM v3_creator_records c JOIN performer_applications a ON a.id=c.application_id
      LEFT JOIN v3_creator_performer_links l ON l.creator_id=c.id LEFT JOIN v3_creator_onboarding_items oi ON oi.creator_id=c.id
      ${filter} GROUP BY c.id,a.id ORDER BY c.updated_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: rows.rows, page: p, limit: l, total: total.rows[0].count };
  }

  async creator(id, { actor, self = false } = {}) {
    const result = await this.db.query(`SELECT c.id,c.application_id,c.performer_profile_id,c.user_id,c.lifecycle,c.private_profile,c.created_at,c.updated_at,a.full_name,a.email,a.country,a.status AS application_status
      FROM v3_creator_records c JOIN performer_applications a ON a.id=c.application_id WHERE c.id=$1`, [id]);
    if (!result.rowCount) throw new HttpError(404, 'CREATOR_NOT_FOUND', 'Creator was not found.');
    const record = result.rows[0];
    if (self) assertCreatorOwner(actor, record);
    const [items, docs, contracts, performers, videos, notifications, history, profile] = await Promise.all([
      this.db.query('SELECT id,requirement_key,state,note,reviewed_at,updated_at FROM v3_creator_onboarding_items WHERE creator_id=$1 ORDER BY requirement_key', [id]),
      this.db.query(`SELECT d.id,d.document_type,d.classification,d.review_state,d.reviewed_at,d.expires_at,d.note,d.version,d.created_at,u.file_name,u.content_type,u.byte_size,u.status AS upload_status,u.confirmed_at
        FROM v3_creator_documents d JOIN application_uploads u ON u.id=d.application_upload_id WHERE d.creator_id=$1 ORDER BY d.created_at DESC`, [id]),
      this.db.query(`SELECT i.id,i.contract_number,i.status,i.creator_legal_name,i.performer_name,i.issued_at,i.viewed_at,i.signed_at,i.source,i.snapshot_hash,t.title,t.contract_type,v.version
        FROM v3_contract_instances i LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id
        WHERE i.creator_id=$1 ORDER BY i.issued_at DESC`, [id]),
      this.db.query('SELECT l.performer_legacy_id,p.display_name,p.slug,p.status FROM v3_creator_performer_links l JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id WHERE l.creator_id=$1 ORDER BY p.display_name', [id]),
      this.db.query(`SELECT DISTINCT v.legacy_id,v.title,v.slug,v.status,v.v3_lifecycle,v.legacy_thumbnail_url FROM v3_creator_performer_links l JOIN catalog_video_performers x ON x.performer_legacy_id=l.performer_legacy_id JOIN catalog_videos v ON v.legacy_id=x.video_legacy_id WHERE l.creator_id=$1 ORDER BY v.title`, [id]),
      this.db.query('SELECT id,kind,title,body,action_path,read_at,created_at FROM v3_creator_notifications WHERE creator_id=$1 ORDER BY created_at DESC LIMIT 20', [id]),
      self ? Promise.resolve({ rows: [] }) : this.history('creator.record', id),
      this.db.query('SELECT preferred_name,contact_email,contact_phone,locale,timezone,notification_preferences,updated_at FROM v3_creator_profiles WHERE creator_id=$1', [id])
    ]);
    const safeRecord = self ? { id: record.id, application_id: record.application_id, lifecycle: record.lifecycle, private_profile: record.private_profile, full_name: record.full_name, country: record.country, created_at: record.created_at } : record;
    return { creator: safeRecord, profile: profile.rows[0] || {}, onboarding: items.rows, documents: docs.rows.map(publicDocument), contracts: contracts.rows, performers: performers.rows, videos: videos.rows, notifications: notifications.rows, actions: notifications.rows.filter(item => item.action_state === 'open'), history };
  }

  async updateCreator(id, input, user, { self = false } = {}) {
    const current = await this.creator(id, { actor: user, self });
    if (self && current.creator.id !== id) throw new HttpError(403, 'FORBIDDEN', 'Creator records are private.');
    const profile = input.private_profile && typeof input.private_profile === 'object' && !Array.isArray(input.private_profile) ? input.private_profile : current.creator.private_profile;
    const nextLifecycle = input.lifecycle || current.creator.lifecycle;
    if (!creatorLifecycle.has(nextLifecycle)) throw new HttpError(422, 'INVALID_LIFECYCLE', 'Invalid creator lifecycle.');
    if (self && input.lifecycle) throw new HttpError(403, 'FORBIDDEN', 'Creators cannot change their own operational lifecycle.');
    const result = await this.db.query(`UPDATE v3_creator_records SET private_profile=$1,lifecycle=$2,updated_at=now() WHERE id=$3 RETURNING id,lifecycle,private_profile,updated_at`, [profile, nextLifecycle, id]);
    await this.audit(user, 'creator.profile.update', 'creator.record', id, { lifecycle: current.creator.lifecycle }, result.rows[0]);
    return result.rows[0];
  }

  async updateProfile(id, input, user, { self = false } = {}) {
    const current = await this.creator(id, { actor: user, self });
    const allowed = ['preferred_name','contact_email','contact_phone','locale','timezone','notification_preferences'];
    const values = Object.fromEntries(allowed.filter(key => Object.hasOwn(input, key)).map(key => [key, input[key]]));
    if (values.contact_email && !/^\S+@\S+\.\S+$/.test(String(values.contact_email))) throw new HttpError(422, 'INVALID_CONTACT_EMAIL', 'A valid contact email is required.');
    if (!Object.keys(values).length) throw new HttpError(422, 'INVALID_INPUT', 'No profile fields supplied.');
    const keys = Object.keys(values), args = [id, ...keys.map(key => values[key]), user.id];
    const result = await this.db.query(`INSERT INTO v3_creator_profiles(creator_id,${keys.join(',')},updated_at) VALUES($1,${keys.map((_,i)=>`$${i+2}`).join(',')},now()) ON CONFLICT(creator_id) DO UPDATE SET ${keys.map((key,i)=>`${key}=$${i+2}`).join(',')},updated_at=now() RETURNING *`, args.slice(0, -1));
    if (values.preferred_name || values.contact_email || values.locale || values.timezone) await this.db.query(`UPDATE v3_creator_onboarding_items SET state='complete',updated_at=now() WHERE creator_id=$1 AND requirement_key='profile'`, [id]);
    await this.audit(user, 'creator.profile.structured_update', 'creator.record', id, current.profile || {}, result.rows[0]);
    return result.rows[0];
  }

  async updateSettings(id, input, user) {
    const current = await this.creator(id, { actor: user, self: true });
    const preferences = input.notification_preferences && typeof input.notification_preferences === 'object' ? input.notification_preferences : current.profile?.notification_preferences || {};
    const result = await this.db.query('UPDATE v3_creator_profiles SET notification_preferences=$1,updated_at=now() WHERE creator_id=$2 RETURNING notification_preferences,updated_at', [preferences, id]);
    if (!result.rowCount) throw new HttpError(404, 'CREATOR_PROFILE_NOT_FOUND', 'Creator profile is not initialized.');
    await this.audit(user, 'creator.settings.update', 'creator.record', id, current.profile || {}, result.rows[0]);
    return result.rows[0];
  }

  async actions(id, user) {
    const current = await this.creator(id, { actor: user, self: true });
    return { records: current.actions || [] };
  }

  async historyForCreator(id, user) {
    await this.creator(id, { actor: user, self: true });
    return { records: await this.history('creator.record', id) };
  }

  async issueDocumentUpload(id, input, user) {
    const current = await this.creator(id, { actor: user, self: true });
    if (!this.blob) throw new HttpError(503, 'PRIVATE_UPLOAD_UNAVAILABLE', 'Private document storage is not configured.');
    const name = String(input.name || '').trim(); const contentType = String(input.content_type || '').trim(); const byteSize = Number(input.byte_size);
    const allowed = new Set(['image/jpeg','image/png','image/webp','application/pdf']);
    if (!name || !allowed.has(contentType) || !Number.isFinite(byteSize) || byteSize <= 0 || byteSize > 50 * 1024 * 1024) throw new HttpError(422, 'INVALID_DOCUMENT_UPLOAD', 'Document metadata is invalid.');
    const token = crypto.randomBytes(32).toString('base64url'); const hash = crypto.createHash('sha256').update(token).digest('hex'); const objectKey = `creators/private/${id}/${crypto.randomUUID()}`;
    const row = await this.db.query(`INSERT INTO application_uploads(application_id,upload_session_hash,object_key,file_name,content_type,byte_size,status,write_expires_at) VALUES($1,$2,$3,$4,$5,$6,'issued',now()+interval '15 minutes') RETURNING id`, [current.creator.application_id, hash, objectKey, name, contentType, byteSize]);
    try { return { upload_id: row.rows[0].id, upload_url: await this.blob.issueWriteUrl(objectKey, contentType), expires_in_seconds: 900 }; } catch (error) { await this.db.query('DELETE FROM application_uploads WHERE id=$1 AND status=\'issued\'', [row.rows[0].id]); throw new HttpError(503, 'PRIVATE_UPLOAD_UNAVAILABLE', 'Private document storage is not currently available.'); }
  }

  async confirmDocumentUpload(id, uploadId, input, user) {
    const current = await this.creator(id, { actor: user, self: true });
    const found = await this.db.query('SELECT * FROM application_uploads WHERE id=$1 AND application_id=$2 FOR UPDATE', [uploadId, current.creator.application_id]);
    if (!found.rowCount) throw new HttpError(404, 'DOCUMENT_UPLOAD_NOT_FOUND', 'Document upload was not found.');
    const upload = found.rows[0]; if (upload.status !== 'confirmed') { const metadata = this.blob ? await this.blob.verifyObject(upload.object_key) : null; if (!metadata || metadata.byteSize !== Number(upload.byte_size)) throw new HttpError(422, 'DOCUMENT_UPLOAD_NOT_PRESENT', 'The uploaded document cannot be verified.'); await this.db.query('UPDATE application_uploads SET status=\'confirmed\',confirmed_at=now(),etag=$2 WHERE id=$1', [upload.id, metadata.etag || null]); }
    const prior = await this.db.query('SELECT id,version FROM v3_creator_documents WHERE creator_id=$1 AND document_type=$2 ORDER BY version DESC LIMIT 1', [id, input.document_type || upload.content_type]);
    const version = (prior.rows[0]?.version || 0) + 1;
    const result = await this.db.query(`INSERT INTO v3_creator_documents(creator_id,application_upload_id,document_type,version,replaced_document_id) VALUES($1,$2,$3,$4,$5) RETURNING id,document_type,version,review_state,created_at`, [id, upload.id, input.document_type || upload.content_type, version, prior.rows[0]?.id || null]);
    await this.audit(user, 'creator.document.upload_confirmed', 'creator.record', id, null, { document_id: result.rows[0].id, document_type: result.rows[0].document_type, version });
    return result.rows[0];
  }

  async documentDownload(id, documentId, user) {
    const current = await this.creator(id, { actor: user, self: true });
    if (!this.blob?.issueReadUrl) throw new HttpError(503, 'PRIVATE_DOWNLOAD_UNAVAILABLE', 'Private document retrieval is not configured.');
    const result = await this.db.query(`SELECT d.id,u.object_key,u.file_name,u.content_type FROM v3_creator_documents d JOIN application_uploads u ON u.id=d.application_upload_id WHERE d.id=$1 AND d.creator_id=$2 AND u.status='confirmed'`, [documentId, current.creator.id]);
    if (!result.rowCount) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document was not found.');
    return { download_url: await this.blob.issueReadUrl(result.rows[0].object_key), expires_in_seconds: 300, file_name: result.rows[0].file_name, content_type: result.rows[0].content_type };
  }

  async updateOnboarding(creatorId, requirementKey, input, user) {
    if (!creatorOnboardingStates.has(input.state)) throw new HttpError(422, 'INVALID_ONBOARDING_STATE', 'Invalid onboarding state.');
    const result = await this.db.query(`UPDATE v3_creator_onboarding_items SET state=$1,note=$2,reviewed_by=$3,reviewed_at=now(),updated_at=now() WHERE creator_id=$4 AND requirement_key=$5 RETURNING *`, [input.state, input.note || null, user.id, creatorId, requirementKey]);
    if (!result.rowCount) throw new HttpError(404, 'ONBOARDING_ITEM_NOT_FOUND', 'Onboarding item was not found.');
    await this.audit(user, 'creator.onboarding.update', 'creator.record', creatorId, null, { requirement_key: requirementKey, state: input.state });
    return result.rows[0];
  }

  async reviewDocument(creatorId, documentId, input, user) {
    if (!creatorDocumentStates.has(input.review_state)) throw new HttpError(422, 'INVALID_DOCUMENT_STATE', 'Invalid document review state.');
    const result = await this.db.query(`UPDATE v3_creator_documents SET review_state=$1,note=$2,reviewer_id=$3,reviewed_at=now(),updated_at=now() WHERE id=$4 AND creator_id=$5 RETURNING id,review_state,note,reviewed_at`, [input.review_state, input.note || null, user.id, documentId, creatorId]);
    if (!result.rowCount) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document was not found.');
    await this.db.query(`UPDATE v3_creator_onboarding_items SET state=$1,note=$2,reviewed_by=$3,reviewed_at=now(),updated_at=now() WHERE creator_id=$4 AND requirement_key='private_upload'`, [input.review_state === 'accepted' ? 'complete' : input.review_state === 'rejected' ? 'blocked' : 'needs_review', input.note || null, user.id, creatorId]);
    await this.db.query(`INSERT INTO v3_creator_notifications(creator_id,kind,title,body,action_path) VALUES($1,'document_review',$2,$3,'/v3/creator/documents')`, [creatorId, input.review_state === 'accepted' ? 'Document accepted' : 'Document requires attention', input.note || `Your document review state is ${input.review_state}.`]);
    await this.audit(user, 'creator.document.review', 'creator.record', creatorId, null, result.rows[0]);
    return result.rows[0];
  }

  async creatorForUser(user) {
    if (user.role !== 'performer') throw new HttpError(403, 'FORBIDDEN', 'A creator account is required.');
    const result = await this.db.query('SELECT id FROM v3_creator_records WHERE user_id=$1', [user.id]);
    if (!result.rowCount) throw new HttpError(404, 'CREATOR_PROFILE_NOT_LINKED', 'This creator account is not linked to a V3 creator profile.');
    return this.creator(result.rows[0].id, { actor: user, self: true });
  }

  async history(type, id) {
    return (await this.db.query('SELECT action,entity_type,entity_id,before_summary,after_summary,created_at FROM v3_audit_events WHERE entity_type=$1 AND entity_id=$2 ORDER BY created_at DESC LIMIT 50', [type, String(id)])).rows;
  }
}
