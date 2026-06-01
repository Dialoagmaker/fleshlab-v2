import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { S3Client, HeadObjectCommand, GetObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { asset_id, video_id } = body;

    if (!asset_id || !video_id) {
      return Response.json({ error: 'Missing required fields: asset_id, video_id' }, { status: 400 });
    }

    // Fetch asset to get R2 key
    const asset = await base44.entities.VideoAsset.get(asset_id);
    if (!asset) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
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

    // Verify file exists in R2
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: Deno.env.get('R2_BUCKET_NAME'),
        Key: asset.r2_key,
      });
      const headResult = await r2Client.send(headCommand);

      await base44.entities.VideoAsset.update(asset_id, {
        status: 'uploaded',
        file_size_bytes: headResult.ContentLength || asset.file_size_bytes,
      });
    } catch (r2Error) {
      if (r2Error.name === 'NotFound' || r2Error.$metadata?.httpStatusCode === 404) {
        return Response.json({
          error: 'File not found in R2. Upload may have failed or expired.',
          retry_allowed: true
        }, { status: 404 });
      }
      throw r2Error;
    }

    // Create JobQueue entry
    const job = await base44.entities.JobQueue.create({
      job_type: 'process_video',
      status: 'pending',
      priority: 5,
      payload: JSON.stringify({ video_id, source_asset_id: asset_id, source_r2_key: asset.r2_key }),
      entity_type: 'Video',
      entity_id: video_id,
      retry_count: 0,
    });

    // Generate signed URL for processor to download source
    const getCommand = new GetObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME'),
      Key: asset.r2_key,
    });
    const sourceSignedUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 3600 });

    const processorWebhookUrl = Deno.env.get('PROCESSOR_WEBHOOK_URL');
    const processorSecret = Deno.env.get('PROCESSOR_API_KEY');

    // Derive studio and file from r2_key (format: fleshlab/{studio}/videos/{uuid}/source.mov)
    const keyParts = asset.r2_key.split('/');
    const studio = keyParts.length >= 2 ? keyParts[1] : 'default';
    const originalFile = keyParts[keyParts.length - 1];
    const ext = originalFile.includes('.') ? originalFile.split('.').pop() : 'mov';
    const uuidDir = keyParts[keyParts.length - 2];
    // Use UUID as filename so each video gets unique output (not shared "source.jpg")
    const file = (uuidDir && uuidDir !== 'videos') ? `${uuidDir}.${ext}` : originalFile;
    const basename = file.replace(/\.[^.]+$/, '');

    // Trigger processor — POST /regenerate with secret in body
    const processorPayload = {
      secret: processorSecret,
      studio,
      file,
      src_url: sourceSignedUrl,
    };

    let processorStatus = 'unknown';

    const processorResponse = await fetch(`${processorWebhookUrl}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(processorPayload),
    });

    processorStatus = processorResponse.status;

    if (!processorResponse.ok) {
      const errorText = await processorResponse.text();
      console.error('Processor trigger failed:', processorResponse.status, errorText);
      await base44.entities.JobQueue.update(job.id, {
        status: 'failed',
        error_message: `Processor responded with ${processorResponse.status}: ${errorText}`,
        completed_at: new Date().toISOString(),
      });
      return Response.json({
        error: `Processor trigger failed: HTTP ${processorResponse.status}`,
        details: errorText,
        job_id: job.id,
      }, { status: 502 });
    }

    console.log('Processor accepted job (202):', studio, file);

    // Pre-compute expected CDN URLs — processor uploads to these paths in R2
    const cdnBase = (Deno.env.get('R2_PUBLIC_BUCKET_URL') || '').replace(/\/$/, '');
    const expectedThumbnailUrl = `${cdnBase}/studios/${studio}/thumbnails/${basename}.jpg`;
    const expectedPreviewUrl = `${cdnBase}/studios/${studio}/previews/${basename}-preview.mp4`;

    // Store expected URLs on video entity
    await base44.entities.Video.update(video_id, {
      primary_thumbnail_url: expectedThumbnailUrl,
      trailer_url: expectedPreviewUrl,
    });

    // Create VideoAsset entries for thumbnail and preview
    await base44.entities.VideoAsset.create({
      video_id,
      asset_type: 'thumbnail',
      r2_key: `studios/${studio}/thumbnails/${basename}.jpg`,
      cdn_url: expectedThumbnailUrl,
      status: 'processing',
    });
    await base44.entities.VideoAsset.create({
      video_id,
      asset_type: 'preview',
      r2_key: `studios/${studio}/previews/${basename}-preview.mp4`,
      cdn_url: expectedPreviewUrl,
      status: 'processing',
    });

    // Update job to running
    await base44.entities.JobQueue.update(job.id, {
      status: 'running',
      started_at: new Date().toISOString(),
    });

    return Response.json({
      status: 'queued',
      job_id: job.id,
      processor_http_status: processorStatus,
      studio,
      file,
      expected_thumbnail_url: expectedThumbnailUrl,
      expected_preview_url: expectedPreviewUrl,
      message: 'Upload verified. Processor accepted job (async).',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});