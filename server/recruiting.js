import crypto from 'node:crypto';
import { HttpError } from './errors.js';

const tokenHash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const token = () => crypto.randomBytes(32).toString('base64url');
const publicText = (value, maximum = 4000) => String(value ?? '').trim().slice(0, maximum);
const publicApplicationReference = (id) => `FLA-${String(id || '').replace(/[^a-z0-9]/gi, '').slice(0, 12).toUpperCase()}`;
const publicContactMethods = new Set(['email', 'whatsapp', 'telegram']);
const publicExperiences = new Set(['new', 'content', 'live', 'studio', 'unsure']);
const publicInterests = new Set(['own_content', 'studio_productions', 'livecam', 'couple_application', 'undecided']);
const attributionText = (value, maximum = 160) => publicText(value, maximum).replace(/[\r\n]/g, ' ');
const normalizeWhatsappNumber = value => publicText(value, 40).replace(/[\s().-]/g, '');

export { publicApplicationReference };

export function validateApplication(input) {
  const required = ['full_name', 'email', 'country'];
  for (const field of required) if (!String(input[field] || '').trim()) throw new HttpError(422, 'VALIDATION_ERROR', `${field} is required`);
  if (!/^\S+@\S+\.\S+$/.test(input.email)) throw new HttpError(422, 'VALIDATION_ERROR', 'email is invalid');
  if (input.age_confirmed !== true || input.consent_confirmed !== true) {
    throw new HttpError(422, 'CONSENT_REQUIRED', 'Age and consent confirmation are required.');
  }
}

// A draft may exist before the final review consent has been collected. It is
// deliberately not approvable until final validation and completeness pass.
export function validateDraft(input) {
  const required = ['full_name', 'email', 'country'];
  for (const field of required) if (!String(input[field] || '').trim()) throw new HttpError(422, 'VALIDATION_ERROR', `${field} is required`);
  if (!/^\S+@\S+\.\S+$/.test(input.email)) throw new HttpError(422, 'VALIDATION_ERROR', 'email is invalid');
  if (input.age_confirmed !== true) throw new HttpError(422, 'AGE_CONFIRMATION_REQUIRED', 'Age confirmation is required before private material can be uploaded.');
}

export function normalizePublicApplication(input = {}) {
  const age = Number(input.age);
  const interests = Array.isArray(input.interests) ? [...new Set(input.interests.map(item => publicText(item, 40)))] : [];
  const profileLinks = Array.isArray(input.profile_links) ? input.profile_links.map(item => publicText(item, 300)).filter(Boolean).slice(0, 5) : [];
  const normalized = {
    full_name: publicText(input.full_name, 160),
    email: publicText(input.email, 240).toLowerCase(),
    country: publicText(input.country, 100),
    age,
    city: publicText(input.city, 120),
    experience_level: publicText(input.experience_level, 40),
    interests: interests.filter(item => publicInterests.has(item)),
    preferred_contact: publicText(input.preferred_contact, 30).toLowerCase(),
    whatsapp_number: normalizeWhatsappNumber(input.whatsapp_number),
    telegram: publicText(input.telegram, 120),
    profile_links: profileLinks,
    message: publicText(input.message, 3000),
    model_preference: publicText(input.model_preference, 80),
    attribution: {
      landing_page: attributionText(input.attribution?.landing_page, 240),
      utm_source: attributionText(input.attribution?.utm_source),
      utm_medium: attributionText(input.attribution?.utm_medium),
      utm_campaign: attributionText(input.attribution?.utm_campaign),
      utm_content: attributionText(input.attribution?.utm_content),
      referrer: attributionText(input.attribution?.referrer, 500)
    },
    age_confirmed: input.age_confirmed === true,
    adult_work_confirmed: input.adult_work_confirmed === true,
    privacy_confirmed: input.privacy_confirmed === true
  };
  if (!Number.isInteger(age) || age < 18 || age > 100) throw new HttpError(422, 'AGE_REQUIRED', 'You must be at least 18 years old to apply.');
  if (!normalized.city) throw new HttpError(422, 'CITY_REQUIRED', 'City is required.');
  if (!publicExperiences.has(normalized.experience_level)) throw new HttpError(422, 'EXPERIENCE_REQUIRED', 'Please select your experience level.');
  if (!normalized.interests.length) throw new HttpError(422, 'INTEREST_REQUIRED', 'Please select at least one area of interest.');
  if (!publicContactMethods.has(normalized.preferred_contact)) throw new HttpError(422, 'CONTACT_METHOD_REQUIRED', 'Please select a preferred contact method.');
  if (normalized.preferred_contact === 'whatsapp' && !/^\+[1-9]\d{7,14}$/.test(normalized.whatsapp_number)) throw new HttpError(422, 'WHATSAPP_REQUIRED', 'Please provide a WhatsApp number with country code.');
  if (!normalized.age_confirmed || !normalized.adult_work_confirmed || !normalized.privacy_confirmed) throw new HttpError(422, 'CONSENT_REQUIRED', 'Age, adult-work and privacy confirmations are required.');
  validateApplication({ ...normalized, consent_confirmed: true });
  return normalized;
}

