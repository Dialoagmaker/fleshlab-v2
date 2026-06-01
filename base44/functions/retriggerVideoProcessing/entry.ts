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

    const keyParts = sourceAsset.r2_key.split('/');
    const studio = keyParts.length >= 2 ? keyParts[1] : 'default';
    const file = keyParts[keyParts.length - 1];
    const basename = file.replace(/\.[^.]+$/, '');

    const processorResponse = await fetch(`${processorWebhookUrl}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: processorSecret, studio, file, src_url: signedUrl }),
    });

    if (!processorResponse.ok) {
      const errorText = await processorResponse.text();
      return Response.json({
        error: `Processor trigger failed: HTTP ${processorResponse.status}`,
        details: errorText,
      }, { status: 502 });
    }

    // Pre-compute expected CDN URLs and store on video
    const cdnBase = (Deno.env.get('R2_PUBLIC_BUCKET_URL') || '').replace(/\/$/, '');
    const expectedThumbnailUrl = `${cdnBase}/studios/${studio}/thumbnails/${basename}.jpg`;
    const expectedPreviewUrl = `${cdnBase}/studios/${studio}/previews/${basename}-preview.mp4`;

    await base44.entities.Video.update(video_id, {
      primary_thumbnail_url: expectedThumbnailUrl,
      trailer_url: expectedPreviewUrl,
    });

    // Upsert thumbnail asset
    const existingThumb = await base44.entities.VideoAsset.filter({ video_id, asset_type: 'thumbnail' });
    if (existingThumb.length > 0) {
      await base44.entities.VideoAsset.update(existingThumb[0].id, { cdn_url: expectedThumbnailUrl, status: 'processing' });
    } else {
      await base44.entities.VideoAsset.create({ video_id, asset_type: 'thumbnail', r2_key: `studios/${studio}/thumbnails/${basename}.jpg`, cdn_url: expectedThumbnailUrl, status: 'processing' });
    }

    // Upsert preview asset
    const existingPreview = await base44.entities.VideoAsset.filter({ video_id, asset_type: 'preview' });
    if (existingPreview.length > 0) {
      await base44.entities.VideoAsset.update(existingPreview[0].id, { cdn_url: expectedPreviewUrl, status: 'processing' });
    } else {
      await base44.entities.VideoAsset.create({ video_id, asset_type: 'preview', r2_key: `studios/${studio}/previews/${basename}-preview.mp4`, cdn_url: expectedPreviewUrl, status: 'processing' });
    }

    return Response.json({
      status: 'accepted',
      studio,
      file,
      expected_thumbnail_url: expectedThumbnailUrl,
      expected_preview_url: expectedPreviewUrl,
      message: 'Processor accepted job. Assets will be available shortly.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});