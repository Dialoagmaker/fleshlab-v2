/**
 * updateVideoProcessingResult - Phase 2C.2 Enhanced
 * 
 * Callback endpoint for external processor webhook.
 * Receives processing results and validates assets before updating Video entity.
 * 
 * ENHANCED FOR PHASE 2C.2:
 * - Tracks callback metadata (timestamp, attempts, payload)
 * - Logs all validation failures for debugging
 * - Supports thumbnail-only mode
 * - Rejects invalid callbacks with clear error messages
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { S3Client, HeadObjectCommand } from 'npm:@aws-sdk/client-s3';

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Validate auth
    const url = new URL(req.url);
    const processorKey = url.searchParams.get('processor_key');
    const expectedKey = Deno.env.get('PROCESSOR_API_KEY');
    
    if (!processorKey || processorKey !== expectedKey) {
      console.error('[updateVideoProcessingResult] Auth failed:', {
        has_key: !!processorKey,
        key_matches: processorKey === expectedKey,
      });
      return Response.json({ error: 'Unauthorized: Invalid processor_key' }, { status: 401 });
    }

    const payload = await req.json();
    const logPrefix = `[updateVideoProcessingResult][job_${payload.job_id || 'unknown'}]`;
    
    console.log(`${logPrefix} Callback received:`, {
      job_id: payload.job_id,
      video_id: payload.video_id,
      thumbnail_url: payload.thumbnail_url,
      preview_url: payload.preview_url,
      status: payload.status,
    });

    // Validate required fields
    const requiredFields = ['job_id', 'video_id'];
    const missingFields = requiredFields.filter(f => !payload[f]);
    
    if (missingFields.length > 0) {
      console.error(`${logPrefix} Missing required fields:`, missingFields);
      return Response.json({ 
        error: 'Missing required fields',
        missing_fields: missingFields,
        received_payload: payload 
      }, { status: 400 });
    }

    // Load job
    const job = await base44.entities.JobQueue.get(payload.job_id);
    if (!job) {
      console.error(`${logPrefix} Job not found:`, payload.job_id);
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    // Load video
    const video = await base44.entities.Video.get(payload.video_id);
    if (!video) {
      console.error(`${logPrefix} Video not found:`, payload.video_id);
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Parse job payload to determine mode
    let jobPayload;
    try {
      jobPayload = JSON.parse(job.payload);
    } catch (e) {
      jobPayload = {};
    }

    const isThumbnailOnly = jobPayload.operation === 'thumbnail_only';
    const mode = isThumbnailOnly ? 'thumbnail_only' : 'full_processing';

    console.log(`${logPrefix} Processing mode:`, {
      is_thumbnail_only: isThumbnailOnly,
      mode,
      job_type: job.job_type,
    });

    // Update job: callback received
    await base44.entities.JobQueue.update(payload.job_id, {
      status: 'callback_received',
      callback_received_at: new Date().toISOString(),
      callback_attempts: (job.callback_attempts || 0) + 1,
      last_callback_payload: JSON.stringify(payload),
    });

    // Check if processor reported an error
    if (payload.status === 'failed' || payload.error) {
      console.error(`${logPrefix} Processor reported failure:`, payload.error || payload.message);
      
      await base44.entities.JobQueue.update(payload.job_id, {
        status: 'failed',
        error_message: `Processor failed: ${payload.error || payload.message || 'Unknown error'}`,
        completed_at: new Date().toISOString(),
        result: JSON.stringify({ processor_error: true, payload }),
      });

      return Response.json({
        success: false,
        error: 'Processor reported failure',
        processor_error: payload.error || payload.message,
      });
    }

    // Validate thumbnail URL if provided
    let thumbnailValidation = null;
    if (payload.thumbnail_url) {
      thumbnailValidation = await validateImageUrl(
        payload.thumbnail_url,
        'thumbnail',
        logPrefix
      );
      
      console.log(`${logPrefix} Thumbnail validation result:`, thumbnailValidation);
    }

    // Validate preview URL if provided
    let previewValidation = null;
    if (payload.preview_url) {
      previewValidation = await validateVideoUrl(
        payload.preview_url,
        'preview',
        logPrefix
      );
      
      console.log(`${logPrefix} Preview validation result:`, previewValidation);
    }

    // Build validation report
    const validationReport = {
      source: null, // Not validating source in callback
      thumbnail: thumbnailValidation,
      preview: previewValidation,
      allValid: !isThumbnailOnly || (thumbnailValidation?.ok === true),
      blockingReasons: [],
    };

    // Collect blocking reasons
    if (isThumbnailOnly) {
      if (!payload.thumbnail_url) {
        validationReport.blockingReasons.push('Thumbnail: URL not provided');
      } else if (!thumbnailValidation?.ok) {
        validationReport.blockingReasons.push(`Thumbnail: ${thumbnailValidation?.reason || 'Validation failed'}`);
      }
    }

    // Check if validation passed
    if (!validationReport.allValid) {
      console.error(`${logPrefix} Validation failed:`, validationReport.blockingReasons);
      
      // Update job: validation failed
      await base44.entities.JobQueue.update(payload.job_id, {
        status: 'thumbnail_invalid',
        error_message: `Asset validation failed: ${validationReport.blockingReasons.join('; ')}`,
        completed_at: new Date().toISOString(),
        result: JSON.stringify({ validation_failed: true, validation_report: validationReport, is_thumbnail_only: isThumbnailOnly }),
        validation_report: JSON.stringify(validationReport),
      });

      // Update video processing status
      await base44.entities.Video.update(payload.video_id, {
        processing_status: 'failed',
      });

      return Response.json({
        success: false,
        error: 'Asset validation failed',
        validation_report: validationReport,
        mode,
      });
    }

    // Validation passed - update video
    console.log(`${logPrefix} Validation passed, updating video...`);

    const videoUpdate: any = {
      processing_status: 'metadata_pending',
    };

    // Update thumbnail URL only if valid and provided
    if (thumbnailValidation?.ok && payload.thumbnail_url) {
      videoUpdate.primary_thumbnail_url = payload.thumbnail_url;
      console.log(`${logPrefix} Updating thumbnail URL:`, payload.thumbnail_url);
    }

    // Update preview URL only if valid and provided (and not thumbnail-only mode)
    if (!isThumbnailOnly && previewValidation?.ok && payload.preview_url) {
      videoUpdate.trailer_url = payload.preview_url;
      console.log(`${logPrefix} Updating preview URL:`, payload.preview_url);
    }

    await base44.entities.Video.update(payload.video_id, videoUpdate);

    // Update job: complete
    await base44.entities.JobQueue.update(payload.job_id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      result: JSON.stringify({
        success: true,
        thumbnail_url: payload.thumbnail_url,
        preview_url: payload.preview_url,
        validation_report: validationReport,
        is_thumbnail_only: isThumbnailOnly,
      }),
      validation_report: JSON.stringify(validationReport),
    });

    const elapsedMs = Date.now() - startTime;
    console.log(`${logPrefix} Callback processed successfully in ${elapsedMs}ms`);

    return Response.json({
      success: true,
      message: 'Video updated successfully',
      thumbnail_url: videoUpdate.primary_thumbnail_url,
      preview_url: videoUpdate.trailer_url,
      mode,
    });

  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    console.error(`[updateVideoProcessingResult] Error after ${elapsedMs}ms:`, error);
    
    return Response.json({ 
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
});

/**
 * Validate image URL
 */
