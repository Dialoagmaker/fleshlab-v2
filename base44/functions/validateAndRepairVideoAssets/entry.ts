import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Validate image URL with magic header verification
 * Returns: { ok, status, contentType, contentLength, magicHeader, width, height, reason }
 */
async function validateImageUrl(url) {
  const result = { ok: false, status: null, contentType: null, contentLength: 0, magicHeader: null, width: null, height: null, reason: null };

  if (!url) {
    result.reason = 'URL is null/empty';
    return result;
  }

  try {
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

    const getResponse = await fetch(url, { method: 'GET' });
    const arrayBuffer = await getResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (uint8Array.length < 4) {
      result.reason = 'File too small';
      return result;
    }

    const magicHeader = Array.from(uint8Array.slice(0, 4))
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');

    result.magicHeader = magicHeader;

    const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 100)).toLowerCase();
    if (firstBytes.includes('<!doctype') || firstBytes.includes('<html') || 
        firstBytes.includes('<?xml') || firstBytes.includes('error') ||
        firstBytes.includes('access denied') || firstBytes.includes('not found')) {
      result.reason = 'File is HTML/XML error page, not an image';
      return result;
    }

    const isJpeg = magicHeader.startsWith('FF D8');
    const isPng = magicHeader.startsWith('89 50 4E 47');
    const isWebp = magicHeader.startsWith('52 49 46 46') && 
                   Array.from(uint8Array.slice(8, 12)).map(b => String.fromCharCode(b)).join('') === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      result.reason = `Invalid image magic header: ${magicHeader}`;
      return result;
    }

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
 * Validate video URL
 * Returns: { ok, status, contentType, contentLength, magicHeader, reason }
 */
async function validateVideoUrl(url) {
  const result = { ok: false, status: null, contentType: null, contentLength: 0, magicHeader: null, reason: null };

  if (!url) {
    result.reason = 'URL is null/empty';
    return result;
  }

  try {
    const headResponse = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    result.status = headResponse.status;
    result.contentType = headResponse.headers.get('content-type');
    result.contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);

    if (result.status !== 200 && result.status !== 206 && result.status !== 304) {
      result.reason = `HTTP ${result.status}`;
      return result;
    }

    if (!result.contentType || 
        (!result.contentType.startsWith('video/') && 
         result.contentType !== 'application/octet-stream')) {
      result.reason = `Invalid content-type: ${result.contentType}`;
      return result;
    }

    if (result.contentLength === 0) {
      result.reason = 'Empty file (0 bytes)';
      return result;
    }

    const getResponse = await fetch(url, { method: 'GET' });
    const arrayBuffer = await getResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (uint8Array.length < 8) {
      result.reason = 'File too small';
      return result;
    }

    const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 100)).toLowerCase();
    if (firstBytes.includes('<!doctype') || firstBytes.includes('<html') || 
        firstBytes.includes('<?xml') || firstBytes.includes('error') ||
        firstBytes.includes('access denied') || firstBytes.includes('not found')) {
      result.reason = 'File is HTML/XML error page, not a video';
      return result;
    }

    const magicHeader = Array.from(uint8Array.slice(0, 8))
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');

    result.magicHeader = magicHeader;

    const hasFtyp = uint8Array.length > 8 && 
      (new TextDecoder().decode(uint8Array.slice(4, 8)) === 'ftyp' ||
       new TextDecoder().decode(uint8Array.slice(8, 12)) === 'ftyp');

    const isMp4 = hasFtyp;
    const isWebm = magicHeader.startsWith('1A 45 DF A3');

    if (!isMp4 && !isWebm && result.contentType === 'application/octet-stream') {
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
 * Build public asset URL from R2 key or URL
 */
function buildPublicAssetUrl(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://video.fleshlab.online/${trimmed.replace(/^\/+/, '')}`;
}

/**
 * Main function: Validate and repair video assets
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - admin access required' }, { status: 403 });
    }

    const { video_id } = await req.json();
    
    if (!video_id) {
      return Response.json({ error: 'video_id required' }, { status: 400 });
    }

    console.log('🔍 Validating assets for video:', video_id);

    const video = await base44.entities.Video.get(video_id);
    const videoAssets = await base44.entities.VideoAsset.filter({ video_id });

    const report = {
      video_id,
      title: video.title,
      source: { raw: video.source_video_url, resolved: null, status: null, valid: false, reason: null },
      thumbnail: { raw: video.primary_thumbnail_url, resolved: null, status: null, corrupt: false, valid: false, magicHeader: null, contentType: null, size: null, width: null, height: null, reason: null },
      preview: { raw: video.trailer_url, resolved: null, status: null, valid: false, contentType: null, size: null, reason: null },
      canPublishAssets: false,
      blockingReasons: [],
    };

    // Validate source video
    const sourceUrl = buildPublicAssetUrl(video.source_video_url);
    report.source.resolved = sourceUrl;
    if (sourceUrl) {
      const sourceValidation = await validateVideoUrl(sourceUrl);
      report.source.status = sourceValidation.status;
      report.source.valid = sourceValidation.ok;
      report.source.reason = sourceValidation.reason;
    } else {
      report.source.reason = 'Missing';
    }

    if (!report.source.valid) {
      report.blockingReasons.push(`Source video: ${report.source.reason || 'invalid'}`);
    }

    // Validate thumbnail
    const thumbUrl = buildPublicAssetUrl(video.primary_thumbnail_url);
    report.thumbnail.resolved = thumbUrl;
    if (thumbUrl) {
      const thumbValidation = await validateImageUrl(thumbUrl);
      report.thumbnail.status = thumbValidation.status;
      report.thumbnail.contentType = thumbValidation.contentType;
      report.thumbnail.size = thumbValidation.contentLength;
      report.thumbnail.magicHeader = thumbValidation.magicHeader;
      report.thumbnail.width = thumbValidation.width;
      report.thumbnail.height = thumbValidation.height;

      if (thumbValidation.magicHeader && thumbValidation.magicHeader !== 'FF D8' && thumbValidation.magicHeader !== '89 50 4E 47') {
        report.thumbnail.corrupt = true;
        report.thumbnail.reason = `Corrupt - magic header ${thumbValidation.magicHeader} (expected FF D8 for JPEG)`;
      } else if (thumbValidation.ok) {
        report.thumbnail.valid = true;
      } else {
        report.thumbnail.reason = thumbValidation.reason;
      }
    } else {
      report.thumbnail.reason = 'Missing';
    }

    if (report.thumbnail.corrupt) {
      report.blockingReasons.push('Thumbnail corrupt (HTML saved as JPG) - regeneration required');
    } else if (!report.thumbnail.valid) {
      report.blockingReasons.push(`Thumbnail: ${report.thumbnail.reason || 'invalid'}`);
    }

    // Validate preview
    const previewUrl = video.trailer_url || video.source_video_url;
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

    report.canPublishAssets = report.source.valid && report.thumbnail.valid;

    console.log('📊 Validation complete:', { canPublish: report.canPublishAssets, blocking: report.blockingReasons });

    return Response.json(report);

  } catch (error) {
    console.error('❌ Validation failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});