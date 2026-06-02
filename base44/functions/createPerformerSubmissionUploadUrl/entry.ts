import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { performer_id, performer_token, title, content_type, file_name, file_size_bytes, mime_type } = body;

    // Validate performer session token
    if (!performer_id || !performer_token) {
      return Response.json({ error: 'Unauthorized - performer session required' }, { status: 401 });
    }

    // Create Base44 client for service-role operations (not requiring user auth)
    const base44 = createClientFromRequest(req);

    // Verify the session token is valid
    const sessions = await base44.asServiceRole.entities.PerformerSession.filter({
      performer_id,
      token: performer_token,
      revoked: false
    });

    if (!sessions || sessions.length === 0) {
      return Response.json({ error: 'Invalid or expired performer session' }, { status: 401 });
    }

    const session = sessions[0];
    if (new Date(session.expires_at) < new Date()) {
      return Response.json({ error: 'Performer session expired' }, { status: 401 });
    }

    // Get performer by ID
    const performer = await base44.asServiceRole.entities.Performer.get(performer_id);

    if (!performer) {
      return Response.json({ error: 'Performer profile not found' }, { status: 404 });
    }

    // Validate required fields
    if (!title || !content_type || !file_name || !file_size_bytes) {
      return Response.json({ 
        error: 'Missing required fields: title, content_type, file_name, file_size_bytes' 
      }, { status: 400 });
    }

    // Validate file size (max 2GB)
    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
    if (file_size_bytes > MAX_FILE_SIZE) {
      return Response.json({ 
        error: 'File size exceeds maximum limit of 2GB' 
      }, { status: 400 });
    }

    // Validate content type
    const validContentTypes = ['raw_video', 'photos', 'behind_the_scenes', 'fanclub_preview', 'other'];
    if (!validContentTypes.includes(content_type)) {
      return Response.json({ 
        error: 'Invalid content_type. Must be one of: ' + validContentTypes.join(', ') 
      }, { status: 400 });
    }

    // Validate file extension based on content type
    const lowerFileName = file_name.toLowerCase();
    const isVideo = lowerFileName.endsWith('.mp4') || lowerFileName.endsWith('.mov') || lowerFileName.endsWith('.m4v');
    const isImage = lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg') || 
                    lowerFileName.endsWith('.png') || lowerFileName.endsWith('.webp');

    if (!isVideo && !isImage) {
      return Response.json({ 
        error: 'Invalid file type. Accepted: MP4, MOV, M4V, JPG, PNG, WEBP' 
      }, { status: 400 });
    }

    // Create ContentSubmission record
    const submission = await base44.asServiceRole.entities.ContentSubmission.create({
      performer_id,
      linked_user_id: performer.user_id,
      title,
      description: body.description || '',
      content_type,
      file_name,
      file_size_bytes,
      mime_type: mime_type || 'application/octet-stream',
      upload_status: 'pending_upload',
      review_status: 'pending_review'
    });

    // Generate R2 object key (private folder)
    const timestamp = Date.now();
    const safeFileName = file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const r2ObjectKey = `performer-submissions/${performer_id}/${submission.id}/raw/${timestamp}-${safeFileName}`;

    // Get R2 bucket info
    const bucketName = Deno.env.get('R2_BUCKET_NAME') || 'fleshlab-v2';
    const r2AccountId = Deno.env.get('R2_ACCOUNT_ID');

    if (!r2AccountId) {
      return Response.json({ 
        error: 'R2 configuration missing' 
      }, { status: 500 });
    }

    // Generate signed upload URL using AWS SDK
    const { S3Client, PutObjectCommand } = await import('npm:@aws-sdk/client-s3@3.1057.0');
    const { getSignedUrl } = await import('npm:@aws-sdk/s3-request-presigner@3.1057.0');

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

    // Update submission with R2 key
    await base44.asServiceRole.entities.ContentSubmission.update(submission.id, {
      r2_object_key: r2ObjectKey,
      upload_status: 'pending_upload'
    });

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