export const uploadTypes = Object.freeze({
  photo: ['image/jpeg', 'image/png', 'image/webp'],
  intro_video: ['video/mp4', 'video/quicktime', 'video/webm'],
  hardcore_video: ['video/mp4', 'video/quicktime', 'video/webm'],
  id_document_front: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  id_document_back: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  selfie_with_id: ['image/jpeg', 'image/png', 'image/webp']
});

export const reviewStatuses = new Set(['under_review', 'rejected']);

export function isComplete(application, uploads = []) {
  return Boolean(application?.age_confirmed && application?.consent_confirmed && application?.full_name && application?.email && application?.country && uploads.some((item) => item.status === 'confirmed'));
}

export class RecruitingService {
  constructor(db, blob, config = {}) {
    this.db = db;
    this.blob = blob;
    this.config = config;
  }

  publicResult(application, notification, replay = false) {
    const reference = publicApplicationReference(application.id);
    const adminPath = `${this.config.adminOrigin || 'https://admin.fleshlab.online'}/v3/admin?section=Creators&applicationId=${encodeURIComponent(application.id)}`;
    const contactMessage = `Hi Eric, I've just submitted my FLESHLAB application.\nMy reference is ${reference}.`;
    const recipient = String(this.config.recruitingWhatsappRecipient || '886958679186').replace(/\D/g, '');
    return {
      application: { id: application.id, status: application.status, created_at: application.created_at, public_reference: reference },
      public_reference: reference,
      contact: { whatsapp_url: `https://wa.me/${recipient}?text=${encodeURIComponent(contactMessage)}`, message: contactMessage },
      notification: { channel: 'whatsapp', status: notification?.status || 'not_configured' },
      replay
    };
  }

  async createPublicApplication(input, idempotencyKey) {
    const normalized = normalizePublicApplication(input);
    if (!idempotencyKey || idempotencyKey.length < 16) throw new HttpError(400, 'IDEMPOTENCY_REQUIRED', 'A sufficiently random idempotency key is required.');
    const client = this.db.connect ? await this.db.connect() : this.db;
    const transaction = Boolean(this.db.connect);
    try {
      if (transaction) await client.query('BEGIN');
      const existing = await client.query('SELECT * FROM performer_applications WHERE idempotency_key=$1', [idempotencyKey]);
      if (existing.rowCount) {
        const notification = await client.query('SELECT status FROM v3_recruiting_notifications WHERE application_id=$1', [existing.rows[0].id]);
        if (transaction) await client.query('COMMIT');
        return this.publicResult(existing.rows[0], notification.rows[0], true);
      }
      const answers = {
        source: 'public_performer_application',
        city: normalized.city,
        age: normalized.age,
        experience_level: normalized.experience_level,
        interests: normalized.interests,
        preferred_contact: normalized.preferred_contact,
        whatsapp_number: normalized.whatsapp_number || null,
        telegram: normalized.telegram || null,
        profile_links: normalized.profile_links,
        message: normalized.message || null,
        model_preference: normalized.model_preference || null,
        attribution: normalized.attribution,
        adult_work_confirmed: true,
        privacy_confirmed: true
      };
      const created = await client.query(
        `INSERT INTO performer_applications(full_name,email,country,age_confirmed,consent_confirmed,answers,status,idempotency_key,continuation_token_hash,continuation_expires_at)
         VALUES($1,$2,$3,true,true,$4,'submitted',$5,$6,now()+interval '30 days') RETURNING *`,
        [normalized.full_name, normalized.email, normalized.country, answers, idempotencyKey, tokenHash(token())]
      );
      const application = created.rows[0];
      const configured = Boolean(this.config.whatsappProviderUrl && this.config.whatsappProviderToken && this.config.whatsappSenderId);
      const notification = await client.query(
        `INSERT INTO v3_recruiting_notifications(application_id,channel,recipient,template,payload,status)
         VALUES($1,'whatsapp',$2,'new_performer_application',$3,$4) RETURNING status`,
        [application.id, String(this.config.recruitingWhatsappRecipient || '886958679186').replace(/\D/g, ''), { reference: publicApplicationReference(application.id), admin_path: `/v3/admin?section=Creators&applicationId=${application.id}` }, configured ? 'queued' : 'not_configured']
      );
      if (transaction) await client.query('COMMIT');
      return this.publicResult(application, notification.rows[0], false);
    } catch (error) {
      if (transaction) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (transaction) client.release();
    }
  }

