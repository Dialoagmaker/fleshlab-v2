/**
 * getApplicationFileSignedUrl
 * Admin-only. Returns a 15-minute signed GET URL for a private application media file in R2.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { S3Client, GetObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { r2_key } = body;
    if (!r2_key) {
      return Response.json({ error: 'r2_key is required' }, { status: 400 });
    }

    // Only allow application private files
    if (!r2_key.startsWith('applications/private/')) {
      return Response.json({ error: 'Invalid key path' }, { status: 400 });
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID'),
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY'),
      },
    });

    const command = new GetObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME'),
      Key: r2_key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 min

    return Response.json({ success: true, signed_url: signedUrl, expires_in: 900 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});