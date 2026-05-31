import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { S3Client, HeadObjectCommand } from 'npm:@aws-sdk/client-s3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Initialize R2 client
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID'),
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY'),
      },
    });

    // Check if file exists in R2
    const r2Key = 'fleshlab/6a1ca4cdc29d96ab4c624c98/videos/edf77241-8890-4aa5-8c64-975710fd33a0/source.mov';
    
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: Deno.env.get('R2_BUCKET_NAME'),
        Key: r2Key,
      });
      const headResult = await r2Client.send(headCommand);
      
      return Response.json({
        exists: true,
        content_length: headResult.ContentLength,
        content_type: headResult.ContentType,
        last_modified: headResult.LastModified,
        etag: headResult.ETag,
      });
    } catch (r2Error) {
      return Response.json({
        exists: false,
        error: r2Error.name === 'NotFound' ? 'File not found in R2' : r2Error.message,
        error_name: r2Error.name,
      });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});