  async createApplication(input, idempotencyKey) {
    validateApplication(input);
    if (!idempotencyKey || idempotencyKey.length < 16) throw new HttpError(400, 'IDEMPOTENCY_REQUIRED', 'A sufficiently random idempotency key is required.');
    const existing = await this.db.query('SELECT id FROM performer_applications WHERE idempotency_key = $1', [idempotencyKey]);
    if (existing.rowCount) return { application: await this.getById(existing.rows[0].id), continuationToken: null, replay: true };
    const continuationToken = token();
    const result = await this.db.query(
      `INSERT INTO performer_applications (full_name,email,country,age_confirmed,consent_confirmed,answers,idempotency_key,continuation_token_hash,continuation_expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now() + interval '30 days') RETURNING id`,
      [input.full_name.trim(), input.email.trim().toLowerCase(), input.country.trim(), true, true, input.answers || {}, idempotencyKey, tokenHash(continuationToken)]
    );
    return { application: await this.getById(result.rows[0].id), continuationToken, replay: false };
  }

  async startDraft(input) {
    validateDraft(input);
    const continuationToken = token();
    const result = await this.db.query(
      `INSERT INTO performer_applications (full_name,email,country,age_confirmed,consent_confirmed,answers,idempotency_key,continuation_token_hash,continuation_expires_at)
       VALUES ($1,$2,$3,$4,false,$5,$6,$7,now() + interval '30 days') RETURNING id`,
      [input.full_name.trim(), input.email.trim().toLowerCase(), input.country.trim(), true, input.answers || {}, `draft:${crypto.randomUUID()}`, tokenHash(continuationToken)]
    );
    const application = await this.getById(result.rows[0].id);
    await this.db.query(`INSERT INTO application_upload_sessions(session_hash,application_id,expires_at) VALUES($1,$2,now() + interval '30 days')`, [tokenHash(continuationToken), application.id]);
    return { application, continuationToken };
  }

  async resume(continuationToken) {
    if (!continuationToken) throw new HttpError(401, 'CONTINUATION_REQUIRED', 'A continuation token is required.');
    const result = await this.db.query(
      `SELECT * FROM performer_applications WHERE continuation_token_hash = $1 AND continuation_expires_at > now()`, [tokenHash(continuationToken)]
    );
    if (!result.rowCount) throw new HttpError(401, 'INVALID_CONTINUATION', 'The continuation link is invalid or expired.');
    const application = result.rows[0];
    const uploads = await this.db.query('SELECT id,file_name,content_type,byte_size,status,confirmed_at FROM application_uploads WHERE application_id=$1 ORDER BY created_at', [application.id]);
    return { application: sanitize(application), uploads: uploads.rows };
  }

