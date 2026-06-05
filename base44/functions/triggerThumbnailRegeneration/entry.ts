/**
 * triggerThumbnailRegeneration - Phase 2C.2 Async
 * 
 * ASYNCHRONOUS ARCHITECTURE:
 * 1. Creates JobQueue entry with status 'queued'
 * 2. Calls external processor webhook ONCE
 * 3. Returns immediately (NO polling, NO waiting)
 * 
 * Processor callback (updateVideoProcessingResult) is the ONLY completion path.
 * 
 * Job Status Flow:
 * queued → processing → callback_received → validating → complete
 *                                ↓
 *                         thumbnail_invalid (if validation fails)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { S3Client, GetObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const { video_id } = payload;

    if (!video_id) {
      return Response.json({ error: 'Missing required field: video_id' }, { status: 400 });
    }

    // Load video
    const video = await base44.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Find source asset
    const assets = await base44.entities.VideoAsset.filter({ video_id, asset_type: 'source' });
    const sourceAsset = assets[0];

    if (!sourceAsset || !sourceAsset.r2_key) {
      return Response.json({ error: 'No source asset found' }, { status: 404 });
    }

    // Generate signed R2 URL
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

    // Create JobQueue entry BEFORE triggering processor
    const job = await base44.entities.JobQueue.create({
      job_type: 'regenerate_thumbnail',
      status: 'queued',
      priority: 5,
      payload: JSON.stringify({
        video_id,
        source_asset_id: sourceAsset.id,
        source_r2_key: sourceAsset.r2_key,
        operation: 'thumbnail_only',
      }),
      entity_type: 'Video',
      entity_id: video_id,
      retry_count: 0,
    });

    // Prepare processor callback URL
    const processorApiKey = Deno.env.get('PROCESSOR_API_KEY');
    const appBaseUrl = (Deno.env.get('APP_BASE_URL') || '').replace(/\/$/, '');
    const callbackUrl = `${appBaseUrl}/api/functions/updateVideoProcessingResult?processor_key=${encodeURIComponent(processorApiKey)}`;

    // Derive studio and file from r2_key
    const keyParts = sourceAsset.r2_key.split('/');
    const studio = keyParts.length >= 2 ? keyParts[1] : 'default';
    const originalFile = keyParts[keyParts.length - 1];
    const ext = originalFile.includes('.') ? originalFile.split('.').pop() : 'mov';
    const uuidDir = keyParts[keyParts.length - 2];
    const file = (uuidDir && uuidDir !== 'videos') ? `${uuidDir}.${ext}` : originalFile;

    // Trigger external processor ONCE
    const processorWebhookUrl = Deno.env.get('PROCESSOR_WEBHOOK_URL');
    const processorResponse = await fetch(`${processorWebhookUrl}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: processorApiKey,
        studio,
        file,
        src_url: signedUrl,
        video_id,
        source_asset_id: sourceAsset.id,
        job_id: job.id,
        callback_url: callbackUrl,
        regenerate_only: 'thumbnail',
      }),
    });

    if (!processorResponse.ok) {
      const errorText = await processorResponse.text();
      console.error('[triggerThumbnailRegeneration] Processor rejected:', processorResponse.status, errorText);
      
      // Update job to failed
      await base44.entities.JobQueue.update(job.id, {
        status: 'failed',
        error_message: `Processor rejected: HTTP ${processorResponse.status}`,
        completed_at: new Date().toISOString(),
      });

      return Response.json({
        error: `Processor trigger failed: HTTP ${processorResponse.status}`,
        details: errorText.substring(0, 500),
      }, { status: 502 });
    }

    // Update job to 'processing' (processor accepted)
    await base44.entities.JobQueue.update(job.id, {
      status: 'processing',
      started_at: new Date().toISOString(),
    });

    console.log('[triggerThumbnailRegeneration] Job queued:', {
      job_id: job.id,
      video_id,
      studio,
      file,
      status: 'processing'
    });

    // RETURN IMMEDIATELY - DO NOT WAIT
    return Response.json({
      success: true,
      job_id: job.id,
      status: 'processing',
      message: 'Thumbnail regeneration started. Check job status for completion.',
    });

  } catch (error) {
    console.error('[triggerThumbnailRegeneration] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});