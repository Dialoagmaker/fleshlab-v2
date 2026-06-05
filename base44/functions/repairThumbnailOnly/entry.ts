/**
 * Repair Thumbnail Only
 * 
 * Clears corrupt thumbnail URL and triggers regeneration via retriggerVideoProcessing.
 * Does NOT download source video or run FFmpeg locally.
 * 
 * Flow:
 * 1. Load video
 * 2. Clear current thumbnail URL
 * 3. Call retriggerVideoProcessing via HTTP (not SDK invoke)
 * 4. Poll for new thumbnail URL (max 30s)
 * 5. Validate new thumbnail (HTTP, content-type, magic header, dimensions)
 * 6. Return structured JSON with exact step and validation details
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PROCESSOR_API_KEY = Deno.env.get('PROCESSOR_API_KEY');
const PROCESSOR_WEBHOOK_URL = Deno.env.get('PROCESSOR_WEBHOOK_URL');

/**
 * Validate image URL - returns detailed validation result
 */
async function validateImageUrl(url) {
  const result = {
    ok: false,
    status: null,
    contentType: null,
    contentLength: 0,
    magicHeader: null,
    width: 0,
    height: 0,
    reason: null,
    actualFormat: null
  };

  if (!url) {
    result.reason = 'URL is null/empty';
    return result;
  }

  try {
    // HEAD request first
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

    // GET request for magic header check
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

    // Check for HTML/XML error pages
    const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 100)).toLowerCase();
    if (firstBytes.includes('<!doctype') || firstBytes.includes('<html') || 
        firstBytes.includes('<?xml') || firstBytes.includes('error')) {
      result.reason = 'File is HTML/XML error page, not an image';
      result.actualFormat = firstBytes.includes('<!doctype') || firstBytes.includes('<html') ? 'HTML' : 'XML';
      return result;
    }

    // Validate magic header (JPEG: FF D8, PNG: 89 50 4E 47)
    const isJpeg = magicHeader.startsWith('FF D8');
    const isPng = magicHeader.startsWith('89 50 4E 47');

    if (!isJpeg && !isPng) {
      result.reason = `Invalid image magic header: ${magicHeader}`;
      result.actualFormat = 'unknown';
      return result;
    }

    // Extract dimensions
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