  async issueUpload(continuationToken, file) {
    const { application } = await this.resume(continuationToken);
    if (!file?.name || !file?.contentType || !Number.isFinite(file.byteSize) || file.byteSize <= 0 || file.byteSize > 50 * 1024 * 1024) {
      throw new HttpError(422, 'INVALID_UPLOAD', 'Upload metadata is invalid.');
    }
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
    if (!allowed.has(file.contentType)) throw new HttpError(422, 'INVALID_UPLOAD_TYPE', 'That upload type is not accepted.');
    const objectKey = `applications/${application.id}/${crypto.randomUUID()}`;
    const created = await this.db.query(
      `INSERT INTO application_uploads (application_id,upload_session_hash,object_key,file_name,content_type,byte_size,status,write_expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,'issued',now() + interval '15 minutes') RETURNING id`,
      [application.id, tokenHash(continuationToken), objectKey, file.name, file.contentType, file.byteSize]
    );
    const upload = created.rows[0];
    return { uploadId: upload.id, uploadUrl: await this.blob.issueWriteUrl(objectKey, file.contentType), expiresInSeconds: 900 };
  }

  async issueSessionUpload(sessionToken, file) {
    if (!sessionToken || sessionToken.length < 32) throw new HttpError(401, 'UPLOAD_SESSION_REQUIRED', 'A secure upload session is required.');
    if (!file?.name || !file?.contentType || !Number.isFinite(file.byteSize) || file.byteSize <= 0 || file.byteSize > 2 * 1024 * 1024 * 1024) throw new HttpError(422, 'INVALID_UPLOAD', 'Upload metadata is invalid.');
    if (!uploadTypes[file.fileType]?.includes(file.contentType)) throw new HttpError(422, 'INVALID_UPLOAD_TYPE', 'That upload type is not accepted.');
    const hash = tokenHash(sessionToken);
    const session = await this.db.query(`SELECT application_id,expires_at FROM application_upload_sessions WHERE session_hash=$1 AND expires_at > now()`, [hash]);
    if (!session.rowCount || !session.rows[0].application_id) throw new HttpError(401, 'UPLOAD_SESSION_EXPIRED', 'Upload session is invalid or expired.');
    const objectKey = `applications/private/${crypto.randomUUID()}`;
    const row = await this.db.query(`INSERT INTO application_uploads(application_id,upload_session_hash,object_key,file_name,content_type,byte_size,status,write_expires_at) VALUES($1,$2,$3,$4,$5,$6,'issued',now() + interval '15 minutes') RETURNING id`, [session.rows[0].application_id, hash, objectKey, file.name, file.contentType, file.byteSize]);
    return { intent_id: row.rows[0].id, r2_key: objectKey, upload_url: await this.blob.issueWriteUrl(objectKey, file.contentType), expires_in: 900 };
  }

  async confirmSessionUpload(sessionToken, uploadId) {
    const hash = tokenHash(sessionToken);
    const found = await this.db.query('SELECT * FROM application_uploads WHERE id=$1 AND upload_session_hash=$2 FOR UPDATE', [uploadId, hash]);
    if (!found.rowCount) throw new HttpError(404, 'UPLOAD_NOT_FOUND', 'Upload not found.');
    const upload = found.rows[0];
    if (upload.status === 'confirmed') return { success: true, intent_id: upload.id, r2_key: upload.object_key, replay: true };
    const metadata = await this.blob.verifyObject(upload.object_key);
    if (!metadata || metadata.byteSize !== Number(upload.byte_size)) throw new HttpError(422, 'UPLOAD_NOT_PRESENT', 'The uploaded file cannot be verified.');
    await this.db.query(`UPDATE application_uploads SET status='confirmed',confirmed_at=now(),etag=$2 WHERE id=$1`, [upload.id, metadata.etag || null]);
    return { success: true, intent_id: upload.id, r2_key: upload.object_key, replay: false };
  }

