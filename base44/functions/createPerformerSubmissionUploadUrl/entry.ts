import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.1057.0';

// Public endpoint — performer token auth (not Base44 user auth)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    
    const { 
      performer_id, 
      performer_token,
      title, 
      content_type, 
      file_name, 
      file_size_bytes, 
      mime_type 
    } = body;

    // Validate performer session
    if (!performer_id || !performer_token) {
      return Response.json({ error: 'Missing performer_id or performer_token' }, { status: 400 });
    }

    // Verify session exists and is valid
    const sessions = await base44.asServiceRole.entities.PerformerSession.filter({
      performer_id,
      token: performer_token,
      revoked: false
    });

    if (!sessions || sessions.length === 0) {
      return Response.json({ error: 'Invalid or expired performer session' }, { status: 401 });
    }

    const session = sessions[0];
    
    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      return Response.json({ error: 'Session expired' }, { status: 401 });
    }

    // Get performer record
    const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
    if (!performer) {
      return Response.json({ error: 'Performer not found' }, { status: 404 });
    }

    // Validate required fields
    if (!title || !content_type || !file_name || !file_size_bytes) {
      return Response.json({ 
        error: 'Missing required fields: title, content_type, file_name, file_size_bytes' 
      }, { status: 400 });
    }

    // Validate file size (max 2GB)
    if (file_size_bytes > 2 * 1024 * 1024 * 1024) {
      return Response.json({ error: 'File size exceeds 2GB limit' }, { status: 400 });
    }

    // Validate file type
    const lowerFileName = file_name.toLowerCase();
    const isVideo = lowerFileName.endsWith('.mp4') || lowerFileName.endsWith('.mov') || lowerFileName.endsWith('.m4v');
    const isImage = lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg') || 
                    lowerFileName.endsWith('.png') || lowerFileName.endsWith('.webp');

    if (!isVideo && !isImage) {
      return Response.json({ 
        error: 'Invalid file type. Accepted: MP4, MOV, M4V, JPG, PNG, WEBP' 
      }, { status: 400 });
    }

    // Generate R2 object key FIRST (private folder)
    const timestamp = Date.now();
    const safeFileName = file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const r2ObjectKey = `performer-submissions/${performer_id}/raw/${timestamp}-${safeFileName}`;

    // Create ContentSubmission record WITH r2_object_key
    const submission = await base44.asServiceRole.entities.ContentSubmission.create({
      performer_id,
      linked_user_id: performer.user_id,
      title,
      description: body.description || '',
      content_type,
      file_name,
      file_size_bytes,
      mime_type: mime_type || 'application/octet-stream',
      r2_object_key: r2ObjectKey,
      upload_status: 'pending_upload',
      review_status: 'pending_review'
    });

    // Get R2 bucket info
    const bucketName = Deno.env.get('R2_BUCKET_NAME') || 'fleshlab-v2';
    const r2AccountId = Deno.env.get('R2_ACCOUNT_ID');

    if (!r2AccountId) {
      return Response.json({ 
        error: 'R2 configuration missing' 
      }, { status: 500 });
    }

    // Generate signed upload URL using AWS SDK
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') || ''
      }
    });

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: r2ObjectKey,
      ContentType: mime_type || 'application/octet-stream',
      ContentLength: file_size_bytes
    });

    // Generate signed URL (1 hour expiry for upload)
    const signedUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 3600 });

    return Response.json({
      success: true,
      submission_id: submission.id,
      upload_url: signedUrl,
      r2_object_key: r2ObjectKey,
      expires_in: 3600
    });

  } catch (error) {
    console.error('createPerformerSubmissionUploadUrl error:', error);
    return Response.json({ 
      error: 'Failed to create upload URL: ' + error.message 
    }, { status: 500 });
  }
});