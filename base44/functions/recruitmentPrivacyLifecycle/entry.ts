import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { S3Client, DeleteObjectsCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';

const RETENTION_DAYS = {
  rejected_application: 30,
  applicant_withdrawn_application: 7,
  abandoned_application: 180,
  approved_application_files: 2555,
  approved_compliance_document: 2555,
  orphan_upload: 2,
  expired_upload_intent: 2,
  expired_upload_token: 1,
};
const APPROVED_STATES = new Set(['approved','contract_pending','contract_sent','contract_signed','performer_created','user_linked','active']);
const ABANDONABLE_STATES = new Set(['pending','media_pending','more_info_requested']);

function ageDays(value) {
  if (!value) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
}
function appKeys(app) {
  return [...(app.profile_photo_r2_keys || []), app.intro_video_r2_key, app.hardcore_video_r2_key, app.id_document_r2_key, app.id_document_front_r2_key, app.id_document_back_r2_key, app.selfie_with_id_r2_key].filter(Boolean);
}
function docKey(doc) {
  return doc?.file_uri || null;
}
async function audit(base44, subjectType, subjectId, action, actorId, details, severity = 'warning') {
  await base44.asServiceRole.entities.RecruitmentAuditLog.create({
    subject_type: subjectType,
    subject_id: subjectId,
    action,
    actor_type: 'admin',
    actor_id: actorId,
    severity,
    details_json: JSON.stringify(details || {}),
    created_at: new Date().toISOString(),
  }).catch(() => null);
}
async function deleteKeys(r2, bucketName, keys) {
  if (!keys.length) return { deleted: 0, failed: false };
  await r2.send(new DeleteObjectsCommand({ Bucket: bucketName, Delete: { Objects: keys.map(Key => ({ Key })), Quiet: true } }));
  return { deleted: keys.length, failed: false };
}
function candidate(kind, entity, age, r2Keys, retentionDays, reason) {
  return { kind, entity_type: entity.entity_name || 'record', id: entity.id, age_days: age, r2Keys, retention_days: retentionDays, reason };
}
function appCandidate(app) {
  const keys = appKeys(app);
  if (app.status === 'rejected') {
    const age = ageDays(app.rejected_at || app.updated_date || app.created_date);
    if (age >= RETENTION_DAYS.rejected_application) return candidate('rejected_application', app, age, keys, RETENTION_DAYS.rejected_application, 'rejected status beyond retention');
  }
  if (app.applicant_withdrawn_at || app.withdrawal_requested_at) {
    const age = ageDays(app.applicant_withdrawn_at || app.withdrawal_requested_at);
    if (age >= RETENTION_DAYS.applicant_withdrawn_application) return candidate('applicant_withdrawn_application', app, age, keys, RETENTION_DAYS.applicant_withdrawn_application, 'withdrawal timestamp beyond retention');
  }
  if (ABANDONABLE_STATES.has(app.status)) {
    const age = ageDays(app.last_activity_at || app.submitted_at || app.updated_date || app.created_date);
    if (age >= RETENTION_DAYS.abandoned_application) return candidate('abandoned_application', app, age, keys, RETENTION_DAYS.abandoned_application, 'reachable pending/media state inactive beyond retention');
  }
  if (APPROVED_STATES.has(app.status)) {
    const age = ageDays(app.approved_at || app.activated_at || app.updated_date || app.created_date);
    if (age >= RETENTION_DAYS.approved_application_files) return candidate('approved_application_files', app, age, keys, RETENTION_DAYS.approved_application_files, 'approved application files beyond configured retention');
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    const body = await req.json();
    const action = body?.dry_run ? 'dry_run' : (body?.action || 'dry_run');
    const { application_id } = body || {};
    const candidateIds = new Set(Array.isArray(body?.candidate_ids) ? body.candidate_ids : []);

    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('R2_BUCKET_NAME');
    const r2 = new S3Client({ region:'auto', endpoint:`https://${accountId}.r2.cloudflarestorage.com`, credentials:{ accessKeyId, secretAccessKey } });

    const apps = application_id ? [await base44.asServiceRole.entities.GuestProductionApplication.get(application_id).catch(() => null)] : await base44.asServiceRole.entities.GuestProductionApplication.filter({ request_type:'performer_application' }, '-created_date', 500);
    const candidates = [];
    for (const app of apps.filter(Boolean)) {
      const c = appCandidate(app);
      if (c) candidates.push(c);
    }

    const intents = await base44.asServiceRole.entities.ApplicationUploadIntent.filter({ status: 'issued' }, '-created_date', 500).catch(() => []);
    for (const intent of intents || []) {
      const expiredAge = ageDays(intent.expires_at);
      if (new Date(intent.expires_at) >= new Date()) continue;
      let kind = 'expired_upload_intent';
      let orphan = !intent.application_id;
      if (intent.application_id) {
        const app = await base44.asServiceRole.entities.GuestProductionApplication.get(intent.application_id).catch(() => null);
        orphan = !app;
      }
      if (orphan) kind = 'orphan_upload';
      const retention = kind === 'orphan_upload' ? RETENTION_DAYS.orphan_upload : RETENTION_DAYS.expired_upload_intent;
      if (expiredAge >= retention) candidates.push(candidate(kind, { ...intent, entity_name: 'ApplicationUploadIntent' }, expiredAge, [intent.r2_key].filter(Boolean), retention, `${kind} beyond retention`));
    }

    const tokens = await base44.asServiceRole.entities.ApplicationUploadToken.filter({ status: 'issued' }, '-created_date', 500).catch(() => []);
    for (const token of tokens || []) {
      if (new Date(token.expires_at) >= new Date()) continue;
      const age = ageDays(token.expires_at);
      if (age >= RETENTION_DAYS.expired_upload_token) candidates.push(candidate('expired_upload_token', { ...token, entity_name: 'ApplicationUploadToken' }, age, [], RETENTION_DAYS.expired_upload_token, 'expired upload token beyond retention'));
    }

    const docs = await base44.asServiceRole.entities.ComplianceDocument.list('-created_date', 500).catch(() => []);
    for (const doc of docs || []) {
      const triggerDate = doc.expires_at || doc.updated_date || doc.created_date;
      const age = ageDays(triggerDate);
      if ((doc.status === 'expired' || doc.status === 'revoked') && age >= RETENTION_DAYS.approved_compliance_document) {
        candidates.push(candidate('approved_compliance_document', { ...doc, entity_name: 'ComplianceDocument' }, age, [docKey(doc)].filter(Boolean), RETENTION_DAYS.approved_compliance_document, 'expired/revoked compliance document beyond configured retention'));
      }
    }

    const scopedCandidates = candidateIds.size ? candidates.filter(c => candidateIds.has(c.id)) : candidates;

    if (action === 'dry_run') {
      return Response.json({
        success: true,
        dry_run: true,
        retention_days: RETENTION_DAYS,
        canonical_status_map: {
          rejected_application: "status='rejected' + rejected_at age",
          applicant_withdrawn_application: 'applicant_withdrawn_at or withdrawal_requested_at age',
          abandoned_application: "status in pending/media_pending/more_info_requested + last_activity age",
          approved_application_files: 'approved/contract/performer/active states + approved/activation age',
          orphan_upload: 'expired issued upload intent with no reachable application',
          expired_upload_intent: 'expired issued upload intent with reachable application',
          expired_upload_token: 'issued token past expires_at',
          approved_compliance_document: 'expired/revoked compliance document beyond configured retention'
        },
        candidates: scopedCandidates.map(c => ({ kind: c.kind, id: c.id, age_days: c.age_days, retention_days: c.retention_days, file_count: c.r2Keys.length, reason: c.reason }))
      });
    }
    if (action !== 'purge') return Response.json({ error:'Invalid action' }, { status:400 });

    let deletedFiles = 0;
    const failures = [];
    for (const c of scopedCandidates) {
      try {
        const deleted = await deleteKeys(r2, bucketName, c.r2Keys);
        deletedFiles += deleted.deleted;
        if (['rejected_application','applicant_withdrawn_application','abandoned_application','approved_application_files'].includes(c.kind)) {
          const update = {
            profile_photo_r2_keys: [], intro_video_r2_key: null, hardcore_video_r2_key: null, id_document_r2_key: null, id_document_front_r2_key: null, id_document_back_r2_key: null, selfie_with_id_r2_key: null,
            media_upload_status: 'none', compliance_upload_status: 'none', privacy_cleanup_status: 'purged', privacy_cleanup_at: new Date().toISOString(), privacy_retention_category: c.kind, privacy_cleanup_error: null
          };
          if (c.kind !== 'approved_application_files') {
            update.legal_name = 'Privacy purged applicant'; update.phone = null; update.social_links = null; update.message = null; update.experience = null;
          }
          await base44.asServiceRole.entities.GuestProductionApplication.update(c.id, update);
        } else if (['expired_upload_intent','orphan_upload'].includes(c.kind)) {
          await base44.asServiceRole.entities.ApplicationUploadIntent.update(c.id, { status: 'purged', purged_at: new Date().toISOString(), cleanup_attempt_count: 1 });
        } else if (c.kind === 'expired_upload_token') {
          await base44.asServiceRole.entities.ApplicationUploadToken.update(c.id, { status: 'expired', last_rejection_reason: 'privacy_lifecycle_expired' });
        } else if (c.kind === 'approved_compliance_document') {
          await base44.asServiceRole.entities.ComplianceDocument.update(c.id, { file_uri: `purged://privacy-lifecycle/${c.id}`, status: 'expired', admin_note: 'Private file purged by configured privacy lifecycle.' });
        }
        await audit(base44, c.entity_type, c.id, 'privacy_lifecycle_purged', user.id, { kind: c.kind, age_days: c.age_days, file_count: c.r2Keys.length, retention_days: c.retention_days }, 'warning');
      } catch (error) {
        failures.push({ id: c.id, kind: c.kind, error: error.message });
        if (['rejected_application','applicant_withdrawn_application','abandoned_application','approved_application_files'].includes(c.kind)) {
          await base44.asServiceRole.entities.GuestProductionApplication.update(c.id, { privacy_cleanup_status: 'purge_failed', privacy_cleanup_error: error.message, privacy_retention_category: c.kind }).catch(() => null);
        } else if (['expired_upload_intent','orphan_upload'].includes(c.kind)) {
          await base44.asServiceRole.entities.ApplicationUploadIntent.update(c.id, { status: 'purge_failed', rejected_reason: error.message }).catch(() => null);
        }
        await audit(base44, c.entity_type, c.id, 'privacy_lifecycle_purge_failed', user.id, { kind: c.kind, error: error.message }, 'critical');
      }
    }

    return Response.json({ success: failures.length === 0, purged_records: scopedCandidates.length - failures.length, failed_records: failures.length, deleted_files: deletedFiles, failures });
  } catch (error) {
    return Response.json({ error:error.message }, { status:500 });
  }
});