import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'npm:uuid';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { performer_id, file_name, file_size_bytes, mime_type } = body;

    if (!performer_id || !file_name || !file_size_bytes || !mime_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (file_size_bytes > 50 * 1024 * 1024) {
      return Response.json({ error: 'File exceeds 50MB limit' }, { status: 400 });
    }

    const allowedMimeTypes = [
      'application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedMimeTypes.includes(mime_type)) {
      return Response.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID'),
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY'),
      },
    });

    const extension = file_name.split('.').pop() || 'pdf';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const r2Key = `fleshlab/performers/${performer_id}/compliance/${timestamp}-${uuidv4()}.${extension}`;

    const putCommand = new PutObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME'),
      Key: r2Key,
      ContentType: mime_type,
    });

    const uploadUrl = await getSignedUrl(r2Client, putCommand, { expiresIn: 3600 });

    return Response.json({
      upload_url: uploadUrl,
      r2_key: r2Key,
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});