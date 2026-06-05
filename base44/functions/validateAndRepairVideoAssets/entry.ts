import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Validate image URL - only for small files like thumbnails
 * Downloads full image but thumbnails are < 1MB so this is safe
 */
async function validateImageUrl(url) {
  const result = { ok: false, status: null, contentType: null, contentLength: 0, magicHeader: null, width: null, height: null, reason: null };

  if (!url) {
    result.reason = 'URL is null/empty';
    return result;
  }

  try {
    // Step 1: HEAD request for metadata (no download)
    const headResponse = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    result.status = headResponse.status;
    result.contentType = headResponse.headers.get('content-type');
    result.contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);

    if (result.status !== 200 && result.status !== 304) {
      result.reason = `HTTP ${result.status}`;
      return result;
    }

    // Reject non-image content types
    if (!result.contentType || !result.contentType.startsWith('image/')) {
      result.reason = `Invalid content-type: ${result.contentType}`;
      return result;
    }

    // Reject empty files
    if (result.contentLength === 0) {
      result.reason = 'Empty file (0 bytes)';
      return result;
    }

    // Reject files that are too large for an image (> 10MB)
    if (result.contentLength > 10 * 1024 * 1024) {
      result.reason = `File too large for image: ${result.contentLength} bytes`;
      return result;
    }

    // Step 2: GET request - safe for thumbnails (< 10MB)
    const getResponse = await fetch(url, { method: 'GET' });
    const arrayBuffer = await getResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (uint8Array.length < 4) {
      result.reason = 'File too small';
      return result;
    }

    // Check magic header
    const magicHeader = Array.from(uint8Array.slice(0, 4))
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');

    result.magicHeader = magicHeader;

    // Check for HTML/XML error pages
    const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 100)).toLowerCase();
    if (firstBytes.includes('<!doctype') || firstBytes.includes('<html') || 
        firstBytes.includes('<?xml')) {
      result.reason = 'File is HTML/XML error page, not an image';
      return result;
    }

    // Validate magic header for known image formats
    const isJpeg = magicHeader.startsWith('FF D8');
    const isPng = magicHeader.startsWith('89 50 4E 47');
    const isWebp = magicHeader.startsWith('52 49 46 46') && 
                   Array.from(uint8Array.slice(8, 12)).map(b => String.fromCharCode(b)).join('') === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      result.reason = `Invalid image magic header: ${magicHeader}`;
      return result;
    }

    // Decode image to get dimensions
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
 * Validate video URL using ONLY HEAD request + small range request
 * NEVER downloads full video - safe for 2GB+ files
 */
async function validateVideoUrl(url) {
  const result = { ok: false, status: null, contentType: null, contentLength: 0, magicHeader: null, reason: null };

  if (!url) {
    result.reason = 'URL is null/empty';
    return result;
  }

  try {
    // Step 1: HEAD request - no download, just metadata
    const headResponse = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    result.status = headResponse.status;
    result.contentType = headResponse.headers.get('content-type');
    result.contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);

    if (result.status !== 200 && result.status !== 206 && result.status !== 304) {
      result.reason = `HTTP ${result.status}`;
      return result;
    }

    // Accept video content types or octet-stream
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

    // Step 2: Range request for first 64KB only - NEVER download full video
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
    const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 100)).toLowerCase();
    if (firstBytes.includes('<!doctype') || firstBytes.includes('<html') || 
        firstBytes.includes('<?xml')) {
      result.reason = 'File is HTML/XML error page, not a video';
      return result;
    }

    // Check magic header
    const magicHeader = Array.from(uint8Array.slice(0, 8))
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');

    result.magicHeader = magicHeader;

    // Check for MP4/MOV ftyp header (typically at offset 4-8)
    const hasFtyp = new TextDecoder().decode(uint8Array.slice(4, 8)) === 'ftyp' ||
                    new TextDecoder().decode(uint8Array.slice(8, 12)) === 'ftyp';

    const isMp4 = hasFtyp;
    const isWebm = magicHeader.startsWith('1A 45 DF A3');

    // For octet-stream, be more lenient - just check no HTML error page
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

/**
 * Build public asset URL from R2 key
 */
function buildPublicAssetUrl(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://video.fleshlab.online/${trimmed.replace(/^\/+/, '')}`;
}

/**
 * Main function: Validate video assets WITHOUT downloading full videos
 */
