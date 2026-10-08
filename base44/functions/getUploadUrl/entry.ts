import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'npm:uuid';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { performer_id, file_name, file_size_bytes, mime_type } = await req.json();

    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID'),
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY'),
      },
    });

    const ext = file_name.split('.').pop() || 'pdf';
    const r2_key = `fleshlab/performers/${performer_id}/compliance/${Date.now()}-${uuidv4()}.${ext}`;

    const cmd = new PutObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME'),
      Key: r2_key,
      ContentType: mime_type,
    });

    const url = await getSignedUrl(r2Client, cmd, { expiresIn: 3600 });

    return Response.json({ upload_url: url, r2_key });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});