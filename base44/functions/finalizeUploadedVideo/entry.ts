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
      payload: JSON.stringify({ video_id, source_asset_id: asset_id, source_r2_key: asset.r2_key, action: 'process_video' }),
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
    const processorApiKey = Deno.env.get('PROCESSOR_API_KEY');
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || '';

    const processorPayload = {
      base44_video_id: video_id,
      base44_asset_id: asset_id,
      source_r2_key: asset.r2_key,
      source_signed_url: sourceSignedUrl,
      callback_url: `${appBaseUrl}/api/functions/updateVideoProcessingResult`,
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

    // Await the processor trigger to surface errors
    let processorStatus = 'unknown';
    try {
      const processorResponse = await fetch(processorWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Processor-API-Key': processorApiKey,
        },
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

      console.log('Processor triggered successfully, status:', processorResponse.status);
    } catch (processorError) {
      console.error('Processor fetch error:', processorError.message);
      await base44.entities.JobQueue.update(job.id, {
        status: 'failed',
        error_message: `Failed to reach processor: ${processorError.message}`,
        completed_at: new Date().toISOString(),
      });
      return Response.json({
        error: `Failed to reach processor: ${processorError.message}`,
        job_id: job.id,
      }, { status: 502 });
    }

    // Update job to running
    await base44.entities.JobQueue.update(job.id, {
      status: 'running',
      started_at: new Date().toISOString(),
    });

    return Response.json({
      status: 'queued',
      job_id: job.id,
      processor_http_status: processorStatus,
      callback_url: `${appBaseUrl}/api/functions/updateVideoProcessingResult`,
      message: 'Upload verified. Processing started.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});