Deno.serve(async (req) => {
  const result = {
    ok: false,
    step: 'init',
    error: null,
    details: null,
    video_id: null,
    source_url: null,
    preview_url: null,
    old_thumbnail_url: null,
    new_thumbnail_url: null,
    validation: null
  };

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ ...result, step: 'auth', error: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const { video_id } = payload;

    if (!video_id) {
      return Response.json({ ...result, step: 'validation', error: 'video_id required' }, { status: 400 });
    }

    result.video_id = video_id;
    result.step = 'load_video';

    // Load video
    const video = await base44.asServiceRole.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ ...result, step: 'load_video', error: 'Video not found' }, { status: 404 });
    }

    result.source_url = video.source_video_url;
    result.preview_url = video.trailer_url;
    result.old_thumbnail_url = video.primary_thumbnail_url;

    console.log(`[repairThumbnailOnly] Video ${video_id}:`, {
      source: video.source_video_url ? 'exists' : 'missing',
      preview: video.trailer_url ? 'exists' : 'missing',
      current_thumbnail: video.primary_thumbnail_url || 'null'
    });

    // Clear current thumbnail URL
    result.step = 'clear_thumbnail';
    if (video.primary_thumbnail_url) {
      console.log(`[repairThumbnailOnly] Clearing old thumbnail URL`);
      await base44.asServiceRole.entities.Video.update(video_id, { primary_thumbnail_url: '' });
    }

    // Trigger regeneration via processor API /regenerate endpoint
    result.step = 'trigger_regeneration';
    console.log('[repairThumbnailOnly] Triggering thumbnail regeneration...');

    // Find source asset for signed URL
    const assets = await base44.asServiceRole.entities.VideoAsset.filter({ video_id, asset_type: 'source' });
    const sourceAsset = assets[0];

    if (!sourceAsset || !sourceAsset.r2_key) {
      return Response.json({
        ...result,
        step: 'find_source',
        error: 'No source asset found for this video'
      }, { status: 404 });
    }

    // Generate signed R2 URL
    const { S3Client, GetObjectCommand } = await import('npm:@aws-sdk/client-s3');
    const { getSignedUrl } = await import('npm:@aws-sdk/s3-request-presigner');

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

    const appBaseUrl = (Deno.env.get('APP_BASE_URL') || '').replace(/\/$/, '');
    const callbackUrl = `${appBaseUrl}/api/functions/updateVideoProcessingResult?processor_key=${encodeURIComponent(PROCESSOR_API_KEY)}`;

    const keyParts = sourceAsset.r2_key.split('/');
    const studio = keyParts.length >= 2 ? keyParts[1] : 'default';
    const originalFile = keyParts[keyParts.length - 1];
    const ext = originalFile.includes('.') ? originalFile.split('.').pop() : 'mov';
    const uuidDir = keyParts[keyParts.length - 2];
    const file = (uuidDir && uuidDir !== 'videos') ? `${uuidDir}.${ext}` : originalFile;

    const retriggerResponse = await fetch(`${PROCESSOR_WEBHOOK_URL}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: PROCESSOR_API_KEY,
        studio,
        file,
        src_url: signedUrl,
        video_id,
        source_asset_id: sourceAsset.id,
        callback_url: callbackUrl,
        regenerate_only: 'thumbnail'
      })
    });

    if (!retriggerResponse.ok) {
      const errorText = await retriggerResponse.text();
      console.error('[repairThumbnailOnly] Processor API error:', retriggerResponse.status, errorText);
      return Response.json({
        ...result,
        step: 'trigger_regeneration',
        error: `Processor API failed: ${retriggerResponse.status}`,
        details: errorText.substring(0, 500)
      }, { status: 500 });
    }

    const retriggerResult = await retriggerResponse.json();
    console.log('[repairThumbnailOnly] Regeneration triggered:', retriggerResult);

    // Poll for new thumbnail URL (max 90 seconds, 3s intervals)
    result.step = 'wait_regeneration';
    console.log('[repairThumbnailOnly] Waiting for regeneration...');

    let attempts = 0;
    const maxAttempts = 30;  // 90 seconds

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;

      const refreshedVideo = await base44.asServiceRole.entities.Video.get(video_id);
      
      if (refreshedVideo.primary_thumbnail_url && refreshedVideo.primary_thumbnail_url !== result.old_thumbnail_url) {
        console.log('[repairThumbnailOnly] New thumbnail URL detected:', refreshedVideo.primary_thumbnail_url);
        result.new_thumbnail_url = refreshedVideo.primary_thumbnail_url;
        
        // Validate new thumbnail
        result.step = 'validate_thumbnail';
        const validation = await validateImageUrl(refreshedVideo.primary_thumbnail_url);
        console.log('[repairThumbnailOnly] Validation result:', validation);

        result.validation = {
          httpStatus: validation.status,
          contentType: validation.contentType,
          contentLength: validation.contentLength,
          magicHeader: validation.magicHeader,
          width: validation.width,
          height: validation.height,
          fileSize: validation.contentLength,
          format: validation.magicHeader?.startsWith('FF D8') ? 'JPEG' : 
                  validation.magicHeader?.startsWith('89 50 4E 47') ? 'PNG' : 'unknown'
        };

        if (validation.ok) {
          console.log('[repairThumbnailOnly] New thumbnail validated:', validation.width, 'x', validation.height);
          result.ok = true;
          result.step = 'complete';
          result.error = null;
        } else {
          result.error = `Thumbnail validation failed: ${validation.reason}`;
          result.step = 'validate_thumbnail';
        }

        break;
      }

      console.log(`[repairThumbnailOnly] Waiting... (attempt ${attempts}/${maxAttempts})`);
    }

    if (attempts >= maxAttempts) {
      result.error = 'Timeout: Regeneration took too long (>30s)';
      result.step = 'wait_regeneration';
    }

    return Response.json(result, { status: result.ok ? 200 : 500 });

  } catch (error) {
    console.error('[repairThumbnailOnly] Error:', error);
    result.error = error.message || 'Unknown error';
    result.details = error.stack?.substring(0, 500);
    result.step = 'exception';
    
    return Response.json(result, { status: 500 });
  }
});