  async submitLegacy(payload) {
    const input = { full_name: payload.applicant_name || payload.legal_name, email: payload.email, country: payload.country || payload.nationality || payload.source_country, age_confirmed: Boolean(payload.confirmed_18_plus || payload.age_confirmed), consent_confirmed: Boolean(payload.confirmed_contact_consent || payload.consent_review_materials), answers: payload };
    validateApplication(input);
    const continuationToken = String(payload.application_session_id || '');
    const resumed = await this.resume(continuationToken);
    const application = resumed.application;
    // The high-entropy continuation capability, never an email address,
    // selects the draft the browser may complete.
    await this.db.query(`UPDATE performer_applications SET full_name=$2,email=$3,country=$4,age_confirmed=true,consent_confirmed=true,answers=$5,updated_at=now() WHERE id=$1`, [application.id, input.full_name.trim(), input.email.trim().toLowerCase(), input.country.trim(), input.answers]);
    const updated = await this.getById(application.id);
    const uploads = await this.db.query(`SELECT status FROM application_uploads WHERE application_id=$1`, [application.id]);
    const complete = isComplete(updated, uploads.rows);
    await this.db.query(`UPDATE performer_applications SET status=$2,updated_at=now() WHERE id=$1`, [application.id, complete ? 'submitted' : 'draft']);
    return { success: true, application_id: application.id, status: complete ? 'pending' : 'media_pending', continuation_token: continuationToken };
  }

  async confirmUpload(continuationToken, uploadId) {
    const { application } = await this.resume(continuationToken);
    const found = await this.db.query('SELECT * FROM application_uploads WHERE id=$1 AND application_id=$2 FOR UPDATE', [uploadId, application.id]);
    if (!found.rowCount) throw new HttpError(404, 'UPLOAD_NOT_FOUND', 'Upload not found.');
    const upload = found.rows[0];
    if (upload.status === 'confirmed') return { id: upload.id, status: 'confirmed', replay: true };
    const metadata = await this.blob.verifyObject(upload.object_key);
    if (!metadata || metadata.byteSize !== Number(upload.byte_size)) throw new HttpError(422, 'UPLOAD_NOT_PRESENT', 'The uploaded file cannot be verified.');
    await this.db.query(`UPDATE application_uploads SET status='confirmed',confirmed_at=now(),etag=$2 WHERE id=$1`, [upload.id, metadata.etag || null]);
    return { id: upload.id, status: 'confirmed', replay: false };
  }

  async getById(id) {
    const result = await this.db.query('SELECT * FROM performer_applications WHERE id=$1', [id]);
    if (!result.rowCount) throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found.');
    return sanitize(result.rows[0]);
  }

