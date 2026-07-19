import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { S3Client, HeadObjectCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';

const ALLOWED_PATHS = new Set(['managed_40','network_70','not_sure','beginner','existing','cam','studio','couple','unsure']);
const ALLOWED_MODELS = new Set(['standard_studio_60_performer_40','network_performer_70_studio_30','undecided']);
function emailOk(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim()); }
function bad(message, field = 'request') { return Response.json({ error: message, field }, { status: 400 }); }
function now() { return new Date().toISOString(); }
function getAllKeys(payload) { return [...(payload.profile_photo_r2_keys || []), payload.intro_video_r2_key, payload.hardcore_video_r2_key, payload.id_document_r2_key, payload.id_document_back_r2_key, payload.selfie_with_id_r2_key].filter(Boolean); }
async function objectExists(r2, bucket, key) { try { await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); return true; } catch { return false; } }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const applicantName = String(payload.applicant_name || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const path = payload.package_interest || 'not_sure';
    const revenueModel = payload.preferred_revenue_model || 'undecided';
    if (!applicantName) return bad('Name is required', 'applicant_name');
    if (!emailOk(email)) return bad('Valid email is required', 'email');
    if (!payload.nationality && !payload.source_country) return bad('Country is required', 'country');
    if (!ALLOWED_PATHS.has(path)) return bad('Invalid creator path', 'package_interest');
    if (!ALLOWED_MODELS.has(revenueModel)) return bad('Invalid revenue model', 'preferred_revenue_model');
    if (!payload.confirmed_18_plus && !payload.age_confirmed) return bad('18+ confirmation is required', 'confirmed_18_plus');
    if (!payload.confirmed_contact_consent && !payload.consent_review_materials) return bad('Review/contact consent is required', 'consent');

    const keys = getAllKeys(payload);
    const fullVerificationAttempt = keys.length > 0;
    if (fullVerificationAttempt) {
      if (!payload.application_session_id) return bad('Upload session is required', 'application_session_id');
      if ((payload.profile_photo_r2_keys || []).length < 5) return bad('At least 5 photos are required', 'profile_photo_r2_keys');
      if (!payload.intro_video_r2_key || !payload.hardcore_video_r2_key) return bad('Both required videos are required', 'videos');
      if (!payload.id_document_r2_key || !payload.selfie_with_id_r2_key) return bad('ID document and selfie are required', 'identity');
      const accountId = Deno.env.get('R2_ACCOUNT_ID'); const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID'); const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY'); const bucketName = Deno.env.get('R2_BUCKET_NAME');
      const r2 = new S3Client({ region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
      for (const key of keys) {
        const intents = await base44.asServiceRole.entities.ApplicationUploadIntent.filter({ application_session_id: payload.application_session_id, r2_key: key, status: 'issued' });
        if (!intents?.length) return bad('Upload ownership validation failed', 'uploads');
        if (new Date(intents[0].expires_at) < new Date()) return bad('Upload intent expired', 'uploads');
        if (!(await objectExists(r2, bucketName, key))) return bad('Uploaded object was not found', 'uploads');
      }
    }

    const hasPhotos = (payload.profile_photo_r2_keys || []).length >= 5;
    const hasVideos = payload.intro_video_r2_key && payload.hardcore_video_r2_key;
    const hasId = !!payload.id_document_r2_key;
    const initialStatus = (hasPhotos && hasVideos && hasId && payload.selfie_with_id_r2_key) ? 'pending' : 'media_pending';
    const application = await base44.asServiceRole.entities.GuestProductionApplication.create({
      applicant_name: applicantName, legal_name: payload.legal_name || applicantName, email,
      phone: payload.phone || null, nationality: payload.nationality || null, city: payload.city || null,
      experience: payload.experience || null, social_links: payload.social_links || null, interests: Array.isArray(payload.interests) ? payload.interests : [],
      package_interest: path, preferred_revenue_model: revenueModel, request_type: 'performer_application',
      source_page: payload.source_page || 'become_performer', source_country: payload.source_country || null, utm_source: payload.utm_source || null, utm_market: payload.utm_market || null, utm_campaign: payload.utm_campaign || null,
      profile_photo_r2_keys: payload.profile_photo_r2_keys || [], intro_video_r2_key: payload.intro_video_r2_key || null, hardcore_video_r2_key: payload.hardcore_video_r2_key || null, id_document_r2_key: payload.id_document_r2_key || null, id_document_back_r2_key: payload.id_document_back_r2_key || null, selfie_with_id_r2_key: payload.selfie_with_id_r2_key || null,
      media_upload_status: (hasPhotos && hasVideos) ? 'complete' : (keys.length ? 'partial' : 'none'), compliance_upload_status: hasId ? 'uploaded' : 'none',
      confirmed_18_plus: !!(payload.confirmed_18_plus || payload.age_confirmed), confirmed_contact_consent: !!(payload.confirmed_contact_consent || payload.consent_review_materials), consent_review_materials: !!(payload.consent_review_materials || payload.confirmed_contact_consent), consent_version: payload.consent_version || 'recruitment-2026-07', consented_at: now(),
      message: payload.message || null, status: initialStatus, submitted_at: now(), admin_notes: `Source: ${payload.source_page || 'become_performer'}\nCountry: ${payload.source_country || payload.nationality || 'Not specified'}\nPreferred Path: ${path}`,
    });

    for (const key of keys) {
      const intents = await base44.asServiceRole.entities.ApplicationUploadIntent.filter({ application_session_id: payload.application_session_id, r2_key: key, status: 'issued' });
      if (intents?.[0]) await base44.asServiceRole.entities.ApplicationUploadIntent.update(intents[0].id, { application_id: application.id, status: 'finalized', finalized_at: now() });
    }
    await base44.asServiceRole.entities.RecruitmentAuditLog.create({ subject_type: 'application', subject_id: application.id, action: 'application_submitted_validated', actor_type: 'public', severity: 'info', details_json: JSON.stringify({ initialStatus, fullVerificationAttempt }), created_at: now() }).catch(() => null);
    return Response.json({ success: true, application_id: application.id, status: initialStatus, message: 'Application submitted successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});