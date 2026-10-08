import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { format } from 'npm:date-fns@3.6.0';
import { S3Client, HeadObjectCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';

async function sha(value) {
  const data = new TextEncoder().encode(value || 'unknown');
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function resolveToken(base44, token) {
  const tokenHash = await sha(token);
  const records = await base44.asServiceRole.entities.ApplicationUploadToken.filter({ token_hash: tokenHash });
  const record = records?.[0];
  if (!record || record.status !== 'issued') return { error: 'Invalid or expired upload token', status: 403, tokenHash };
  if (new Date(record.expires_at) < new Date()) {
    await base44.asServiceRole.entities.ApplicationUploadToken.update(record.id, { status: 'expired', last_rejection_reason: 'expired' });
    return { error: 'Upload token has expired', status: 403, tokenHash };
  }
  const application = await base44.asServiceRole.entities.GuestProductionApplication.get(record.application_id).catch(() => null);
  if (!application) return { error: 'Application not found for upload token', status: 404, tokenHash };
  return { record, application, tokenHash };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token, r2_key, file_type, photo_index, intent_id } = await req.json();
    if (!token || !r2_key || !file_type || !intent_id) return Response.json({ error: 'Missing required fields: token, intent_id, r2_key, file_type' }, { status: 400 });

    const resolved = await resolveToken(base44, token);
    if (resolved.error) return Response.json({ error: resolved.error }, { status: resolved.status });
    const { application, tokenHash } = resolved;

    const intent = await base44.asServiceRole.entities.ApplicationUploadIntent.get(intent_id);
    if (!intent || intent.application_id !== application.id || intent.upload_token_hash !== tokenHash || intent.r2_key !== r2_key || intent.file_type !== file_type) return Response.json({ error: 'Upload intent verification failed' }, { status: 403 });
    if (intent.status !== 'issued') return Response.json({ error: 'Upload intent has already been used' }, { status: 409 });
    if (new Date(intent.expires_at) < new Date()) {
      await base44.asServiceRole.entities.ApplicationUploadIntent.update(intent.id, { status: 'expired' });
      return Response.json({ error: 'Upload intent has expired' }, { status: 403 });
    }

    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('R2_BUCKET_NAME');
    const r2 = new S3Client({ region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
    await r2.send(new HeadObjectCommand({ Bucket: bucketName, Key: r2_key }));

    const ts = format(new Date(), 'yyyy-MM-dd HH:mm');
    const updateData = {};
    let logMessage = '';
    switch (file_type) {
      case 'photo': {
        const existingPhotos = application.profile_photo_r2_keys || [];
        if (photo_index !== undefined && photo_index < existingPhotos.length) existingPhotos[photo_index] = r2_key; else existingPhotos.push(r2_key);
        updateData.profile_photo_r2_keys = [...new Set(existingPhotos)];
        logMessage = `Uploaded photo ${photo_index !== undefined ? photo_index + 1 : updateData.profile_photo_r2_keys.length}`;
        break;
      }
      case 'intro_video': updateData.intro_video_r2_key = r2_key; logMessage = 'Uploaded/replaced body video'; break;
      case 'hardcore_video': updateData.hardcore_video_r2_key = r2_key; logMessage = 'Uploaded/replaced performance video'; break;
      case 'id_document_front': updateData.id_document_r2_key = r2_key; updateData.id_document_front_r2_key = r2_key; logMessage = 'Uploaded ID front'; break;
      case 'id_document_back': updateData.id_document_back_r2_key = r2_key; logMessage = 'Uploaded ID back'; break;
      case 'selfie_with_id': updateData.selfie_with_id_r2_key = r2_key; logMessage = 'Uploaded selfie with ID'; break;
      default: return Response.json({ error: 'Invalid file_type' }, { status: 400 });
    }

    const newPhotos = updateData.profile_photo_r2_keys || application.profile_photo_r2_keys || [];
    const hasPhotos = newPhotos.length >= 5;
    const hasVideos = (updateData.intro_video_r2_key || application.intro_video_r2_key) && (updateData.hardcore_video_r2_key || application.hardcore_video_r2_key);
    const hasId = (updateData.id_document_r2_key || application.id_document_r2_key);
    updateData.media_upload_status = (hasPhotos && hasVideos) ? 'complete' : (newPhotos.length > 0 || updateData.intro_video_r2_key || updateData.hardcore_video_r2_key) ? 'partial' : 'none';
    updateData.compliance_upload_status = hasId ? 'uploaded' : 'none';
    updateData.last_activity_at = new Date().toISOString();
    updateData.contact_log = application.contact_log ? `${application.contact_log}\n\n[${ts}] ${logMessage} via upload token` : `[${ts}] ${logMessage} via upload token`;

    await base44.asServiceRole.entities.GuestProductionApplication.update(application.id, updateData);
    await base44.asServiceRole.entities.ApplicationUploadIntent.update(intent.id, { status: 'finalized', finalized_at: new Date().toISOString() });
    await base44.asServiceRole.entities.RecruitmentAuditLog.create({ subject_type: 'application', subject_id: application.id, action: 'token_upload_finalized', actor_type: 'applicant_token', severity: 'info', details_json: JSON.stringify({ file_type, intent_id }), created_at: new Date().toISOString() }).catch(() => null);
    return Response.json({ success: true, application_id: application.id, file_type, r2_key, intent_id, message: logMessage, ready_for_review: hasPhotos && hasVideos && hasId && !!(updateData.selfie_with_id_r2_key || application.selfie_with_id_r2_key) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});