async function validateImageUrl(url: string, assetType: string, logPrefix: string) {
  try {
    // HEAD request
    const headResponse = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const httpStatus = headResponse.status;
    
    if (![200, 206, 304].includes(httpStatus)) {
      return { ok: false, reason: `HTTP ${httpStatus}`, http_status: httpStatus };
    }

    const contentType = headResponse.headers.get('content-type') || '';
    const contentLength = headResponse.headers.get('content-length');
    
    if (!contentType.startsWith('image/')) {
      return { ok: false, reason: `Invalid content-type: ${contentType}`, content_type: contentType };
    }

    // GET request with range limit
    const getResponse = await fetch(url, { 
      method: 'GET',
      headers: { Range: 'bytes=0-524288' }, // First 512KB
      redirect: 'follow',
    });

    if (!getResponse.ok) {
      return { ok: false, reason: `GET failed: HTTP ${getResponse.status}` };
    }

    const arrayBuffer = await getResponse.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Check for HTML/XML (common error page trap)
    const text = new TextDecoder().decode(bytes.slice(0, 500));
    if (text.toLowerCase().includes('<!doctype html') || text.toLowerCase().includes('<?xml')) {
      return { ok: false, reason: 'Content is HTML/XML, not image' };
    }

    // Validate magic header
    const magicHeader = Array.from(bytes.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ')
      .toUpperCase();
    
    const validHeaders = [
      'FF D8 FF', // JPEG
      '89 50 4E 47', // PNG
      '52 49 46 46', // WebP (RIFF)
    ];
    
    const isValidMagic = validHeaders.some(h => magicHeader.startsWith(h));
    
    if (!isValidMagic) {
      return { ok: false, reason: `Invalid magic header: ${magicHeader}`, magic_header: magicHeader };
    }

    // Try to get dimensions (simplified - full implementation would parse image headers)
    const dimensions = { width: null, height: null };

    return {
      ok: true,
      http_status: httpStatus,
      content_type: contentType,
      content_length: contentLength ? parseInt(contentLength) : null,
      magic_header: magicHeader,
      dimensions,
      asset_type: assetType,
    };

  } catch (error) {
    return {
      ok: false,
      reason: `Validation error: ${error.message}`,
      error: error.message,
      asset_type: assetType,
    };
  }
}

/**
 * Validate video URL
 */
async function validateVideoUrl(url: string, assetType: string, logPrefix: string) {
  try {
    // HEAD request
    const headResponse = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const httpStatus = headResponse.status;
    
    if (![200, 206, 304].includes(httpStatus)) {
      return { ok: false, reason: `HTTP ${httpStatus}`, http_status: httpStatus };
    }

    const contentType = headResponse.headers.get('content-type') || '';
    const contentLength = headResponse.headers.get('content-length');
    
    if (!contentType.startsWith('video/') && !contentType.includes('mp4') && !contentType.includes('webm')) {
      return { ok: false, reason: `Invalid content-type: ${contentType}`, content_type: contentType };
    }

    // GET request with range limit (first 2MB for video)
    const getResponse = await fetch(url, { 
      method: 'GET',
      headers: { Range: 'bytes=0-2097152' },
      redirect: 'follow',
    });

    if (!getResponse.ok) {
      return { ok: false, reason: `GET failed: HTTP ${getResponse.status}` };
    }

    const arrayBuffer = await getResponse.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Check for HTML/XML
    const text = new TextDecoder().decode(bytes.slice(0, 500));
    if (text.toLowerCase().includes('<!doctype html') || text.toLowerCase().includes('<?xml')) {
      return { ok: false, reason: 'Content is HTML/XML, not video' };
    }

    // Validate magic header (MP4, WebM)
    const magicHeader = Array.from(bytes.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ')
      .toUpperCase();
    
    // MP4: 00 00 00 18 66 74 79 70 (starts with 00 00 00)
    // WebM: 1A 45 DF A3
    const isValidMagic = magicHeader.startsWith('00 00 00') || magicHeader.startsWith('1A 45 DF A3');
    
    if (!isValidMagic) {
      return { ok: false, reason: `Invalid magic header: ${magicHeader}`, magic_header: magicHeader };
    }

    return {
      ok: true,
      http_status: httpStatus,
      content_type: contentType,
      content_length: contentLength ? parseInt(contentLength) : null,
      magic_header: magicHeader,
      dimensions: { width: null, height: null, duration: null },
      asset_type: assetType,
    };

  } catch (error) {
    return {
      ok: false,
      reason: `Validation error: ${error.message}`,
      error: error.message,
      asset_type: assetType,
    };
  }
}