Deno.serve(async (req) => {
  const video_id = req.query?.video_id || (await req.json())?.video_id;
  
  const report = {
    ok: false,
    video_id: video_id,
    step: 'initializing',
    source: { raw: null, resolved: null, status: null, valid: false, reason: null },
    thumbnail: { raw: null, resolved: null, status: null, corrupt: false, valid: false, magicHeader: null, contentType: null, size: null, width: null, height: null, reason: null },
    preview: { raw: null, resolved: null, status: null, valid: false, contentType: null, size: null, reason: null },
    canPublishAssets: false,
    blockingReasons: [],
    error: null,
    details: null,
  };

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      report.error = 'Unauthorized - admin access required';
      return Response.json(report, { status: 403 });
    }

    if (!video_id) {
      report.error = 'video_id required';
      return Response.json(report, { status: 400 });
    }

    console.log('🔍 Step: load_video -', video_id);
    report.step = 'load_video';
    const video = await base44.entities.Video.get(video_id);
    
    if (!video) {
      report.error = 'Video not found';
      return Response.json(report, { status: 404 });
    }

    console.log('📊 Step: load_video_assets -', video.title);
    report.step = 'load_video_assets';
    const videoAssets = await base44.entities.VideoAsset.filter({ video_id });
    
    console.log('🔍 Step: resolve_source');
    report.step = 'resolve_source';
    report.source.raw = video.source_video_url;
    report.source.resolved = buildPublicAssetUrl(video.source_video_url);

    console.log('🎬 Step: validate_source (HEAD + range request only)');
    report.step = 'validate_source';
    if (report.source.resolved) {
      const sourceValidation = await validateVideoUrl(report.source.resolved);
      report.source.status = sourceValidation.status;
      report.source.contentType = sourceValidation.contentType;
      report.source.contentLength = sourceValidation.contentLength;
      report.source.valid = sourceValidation.ok;
      report.source.reason = sourceValidation.reason;
      
      if (sourceValidation.ok) {
        console.log('✅ Source video valid:', sourceValidation.status);
      } else {
        console.log('❌ Source video invalid:', sourceValidation.reason);
      }
    } else {
      report.source.reason = 'Missing';
    }

    if (!report.source.valid) {
      report.blockingReasons.push(`Source video: ${report.source.reason || 'invalid'}`);
    }

    console.log('🖼️ Step: validate_thumbnail');
    report.step = 'validate_thumbnail';
    report.thumbnail.raw = video.primary_thumbnail_url;
    report.thumbnail.resolved = buildPublicAssetUrl(video.primary_thumbnail_url);
    
    if (report.thumbnail.resolved) {
      const thumbValidation = await validateImageUrl(report.thumbnail.resolved);
      report.thumbnail.status = thumbValidation.status;
      report.thumbnail.contentType = thumbValidation.contentType;
      report.thumbnail.size = thumbValidation.contentLength;
      report.thumbnail.magicHeader = thumbValidation.magicHeader;
      report.thumbnail.width = thumbValidation.width;
      report.thumbnail.height = thumbValidation.height;

      // Check if corrupt (HTML saved as JPG)
      if (thumbValidation.magicHeader && thumbValidation.magicHeader !== 'FF D8' && thumbValidation.magicHeader !== '89 50 4E 47') {
        report.thumbnail.corrupt = true;
        report.thumbnail.reason = `Corrupt - magic header ${thumbValidation.magicHeader} (expected FF D8 for JPEG)`;
        console.log('❌ Thumbnail corrupt:', thumbValidation.magicHeader);
      } else if (thumbValidation.ok) {
        report.thumbnail.valid = true;
        console.log('✅ Thumbnail valid:', thumbValidation.width, 'x', thumbValidation.height);
      } else {
        report.thumbnail.reason = thumbValidation.reason;
        console.log('❌ Thumbnail invalid:', thumbValidation.reason);
      }
    } else {
      report.thumbnail.reason = 'Missing';
    }

    if (report.thumbnail.corrupt) {
      report.blockingReasons.push('Thumbnail corrupt (HTML saved as JPG) - regeneration required');
    } else if (!report.thumbnail.valid) {
      report.blockingReasons.push(`Thumbnail: ${report.thumbnail.reason || 'invalid'}`);
    }

    console.log('🎬 Step: validate_preview (HEAD + range request only)');
    report.step = 'validate_preview';
    const previewUrl = video.trailer_url || video.source_video_url;
    report.preview.raw = video.trailer_url;
    report.preview.resolved = buildPublicAssetUrl(previewUrl);
    
    if (previewUrl && previewUrl !== video.source_video_url) {
      const previewValidation = await validateVideoUrl(report.preview.resolved);
      report.preview.status = previewValidation.status;
      report.preview.contentType = previewValidation.contentType;
      report.preview.size = previewValidation.contentLength;
      report.preview.valid = previewValidation.ok;
      report.preview.reason = previewValidation.reason;
    } else if (video.source_video_url && report.source.valid) {
      report.preview.valid = true;
      report.preview.reason = 'Using source video';
    }

    if (!report.preview.valid && !video.trailer_url) {
      report.blockingReasons.push('Preview missing');
    }

    // Determine publish readiness
    report.canPublishAssets = report.source.valid && report.thumbnail.valid;
    report.ok = report.canPublishAssets;

    console.log('📊 Validation complete:', { 
      canPublish: report.canPublishAssets, 
      blocking: report.blockingReasons 
    });

    return Response.json(report);

  } catch (error) {
    console.error('❌ Validation failed:', error);
    report.error = error.message || 'Unknown error';
    report.details = error.stack;
    report.ok = false;
    return Response.json(report, { status: 500 });
  }
});