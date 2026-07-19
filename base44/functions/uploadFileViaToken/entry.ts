import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.1057.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const ALLOWED_FILE_TYPES = {
  photo: { mimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 20 * 1024 * 1024, prefix: 'photos', maxPerHour: 12 },
  intro_video: { mimes: ['video/mp4', 'video/quicktime', 'video/webm'], maxBytes: 2 * 1024 * 1024 * 1024, prefix: 'videos', maxPerHour: 3 },
  hardcore_video: { mimes: ['video/mp4', 'video/quicktime', 'video/webm'], maxBytes: 2 * 1024 * 1024 * 1024, prefix: 'videos', maxPerHour: 3 },
  id_document_front: { mimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], maxBytes: 20 * 1024 * 1024, prefix: 'id_docs', maxPerHour: 3 },
  id_document_back: { mimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], maxBytes: 20 * 1024 * 1024, prefix: 'id_docs', maxPerHour: 3 },
  selfie_with_id: { mimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 20 * 1024 * 1024, prefix: 'id_docs', maxPerHour: 3 },
};

async function sha(value) {
  const data = new TextEncoder().encode(value || 'unknown');
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
}
function hourWindow() { return new Date(Math.floor(Date.now() / 3600000) * 3600000).toISOString(); }
async function rateLimit(base44, key, max) {
  const window_start = hourWindow();
  const found = await base44.asServiceRole.entities.RecruitmentRateLimit.filter({ rate_key: key, window_start });
  if (found?.length) {
    const row = found[0];
    if ((row.count || 0) >= max) return false;
    await base44.asServiceRole.entities.RecruitmentRateLimit.update(row.id, { count: (row.count || 0) + 1, last_seen_at: new Date().toISOString() });
    return true;
  }
  await base44.asServiceRole.entities.RecruitmentRateLimit.create({ rate_key: key, window_start, count: 1, last_seen_at: new Date().toISOString() });
  return true;
}

async function resolveToken(base44, token, requestedApplicationId) {
  const tokenHash = await sha(token);
  const records = await base44.asServiceRole.entities.ApplicationUploadToken.filter({ token_hash: tokenHash });
  const record = records?.[0];
  if (!record) return { error: 'Invalid or expired upload token', status: 403, tokenHash };
  if (requestedApplicationId && record.application_id !== requestedApplicationId) return { error: 'Token does not belong to this application', status: 403, tokenHash, record };
  if (record.status !== 'issued') return { error: 'Upload token is not active', status: 403, tokenHash, record };
  if (new Date(record.expires_at) < new Date()) {
    await base44.asServiceRole.entities.ApplicationUploadToken.update(record.id, { status: 'expired', last_rejection_reason: 'expired' });
    return { error: 'Upload token has expired', status: 403, tokenHash, record };
  }
  const application = await base44.asServiceRole.entities.GuestProductionApplication.get(record.application_id).catch(() => null);
  if (!application) return { error: 'Application not found for upload token', status: 404, tokenHash, record };
  await base44.asServiceRole.entities.ApplicationUploadToken.update(record.id, {
    last_validated_at: new Date().toISOString(),
    validation_count: (record.validation_count || 0) + 1,
  });
  return { record, application, tokenHash };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token, application_id, file_type, file_name, file_size_bytes, mime_type, photo_index, validate_only } = await req.json();
    if (!token) return Response.json({ error: 'Missing upload token' }, { status: 400 });
    if (!validate_only && (!file_type || !file_name || !file_size_bytes || !mime_type)) return Response.json({ error: 'Missing required upload fields' }, { status: 400 });

    const resolved = await resolveToken(base44, token, application_id);
    if (resolved.error) return Response.json({ error: resolved.error }, { status: resolved.status });
    const { record, application, tokenHash } = resolved;
    const allowedScope = record.allowed_upload_scope || [];

    if (validate_only) return Response.json({ success: true, application_id: application.id, token_id: record.id, token_expires_at: record.expires_at, allowed_upload_scope: allowedScope });
    if (allowedScope.length && !allowedScope.includes(file_type)) return Response.json({ error: 'Upload type is not allowed for this token' }, { status: 403 });

    const config = ALLOWED_FILE_TYPES[file_type];
    if (!config || !config.mimes.includes(mime_type) || file_size_bytes <= 0 || file_size_bytes > config.maxBytes) return Response.json({ error: 'Invalid upload request' }, { status: 400 });

    const ipHash = await sha(req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown');
    if (!(await rateLimit(base44, `token-upload:ip:${ipHash}`, 80))) return Response.json({ error: 'Upload rate limit exceeded' }, { status: 429 });
    if (!(await rateLimit(base44, `token-upload:token:${tokenHash}`, 25))) return Response.json({ error: 'Token upload limit exceeded' }, { status: 429 });
    if (!(await rateLimit(base44, `token-upload:type:${tokenHash}:${file_type}`, config.maxPerHour))) return Response.json({ error: 'Upload type limit exceeded' }, { status: 429 });

    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('R2_BUCKET_NAME');
    const r2Client = new S3Client({ region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
    const ext = String(file_name).split('.').pop()?.replace(/[^a-zA-Z0-9]/g,'').slice(0,8) || 'bin';
    const appId = application.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
    const suffix = file_type === 'photo' ? `photo_${photo_index ?? 0}` : file_type;
    const r2Key = `applications/private/${appId}/${config.prefix}/${Date.now()}_${crypto.randomUUID()}_${suffix}.${ext}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const intent = await base44.asServiceRole.entities.ApplicationUploadIntent.create({ application_id: application.id, upload_token_hash: tokenHash, r2_key: r2Key, file_type, file_name: String(file_name).slice(0,180), mime_type, file_size_bytes, status: 'issued', expires_at: expiresAt, issued_ip_hash: ipHash });
    const uploadUrl = await getSignedUrl(r2Client, new PutObjectCommand({ Bucket: bucketName, Key: r2Key, ContentType: mime_type, ContentLength: file_size_bytes }), { expiresIn: 900 });
    return Response.json({ upload_url: uploadUrl, r2_key: r2Key, intent_id: intent.id, expires_in: 900, application_id: application.id, file_type });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});