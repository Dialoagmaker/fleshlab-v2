/**
 * getApplicationFileSignedUrl
 * Generates a time-limited signed download URL for application files (ID docs, photos, videos).
 * Admin-only endpoint - verifies user is admin before generating URL.
 * Files are stored in private R2, never public CDN.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { S3Client, GetObjectCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.1057.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only check
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { application_id, r2_key } = body;

    if (!application_id || !r2_key) {
      return Response.json({ error: 'Missing required fields: application_id, r2_key' }, { status: 400 });
    }

    // Verify file belongs to the specified application
    const application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
    if (!application) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify the r2_key is actually associated with this application
    const allAppKeys = [
      ...(application.profile_photo_r2_keys || []),
      application.intro_video_r2_key,
      application.hardcore_video_r2_key,
      application.id_document_r2_key,
      application.id_document_front_r2_key,
      application.id_document_back_r2_key,
      application.selfie_with_id_r2_key,
    ].filter(Boolean);

    if (!allAppKeys.includes(r2_key)) {
      return Response.json({ error: 'File does not belong to this application' }, { status: 403 });
    }

    // Get R2 credentials
    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('R2_BUCKET_NAME');

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    // Generate signed URL (1 hour expiry)
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: r2_key
    });

    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

    // Log the access
    const ts = new Date().toISOString();
    const existingLog = application.contact_log || '';
    await base44.asServiceRole.entities.GuestProductionApplication.update(application.id, {
      contact_log: `${existingLog}\n\n[${ts}] Admin accessed file: ${r2_key.split('/').pop()}`
    });

    return Response.json({
      signed_url: signedUrl,
      expires_in: 3600,
      filename: r2_key.split('/').pop(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});