/**
 * validateVideoAssets - Server-Side Asset Validation
 * 
 * Validates video assets using server-side HTTP requests (not browser fetch).
 * Returns structured validation report for publish gating and admin diagnostics.
 * 
 * Validation Rules:
 * - Source: HEAD + small range request, video content-type or magic header
 * - Thumbnail: Full download (< 10MB), magic header validation, HTML corruption detection
 * - Preview: HEAD + small range request, video content-type or magic header
 * 
 * @param {Object} event - Base44 function event
 * @returns {Object} Validation report
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user (admin-only)
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        ok: false, 
        error: 'Unauthorized',
        step: 'auth',
        blockingReasons: ['Admin access required']
      }, { status: 403 });
    }

    const { video_id } = await req.json();
    
    if (!video_id) {
      return Response.json({ 
        ok: false, 
        error: 'video_id required',
        step: 'validation',
        blockingReasons: ['Missing video_id parameter']
      }, { status: 400 });
    }

    // Load video entity
    const video = await base44.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ 
        ok: false, 
        error: 'Video not found',
        step: 'load_video',
        video_id,
        blockingReasons: ['Video not found']
      }, { status: 404 });
    }

    // Load VideoAsset records if available
    const videoAssets = await base44.entities.VideoAsset.filter({ video_id });

    // Validate each asset
    const sourceValidation = await validateSourceVideo(video.source_video_url);
    const thumbnailValidation = await validateThumbnail(video.primary_thumbnail_url);
    const previewValidation = await validatePreview(video.trailer_url || video.source_video_url);

    // Build blocking reasons
    const blockingReasons = [];
    
    if (!sourceValidation.valid) {
      blockingReasons.push(`Source video: ${sourceValidation.reason || 'Invalid'}`);
    }
    
    if (!thumbnailValidation.valid) {
      if (thumbnailValidation.corrupt) {
        blockingReasons.push('Thumbnail corrupt: HTML saved as JPG');
      } else {
        blockingReasons.push(`Thumbnail: ${thumbnailValidation.reason || 'Invalid'}`);
      }
    }
    
    if (video.trailer_url && !previewValidation.valid) {
      blockingReasons.push(`Preview: ${previewValidation.reason || 'Invalid'}`);
    } else if (!video.trailer_url && !sourceValidation.valid) {
      blockingReasons.push('Preview missing and source video invalid');
    }

    // Determine if assets are valid for publishing
    const canPublishAssets = sourceValidation.valid && thumbnailValidation.valid && 
                            (video.trailer_url ? previewValidation.valid : true);

    return Response.json({
      ok: canPublishAssets,
      video_id,
      title: video.title,
      source: sourceValidation,
      thumbnail: thumbnailValidation,
      preview: previewValidation,
      canPublishAssets,
      blockingReasons
    });

  } catch (error) {
    console.error('validateVideoAssets error:', error);
    return Response.json({
      ok: false,
      step: 'server_error',
      error: error.message || 'Validation failed',
      details: { stack: error.stack },
      blockingReasons: ['Server validation failed']
    }, { status: 500 });
  }
});

/**
 * Validate source video URL
 * Uses HEAD + small range request (never downloads full video)
 */
