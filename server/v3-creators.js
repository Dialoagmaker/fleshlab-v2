import crypto from 'node:crypto';
import { MIN_PASSWORD_LENGTH, normalizeUsername, passwordHash, validateUsername } from './auth.js';
import { HttpError } from './errors.js';
import { publicApplicationReference, RecruitingService } from './recruiting.js';

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
  constructor(db, blob = null, config = {}) { this.db = db; this.blob = blob; this.config = config; }

  async audit(user, action, entityType, entityId, before = null, after = null) {
    await this.db.query(
      'INSERT INTO v3_audit_events(actor_id,action,entity_type,entity_id,before_summary,after_summary) VALUES($1,$2,$3,$4,$5,$6)',
      [user.id, action, entityType, String(entityId), before, after]
    );
  }

  async overview() {
    const result = await this.db.query(`SELECT
      (SELECT count(*)::int FROM performer_applications WHERE admin_deleted_at IS NULL AND status IN ('submitted','under_review')) AS awaiting_review,
      (SELECT count(*)::int FROM performer_applications WHERE admin_deleted_at IS NULL AND status='approved') AS approved_unconverted,
      (SELECT count(*)::int FROM v3_creator_records WHERE lifecycle='onboarding') AS onboarding_incomplete,
      (SELECT count(*)::int FROM v3_creator_documents WHERE review_state='needs_review') AS documents_needing_review,
      (SELECT count(*)::int FROM v3_contract_instances WHERE status='signed') AS signed_contracts,
      (SELECT count(*)::int FROM v3_creator_records WHERE lifecycle='active') AS active_creators`);
    return { metrics: result.rows[0] };
  }

  async applications({ status, q, page: rawPage, limit: rawLimit } = {}) {
    const values = []; const where = ['a.admin_deleted_at IS NULL'];
    if (status) { values.push(status); where.push(`a.status=$${values.length}`); }
    if (q) { values.push(`%${String(q).trim()}%`); where.push(`(a.full_name ILIKE $${values.length} OR a.email ILIKE $${values.length})`); }
    const p = page(rawPage), l = limit(rawLimit), offset = (p - 1) * l;
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = await this.db.query(`SELECT count(*)::int FROM performer_applications a ${clause}`, values);
    values.push(l, offset);
    const rows = await this.db.query(`SELECT a.id,a.full_name,a.email,a.country,a.status,a.answers->>'recruitment_campaign_id' AS campaign_id,a.created_at,a.updated_at,c.id AS creator_id,c.lifecycle
      FROM performer_applications a LEFT JOIN v3_creator_records c ON c.application_id=a.id ${clause}
      ORDER BY a.created_at DESC,a.id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: rows.rows.map(row => ({ ...row, public_reference: publicApplicationReference(row.id) })), page: p, limit: l, total: total.rows[0].count };
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
    const application = { ...result.rows[0], public_reference: publicApplicationReference(result.rows[0].id) };
    const [uploads, contract, links, history, notification] = await Promise.all([
      this.db.query(`SELECT d.id,d.document_type,d.classification,d.review_state,d.reviewed_at,d.expires_at,d.note,d.created_at,u.id AS upload_id,u.file_name,u.content_type,u.byte_size,u.status AS upload_status,u.confirmed_at
        FROM application_uploads u LEFT JOIN v3_creator_documents d ON d.application_upload_id=u.id WHERE u.application_id=$1 ORDER BY u.created_at`, [id]),
      this.db.query(`SELECT i.id,i.status,i.contract_number,i.issued_at,i.viewed_at,i.signed_at,v.version,t.title FROM v3_contract_instances i JOIN v3_creator_records c ON c.id=i.creator_id LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id WHERE c.application_id=$1 ORDER BY i.issued_at DESC LIMIT 1`, [id]),
      this.db.query(`SELECT l.performer_legacy_id,p.display_name,p.slug,l.linked_at FROM v3_creator_performer_links l JOIN v3_creator_records c ON c.id=l.creator_id JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id WHERE c.application_id=$1`, [id]),
      this.history('creator.application', id),
      this.db.query('SELECT channel,status,recipient,last_error,attempts,created_at,updated_at,sent_at FROM v3_recruiting_notifications WHERE application_id=$1', [id])
    ]);
    return { application, documents: uploads.rows.map(publicDocument), contract: contract.rows[0] || null, performers: links.rows, notification: notification.rows[0] || null, history };
  }

  async removeApplication(id, input, user) {
    const reason=String(input?.reason||'').trim()||'Removed by administrator';
    const client=await this.db.connect();
    try { await client.query('BEGIN');
      const result=await client.query(`SELECT a.id,a.status,a.admin_deleted_at,c.id AS creator_id FROM performer_applications a LEFT JOIN v3_creator_records c ON c.application_id=a.id WHERE a.id=$1 FOR UPDATE OF a`,[id]);
      if(!result.rowCount)throw new HttpError(404,'APPLICATION_NOT_FOUND','Application not found.');
      const row=result.rows[0];
      if(row.admin_deleted_at){await client.query('COMMIT');return {id,deleted:true,idempotent:true};}
      if(row.creator_id)throw new HttpError(409,'APPLICATION_IN_USE','A converted creator application cannot be removed. Archive the linked creator through its dedicated lifecycle instead.');
      const saved=await client.query(`UPDATE performer_applications SET status='withdrawn',admin_deleted_at=now(),admin_deleted_by=$2,admin_deletion_reason=$3,updated_at=now() WHERE id=$1 RETURNING id,status,admin_deleted_at`,[id,user.id,reason]);
      await client.query(`INSERT INTO v3_audit_events(actor_id,action,entity_type,entity_id,before_summary,after_summary) VALUES($1,'creator.application.removed','creator.application',$2,$3,$4)`,[user.id,String(id),{status:row.status},{status:'withdrawn',reason,physical_delete:false}]);
      await client.query('COMMIT');return {...saved.rows[0],deleted:true};
    } catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;} finally {client.release();}
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
    } catch (error) { await client.query('ROLLBACK'); if (error.code === '23505') throw new HttpError(409, 'USERNAME_TAKEN', 'That username is already in use. Choose another username.'); throw error; } finally { client.release(); }
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

  async onboarding(applicationId) {
    const detail = await this.application(applicationId);
    const creatorResult = await this.db.query(`SELECT c.id,c.lifecycle,c.user_id FROM v3_creator_records c WHERE c.application_id=$1`, [applicationId]);
    const creator = creatorResult.rows[0] || null;
    const account = creator?.user_id ? (await this.db.query(`SELECT id,username,account_status,must_change_password,last_login_at FROM app_users WHERE id=$1`, [creator.user_id])).rows[0] || null : null;
    const performer = detail.performers?.[0] || null;
    const contract = creator ? (await this.db.query(`SELECT id,contract_number,status FROM v3_contract_instances WHERE creator_id=$1 ORDER BY issued_at DESC LIMIT 1`, [creator.id])).rows[0] || null : null;
    const identity = creator ? (await this.db.query(`SELECT status FROM v3_creator_identity_verifications WHERE creator_id=$1`, [creator.id])).rows[0] || null : null;
    const media = creator ? (await this.db.query(`SELECT count(*)::int AS count FROM v3_media_assets WHERE creator_id=$1 AND upload_status='uploaded'`, [creator.id])).rows[0] : { count: 0 };
    const blockers = [];
    if (!creator) blockers.push('NO_CREATOR_LINK');
    else if (!['onboarding','active'].includes(creator.lifecycle)) blockers.push('INVALID_CREATOR_LIFECYCLE');
    if (!performer) blockers.push('NO_PERFORMER_LINK');
    if (!account) blockers.push('NO_ACCOUNT');
    else if (account.account_status !== 'active') blockers.push('ACCOUNT_DISABLED');
    else if (account.must_change_password) blockers.push('PASSWORD_RESET_REQUIRED');
    return { application: detail.application, creator, performer, account, identity: identity || { status: 'not_started' }, contract, media_count: Number(media.count || 0), portal_access: { status: blockers.length ? 'blocked' : 'ready', blockers } };
  }

  async onboard(applicationId, input, user) {
    const initial = await this.application(applicationId);
    if (initial.application.status !== 'approved') throw new HttpError(409, 'APPLICATION_NOT_APPROVED', 'Approve the application before onboarding.');
    let creator = await this.ensureCreator(applicationId, user);
    let state = await this.onboarding(applicationId);
    if (!state.performer) {
      const stageName = String(input.stage_name || input.display_name || '').trim();
      if (!stageName) throw new HttpError(422, 'STAGE_NAME_REQUIRED', 'A public stage name is required before creating the Performer profile.');
      await this.linkPerformer(applicationId, { create_performer: true, display_name: stageName, slug: input.slug }, user);
      state = await this.onboarding(applicationId);
    }
    if (!state.account && (input.username || input.temporary_password || input.temporaryPassword)) {
      await this.createAccount(creator.id, user, input);
      state = await this.onboarding(applicationId);
    }
    await this.audit(user, 'creator.onboarding.guided', 'creator.application', applicationId, null, { creator_id: creator.id, performer_legacy_id: state.performer?.legacy_id || null, account_id: state.account?.id || null });
    return state;
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
    const [items, docs, contracts, performers, videos, notifications, history, profile, accountResult, identity, identityDocuments, media] = await Promise.all([
      this.db.query('SELECT id,requirement_key,state,note,reviewed_at,updated_at FROM v3_creator_onboarding_items WHERE creator_id=$1 ORDER BY requirement_key', [id]),
      this.db.query(`SELECT d.id,d.document_type,d.classification,d.review_state,d.reviewed_at,d.expires_at,d.note,d.version,d.created_at,u.file_name,u.content_type,u.byte_size,u.status AS upload_status,u.confirmed_at
        FROM v3_creator_documents d JOIN application_uploads u ON u.id=d.application_upload_id WHERE d.creator_id=$1 ORDER BY d.created_at DESC`, [id]),
      this.db.query(`SELECT i.id,i.contract_number,i.status,i.creator_legal_name,i.performer_name,i.issued_at,i.viewed_at,i.signed_at,i.source,i.snapshot_hash,t.title,t.contract_type,v.version
        FROM v3_contract_instances i LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id
        WHERE i.creator_id=$1 ORDER BY i.issued_at DESC`, [id]),
      this.db.query(`SELECT l.performer_legacy_id,p.display_name,p.slug,p.status,p.nationality,p.date_of_birth,p.profile_media_asset_id,
        COALESCE((SELECT COALESCE(a.legacy_url,'/api/v3/public/media/' || a.id || '/file')
          FROM v3_media_assets a
          WHERE a.id=p.profile_media_asset_id AND a.asset_type='thumbnail'
            AND a.visibility='public' AND a.processing_state='ready' AND a.review_status='approved'),p.legacy_profile_image_url) AS profile_image_url,
        COALESCE((SELECT json_agg(json_build_object('id',b.legacy_id,'name',b.name,'slug',b.slug) ORDER BY b.name)
          FROM v3_performer_brand_affiliations pa
          JOIN catalog_brands b ON b.legacy_id=pa.brand_legacy_id
          WHERE pa.performer_legacy_id=p.legacy_id AND pa.affiliation_status='active'
            AND b.status='active' AND b.v3_lifecycle='active'),'[]'::json) AS labels
        FROM v3_creator_performer_links l
        JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id
        WHERE l.creator_id=$1 ORDER BY p.display_name`, [id]),
      this.db.query(`SELECT DISTINCT v.legacy_id,v.title,v.slug,v.status,v.v3_lifecycle,v.legacy_thumbnail_url FROM v3_creator_performer_links l JOIN catalog_video_performers x ON x.performer_legacy_id=l.performer_legacy_id JOIN catalog_videos v ON v.legacy_id=x.video_legacy_id WHERE l.creator_id=$1 ORDER BY v.title`, [id]),
      this.db.query('SELECT id,kind,title,body,action_path,action_state,completed_at,read_at,created_at FROM v3_creator_notifications WHERE creator_id=$1 ORDER BY created_at DESC LIMIT 20', [id]),
      self ? Promise.resolve({ rows: [] }) : this.history('creator.record', id),
      this.db.query('SELECT preferred_name,contact_email,contact_phone,locale,timezone,notification_preferences,updated_at FROM v3_creator_profiles WHERE creator_id=$1', [id]),
      this.db.query('SELECT id,email,username,role,account_status,must_change_password,last_login_at,created_at FROM app_users WHERE id=$1', [record.user_id]),
      this.db.query(`SELECT id,document_kind,age_confirmed,status,reviewed_at,rejection_reason,created_at,updated_at
        FROM v3_creator_identity_verifications WHERE creator_id=$1`, [id]),
      this.db.query(`SELECT id,document_type,file_name,content_type,actual_byte_size,status,document_version,uploaded_at,created_at
        FROM v3_creator_identity_documents WHERE creator_id=$1 AND status <> 'replaced' ORDER BY document_type,document_version DESC`, [id]),
      this.db.query(`SELECT DISTINCT a.id,a.asset_type,a.file_name,a.usage,a.visibility,a.review_status,a.processing_state,a.upload_status,a.mime_type,a.byte_size,a.duration_seconds,a.legacy_url,a.created_at,
        l.performer_legacy_id,p.display_name AS performer_name
        FROM v3_media_assets a
        LEFT JOIN v3_media_asset_links l ON l.asset_id=a.id
        LEFT JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id
        WHERE a.creator_id=$1
           OR l.performer_legacy_id IN (SELECT performer_legacy_id FROM v3_creator_performer_links WHERE creator_id=$1)
           OR a.id IN (
             SELECT sa.media_asset_id
             FROM v3_creator_submission_assets sa
             JOIN v3_creator_submissions s ON s.id=sa.submission_id
             WHERE sa.media_asset_id IS NOT NULL AND s.creator_id=$1
           )
        ORDER BY a.created_at DESC`, [id])
    ]);
    const safeRecord = self ? { id: record.id, application_id: record.application_id, lifecycle: record.lifecycle, private_profile: record.private_profile, full_name: record.full_name, country: record.country, created_at: record.created_at } : record;
    const accountRecord = accountResult.rows[0] || null;
    if (self) for (const performer of performers.rows) if (performer.profile_media_asset_id) performer.profile_image_url = `/api/v3/creator/media/${performer.profile_media_asset_id}/file`;
    const account = accountRecord ? {
      ...accountRecord,
      password_status: accountRecord.must_change_password ? 'temporary' : 'changed',
      login_url: `${String(this.config.performerOrigin || 'https://performer.fleshlab.online').replace(/\/$/, '')}/creator/login`
    } : null;
    const verification = identity.rows[0] || null;
    const identityRecord = {
      id: verification?.id || null,
      status: verification?.status || 'not_started',
      document_kind: verification?.document_kind || null,
      age_verified: verification?.status === 'approved' || verification?.age_confirmed === true,
      age_confirmed: verification?.age_confirmed === true,
      date_of_birth: performers.rows.find(item => item.date_of_birth)?.date_of_birth || null,
      country: record.country || null,
      reviewed_at: verification?.reviewed_at || null,
      rejection_reason: verification?.rejection_reason || null,
      documents: identityDocuments.rows
    };
    return {
      creator: safeRecord,
      profile: profile.rows[0] || {},
      account,
      identity: identityRecord,
      onboarding: items.rows,
      documents: docs.rows.map(publicDocument),
      contracts: contracts.rows,
      performers: performers.rows,
      videos: videos.rows,
      media: media.rows.map(publicDocument),
      notifications: notifications.rows,
      actions: notifications.rows.filter(item => item.action_state === 'open'),
      history
    };
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

  async createAccount(creatorId, user, input = {}) {
    const current = await this.creator(creatorId, { actor: user });
    const address = String(current.creator.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(address)) throw new HttpError(422, 'CREATOR_EMAIL_REQUIRED', 'A valid application email is required before creating a creator account.');
    const username = validateUsername(input.username);
    const temporaryPassword = String(input.temporary_password || input.temporaryPassword || '');
    if (temporaryPassword.length < MIN_PASSWORD_LENGTH) throw new HttpError(422, 'WEAK_PASSWORD', `Temporary password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (current.account?.id && current.account.username) throw new HttpError(409, 'ACCOUNT_ALREADY_EXISTS', 'This Creator already has a login. Use RESET PASSWORD instead.');
    const client = await this.db.connect();
    let account;
    let created = false;
    try {
      await client.query('BEGIN');
      const locked = await client.query(`SELECT c.id,c.user_id,c.application_id,a.email
        FROM v3_creator_records c JOIN performer_applications a ON a.id=c.application_id
        WHERE c.id=$1 FOR UPDATE`, [creatorId]);
      if (!locked.rowCount) throw new HttpError(404, 'CREATOR_NOT_FOUND', 'Creator was not found.');
      const existing = await client.query('SELECT id,email,username,role,account_status,must_change_password,last_login_at,created_at FROM app_users WHERE email=$1 FOR UPDATE', [address]);
      if (existing.rowCount) {
        if (existing.rows[0].role !== 'performer') throw new HttpError(409, 'EMAIL_ACCOUNT_ROLE_CONFLICT', 'The application email already belongs to a non-creator account.');
        const conflict = await client.query('SELECT id FROM v3_creator_records WHERE user_id=$1 AND id<>$2', [existing.rows[0].id, creatorId]);
        if (conflict.rowCount) throw new HttpError(409, 'ACCOUNT_ALREADY_LINKED', 'This account is already linked to another Creator record.');
        if (existing.rows[0].username && normalizeUsername(existing.rows[0].username) !== username) throw new HttpError(409, 'ACCOUNT_ALREADY_EXISTS', 'This Creator already has a different username. Use RESET PASSWORD instead.');
        const updated = await client.query(`UPDATE app_users SET username=$2,password_hash=$3,account_status='active',must_change_password=true,updated_at=now() WHERE id=$1 RETURNING id,email,username,role,account_status,must_change_password,last_login_at,created_at`, [existing.rows[0].id, username, passwordHash(temporaryPassword)]);
        account = updated.rows[0];
      } else {
        const inserted = await client.query(`INSERT INTO app_users(email,password_hash,role,account_status)
          VALUES($1,$2,'performer','active')
          RETURNING id,email,role,account_status,created_at`, [address, passwordHash(temporaryPassword)]);
        await client.query('UPDATE app_users SET username=$2,must_change_password=true WHERE id=$1', [inserted.rows[0].id, username]);
        const refreshed = await client.query('SELECT id,email,username,role,account_status,must_change_password,last_login_at,created_at FROM app_users WHERE id=$1', [inserted.rows[0].id]);
        account = refreshed.rows[0];
        created = true;
      }
      await client.query('UPDATE v3_creator_records SET user_id=$1,updated_at=now() WHERE id=$2', [account.id, creatorId]);
      await client.query('UPDATE performer_profiles SET user_id=$1 WHERE application_id=(SELECT application_id FROM v3_creator_records WHERE id=$2)', [account.id, creatorId]);
      await client.query(`UPDATE v3_creator_onboarding_items SET state='complete',reviewed_by=$1,reviewed_at=now(),updated_at=now()
        WHERE creator_id=$2 AND requirement_key='account_link'`, [user.id, creatorId]);
      await client.query(`INSERT INTO v3_performer_user_links(performer_legacy_id,user_id,linked_by)
        SELECT performer_legacy_id,$1,$2 FROM v3_creator_performer_links WHERE creator_id=$3
        ON CONFLICT(performer_legacy_id) DO UPDATE SET user_id=EXCLUDED.user_id,linked_by=EXCLUDED.linked_by,updated_at=now()`, [account.id, user.id, creatorId]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    const loginUrl = `${String(this.config.performerOrigin || 'https://performer.fleshlab.online').replace(/\/$/, '')}/creator/login`;
    await this.audit(user, 'creator.account.created', 'creator.record', creatorId, null, { account_id: account.id, created, username: account.username, password_status: 'temporary' });
    return { account: { ...account, password_status: 'temporary', login_url: loginUrl }, created, login_url: loginUrl };
  }

  async resetAccountPassword(creatorId, input, user) {
    const current = await this.creator(creatorId, { actor: user });
    const temporaryPassword = String(input.temporary_password || input.temporaryPassword || '');
    if (temporaryPassword.length < MIN_PASSWORD_LENGTH) throw new HttpError(422, 'WEAK_PASSWORD', `Temporary password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (!current.account?.id) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Create the Creator login before resetting its password.');
    await this.db.query(`UPDATE app_users SET password_hash=$2,account_status='active',must_change_password=true,updated_at=now() WHERE id=$1`, [current.account.id, passwordHash(temporaryPassword)]);
    await this.db.query('UPDATE web_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [current.account.id]);
    await this.audit(user, 'creator.account.password_reset', 'creator.record', creatorId, null, { account_id: current.account.id, password_status: 'temporary' });
    return { account: { ...current.account, account_status: 'active', must_change_password: true, password_status: 'temporary' }, reset: true };
  }

  async setAccountStatus(creatorId, status, user) {
    const current = await this.creator(creatorId, { actor: user });
    if (!current.account?.id) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'This Creator does not have a login yet.');
    if (!['active', 'disabled'].includes(status)) throw new HttpError(422, 'INVALID_ACCOUNT_STATUS', 'Account status must be active or disabled.');
    await this.db.query('UPDATE app_users SET account_status=$2,updated_at=now() WHERE id=$1', [current.account.id, status]);
    if (status === 'disabled') await this.db.query('UPDATE web_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [current.account.id]);
    await this.audit(user, `creator.account.${status === 'active' ? 'reactivated' : 'disabled'}`, 'creator.record', creatorId, null, { account_id: current.account.id, account_status: status });
    return { account: { ...current.account, account_status: status }, status };
  }

  async createPerformer(creatorId, input, user) {
    const current = await this.creator(creatorId, { actor: user });
    const name = String(input.display_name || '').trim();
    if (!name) throw new HttpError(422, 'PERFORMER_REQUIRED', 'A public performer name is required.');
    await this.linkPerformer(current.creator.application_id, { create_performer: true, display_name: name, slug: input.slug }, user);
    return this.creator(creatorId, { actor: user });
  }

  async linkExistingPerformer(creatorId, performerLegacyId, user) {
    const current = await this.creator(creatorId, { actor: user });
    await this.linkPerformer(current.creator.application_id, { performer_legacy_id: performerLegacyId }, user);
    return this.creator(creatorId, { actor: user });
  }

  async linkVideo(creatorId, input, user) {
    const current = await this.creator(creatorId, { actor: user });
    const videoId = String(input.video_legacy_id || '').trim();
    if (!videoId) throw new HttpError(422, 'VIDEO_REQUIRED', 'Select a catalogue video to link.');
    const performerId = String(input.performer_legacy_id || current.performers[0]?.performer_legacy_id || '').trim();
    if (!performerId || !current.performers.some(item => item.performer_legacy_id === performerId)) throw new HttpError(422, 'PERFORMER_REQUIRED', 'Link a performer identity before linking a catalogue video.');
    const video = await this.db.query('SELECT legacy_id FROM catalog_videos WHERE legacy_id=$1', [videoId]);
    if (!video.rowCount) throw new HttpError(404, 'VIDEO_NOT_FOUND', 'The catalogue video was not found.');
    await this.db.query(`INSERT INTO catalog_video_performers(video_legacy_id,performer_legacy_id,display_order)
      VALUES($1,$2,COALESCE((SELECT max(display_order)+1 FROM catalog_video_performers WHERE video_legacy_id=$1),0))
      ON CONFLICT(video_legacy_id,performer_legacy_id) DO NOTHING`, [videoId, performerId]);
    await this.audit(user, 'creator.catalogue_video.linked', 'creator.record', creatorId, null, { video_legacy_id: videoId, performer_legacy_id: performerId });
    return this.creator(creatorId, { actor: user });
  }

  async createVideo(creatorId, input, user) {
    const current = await this.creator(creatorId, { actor: user });
    const title = String(input.title || '').trim().slice(0, 180);
    const performerId = String(input.performer_legacy_id || current.performers[0]?.performer_legacy_id || '').trim();
    if (!title) throw new HttpError(422, 'VIDEO_TITLE_REQUIRED', 'A public video title is required.');
    if (!performerId || !current.performers.some(item => item.performer_legacy_id === performerId)) throw new HttpError(422, 'PERFORMER_REQUIRED', 'Link a performer identity before creating a catalogue video.');
    const baseSlug = slug(input.slug || title);
    if (!baseSlug) throw new HttpError(422, 'VIDEO_SLUG_REQUIRED', 'A valid video title or slug is required.');
    const duplicate = await this.db.query('SELECT 1 FROM catalog_videos WHERE slug=$1', [baseSlug]);
    if (duplicate.rowCount) throw new HttpError(409, 'VIDEO_SLUG_EXISTS', 'A catalogue video already uses this slug.');
    const videoId = `v3:${crypto.randomUUID()}`;
    await this.db.query(`INSERT INTO catalog_videos(legacy_id,title,slug,description,short_summary,status,access_tier,source_payload)
      VALUES($1,$2,$3,$4,$5,'draft','free',$6)`, [videoId, title, baseSlug, input.description || null, input.short_summary || null, { origin: 'creator_onboarding', creator_id: creatorId, created_by: user.id }]);
    await this.db.query('INSERT INTO catalog_video_performers(video_legacy_id,performer_legacy_id,display_order) VALUES($1,$2,0)', [videoId, performerId]);
    await this.audit(user, 'creator.catalogue_video.created', 'creator.record', creatorId, null, { video_legacy_id: videoId, performer_legacy_id: performerId });
    return this.creator(creatorId, { actor: user });
  }

  async reviewIdentity(creatorId, input, user) {
    if (!['approved', 'rejected', 'resubmission_required', 'under_review'].includes(input.status)) throw new HttpError(422, 'INVALID_IDENTITY_REVIEW', 'Unsupported identity review.');
    if (input.status === 'approved') {
      const evidence = await this.db.query(`SELECT document_type FROM v3_creator_identity_documents WHERE creator_id=$1 AND status='uploaded' AND document_type IN ('id_front','verification_selfie') GROUP BY document_type`, [creatorId]);
      const types = new Set(evidence.rows.map(row => row.document_type));
      if (!types.has('id_front') || !types.has('verification_selfie')) throw new HttpError(422, 'IDENTITY_EVIDENCE_REQUIRED', 'An uploaded ID front and verification selfie are required before verification can be approved.');
    }
    const result = await this.db.query(`INSERT INTO v3_creator_identity_verifications(creator_id,status,reviewed_by,reviewed_at,rejection_reason)
      VALUES($1,$2,$3,now(),$4)
      ON CONFLICT(creator_id) DO UPDATE SET status=EXCLUDED.status,reviewed_by=EXCLUDED.reviewed_by,reviewed_at=EXCLUDED.reviewed_at,rejection_reason=EXCLUDED.rejection_reason,updated_at=now()
      RETURNING id,creator_id,status,reviewed_at,rejection_reason`, [creatorId, input.status, user.id, String(input.rejection_reason || '').trim() || null]);
    await this.db.query(`UPDATE catalog_performers p SET verified=($2='approved') FROM v3_creator_performer_links l WHERE l.creator_id=$1 AND l.performer_legacy_id=p.legacy_id`, [creatorId, input.status]);
    await this.audit(user, 'creator.identity.review', 'creator.record', creatorId, null, result.rows[0]);
    return this.creator(creatorId, { actor: user });
  }

  async issueAdminIdentityUpload(creatorId, input, user) {
    const current = await this.creator(creatorId, { actor: user });
    if (!this.blob) throw new HttpError(503, 'PRIVATE_UPLOAD_UNAVAILABLE', 'Private document storage is not configured.');
    const type = String(input.document_type || '').trim();
    const allowedTypes = new Set(['id_front', 'id_back', 'verification_selfie']);
    const contentType = String(input.content_type || '').split(';')[0].trim().toLowerCase();
    const allowedContent = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
    const size = Number(input.byte_size);
    if (!allowedTypes.has(type) || !allowedContent.has(contentType) || !Number.isInteger(size) || size < 1 || size > 50 * 1024 * 1024) throw new HttpError(422, 'INVALID_IDENTITY_FILE', 'Identity document metadata is invalid.');
    let verification = await this.db.query('SELECT id FROM v3_creator_identity_verifications WHERE creator_id=$1', [creatorId]);
    if (!verification.rowCount) verification = await this.db.query(`INSERT INTO v3_creator_identity_verifications(creator_id,status) VALUES($1,'submitted') RETURNING id`, [creatorId]);
    const prior = await this.db.query(`SELECT id,document_version FROM v3_creator_identity_documents WHERE creator_id=$1 AND document_type=$2 AND status <> 'replaced' ORDER BY document_version DESC LIMIT 1`, [creatorId, type]);
    const documentId = crypto.randomUUID();
    const objectKey = `creator-identity/${creatorId}/${documentId}/${String(input.file_name || type).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)}`;
    await this.db.query(`INSERT INTO v3_creator_identity_documents(id,verification_id,creator_id,document_type,object_key,file_name,content_type,expected_byte_size,document_version,replaced_document_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [documentId, verification.rows[0].id, creatorId, type, objectKey, String(input.file_name || type).slice(0, 200), contentType, size, (prior.rows[0]?.document_version || 0) + 1, prior.rows[0]?.id || null]);
    if (prior.rowCount) await this.db.query(`UPDATE v3_creator_identity_documents SET status='replaced',updated_at=now() WHERE id=$1`, [prior.rows[0].id]);
    try {
      const uploadUrl = await this.blob.issueWriteUrl(objectKey, contentType);
      await this.audit(user, 'creator.identity.upload_issued', 'creator.record', creatorId, null, { document_id: documentId, document_type: type });
      return { document_id: documentId, upload_url: uploadUrl, expires_in_seconds: 900 };
    } catch (error) { await this.db.query('DELETE FROM v3_creator_identity_documents WHERE id=$1', [documentId]); throw new HttpError(503, 'PRIVATE_UPLOAD_UNAVAILABLE', 'Private identity storage is not currently available.'); }
  }

  async confirmAdminIdentityUpload(creatorId, documentId, user) {
    const current = await this.creator(creatorId, { actor: user });
    const row = await this.db.query(`SELECT * FROM v3_creator_identity_documents WHERE id=$1 AND creator_id=$2 AND status='issued'`, [documentId, current.creator.id]);
    if (!row.rowCount || !this.blob) throw new HttpError(404, 'IDENTITY_DOCUMENT_NOT_FOUND', 'Identity document was not found.');
    const object = await this.blob.verifyObject(row.rows[0].object_key);
    if (!object || object.byteSize !== Number(row.rows[0].expected_byte_size)) throw new HttpError(422, 'PRIVATE_UPLOAD_INVALID', 'The identity document could not be verified.');
    await this.db.query(`UPDATE v3_creator_identity_documents SET status='uploaded',actual_byte_size=$1,etag=$2,uploaded_at=now(),updated_at=now() WHERE id=$3`, [object.byteSize, object.etag || null, documentId]);
    await this.db.query(`UPDATE v3_creator_identity_verifications SET status='submitted',updated_at=now() WHERE creator_id=$1`, [creatorId]);
    await this.audit(user, 'creator.identity.upload_confirmed', 'creator.record', creatorId, null, { document_id: documentId });
    return this.creator(creatorId, { actor: user });
  }

  async issueAdminMediaUpload(creatorId, input, user) {
    const current = await this.creator(creatorId, { actor: user });
    if (!this.blob) throw new HttpError(503, 'MEDIA_UPLOAD_UNAVAILABLE', 'Media storage is not configured.');
    const assetType = String(input.asset_type || '').trim();
    const usage = String(input.usage || 'other').trim();
    const contentType = String(input.content_type || '').split(';')[0].trim().toLowerCase();
    const allowedTypes = new Set(['thumbnail', 'poster', 'trailer', 'source']);
    const allowedUsage = new Set(['profile', 'cover', 'gallery', 'promo', 'source_video', 'preview_trailer', 'full_video', 'other']);
    const size = Number(input.byte_size);
    if (!allowedTypes.has(assetType) || !allowedUsage.has(usage) || !/^(image|video)\//.test(contentType) || !Number.isInteger(size) || size < 1 || size > 20 * 1024 * 1024 * 1024) throw new HttpError(422, 'INVALID_MEDIA_FILE', 'Media metadata is invalid.');
    const performerId = String(input.performer_legacy_id || '').trim() || null;
    if (performerId && !current.performers.some(item => item.performer_legacy_id === performerId)) throw new HttpError(422, 'PERFORMER_NOT_LINKED', 'The performer must be linked to this Creator record first.');
    const objectKey = `creator-media/${creatorId}/${crypto.randomUUID()}/${String(input.file_name || usage).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160)}`;
    const asset = await this.db.query(`INSERT INTO v3_media_assets(asset_type,storage_reference,file_name,mime_type,byte_size,processing_state,visibility,creator_id,usage,upload_status,review_status)
      VALUES($1,$2,$3,$4,$5,'pending','private',$6,$7,'issued','pending_review') RETURNING id`, [assetType, objectKey, String(input.file_name || usage).slice(0, 200), contentType, size, creatorId, usage]);
    try {
      if (performerId) await this.db.query('INSERT INTO v3_media_asset_links(asset_id,performer_legacy_id,is_primary) VALUES($1,$2,false)', [asset.rows[0].id, performerId]);
      const uploadUrl = input.upload_transport === 'authenticated_stream'
        ? `/api/v3/creator/media/${asset.rows[0].id}/upload`
        : await this.blob.issueWriteUrl(objectKey, contentType);
      await this.audit(user, 'creator.media.upload_issued', 'creator.record', creatorId, null, { asset_id: asset.rows[0].id, asset_type: assetType, usage });
      return { asset_id: asset.rows[0].id, upload_url: uploadUrl, upload_transport: input.upload_transport || 'azure_sas', expires_in_seconds: 900 };
    } catch (error) { await this.db.query('DELETE FROM v3_media_assets WHERE id=$1', [asset.rows[0].id]); throw new HttpError(503, 'MEDIA_UPLOAD_UNAVAILABLE', 'Media storage is not currently available.'); }
  }

  async confirmAdminMediaUpload(creatorId, assetId, user) {
    const current = await this.creator(creatorId, { actor: user });
    const row = await this.db.query("SELECT * FROM v3_media_assets WHERE id=$1 AND creator_id=$2 AND upload_status IN ('issued','uploaded')", [assetId, current.creator.id]);
    if (!row.rowCount || !this.blob) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset was not found.');
    if (row.rows[0].upload_status === 'uploaded') return this.creator(creatorId, { actor: user });
    const object = await this.blob.verifyObject(row.rows[0].storage_reference);
    if (!object || object.byteSize !== Number(row.rows[0].byte_size)) throw new HttpError(422, 'MEDIA_UPLOAD_INVALID', 'The uploaded media could not be verified.');
    await this.db.query(`UPDATE v3_media_assets SET processing_state='ready',upload_status='uploaded',byte_size=$1,content_hash=$2,updated_at=now() WHERE id=$3`, [object.byteSize, object.etag || null, assetId]);
    await this.audit(user, 'creator.media.upload_confirmed', 'creator.record', creatorId, null, { asset_id: assetId });
    return this.creator(creatorId, { actor: user });
  }

  async issueCreatorMediaUpload(user, input) {
    const current = await this.creatorForUser(user);
    const usage = String(input.usage || 'gallery').trim();
    if (!['profile', 'cover', 'gallery', 'promo'].includes(usage)) throw new HttpError(422, 'INVALID_MEDIA_USAGE', 'Choose a profile, cover, gallery or promo upload.');
    const contentType = String(input.content_type || '').split(';')[0].trim().toLowerCase();
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) throw new HttpError(422, 'INVALID_MEDIA_FILE', 'Photos must be JPG, PNG or WEBP files.');
    const extension = String(input.file_name || '').toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) throw new HttpError(422, 'INVALID_MEDIA_FILE', 'Photos must have a JPG, PNG or WEBP extension.');
    const size = Number(input.byte_size);
    if (!Number.isInteger(size) || size < 1 || size > 20 * 1024 * 1024) throw new HttpError(422, 'INVALID_MEDIA_FILE', 'Photos must be no larger than 20 MiB.');
    if (current.performers.length !== 1) throw new HttpError(409, 'PERFORMER_LINK_REQUIRED', 'This account must have exactly one linked performer before profile media can be uploaded.');
    return this.issueAdminMediaUpload(current.creator.id, { ...input, performer_legacy_id: current.performers[0].performer_legacy_id, asset_type: usage === 'cover' ? 'poster' : 'thumbnail', usage, visibility: 'private', upload_transport: 'authenticated_stream' }, user);
  }

  async confirmCreatorMediaUpload(user, assetId) {
    const current = await this.creatorForUser(user);
    return this.confirmAdminMediaUpload(current.creator.id, assetId, user);
  }

  async streamCreatorMediaUpload(user, assetId, request) {
    const current = await this.creatorForUser(user);
    const contentType = String(request.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const row = await this.db.query(`SELECT * FROM v3_media_assets WHERE id=$1 AND creator_id=$2 AND upload_status='issued'`, [assetId, current.creator.id]);
    if (!row.rowCount || contentType !== row.rows[0].mime_type) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset was not found.');
    if (Number(request.headers['content-length']) !== Number(row.rows[0].byte_size)) throw new HttpError(422, 'MEDIA_UPLOAD_INVALID', 'The uploaded media size does not match the authorized file.');
    await this.blob.uploadStream(row.rows[0].storage_reference, request, contentType);
    // Keep the asset issued until the follow-up confirmation verifies the
    // object and its exact byte size. The browser always calls confirm after
    // this stream; marking it uploaded here makes that canonical step fail.
    await this.audit(user, 'creator.media.upload_streamed', 'creator.record', current.creator.id, null, { asset_id: assetId, byte_size: row.rows[0].byte_size });
    return { id: assetId, uploaded: true };
  }

  async updateMedia(creatorId, assetId, input, user) {
    const current = await this.creator(creatorId, { actor: user });
    if (!current.media.some(item => item.id === assetId)) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset was not found for this Creator.');
    const row = await this.db.query('SELECT id,storage_reference,visibility,usage,review_status,upload_status,processing_state FROM v3_media_assets WHERE id=$1 AND creator_id=$2', [assetId, creatorId]);
    if (!row.rowCount) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset was not found for this Creator.');
    const asset = row.rows[0];
    const visibility = Object.hasOwn(input, 'visibility') ? input.visibility : asset.visibility;
    const usage = Object.hasOwn(input, 'usage') ? input.usage : asset.usage;
    const reviewStatus = Object.hasOwn(input, 'review_status') ? input.review_status : asset.review_status;
    if (!['public', 'private', 'internal'].includes(visibility) || !['profile', 'cover', 'gallery', 'promo', 'source_video', 'preview_trailer', 'full_video', 'other'].includes(usage) || !['pending_review', 'approved', 'rejected'].includes(reviewStatus)) throw new HttpError(422, 'INVALID_MEDIA_STATE', 'Media visibility, usage or review status is invalid.');
    if (reviewStatus === 'approved' && (asset.upload_status !== 'uploaded' || !['ready', 'processing'].includes(asset.processing_state))) throw new HttpError(409, 'MEDIA_NOT_READY_FOR_REVIEW', 'The media must finish uploading before approval.');
    if (visibility === 'public' && reviewStatus !== 'approved') throw new HttpError(409, 'MEDIA_APPROVAL_REQUIRED', 'Approve the media before making it public.');
    if (visibility === 'public') {
      const signed = await this.db.query("SELECT 1 FROM v3_contract_instances WHERE creator_id=$1 AND status='signed' LIMIT 1", [creatorId]);
      if (!signed.rowCount) throw new HttpError(409, 'CONTRACT_SIGNATURE_REQUIRED', 'A signed contract is required before public media can be published.');
    }
    await this.db.query(`UPDATE v3_media_assets
      SET visibility=$1,usage=$2,review_status=$3,
          legacy_url=CASE
            WHEN $1='public' AND $3='approved' AND storage_reference IS NOT NULL THEN '/api/v3/public/media/' || id || '/file'
            WHEN $1<>'public' AND legacy_url LIKE '/api/v3/public/media/%' THEN NULL
            ELSE legacy_url END,
          updated_at=now()
      WHERE id=$4 AND creator_id=$5`, [visibility, usage, reviewStatus, assetId, creatorId]);
    await this.audit(user, 'creator.media.updated', 'creator.record', creatorId, { asset_id: assetId, visibility: asset.visibility, usage: asset.usage, review_status: asset.review_status }, { asset_id: assetId, visibility, usage, review_status: reviewStatus });
    return this.creator(creatorId, { actor: user });
  }

  async publishProfileMedia(creatorId, assetId, user, { approve = false } = {}) {
    const current = await this.creator(creatorId, { actor: user });
    const asset = await this.db.query(`SELECT id,asset_type,mime_type,storage_reference,upload_status,processing_state,review_status
      FROM v3_media_assets WHERE id=$1 AND creator_id=$2`, [assetId, creatorId]);
    if (!asset.rowCount || asset.rows[0].asset_type !== 'thumbnail' || !String(asset.rows[0].mime_type || '').startsWith('image/')) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'A profile image owned by this Creator was not found.');
    const candidate = asset.rows[0];
    if (candidate.upload_status !== 'uploaded' || candidate.processing_state !== 'ready') throw new HttpError(409, 'MEDIA_NOT_READY_FOR_PUBLICATION', 'The image must finish processing before publication.');
    if (candidate.review_status !== 'approved' && !approve) throw new HttpError(409, 'MEDIA_APPROVAL_REQUIRED', 'Approve the image before setting it as the public profile picture.');
    const linked = await this.db.query(`SELECT performer_legacy_id FROM v3_media_asset_links WHERE asset_id=$1 AND performer_legacy_id IS NOT NULL LIMIT 1`, [assetId]);
    const performerId = linked.rows[0]?.performer_legacy_id || current.performers[0]?.performer_legacy_id;
    if (!performerId) throw new HttpError(409, 'PERFORMER_NOT_LINKED', 'Link a public performer identity before publishing a profile picture.');
    const signed = await this.db.query("SELECT 1 FROM v3_contract_instances WHERE creator_id=$1 AND status='signed' LIMIT 1", [creatorId]);
    if (!signed.rowCount) {
      await this.db.query(`UPDATE v3_media_assets SET usage='profile',review_status='approved',updated_at=now() WHERE id=$1 AND creator_id=$2`, [assetId, creatorId]);
      await this.db.query('UPDATE v3_media_asset_links SET is_primary=false WHERE performer_legacy_id=$1', [performerId]);
      await this.db.query(`INSERT INTO v3_media_asset_links(asset_id,performer_legacy_id,is_primary) SELECT $1,$2,true WHERE NOT EXISTS (SELECT 1 FROM v3_media_asset_links WHERE asset_id=$1 AND performer_legacy_id=$2)`, [assetId, performerId]);
      await this.db.query('UPDATE v3_media_asset_links SET is_primary=true WHERE asset_id=$1 AND performer_legacy_id=$2', [assetId, performerId]);
      await this.db.query('UPDATE catalog_performers SET profile_media_asset_id=$1 WHERE legacy_id=$2', [assetId, performerId]);
      await this.audit(user, 'creator.media.private_profile_set', 'creator.record', creatorId, null, { asset_id: assetId, performer_legacy_id: performerId, contract_gate: 'unsigned' });
      return this.creator(creatorId, { actor: user });
    }
    await this.db.query(`UPDATE v3_media_assets SET visibility='public',usage='profile',review_status='approved',legacy_url=CASE WHEN storage_reference IS NOT NULL THEN '/api/v3/public/media/' || id || '/file' ELSE legacy_url END,updated_at=now() WHERE id=$1 AND creator_id=$2`, [assetId, creatorId]);
    await this.db.query('UPDATE v3_media_asset_links SET is_primary=false WHERE performer_legacy_id=$1', [performerId]);
    await this.db.query(`INSERT INTO v3_media_asset_links(asset_id,performer_legacy_id,is_primary)
      SELECT $1,$2,true WHERE NOT EXISTS (SELECT 1 FROM v3_media_asset_links WHERE asset_id=$1 AND performer_legacy_id=$2)`, [assetId, performerId]);
    await this.db.query('UPDATE v3_media_asset_links SET is_primary=true WHERE asset_id=$1 AND performer_legacy_id=$2', [assetId, performerId]);
    await this.db.query('UPDATE catalog_performers SET profile_media_asset_id=$1,public_visibility=true WHERE legacy_id=$2', [assetId, performerId]);
    await this.audit(user, 'creator.media.profile_published', 'creator.record', creatorId, null, { asset_id: assetId, performer_legacy_id: performerId, contract_gate: 'signed' });
    return this.creator(creatorId, { actor: user });
  }

  mediaViewToken(user, assetId) {
    const payload = Buffer.from(JSON.stringify({ scope: 'creator_media', target_id: assetId, actor_id: user.id, expires_at: Date.now() + 300000 })).toString('base64url');
    const signature = crypto.createHmac('sha256', this.config.sessionSecret).update(payload).digest('base64url');
    return `${payload}.${signature}`;
  }

  verifyMediaViewToken(user, assetId, token) {
    const [payload, signature] = String(token || '').split('.');
    if (!payload || !signature) return false;
    const expected = crypto.createHmac('sha256', this.config.sessionSecret).update(payload).digest('base64url');
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
    try { const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); return value.scope === 'creator_media' && value.target_id === assetId && value.actor_id === user.id && Number(value.expires_at) > Date.now(); } catch { return false; }
  }

  async issueAdminMediaRead(creatorId, assetId, user, request) {
    const current = await this.creator(creatorId, { actor: user });
    if (!current.media.some(item => item.id === assetId)) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset was not found for this Creator.');
    const row = await this.db.query(`SELECT file_name,mime_type,upload_status,storage_reference,legacy_url FROM v3_media_assets WHERE id=$1 AND creator_id=$2`, [assetId, creatorId]);
    if (!row.rowCount || row.rows[0].upload_status !== 'uploaded') throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset is not ready for review.');
    if (!row.rows[0].storage_reference && row.rows[0].legacy_url) return { view_url: row.rows[0].legacy_url, expires_in_seconds: 300, file_name: row.rows[0].file_name, content_type: row.rows[0].mime_type };
    const token = this.mediaViewToken(user, assetId);
    await this.audit(user, 'creator.media.private_view_issued', 'creator.record', creatorId, null, { asset_id: assetId }, request);
    return { view_url: `/api/v3/admin/creators/records/${creatorId}/media/${assetId}/view?token=${encodeURIComponent(token)}`, expires_in_seconds: 300, file_name: row.rows[0].file_name, content_type: row.rows[0].mime_type };
  }

  async streamAdminMediaRead(creatorId, assetId, user, token, request) {
    if (!this.verifyMediaViewToken(user, assetId, token)) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset was not found.');
    const row = await this.db.query(`SELECT storage_reference,file_name,mime_type,upload_status FROM v3_media_assets WHERE id=$1 AND creator_id=$2 AND upload_status='uploaded'`, [assetId, creatorId]);
    if (!row.rowCount || !row.rows[0].storage_reference) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset was not found.');
    const media = await this.blob.downloadStream(row.rows[0].storage_reference);
    await this.audit(user, 'creator.media.private_viewed', 'creator.record', creatorId, null, { asset_id: assetId }, request);
    return { ...media, file_name: row.rows[0].file_name, content_type: row.rows[0].mime_type };
  }

  async issueCreatorMediaRead(user, assetId, request) {
    const current = await this.creatorForUser(user);
    if (!current.media.some(item => item.id === assetId)) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset was not found in your workspace.');
    const row = await this.db.query(`SELECT file_name,mime_type,upload_status,storage_reference,legacy_url FROM v3_media_assets WHERE id=$1 AND creator_id=$2`, [assetId, current.creator.id]);
    if (!row.rowCount || row.rows[0].upload_status !== 'uploaded') throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset is not ready for preview.');
    if (!row.rows[0].storage_reference && row.rows[0].legacy_url) return { view_url: row.rows[0].legacy_url, expires_in_seconds: 300, file_name: row.rows[0].file_name, content_type: row.rows[0].mime_type };
    const token = this.mediaViewToken(user, assetId);
    await this.audit(user, 'creator.media.workspace_view_issued', 'creator.record', current.creator.id, null, { asset_id: assetId });
    return { view_url: `/api/v3/creator/media/${assetId}/view?token=${encodeURIComponent(token)}`, expires_in_seconds: 300, file_name: row.rows[0].file_name, content_type: row.rows[0].mime_type };
  }

  async streamCreatorMediaRead(user, assetId, token, request) {
    if (!this.verifyMediaViewToken(user, assetId, token)) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset was not found.');
    const current = await this.creatorForUser(user);
    if (!current.media.some(item => item.id === assetId)) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset was not found.');
    const row = await this.db.query(`SELECT storage_reference,file_name,mime_type FROM v3_media_assets WHERE id=$1 AND creator_id=$2 AND upload_status='uploaded'`, [assetId, current.creator.id]);
    if (!row.rowCount || !row.rows[0].storage_reference) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset was not found.');
    const media = await this.blob.downloadStream(row.rows[0].storage_reference);
    await this.audit(user, 'creator.media.workspace_viewed', 'creator.record', current.creator.id, null, { asset_id: assetId });
    return { ...media, file_name: row.rows[0].file_name, content_type: row.rows[0].mime_type };
  }

  async streamCreatorProfileMedia(user, assetId) {
    const current = await this.creatorForUser(user);
    const row = await this.db.query(`SELECT a.storage_reference,a.file_name,a.mime_type FROM v3_media_assets a
      JOIN catalog_performers p ON p.profile_media_asset_id=a.id
      JOIN v3_creator_performer_links l ON l.performer_legacy_id=p.legacy_id
      WHERE a.id=$1 AND a.creator_id=$2 AND l.creator_id=$2 AND a.upload_status='uploaded'
        AND a.processing_state='ready' AND a.review_status='approved' AND a.mime_type LIKE 'image/%'`, [assetId, current.creator.id]);
    if (!row.rowCount || !row.rows[0].storage_reference) throw new HttpError(404, 'PROFILE_MEDIA_NOT_FOUND', 'Profile media was not found.');
    const media = await this.blob.downloadStream(row.rows[0].storage_reference);
    return { ...media, file_name: row.rows[0].file_name, content_type: row.rows[0].mime_type };
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
