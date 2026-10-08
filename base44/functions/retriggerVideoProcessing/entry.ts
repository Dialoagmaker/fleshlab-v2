import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { S3Client, GetObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { video_id } = await req.json();
    if (!video_id) {
      return Response.json({ error: 'Missing required field: video_id' }, { status: 400 });
    }

    // Find the source asset for this video
    const assets = await base44.entities.VideoAsset.filter({ video_id, asset_type: 'source' });
    const sourceAsset = assets[0];

    if (!sourceAsset || !sourceAsset.r2_key) {
      return Response.json({ error: 'No source asset found for this video' }, { status: 404 });
    }

    // Generate signed URL
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID'),
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY'),
      },
    });

    const signedUrl = await getSignedUrl(
      r2Client,
      new GetObjectCommand({ Bucket: Deno.env.get('R2_BUCKET_NAME'), Key: sourceAsset.r2_key }),
      { expiresIn: 3600 }
    );

    const processorWebhookUrl = Deno.env.get('PROCESSOR_WEBHOOK_URL');
    const processorSecret = Deno.env.get('PROCESSOR_API_KEY');
    const appBaseUrl = (Deno.env.get('APP_BASE_URL') || '').replace(/\/$/, '');
    // CORRECT BASE44 PATH - no /api/ prefix
    const callbackUrl = `${appBaseUrl}/functions/updateVideoProcessingResult?processor_key=${encodeURIComponent(processorSecret)}`;

    const keyParts = sourceAsset.r2_key.split('/');
    const studio = keyParts.length >= 2 ? keyParts[1] : 'default';
    // Use UUID directory as filename so output is unique per video (not shared "source.jpg")
    const originalFile = keyParts[keyParts.length - 1];
    const ext = originalFile.includes('.') ? originalFile.split('.').pop() : 'mov';
    const uuidDir = keyParts[keyParts.length - 2];
    const file = (uuidDir && uuidDir !== 'videos') ? `${uuidDir}.${ext}` : originalFile;

    const processorResponse = await fetch(`${processorWebhookUrl}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: processorSecret,
        studio,
        file,
        src_url: signedUrl,
        video_id,
        source_asset_id: sourceAsset.id,
        callback_url: callbackUrl,
      }),
    });

    if (!processorResponse.ok) {
      const errorText = await processorResponse.text();
      return Response.json({
        error: `Processor trigger failed: HTTP ${processorResponse.status}`,
        details: errorText,
      }, { status: 502 });
    }

    // NOTE: We do NOT pre-write expected URLs to the video entity here.
    // The updateVideoProcessingResult webhook will set correct URLs once the processor confirms completion.
    // Pre-writing causes wrong assets to appear while processing is ongoing.

    return Response.json({
      status: 'accepted',
      studio,
      file,
      basename: file.replace(/\.[^.]+$/, ''),
      source_r2_key: sourceAsset.r2_key,
      message: `Processor job accepted. Assets will update automatically via webhook when done. Source: ${sourceAsset.r2_key}`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});