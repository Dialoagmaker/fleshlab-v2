/**
 * uploadFileViaToken
 * Allows applicants to upload files using a secure token (no login required).
 * Validates token, checks expiration, and uploads directly to private R2.
 * Updates the same GuestProductionApplication record with new file keys.
 */
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_FILE_TYPES = {
  photo: { mimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 20 * 1024 * 1024, prefix: 'photos' },
  intro_video: { mimes: ['video/mp4', 'video/quicktime', 'video/webm'], maxBytes: 2 * 1024 * 1024 * 1024, prefix: 'videos' },
  hardcore_video: { mimes: ['video/mp4', 'video/quicktime', 'video/webm'], maxBytes: 2 * 1024 * 1024 * 1024, prefix: 'videos' },
  id_document_front: { mimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], maxBytes: 20 * 1024 * 1024, prefix: 'id_docs' },
  id_document_back: { mimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], maxBytes: 20 * 1024 * 1024, prefix: 'id_docs' },
  selfie_with_id: { mimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 20 * 1024 * 1024, prefix: 'id_docs' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const body = await req.json();
    const { token, file_type, file_name, file_size_bytes, mime_type, photo_index } = body;

    if (!token || !file_type || !file_name || !file_size_bytes || !mime_type) {
      return Response.json({ error: 'Missing required fields: token, file_type, file_name, file_size_bytes, mime_type' }, { status: 400 });
    }

    // Find application by token
    const applications = await base44.asServiceRole.entities.GuestProductionApplication.filter({
      application_upload_token: token,
    });

    if (!applications || applications.length === 0) {
      return Response.json({ error: 'Invalid or expired upload token' }, { status: 403 });
    }

    const application = applications[0];

    // Check expiration
    if (application.application_upload_token_expires_at) {
      const expiresAt = new Date(application.application_upload_token_expires_at);
      if (expiresAt < new Date()) {
        return Response.json({ error: 'Upload token has expired' }, { status: 403 });
      }
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

    // Build R2 key path
    const ext = file_name.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const appId = application.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
    
    let r2Key;
    if (file_type === 'photo') {
      const idx = photo_index !== undefined ? photo_index : application.profile_photo_r2_keys?.length || 0;
      r2Key = `applications/private/${appId}/${config.prefix}/${timestamp}_photo_${idx}.${ext}`;
    } else {
      r2Key = `applications/private/${appId}/${config.prefix}/${timestamp}_${file_type}.${ext}`;
    }

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      ContentType: mime_type,
      ContentLength: file_size_bytes,
    });

    const uploadUrl = await getSignedUrl(r2Client, putCommand, { expiresIn: 3600 });

    return Response.json({ 
      upload_url: uploadUrl, 
      r2_key: r2Key, 
      expires_in: 3600,
      application_id: application.id,
      file_type,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});