/**
 * Server-Side Asset Validation Helper
 * 
 * Validates asset URLs and bytes WITHOUT full downloads.
 * Used by: Publish gating, Asset repair, Admin diagnostics
 * 
 * Rules:
 * - validateImageUrl: Downloads full image (safe for thumbnails < 10MB)
 * - validateVideoUrl: Uses HEAD + small range request (NEVER downloads full video)
 * - validateAssetSet: Validates all assets for a video
 */

const CDN_BASE = 'https://video.fleshlab.online';

/**
 * Validate image URL - downloads full image (safe for thumbnails < 10MB)
 * Checks:
 * - HTTP 200/304
 * - image content-type
 * - Magic header: FF D8 (JPEG), 89 50 4E 47 (PNG), RIFF....WEBP
 * - Rejects HTML/XML error pages
 * - Validates dimensions via createImageBitmap
 * 
 * @param {string} url - Image URL to validate
 * @returns {{ ok: boolean, status: number|null, contentType: string|null, contentLength: number, magicHeader: string|null, width: number|null, height: number|null, reason: string|null }}
 */
export async function validateImageUrl(url) {
  const result = { 
    ok: false, 
    status: null, 
    contentType: null, 
    contentLength: 0, 
    magicHeader: null, 
    width: null, 
    height: null, 
    reason: null 
  };

  if (!url) {
    result.reason = 'URL is null/empty';
    return result;
  }

  try {
    // Step 1: HEAD request for metadata
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

    // Step 2: GET request - download full image (safe for thumbnails)
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
        firstBytes.includes('<?xml') || firstBytes.includes('accessdenied') ||
        firstBytes.includes('error')) {
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
 * Validate video URL using ONLY HEAD + small range request (NEVER downloads full video)
 * Checks:
 * - HTTP 200/206/304
 * - video/mp4, video/quicktime, or application/octet-stream with valid video header
 * - Content length > 0
 * - Magic header (ftyp for MP4/MOV)
 * - Rejects HTML/XML error pages
 * 
 * @param {string} url - Video URL to validate
 * @returns {{ ok: boolean, status: number|null, contentType: string|null, contentLength: number, magicHeader: string|null, reason: string|null }}
 */
export async function validateVideoUrl(url) {
  const result = { 
    ok: false, 
    status: null, 
    contentType: null, 
    contentLength: 0, 
    magicHeader: null, 
    reason: null 
  };

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
        firstBytes.includes('<?xml') || firstBytes.includes('accessdenied') ||
        firstBytes.includes('error')) {
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
 * Validate complete asset set for a video
 * Used for publish gating and admin diagnostics
 * 
 * @param {Object} video - Video entity
 * @param {Array} videoAssets - Array of VideoAsset records
 * @returns {{ ok: boolean, canPublish: boolean, source: Object, thumbnail: Object, preview: Object, blockingReasons: string[] }}
 */
export async function validateAssetSet(video, videoAssets = []) {
  const report = {
    ok: false,
    canPublish: false,
    source: { url: null, valid: false, reason: null },
    thumbnail: { url: null, valid: false, corrupt: false, reason: null },
    preview: { url: null, valid: false, reason: null },
    blockingReasons: []
  };

  // Validate source
  report.source.url = video.source_video_url;
  if (!video.source_video_url) {
    report.source.reason = 'Missing';
    report.blockingReasons.push('Source video URL missing');
  } else {
    const sourceValidation = await validateVideoUrl(video.source_video_url);
    report.source.valid = sourceValidation.ok;
    report.source.reason = sourceValidation.reason;
    if (!sourceValidation.ok) {
      report.blockingReasons.push(`Source video: ${sourceValidation.reason}`);
    }
  }

  // Validate thumbnail
  report.thumbnail.url = video.primary_thumbnail_url;
  if (!video.primary_thumbnail_url) {
    report.thumbnail.reason = 'Missing';
    report.blockingReasons.push('Thumbnail URL missing');
  } else {
    const thumbValidation = await validateImageUrl(video.primary_thumbnail_url);
    report.thumbnail.valid = thumbValidation.ok;
    report.thumbnail.reason = thumbValidation.reason;
    
    // Check for corrupt thumbnail (HTML saved as JPG)
    if (thumbValidation.magicHeader && thumbValidation.magicHeader !== 'FF D8' && thumbValidation.magicHeader !== '89 50 4E 47') {
      report.thumbnail.corrupt = true;
      report.thumbnail.reason = `Corrupt - magic header ${thumbValidation.magicHeader} (expected FF D8 for JPEG)`;
      report.blockingReasons.push('Thumbnail corrupt (HTML saved as JPG) - regeneration required');
    } else if (!thumbValidation.ok) {
      report.blockingReasons.push(`Thumbnail: ${thumbValidation.reason}`);
    }
  }

  // Validate preview (optional if source exists)
  report.preview.url = video.trailer_url || video.source_video_url;
  if (!video.trailer_url && video.source_video_url) {
    // Source can serve as preview
    report.preview.valid = report.source.valid;
    report.preview.reason = 'Using source video';
  } else if (!video.trailer_url) {
    report.preview.reason = 'Missing';
    report.blockingReasons.push('Preview/Trailer URL missing');
  } else {
    const previewValidation = await validateVideoUrl(video.trailer_url);
    report.preview.valid = previewValidation.ok;
    report.preview.reason = previewValidation.reason;
    if (!previewValidation.ok) {
      report.blockingReasons.push(`Preview: ${previewValidation.reason}`);
    }
  }

  // Determine publish readiness
  report.canPublish = report.source.valid && report.thumbnail.valid && !report.thumbnail.corrupt;
  report.ok = report.canPublish;

  return report;
}