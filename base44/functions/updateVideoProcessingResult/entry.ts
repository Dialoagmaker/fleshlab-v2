/**
 * updateVideoProcessingResult - Phase 2C.1 Hardened
 * 
 * CRITICAL: Validates ALL processor assets BEFORE writing to Video entity.
 * 
 * Validation flow:
 * 1. Verify processor API key
 * 2. Validate source_video_url (HEAD + range request)
 * 3. Validate primary_thumbnail_url (magic header, dimensions, HTML check)
 * 4. Validate trailer_url (HEAD + range request)
 * 5. ONLY write URLs if ALL validations pass
 * 6. If validation fails: mark asset_status, store error, keep video unpublished
 * 
 * Processor Job Status:
 * - queued → processing → callback_received → validating → complete
 * - failed (processor error)
 * - thumbnail_invalid (validation failed)
 * - preview_invalid (validation failed)
 * - source_invalid (validation failed)
 * - timeout (callback never arrived)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Validate image URL - downloads full image (safe for thumbnails < 10MB)
 */
async function validateImageUrl(url) {
  const result = { 
    ok: false, 
    status: null, 
    contentType: null, 
    contentLength: 0, 
    magicHeader: null, 
    width: null, 
    height: null, 
    reason: null,
    isHtml: false,
    sampleContent: null
  };

  if (!url) {
    result.reason = 'URL is null/empty';
    return result;
  }

  try {
    // HEAD request for metadata
    const headResponse = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    result.status = headResponse.status;
    result.contentType = headResponse.headers.get('content-type');
    result.contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);

    if (result.status !== 200 && result.status !== 304) {
      result.reason = `HTTP ${result.status}`;
      return result;
    }

    if (!result.contentType || !result.contentType.startsWith('image/')) {
      result.reason = `Invalid content-type: ${result.contentType}`;
      return result;
    }

    if (result.contentLength === 0) {
      result.reason = 'Empty file (0 bytes)';
      return result;
    }

    if (result.contentLength > 10 * 1024 * 1024) {
      result.reason = `File too large: ${result.contentLength} bytes`;
      return result;
    }

    // GET request for validation
    const getResponse = await fetch(url, { method: 'GET' });
    const arrayBuffer = await getResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (uint8Array.length < 4) {
      result.reason = 'File too small';
      return result;
    }

    // Magic header check
    const magicHeader = Array.from(uint8Array.slice(0, 4))
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');

    result.magicHeader = magicHeader;

    // Check for HTML/XML error pages (CRITICAL: prevents HTML-as-JPG)
    const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 200)).toLowerCase();
    if (firstBytes.includes('<!doctype') || firstBytes.includes('<html') || 
        firstBytes.includes('<?xml') || firstBytes.includes('accessdenied') ||
        firstBytes.includes('<error') || firstBytes.includes('errorcode')) {
      result.reason = 'File is HTML/XML error page, not an image';
      result.isHtml = true;
      result.sampleContent = firstBytes.substring(0, 100);
      return result;
    }

    // Validate magic header
    const isJpeg = magicHeader.startsWith('FF D8');
    const isPng = magicHeader.startsWith('89 50 4E 47');
    const isWebp = magicHeader.startsWith('52 49 46 46') && 
                   Array.from(uint8Array.slice(8, 12)).map(b => String.fromCharCode(b)).join('') === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      result.reason = `Invalid image magic header: ${magicHeader}`;
      return result;
    }

    // Decode image for dimensions
    try {
      const blob = new Blob([arrayBuffer], { type: result.contentType });
      const imageBitmap = await createImageBitmap(blob);
      result.width = imageBitmap.width;
      result.height = imageBitmap.height;
      imageBitmap.close();

      if (result.width < 1 || result.height < 1) {
        result.reason = 'Image dimensions invalid';
        return result;
      }
    } catch (decodeError) {
      result.reason = `Failed to decode image: ${decodeError.message}`;
      return result;
    }

    result.ok = true;
    return result;

  } catch (error) {
    result.reason = error.message || 'Network error';
    return result;
  }
}

/**
 * Validate video URL - uses only HEAD + small range request (safe for 2GB+ files)
 */