  async listForReview({ cursor, limit = 50, status } = {}) {
    const boundedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const values = [];
    const clauses = [];
    if (status) {
      values.push(status);
      clauses.push(`status = $${values.length}`);
    }
    if (cursor) {
      const [createdAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
      if (!createdAt || !id) throw new HttpError(400, 'INVALID_CURSOR', 'The review cursor is invalid.');
      values.push(createdAt, id);
      clauses.push(`(created_at,id) < ($${values.length - 1}::timestamptz,$${values.length}::uuid)`);
    }
    values.push(boundedLimit + 1);
    const result = await this.db.query(`SELECT id,full_name,email,country,status,age_confirmed,consent_confirmed,created_at,updated_at FROM performer_applications ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''} ORDER BY created_at DESC,id DESC LIMIT $${values.length}`, values);
    const rows = result.rows.slice(0, boundedLimit);
    const last = rows.at(-1);
    return { applications: rows, nextCursor: result.rows.length > boundedLimit && last ? Buffer.from(`${last.created_at.toISOString()}|${last.id}`).toString('base64url') : null };
  }

  async reviewDetail(applicationId) {
    const application = await this.getById(applicationId);
    const uploads = await this.db.query('SELECT id,file_name,content_type,byte_size,status,confirmed_at,created_at FROM application_uploads WHERE application_id=$1 ORDER BY created_at', [applicationId]);
    const profile = await this.db.query('SELECT id,status,user_id,created_at FROM performer_profiles WHERE application_id=$1', [applicationId]);
    const contract = await this.db.query('SELECT id,status,template_version,signed_at,created_at FROM performer_contracts WHERE application_id=$1 ORDER BY created_at DESC LIMIT 1', [applicationId]);
    return { application, uploads: uploads.rows, profile: profile.rows[0] || null, contract: contract.rows[0] || null, complete: isComplete(application, uploads.rows) };
  }

  async updateReview(applicationId, input) {
    if (!reviewStatuses.has(input.status)) throw new HttpError(422, 'INVALID_REVIEW_STATUS', 'Only under-review or rejected status may be set directly.');
    const result = await this.db.query(`UPDATE performer_applications SET status=$2,admin_notes=$3,updated_at=now() WHERE id=$1 RETURNING id,status,updated_at`, [applicationId, input.status, input.admin_notes || null]);
    if (!result.rowCount) throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found.');
    return result.rows[0];
  }

  async approve(applicationId) {
    const detail = await this.reviewDetail(applicationId);
    if (!detail.complete) throw new HttpError(422, 'APPLICATION_INCOMPLETE', 'Age confirmation, consent, and durable confirmed uploads are required before approval.');
    if (detail.application.status === 'rejected') throw new HttpError(409, 'APPLICATION_REJECTED', 'A rejected application cannot be approved without an explicit new review.');
    await this.db.query(`UPDATE performer_applications SET status='approved',updated_at=now() WHERE id=$1`, [applicationId]);
    const profile = await this.db.query(`INSERT INTO performer_profiles(application_id,status) VALUES($1,'pending_contract') ON CONFLICT(application_id) DO UPDATE SET application_id=EXCLUDED.application_id RETURNING id,application_id,status,user_id,created_at`, [applicationId]);
    return { applicationId, profile: profile.rows[0], replay: Boolean(detail.profile) };
  }

  async recordContract(applicationId, input) {
    const detail = await this.reviewDetail(applicationId);
    if (detail.application.status !== 'approved') throw new HttpError(409, 'APPLICATION_NOT_APPROVED', 'A contract can only be recorded for an approved application.');
    const templateVersion = String(input.template_version || '').trim();
    if (!templateVersion) throw new HttpError(422, 'CONTRACT_TEMPLATE_REQUIRED', 'A contract template version is required.');
    const result = await this.db.query(`INSERT INTO performer_contracts(application_id,template_version,status,signed_at) VALUES($1,$2,'signed',now()) ON CONFLICT(application_id) DO UPDATE SET template_version=EXCLUDED.template_version,status='signed',signed_at=now() RETURNING id,status,template_version,signed_at`, [applicationId, templateVersion]);
    await this.db.query(`UPDATE performer_profiles SET status='active' WHERE application_id=$1`, [applicationId]);
    return result.rows[0];
  }

  async assignPerformer(applicationId, performerUserId) {
    const detail = await this.reviewDetail(applicationId);
    if (detail.application.status !== 'approved' || detail.profile?.status !== 'active') throw new HttpError(409, 'CONTRACT_NOT_SIGNED', 'The approved performer contract must be recorded before account assignment.');
    const user = await this.db.query(`SELECT id,role,account_status FROM app_users WHERE id=$1`, [performerUserId]);
    if (!user.rowCount || user.rows[0].role !== 'performer' || user.rows[0].account_status !== 'active') throw new HttpError(422, 'INVALID_PERFORMER_ACCOUNT', 'An active performer account is required.');
    const updated = await this.db.query(`UPDATE performer_profiles SET user_id=$2 WHERE application_id=$1 AND user_id IS NULL RETURNING id,application_id,user_id,status`, [applicationId, performerUserId]);
    if (!updated.rowCount) {
      const existing = await this.db.query(`SELECT id,application_id,user_id,status FROM performer_profiles WHERE application_id=$1`, [applicationId]);
      if (existing.rows[0]?.user_id === performerUserId) return { ...existing.rows[0], replay: true };
      throw new HttpError(409, 'PERFORMER_ALREADY_ASSIGNED', 'This application is already assigned to another performer account.');
    }
    return { ...updated.rows[0], replay: false };
  }

  async listAssignablePerformerAccounts() {
    const result = await this.db.query(
      `SELECT u.id,u.email,u.created_at
       FROM app_users u
       WHERE u.role='performer' AND u.account_status='active'
         AND NOT EXISTS (SELECT 1 FROM performer_profiles p WHERE p.user_id=u.id)
       ORDER BY u.created_at DESC`
    );
    return { accounts: result.rows };
  }
}

function sanitize(row) {
  const { continuation_token_hash, ...application } = row;
  return application;
}
