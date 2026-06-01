// getComplianceDocumentSignedUrl — Generate time-limited signed URL for viewing compliance documents
// Admin-only function to generate signed GET URLs for private R2 objects

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { S3Client, GetObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { r2_key } = body;

    if (!r2_key) {
      return Response.json({ error: 'r2_key is required' }, { status: 400 });
    }

    // Get R2 credentials from secrets
    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('R2_BUCKET_NAME');

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return Response.json({ error: 'R2 configuration missing' }, { status: 500 });
    }

    // Initialize S3 client for R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    // Generate signed GET URL (valid for 15 minutes)
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: r2_key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return Response.json({
      success: true,
      signed_url: signedUrl,
      expires_in: 900, // 15 minutes
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});