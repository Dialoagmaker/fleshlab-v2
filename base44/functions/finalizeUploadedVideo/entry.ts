import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { S3Client, HeadObjectCommand } from 'npm:@aws-sdk/client-s3';

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
      
      // Update asset with actual file size from R2
      await base44.entities.VideoAsset.update(asset_id, {
        status: 'uploaded',
        file_size_bytes: headResult.ContentLength || asset.file_size_bytes,
      });
    } catch (r2Error) {
      if (r2Error.name === 'NotFound') {
        return Response.json({ 
          error: 'File not found in R2. Upload may have failed or expired.',
          retry_allowed: true
        }, { status: 404 });
      }
      throw r2Error;
    }

    // Create JobQueue entry for processing
    const jobPayload = {
      video_id,
      source_asset_id: asset_id,
      source_r2_key: asset.r2_key,
      action: 'process_video',
    };

    const job = await base44.entities.JobQueue.create({
      job_type: 'process_video',
      status: 'pending',
      priority: 5,
      payload: JSON.stringify(jobPayload),
      entity_type: 'Video',
      entity_id: video_id,
      retry_count: 0,
    });

    // Trigger external processor (fire-and-forget)
    const processorWebhookUrl = Deno.env.get('PROCESSOR_WEBHOOK_URL');
    const processorApiKey = Deno.env.get('PROCESSOR_API_KEY');
    const publicBucketUrl = Deno.env.get('R2_PUBLIC_BUCKET_URL');

    // Generate signed GET URL for processor to download source
    const { GetObjectCommand } = await import('npm:@aws-sdk/client-s3');
    const { getSignedUrl } = await import('npm:@aws-sdk/s3-request-presigner');
    
    const getCommand = new GetObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME'),
      Key: asset.r2_key,
    });
    const sourceSignedUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 3600 });

    // Fire-and-forget processor trigger
    const processorPayload = {
      base44_video_id: video_id,
      base44_asset_id: asset_id,
      source_r2_key: asset.r2_key,
      source_signed_url: sourceSignedUrl,
      callback_url: `${req.headers.get('origin') || 'https://preview-sandbox--6a1bc26018a7bec38bc6ac4a.base44.app'}/functions/updateVideoProcessingResult`,
      callback_api_key: processorApiKey,
      target_asset_prefix: `fleshlab/${asset.r2_key.split('/')[1]}/videos/${asset.r2_key.split('/')[3]}/`,
      processor_job_id: `proc_${job.id}`,
      required_assets: ['thumbnail', 'cover', 'preview_video'],
      optional_assets: ['preview_gif'],
      metadata_requirements: {
        extract_duration: true,
        extract_resolution: true,
        extract_bitrate: true,
        extract_mime_type: true,
      },
    };

    // Fire-and-forget: Don't wait for response
    fetch(processorWebhookUrl + '/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Processor-API-Key': processorApiKey,
      },
      body: JSON.stringify(processorPayload),
    }).catch(err => {
      console.error('Processor trigger failed:', err);
      // Don't throw - fire-and-forget should not block response
    });

    // Update job status to running
    await base44.entities.JobQueue.update(job.id, {
      status: 'running',
      started_at: new Date().toISOString(),
    });

    return Response.json({
      status: 'queued',
      job_id: job.id,
      message: 'Upload verified. Processing started.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});