/**
 * finalizeUploadedVideo - Phase 2C.1 Hardened
 * 
 * CRITICAL CHANGES:
 * - Does NOT pre-write guessed URLs to Video entity
 * - Creates JobQueue entry with status 'queued'
 * - External processor callback writes URLs AFTER validation
 * - Video.processing_status = 'processing' (not 'metadata_pending')
 * 
 * Flow:
 * 1. Verify source file exists in R2
 * 2. Create JobQueue entry (status: queued)
 * 3. Generate signed R2 URL for processor
 * 4. Trigger external processor /regenerate webhook
 * 5. Return job_id for tracking
 * 
 * URLs are written ONLY by updateVideoProcessingResult after validation.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
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

    // Create JobQueue entry with processor job tracking
    const job = await base44.entities.JobQueue.create({
      job_type: 'process_video',
      status: 'queued',
      priority: 5,
      payload: JSON.stringify({ 
        video_id, 
        source_asset_id: asset_id, 
        source_r2_key: asset.r2_key,
        phase: '2c1_hardened' // Track that this uses hardened flow
      }),
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

    // Derive studio and file from r2_key
    const keyParts = asset.r2_key.split('/');
    const studio = keyParts.length >= 2 ? keyParts[1] : 'default';
    const originalFile = keyParts[keyParts.length - 1];
    const ext = originalFile.includes('.') ? originalFile.split('.').pop() : 'mov';
    const uuidDir = keyParts[keyParts.length - 2];
    const file = (uuidDir && uuidDir !== 'videos') ? `${uuidDir}.${ext}` : originalFile;
    const basename = file.replace(/\.[^.]+$/, '');

    // Trigger processor
    const processorPayload = {
      secret: processorSecret,
      studio,
      file,
      src_url: sourceSignedUrl,
      video_id,
      source_asset_id: asset_id,
      job_id: job.id,
    };

    const processorResponse = await fetch(`${processorWebhookUrl}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(processorPayload),
    });

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

    console.log('Processor accepted job:', studio, file);

    // Update video processing_status ONLY (NO URL pre-writing)
    await base44.entities.Video.update(video_id, {
      processing_status: 'processing',
    });

    // Update job to running
    await base44.entities.JobQueue.update(job.id, {
      status: 'running',
      started_at: new Date().toISOString(),
    });

    return Response.json({
      status: 'queued',
      job_id: job.id,
      processor_http_status: processorResponse.status,
      studio,
      file,
      message: 'Upload verified. Processor job queued. URLs will be written after validation.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});