async function validateVideoUrl(url) {
  const result = { 
    ok: false, 
    status: null, 
    contentType: null, 
    contentLength: 0, 
    magicHeader: null, 
    reason: null,
    isHtml: false,
    sampleContent: null
  };

  if (!url) {
    result.reason = 'URL is null/empty';
    return result;
  }

  try {
    // HEAD request - no download
    const headResponse = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    result.status = headResponse.status;
    result.contentType = headResponse.headers.get('content-type');
    result.contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);

    if (result.status !== 200 && result.status !== 206 && result.status !== 304) {
      result.reason = `HTTP ${result.status}`;
      return result;
    }

    const isVideoType = result.contentType && (
      result.contentType.startsWith('video/') ||
      result.contentType.startsWith('application/octet-stream') ||
      result.contentType === 'application/mp4'
    );

    if (!isVideoType) {
      result.reason = `Invalid content-type: ${result.contentType}`;
      return result;
    }

    if (result.contentLength === 0) {
      result.reason = 'Empty file (0 bytes)';
      return result;
    }

    // Range request for first 64KB only - NEVER download full video
    const rangeResponse = await fetch(url, { 
      method: 'GET', 
      headers: { 'Range': 'bytes=0-65535' }
    });
    
    if (!rangeResponse.ok && rangeResponse.status !== 206) {
      result.reason = `Range request failed: HTTP ${rangeResponse.status}`;
      return result;
    }

    const arrayBuffer = await rangeResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (uint8Array.length < 8) {
      result.reason = 'File too small';
      return result;
    }

    // Check for HTML/XML error pages
    const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 200)).toLowerCase();
    if (firstBytes.includes('<!doctype') || firstBytes.includes('<html') || 
        firstBytes.includes('<?xml') || firstBytes.includes('accessdenied') ||
        firstBytes.includes('<error')) {
      result.reason = 'File is HTML/XML error page, not a video';
      result.isHtml = true;
      result.sampleContent = firstBytes.substring(0, 100);
      return result;
    }

    // Magic header check
    const magicHeader = Array.from(uint8Array.slice(0, 8))
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');

    result.magicHeader = magicHeader;

    // Check for MP4/MOV ftyp header
    const hasFtyp = new TextDecoder().decode(uint8Array.slice(4, 8)) === 'ftyp' ||
                    new TextDecoder().decode(uint8Array.slice(8, 12)) === 'ftyp';

    const isMp4 = hasFtyp;
    const isWebm = magicHeader.startsWith('1A 45 DF A3');

    // For octet-stream, be lenient if no HTML error page
    if (result.contentType === 'application/octet-stream' && !isMp4 && !isWebm) {
      result.ok = true;
      return result;
    }

    if (!isMp4 && !isWebm && !magicHeader.startsWith('00 00 00')) {
      result.reason = `Invalid video magic header: ${magicHeader}`;
      return result;
    }

    result.ok = true;
    return result;

  } catch (error) {
    result.reason = error.message || 'Network error';
    return result;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validate processor API key
    const url = new URL(req.url);
    const processorApiKey = req.headers.get('X-Processor-API-Key') || url.searchParams.get('processor_key');
    const expectedApiKey = Deno.env.get('PROCESSOR_API_KEY');
    
    if (!processorApiKey || processorApiKey !== expectedApiKey) {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized: Invalid API key' 
      }, { status: 401 });
    }

    const body = await req.json();
    const {
      video_id,
      source_asset_id,
      job_id,
      processor_job_id,
      status,
      assets,
      metadata,
      error_message,
    } = body;

    if (!video_id || !source_asset_id || !status) {
      return Response.json({ 
        success: false, 
        error: 'Missing required fields: video_id, source_asset_id, status' 
      }, { status: 400 });
    }

    // Fetch video and source asset
    const video = await base44.entities.Video.get(video_id);
    const sourceAsset = await base44.entities.VideoAsset.get(source_asset_id);

    if (!video || !sourceAsset) {
      return Response.json({ 
        success: false, 
        error: 'Video or source asset not found' 
      }, { status: 404 });
    }

    // Handle processing failure
    if (status === 'failed') {
      await base44.entities.VideoAsset.update(sourceAsset.id, { status: 'failed' });
      await base44.entities.Video.update(video_id, { processing_status: 'failed' });

      if (job_id) {
        await base44.entities.JobQueue.update(job_id, {
          status: 'failed',
          error_message: error_message || 'Processing failed',
          completed_at: new Date().toISOString(),
          result: JSON.stringify({ processor_job_id, error: error_message }),
        });
      }

      return Response.json({ success: true, message: 'Processing failure recorded' });
    }

    // PHASE 2C.1/2C.2: VALIDATE ASSETS BEFORE WRITING
    console.log('[updateVideoProcessingResult] Validating processor assets...');
    
    // Determine if this is a thumbnail-only regeneration
    const isThumbnailOnly = body.regenerate_only === 'thumbnail';
    console.log('[updateVideoProcessingResult] Mode:', isThumbnailOnly ? 'thumbnail_only' : 'full_processing');
    
    const validationReport = {
      source: null,
      thumbnail: null,
      preview: null,
      allValid: true,
      blockingReasons: []
    };

    // Validate thumbnail (CRITICAL: prevent HTML-as-JPG)
    if (assets?.thumbnail?.cdn_url) {
      validationReport.thumbnail = await validateImageUrl(assets.thumbnail.cdn_url);
      if (!validationReport.thumbnail.ok) {
        validationReport.allValid = false;
        if (validationReport.thumbnail.isHtml) {
          validationReport.blockingReasons.push(`Thumbnail: Processor returned HTML/error page instead of image (magic: ${validationReport.thumbnail.magicHeader})`);
        } else {
          validationReport.blockingReasons.push(`Thumbnail: ${validationReport.thumbnail.reason}`);
        }
      }
    } else if (!isThumbnailOnly) {
      validationReport.thumbnail = { ok: false, reason: 'Thumbnail URL not provided by processor' };
      validationReport.allValid = false;
      validationReport.blockingReasons.push('Thumbnail: URL not provided');
    }

    // Validate source video (only for full processing)
    if (!isThumbnailOnly && assets?.source?.cdn_url) {
      validationReport.source = await validateVideoUrl(assets.source.cdn_url);
      if (!validationReport.source.ok) {
        validationReport.allValid = false;
        validationReport.blockingReasons.push(`Source: ${validationReport.source.reason}`);
      }
    }

    // Validate preview (only for full processing)
    if (!isThumbnailOnly && assets?.preview_video?.cdn_url) {
      validationReport.preview = await validateVideoUrl(assets.preview_video.cdn_url);
      if (!validationReport.preview.ok) {
        validationReport.allValid = false;
        validationReport.blockingReasons.push(`Preview: ${validationReport.preview.reason}`);
      }
    }

    console.log('[updateVideoProcessingResult] Validation results:', validationReport);

    // IF VALIDATION FAILS: Do NOT write URLs, mark status, store error
    if (!validationReport.allValid) {
      console.error('[updateVideoProcessingResult] VALIDATION FAILED - rejecting processor assets:', validationReport.blockingReasons);

      // Update source asset status
      await base44.entities.VideoAsset.update(sourceAsset.id, {
        status: 'validation_failed',
      });

      // Update video status - keep unpublished
      await base44.entities.Video.update(video_id, {
        processing_status: 'failed',
      });

      // Update job queue with validation failure
      if (job_id) {
        // Determine specific failure type
        let failureStatus = 'failed';
        if (isThumbnailOnly && validationReport.thumbnail && !validationReport.thumbnail.ok) {
          failureStatus = 'thumbnail_invalid';
        } else if (validationReport.preview && !validationReport.preview.ok) {
          failureStatus = 'preview_invalid';
        } else if (validationReport.source && !validationReport.source.ok) {
          failureStatus = 'source_invalid';
        }

        await base44.entities.JobQueue.update(job_id, {
          status: failureStatus,
          error_message: `Asset validation failed: ${validationReport.blockingReasons.join('; ')}`,
          completed_at: new Date().toISOString(),
          result: JSON.stringify({
            processor_job_id,
            validation_failed: true,
            validation_report: validationReport,
            is_thumbnail_only: isThumbnailOnly,
          }),
        });
      }

      return Response.json({
        success: false,
        error: 'Asset validation failed',
        validation_report: validationReport,
        mode: isThumbnailOnly ? 'thumbnail_only' : 'full_processing',
      });
    }

    // VALIDATION PASSED - safe to write URLs
    console.log('[updateVideoProcessingResult] ✅ All assets validated successfully');

    const assetPromises = [];

    // Update source asset with metadata (only for full processing)
    if (!isThumbnailOnly) {
      assetPromises.push(
        base44.entities.VideoAsset.update(sourceAsset.id, {
          status: 'ready',
          duration_seconds: metadata?.duration_seconds || null,
          width: metadata?.width || null,
          height: metadata?.height || null,
          fps: metadata?.fps || null,
          bitrate_kbps: metadata?.bitrate_kbps || null,
          codec: metadata?.codec || null,
          aspect_ratio: metadata?.aspect_ratio || null,
        })
      );
    }

    // Update/create thumbnail asset
    if (assets?.thumbnail) {
      const existingThumbnails = await base44.entities.VideoAsset.filter({
        video_id: video.id,
        asset_type: 'thumbnail',
      });
      if (existingThumbnails.length > 0) {
        assetPromises.push(
          base44.entities.VideoAsset.update(existingThumbnails[0].id, {
            status: 'ready',
            file_size_bytes: assets.thumbnail.file_size_bytes,
            width: assets.thumbnail.width,
            height: assets.thumbnail.height,
            mime_type: assets.thumbnail.mime_type || 'image/jpeg',
          })
        );
      } else {
        assetPromises.push(
          base44.entities.VideoAsset.create({
            video_id: video.id,
            asset_type: 'thumbnail',
            r2_key: assets.thumbnail.r2_key,
            cdn_url: assets.thumbnail.cdn_url,
            status: 'ready',
            file_size_bytes: assets.thumbnail.file_size_bytes,
            width: assets.thumbnail.width,
            height: assets.thumbnail.height,
            mime_type: assets.thumbnail.mime_type || 'image/jpeg',
          })
        );
      }
    }

    // Update/create preview asset (only for full processing)
    if (!isThumbnailOnly && assets?.preview_video) {
      const existingPreviews = await base44.entities.VideoAsset.filter({
        video_id: video.id,
        asset_type: 'preview',
      });
      if (existingPreviews.length > 0) {
        assetPromises.push(
          base44.entities.VideoAsset.update(existingPreviews[0].id, {
            status: 'ready',
            file_size_bytes: assets.preview_video.file_size_bytes,
            duration_seconds: assets.preview_video.duration_seconds,
            width: assets.preview_video.width,
            height: assets.preview_video.height,
            mime_type: assets.preview_video.mime_type || 'video/mp4',
          })
        );
      } else {
        assetPromises.push(
          base44.entities.VideoAsset.create({
            video_id: video.id,
            asset_type: 'preview',
            r2_key: assets.preview_video.r2_key,
            cdn_url: assets.preview_video.cdn_url,
            status: 'ready',
            file_size_bytes: assets.preview_video.file_size_bytes,
            duration_seconds: assets.preview_video.duration_seconds,
            width: assets.preview_video.width,
            height: assets.preview_video.height,
            mime_type: assets.preview_video.mime_type || 'video/mp4',
          })
        );
      }
    }

    await Promise.all(assetPromises);

    // Update video with VALIDATED URLs
    const videoUpdateData = {
      processing_status: isThumbnailOnly ? 'draft_ready' : 'metadata_pending',
    };

    // Write source URL (only for full processing)
    if (!isThumbnailOnly) {
      if (assets?.source?.cdn_url) {
        videoUpdateData.source_video_url = assets.source.cdn_url;
      } else if (sourceAsset.cdn_url) {
        videoUpdateData.source_video_url = sourceAsset.cdn_url;
      }
    }

    // Write thumbnail URL (validated)
    if (assets?.thumbnail?.cdn_url) {
      videoUpdateData.primary_thumbnail_url = assets.thumbnail.cdn_url;
    }

    // Write preview URL (only for full processing)
    if (!isThumbnailOnly && assets?.preview_video?.cdn_url) {
      videoUpdateData.trailer_url = assets.preview_video.cdn_url;
    }

    // Write duration if provided (only for full processing)
    if (!isThumbnailOnly && metadata?.duration_seconds) {
      videoUpdateData.duration_seconds = metadata.duration_seconds;
    }

    await base44.entities.Video.update(video.id, videoUpdateData);

    // Update job queue with completion
    if (job_id) {
      await base44.entities.JobQueue.update(job_id, {
        status: 'complete',
        completed_at: new Date().toISOString(),
        result: JSON.stringify({
          processor_job_id,
          assets_created: Object.keys(assets || {}).length,
          processing_time_seconds: body.processing_time_seconds,
          validation_passed: true,
          is_thumbnail_only: isThumbnailOnly,
        }),
      });
    }

    console.log('[updateVideoProcessingResult] ✅ Video entity updated with validated URLs');

    return Response.json({
      success: true,
      message: isThumbnailOnly ? 'Thumbnail regenerated and validated successfully' : 'Processing result saved successfully',
      validation_report: validationReport,
      mode: isThumbnailOnly ? 'thumbnail_only' : 'full_processing',
    });

  } catch (error) {
    console.error('[updateVideoProcessingResult] Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});