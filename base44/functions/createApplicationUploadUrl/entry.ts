import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.1057.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const ALLOWED_FILE_TYPES = {
  photo: { mimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 20 * 1024 * 1024, prefix: 'photos', maxPerSession: 12 },
  intro_video: { mimes: ['video/mp4', 'video/quicktime', 'video/webm'], maxBytes: 2 * 1024 * 1024 * 1024, prefix: 'videos', maxPerSession: 3 },
  hardcore_video: { mimes: ['video/mp4', 'video/quicktime', 'video/webm'], maxBytes: 2 * 1024 * 1024 * 1024, prefix: 'videos', maxPerSession: 3 },
  id_document: { mimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], maxBytes: 20 * 1024 * 1024, prefix: 'id_docs', maxPerSession: 3 },
  id_document_back: { mimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], maxBytes: 20 * 1024 * 1024, prefix: 'id_docs', maxPerSession: 3 },
  id_selfie: { mimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 20 * 1024 * 1024, prefix: 'id_docs', maxPerSession: 3 },
};

async function sha(value) { const data = new TextEncoder().encode(value || 'unknown'); const digest = await crypto.subtle.digest('SHA-256', data); return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0,32); }
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { application_session_id, file_type, file_name, file_size_bytes, mime_type } = body;
    if (!application_session_id || !file_type || !file_name || !file_size_bytes || !mime_type) return Response.json({ error: 'Missing required upload fields' }, { status: 400 });
    const config = ALLOWED_FILE_TYPES[file_type];
    if (!config) return Response.json({ error: 'Invalid file_type' }, { status: 400 });
    if (!config.mimes.includes(mime_type)) return Response.json({ error: 'Invalid MIME type' }, { status: 400 });
    if (file_size_bytes > config.maxBytes || file_size_bytes <= 0) return Response.json({ error: 'Invalid file size' }, { status: 400 });

    const safeSession = String(application_session_id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
    if (safeSession.length < 8) return Response.json({ error: 'Invalid upload session' }, { status: 400 });
    const ipHash = await sha(req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown');
    const sessionHash = await sha(safeSession);
    if (!(await rateLimit(base44, `upload:ip:${ipHash}`, 80))) return Response.json({ error: 'Upload rate limit exceeded' }, { status: 429 });
    if (!(await rateLimit(base44, `upload:session:${sessionHash}`, 25))) return Response.json({ error: 'Upload session limit exceeded' }, { status: 429 });
    if (!(await rateLimit(base44, `upload:type:${sessionHash}:${file_type}`, config.maxPerSession))) return Response.json({ error: 'Upload type limit exceeded' }, { status: 429 });

    const accountId = Deno.env.get('R2_ACCOUNT_ID'); const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID'); const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY'); const bucketName = Deno.env.get('R2_BUCKET_NAME');
    const r2Client = new S3Client({ region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
    const ext = String(file_name).split('.').pop()?.replace(/[^a-zA-Z0-9]/g,'').slice(0,8) || 'bin';
    const r2Key = `applications/private/${safeSession}/${config.prefix}/${Date.now()}_${crypto.randomUUID()}_${file_type}.${ext}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const intent = await base44.asServiceRole.entities.ApplicationUploadIntent.create({ application_session_id: safeSession, r2_key: r2Key, file_type, file_name: String(file_name).slice(0,180), mime_type, file_size_bytes, status: 'issued', expires_at: expiresAt, issued_ip_hash: ipHash });
    const uploadUrl = await getSignedUrl(r2Client, new PutObjectCommand({ Bucket: bucketName, Key: r2Key, ContentType: mime_type, ContentLength: file_size_bytes }), { expiresIn: 900 });
    await base44.asServiceRole.entities.RecruitmentAuditLog.create({ subject_type: 'upload_intent', subject_id: intent.id, action: 'upload_intent_issued', actor_type: 'public', severity: 'info', details_json: JSON.stringify({ file_type, size: file_size_bytes }), created_at: new Date().toISOString() }).catch(() => null);
    return Response.json({ upload_url: uploadUrl, r2_key: r2Key, intent_id: intent.id, expires_in: 900 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});