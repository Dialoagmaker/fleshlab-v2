import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Validate image URL with magic header verification
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
      result.actualFormat = firstBytes.includes('<!doctype') || firstBytes.includes('<html') ? 'HTML' : 'XML';
      return result;
    }

    const isJpeg = magicHeader.startsWith('FF D8');
    const isPng = magicHeader.startsWith('89 50 4E 47');
    const isWebp = magicHeader.startsWith('52 49 46 46') && 
                   Array.from(uint8Array.slice(8, 12)).map(b => String.fromCharCode(b)).join('') === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      result.reason = `Invalid image magic header: ${magicHeader}`;
      result.actualFormat = 'unknown';
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
 * Main function: Repair corrupt thumbnail
 * Steps:
 * 1. Validate current thumbnail (confirm it's corrupt)
 * 2. Clear the corrupt URL
 * 3. Trigger thumbnail regeneration via retriggerVideoProcessing
 * 4. Wait for regeneration
 * 5. Validate new thumbnail
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - admin access required' }, { status: 403 });
    }

    const { video_id, forceRegenerate = false } = await req.json();
    
    if (!video_id) {
      return Response.json({ error: 'video_id required' }, { status: 400 });
    }

    console.log('🔧 Repairing corrupt thumbnail for video:', video_id);

    // A) Load video data
    const video = await base44.entities.Video.get(video_id);
    
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    const report = {
      video_id,
      title: video.title,
      oldThumbnail: {
        url: video.primary_thumbnail_url,
        status: null,
        corrupt: false,
        reason: null,
        magicHeader: null,
        contentType: null,
      },
      newThumbnail: {
        url: null,
        status: null,
        valid: false,
        reason: null,
        magicHeader: null,
        width: null,
        height: null,
      },
      success: false,
    };

    // B) Validate current thumbnail (confirm it's corrupt)
    const oldThumbUrl = buildPublicAssetUrl(video.primary_thumbnail_url);
    report.oldThumbnail.url = oldThumbUrl;

    if (oldThumbUrl) {
      console.log('🔍 Validating current thumbnail:', oldThumbUrl);
      const oldValidation = await validateImageUrl(oldThumbUrl);
      report.oldThumbnail.status = oldValidation.status;
      report.oldThumbnail.contentType = oldValidation.contentType;
      report.oldThumbnail.magicHeader = oldValidation.magicHeader;

      if (oldValidation.magicHeader && oldValidation.magicHeader !== 'FF D8' && oldValidation.magicHeader !== '89 50 4E 47') {
        report.oldThumbnail.corrupt = true;
        report.oldThumbnail.reason = `Corrupt - magic header ${oldValidation.magicHeader} (expected FF D8 for JPEG)`;
        console.log('❌ Confirmed: Thumbnail is corrupt:', oldValidation.magicHeader);
      } else if (!oldValidation.ok) {
        report.oldThumbnail.reason = oldValidation.reason;
        console.log('❌ Thumbnail invalid:', oldValidation.reason);
      }
    } else {
      report.oldThumbnail.reason = 'Missing';
    }

    // C) Clear corrupt thumbnail URL
    console.log('🗑️ Clearing corrupt thumbnail URL...');
    await base44.entities.Video.update(video_id, { primary_thumbnail_url: '' });
    console.log('✅ Corrupt thumbnail URL cleared');

    // D) Trigger thumbnail regeneration
    console.log('🔄 Triggering thumbnail regeneration...');
    try {
      const retriggerResult = await base44.functions.invoke('retriggerVideoProcessing', { 
        video_id,
        regenerate_only: 'thumbnail'
      });
      console.log('✅ Regeneration triggered:', retriggerResult.data?.message);
    } catch (retriggerError) {
      console.error('❌ Regeneration trigger failed:', retriggerError);
      report.newThumbnail.reason = 'Failed to trigger regeneration: ' + retriggerError.message;
      return Response.json(report);
    }

    // E) Wait for regeneration (poll every 2 seconds, max 30 seconds)
    console.log('⏳ Waiting for regeneration...');
    let attempts = 0;
    const maxAttempts = 15; // 30 seconds

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;

      const refreshedVideo = await base44.entities.Video.get(video_id);
      
      if (refreshedVideo.primary_thumbnail_url && refreshedVideo.primary_thumbnail_url !== video.primary_thumbnail_url) {
        console.log('✅ New thumbnail URL detected:', refreshedVideo.primary_thumbnail_url);
        
        // F) Validate new thumbnail
        const newThumbUrl = buildPublicAssetUrl(refreshedVideo.primary_thumbnail_url);
        report.newThumbnail.url = newThumbUrl;

        const newValidation = await validateImageUrl(newThumbUrl);
        report.newThumbnail.status = newValidation.status;
        report.newThumbnail.contentType = newValidation.contentType;
        report.newThumbnail.magicHeader = newValidation.magicHeader;
        report.newThumbnail.width = newValidation.width;
        report.newThumbnail.height = newValidation.height;

        if (newValidation.ok) {
          report.newThumbnail.valid = true;
          report.success = true;
          console.log('✅ New thumbnail validated successfully:', newValidation.width, 'x', newValidation.height);
        } else {
          report.newThumbnail.reason = newValidation.reason;
          console.log('❌ New thumbnail validation failed:', newValidation.reason);
        }

        break;
      }

      console.log('⏳ Still waiting for new thumbnail... (attempt', attempts, '/', maxAttempts, ')');
    }

    if (attempts >= maxAttempts) {
      report.newThumbnail.reason = 'Timeout: Regeneration took too long (>30s)';
      console.log('⏱️ Regeneration timeout');
    }

    return Response.json(report);

  } catch (error) {
    console.error('❌ Thumbnail repair failed:', error);
    return Response.json({ 
      error: error.message,
      video_id: req.json?.video_id,
    }, { status: 500 });
  }
});