async function validateSourceVideo(url) {
  const result = {
    url: url || null,
    urlType: classifyUrl(url),
    status: null,
    contentType: null,
    contentLength: 0,
    magicHeader: null,
    valid: false,
    reason: null
  };

  if (!url) {
    result.reason = 'Missing';
    return result;
  }

  try {
    // Step 1: HEAD request
    const headResponse = await fetch(url, { 
      method: 'HEAD', 
      redirect: 'follow',
      headers: { 'User-Agent': 'FLESHLAB-Validator/1.0' }
    });
    
    result.status = headResponse.status;
    result.contentType = headResponse.headers.get('content-type');
    result.contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);

    // Check HTTP status
    if (result.status !== 200 && result.status !== 206 && result.status !== 304) {
      result.reason = `HTTP ${result.status}`;
      return result;
    }

    // Check content-type
    const isVideoType = result.contentType && (
      result.contentType.startsWith('video/') ||
      result.contentType.startsWith('application/octet-stream') ||
      result.contentType === 'application/mp4'
    );

    if (!isVideoType) {
      result.reason = `Invalid content-type: ${result.contentType}`;
      return result;
    }

    // Check content-length
    if (result.contentLength === 0) {
      result.reason = 'Empty file (0 bytes)';
      return result;
    }

    // Step 2: Small range request for magic header validation
    const rangeResponse = await fetch(url, { 
      method: 'GET', 
      headers: { 
        'Range': 'bytes=0-65535',
        'User-Agent': 'FLESHLAB-Validator/1.0'
      }
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

    // Check for HTML error pages
    const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 100)).toLowerCase();
    if (firstBytes.includes('<!doctype') || firstBytes.includes('<html') || 
        firstBytes.includes('<?xml') || firstBytes.includes('accessdenied') ||
        firstBytes.includes('error')) {
      result.reason = 'File is HTML/XML error page';
      return result;
    }

    // Validate magic header
    const magicHeader = Array.from(uint8Array.slice(0, 8))
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');

    result.magicHeader = magicHeader;

    const hasFtyp = new TextDecoder().decode(uint8Array.slice(4, 8)) === 'ftyp' ||
                    new TextDecoder().decode(uint8Array.slice(8, 12)) === 'ftyp';

    const isMp4 = hasFtyp;
    const isWebm = magicHeader.startsWith('1A 45 DF A3');

    // For application/octet-stream, accept if has valid video header
    if (result.contentType === 'application/octet-stream' && (isMp4 || isWebm)) {
      result.valid = true;
      return result;
    }

    if (!isMp4 && !isWebm && !magicHeader.startsWith('00 00 00')) {
      result.reason = `Invalid video magic header: ${magicHeader}`;
      return result;
    }

    result.valid = true;
    return result;

  } catch (error) {
    result.reason = error.message || 'Network error';
    return result;
  }
}

/**
 * Validate thumbnail image URL
 * Downloads full image (safe for thumbnails < 10MB)
 */
async function validateThumbnail(url) {
  const result = {
    url: url || null,
    urlType: classifyUrl(url),
    status: null,
    contentType: null,
    contentLength: 0,
    magicHeader: null,
    valid: false,
    corrupt: false,
    reason: null
  };

  if (!url) {
    result.reason = 'Missing';
    return result;
  }

  try {
    // Step 1: HEAD request
    const headResponse = await fetch(url, { 
      method: 'HEAD', 
      redirect: 'follow',
      headers: { 'User-Agent': 'FLESHLAB-Validator/1.0' }
    });
    
    result.status = headResponse.status;
    result.contentType = headResponse.headers.get('content-type');
    result.contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);

    // Check HTTP status
    if (result.status !== 200 && result.status !== 304) {
      result.reason = `HTTP ${result.status}`;
      return result;
    }

    // Check content-type
    const isImageType = result.contentType && (
      result.contentType.startsWith('image/') ||
      result.contentType.startsWith('application/octet-stream')
    );

    if (!isImageType) {
      result.reason = `Invalid content-type: ${result.contentType}`;
      return result;
    }

    // Check content-length
    if (result.contentLength === 0) {
      result.reason = 'Empty file (0 bytes)';
      return result;
    }

    // Check file size limit (10MB)
    if (result.contentLength > 10 * 1024 * 1024) {
      result.reason = `File too large: ${result.contentLength} bytes`;
      return result;
    }

    // Step 2: GET request for full image validation
    const getResponse = await fetch(url, { 
      method: 'GET',
      headers: { 'User-Agent': 'FLESHLAB-Validator/1.0' }
    });

    if (!getResponse.ok) {
      result.reason = `GET failed: HTTP ${getResponse.status}`;
      return result;
    }

    const arrayBuffer = await getResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (uint8Array.length < 4) {
      result.reason = 'File too small';
      return result;
    }

    // Get magic header
    const magicHeader = Array.from(uint8Array.slice(0, 4))
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');

    result.magicHeader = magicHeader;

    // Check for HTML error pages (CORRUPT DETECTION)
    const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 100)).toLowerCase();
    if (firstBytes.includes('<!doctype') || firstBytes.includes('<html') || 
        firstBytes.includes('<?xml') || firstBytes.includes('accessdenied') ||
        firstBytes.includes('error')) {
      result.corrupt = true;
      result.reason = 'File is HTML/XML error page (corrupt)';
      return result;
    }

    // Validate magic header for image formats
    const isJpeg = magicHeader.startsWith('FF D8');
    const isPng = magicHeader.startsWith('89 50 4E 47');
    const isWebp = magicHeader.startsWith('52 49 46 46') && 
                   Array.from(uint8Array.slice(8, 12)).map(b => String.fromCharCode(b)).join('') === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      result.corrupt = true;
      result.reason = `Invalid image magic header: ${magicHeader}`;
      return result;
    }

    // Try to decode image to verify dimensions
    try {
      const blob = new Blob([arrayBuffer], { type: result.contentType });
      const imageBitmap = await createImageBitmap(blob);
      
      if (imageBitmap.width < 1 || imageBitmap.height < 1) {
        result.reason = 'Image dimensions invalid';
        imageBitmap.close();
        return result;
      }
      
      imageBitmap.close();
    } catch (decodeError) {
      result.reason = `Failed to decode image: ${decodeError.message}`;
      return result;
    }

    result.valid = true;
    return result;

  } catch (error) {
    result.reason = error.message || 'Network error';
    return result;
  }
}

