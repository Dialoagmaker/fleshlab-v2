/**
 * createApplicationUploadUrl
 * Generates a pre-signed PUT URL to upload application media directly to private R2.
 * No auth required (public applicants). Files go to a private prefix, never public CDN.
 */
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';

const ALLOWED_FILE_TYPES = {
  photo: { mimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 20 * 1024 * 1024, prefix: 'photos' },
  intro_video: { mimes: ['video/mp4', 'video/quicktime', 'video/webm'], maxBytes: 2 * 1024 * 1024 * 1024, prefix: 'videos' },
  hardcore_video: { mimes: ['video/mp4', 'video/quicktime', 'video/webm'], maxBytes: 2 * 1024 * 1024 * 1024, prefix: 'videos' },
  id_document: { mimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], maxBytes: 20 * 1024 * 1024, prefix: 'id_docs' },
  id_document_back: { mimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], maxBytes: 20 * 1024 * 1024, prefix: 'id_docs' },
  id_selfie: { mimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 20 * 1024 * 1024, prefix: 'id_docs' },
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { application_session_id, file_type, file_name, file_size_bytes, mime_type } = body;

    if (!application_session_id || !file_type || !file_name || !file_size_bytes || !mime_type) {
      return Response.json({ error: 'Missing required fields: application_session_id, file_type, file_name, file_size_bytes, mime_type' }, { status: 400 });
    }

    const config = ALLOWED_FILE_TYPES[file_type];
    if (!config) {
      return Response.json({ error: `Invalid file_type. Allowed: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}` }, { status: 400 });
    }
    if (!config.mimes.includes(mime_type)) {
      return Response.json({ error: `Invalid MIME type for ${file_type}` }, { status: 400 });
    }
    if (file_size_bytes > config.maxBytes) {
      return Response.json({ error: `File too large for ${file_type}` }, { status: 400 });
    }

    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('R2_BUCKET_NAME');

    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    const ext = file_name.split('.').pop() || 'bin';
    const safeSession = application_session_id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
    const timestamp = Date.now();
    const r2Key = `applications/private/${safeSession}/${config.prefix}/${timestamp}_${file_type}.${ext}`;

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      ContentType: mime_type,
      ContentLength: file_size_bytes,
    });

    const uploadUrl = await getSignedUrl(r2Client, putCommand, { expiresIn: 3600 });

    return Response.json({ upload_url: uploadUrl, r2_key: r2Key, expires_in: 3600 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});