/**
 * Validate preview video URL
 * Uses HEAD + small range request (never downloads full video)
 */
async function validatePreview(url) {
  const result = {
    url: url || null,
    urlType: classifyUrl(url),
    status: null,
    contentType: null,
    contentLength: 0,
    magicHeader: null,
    valid: false,
    reason: null
  };

  if (!url) {
    result.reason = 'Missing';
    return result;
  }

  // If preview URL is same as source, use source validation
  if (url === result.url) {
    return await validateSourceVideo(url);
  }

  try {
    // Step 1: HEAD request
    const headResponse = await fetch(url, { 
      method: 'HEAD', 
      redirect: 'follow',
      headers: { 'User-Agent': 'FLESHLAB-Validator/1.0' }
    });
    
    result.status = headResponse.status;
    result.contentType = headResponse.headers.get('content-type');
    result.contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);

    // Check HTTP status
    if (result.status !== 200 && result.status !== 206 && result.status !== 304) {
      result.reason = `HTTP ${result.status}`;
      return result;
    }

    // Check content-type
    const isVideoType = result.contentType && (
      result.contentType.startsWith('video/') ||
      result.contentType.startsWith('application/octet-stream') ||
      result.contentType === 'application/mp4'
    );

    if (!isVideoType) {
      result.reason = `Invalid content-type: ${result.contentType}`;
      return result;
    }

    // Check content-length
    if (result.contentLength === 0) {
      result.reason = 'Empty file (0 bytes)';
      return result;
    }

    // Step 2: Small range request for magic header validation
    const rangeResponse = await fetch(url, { 
      method: 'GET', 
      headers: { 
        'Range': 'bytes=0-65535',
        'User-Agent': 'FLESHLAB-Validator/1.0'
      }
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

    // Check for HTML error pages
    const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 100)).toLowerCase();
    if (firstBytes.includes('<!doctype') || firstBytes.includes('<html') || 
        firstBytes.includes('<?xml') || firstBytes.includes('accessdenied') ||
        firstBytes.includes('error')) {
      result.reason = 'File is HTML/XML error page';
      return result;
    }

    // Validate magic header
    const magicHeader = Array.from(uint8Array.slice(0, 8))
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');

    result.magicHeader = magicHeader;

    const hasFtyp = new TextDecoder().decode(uint8Array.slice(4, 8)) === 'ftyp' ||
                    new TextDecoder().decode(uint8Array.slice(8, 12)) === 'ftyp';

    const isMp4 = hasFtyp;
    const isWebm = magicHeader.startsWith('1A 45 DF A3');

    if (!isMp4 && !isWebm && !magicHeader.startsWith('00 00 00')) {
      result.reason = `Invalid video magic header: ${magicHeader}`;
      return result;
    }

    result.valid = true;
    return result;

  } catch (error) {
    result.reason = error.message || 'Network error';
    return result;
  }
}

/**
 * Classify URL type
 */
function classifyUrl(url) {
  if (!url) return 'missing';
  if (url.includes('video.fleshlab.online')) return 'canonical_cdn';
  if (/pub-[a-f0-9]+\.r2\.dev/i.test(url)) return 'legacy_r2_dev';
  if (url.startsWith('http')) return 'external';
  return 'relative_key';
}