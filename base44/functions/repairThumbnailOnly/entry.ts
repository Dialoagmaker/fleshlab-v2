/**
 * Repair Corrupt Thumbnail Only
 * 
 * Flow:
 * 1. Load video and check source/preview URLs
 * 2. Call processor API to generate thumbnail from valid source or preview
 * 3. Validate uploaded thumbnail (HTTP, content-type, magic header, dimensions)
 * 4. Save URL to Video.primary_thumbnail_url ONLY if validation passes
 * 
 * Does NOT:
 * - Touch source_video_url
 * - Touch trailer_url
 * - Trigger full asset repair
 * - Regenerate preview
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PROCESSOR_API_KEY = Deno.env.get('PROCESSOR_API_KEY');
const PROCESSOR_BASE_URL = Deno.env.get('PROCESSOR_WEBHOOK_URL')?.replace('/webhook', '');
const R2_BUCKET_URL = Deno.env.get('R2_PUBLIC_BUCKET_URL');

Deno.serve(async (req) => {
  const result = {
    ok: false,
    step: 'init',
    error: null,
    details: null,
    validation: null,
    source_url: null,
    preview_url: null
  };

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const { video_id } = payload;

    if (!video_id) {
      return Response.json({ error: 'video_id required' }, { status: 400 });
    }

    result.step = 'load_video';

    // Load video
    const video = await base44.asServiceRole.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ ...result, error: 'Video not found' }, { status: 404 });
    }

    console.log(`[repairThumbnailOnly] Video ${video_id}:`, {
      source: video.source_video_url ? 'exists' : 'missing',
      preview: video.trailer_url ? 'exists' : 'missing'
    });

    result.source_url = video.source_video_url;
    result.preview_url = video.trailer_url;

    // Find a valid source to generate from - prefer preview, fallback to source
    const generateFromUrl = video.trailer_url || video.source_video_url;
    if (!generateFromUrl) {
      return Response.json({
        ...result,
        error: 'No source or preview video URL available',
        step: 'find_source'
      }, { status: 400 });
    }

    console.log(`[repairThumbnailOnly] Generating thumbnail from: ${generateFromUrl}`);

    result.step = 'call_processor';

    // Call processor API to generate thumbnail
    const processorResponse = await fetch(`${PROCESSOR_BASE_URL}/generate-thumbnail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PROCESSOR_API_KEY}`
      },
      body: JSON.stringify({
        video_id,
        source_url: generateFromUrl,
        timestamp_seconds: 5,  // Extract frame at 5 seconds
        width: 640,
        height: 360,
        quality: 85
      })
    });

    if (!processorResponse.ok) {
      const errorText = await processorResponse.text();
      console.error('Processor API error:', processorResponse.status, errorText);
      return Response.json({
        ...result,
        error: `Processor API failed: ${processorResponse.status}`,
        details: errorText.substring(0, 500)
      }, { status: 500 });
    }

    const processorResult = await processorResponse.json();
    console.log('[repairThumbnailOnly] Processor result:', processorResult);

    if (!processorResult.ok || !processorResult.thumbnail_url) {
      return Response.json({
        ...result,
        error: processorResult.error || 'Processor did not return thumbnail URL',
        step: 'processor_response'
      }, { status: 500 });
    }

    const newThumbnailUrl = processorResult.thumbnail_url;
    console.log(`[repairThumbnailOnly] New thumbnail URL: ${newThumbnailUrl}`);

    result.step = 'validate_thumbnail';

    // Validate uploaded thumbnail via HTTP HEAD
    const validateResponse = await fetch(newThumbnailUrl, { method: 'HEAD', redirect: 'follow' });
    
    if (!validateResponse.ok) {
      return Response.json({
        ...result,
        error: `Uploaded thumbnail validation failed: HTTP ${validateResponse.status}`,
        step: 'validate_http'
      }, { status: 500 });
    }

    const contentType = validateResponse.headers.get('content-type');
    const contentLength = validateResponse.headers.get('content-length');

    if (!contentType || (!contentType.includes('image/jpeg') && !contentType.includes('image/png'))) {
      return Response.json({
        ...result,
        error: `Invalid content-type: ${contentType}`,
        step: 'validate_content_type'
      }, { status: 500 });
    }

    console.log(`[repairThumbnailOnly] Content-Type: ${contentType}, Length: ${contentLength}`);

    // Download and validate magic header + dimensions
    const imgResponse = await fetch(newThumbnailUrl);
    const imgBuffer = await imgResponse.arrayBuffer();
    const imgBytes = new Uint8Array(imgBuffer);
    
    // Check magic header
    const magicHeader = Array.from(imgBytes.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    console.log(`[repairThumbnailOnly] Magic header: ${magicHeader}`);

    // Check for HTML (corrupt file)
    const sampleText = new TextDecoder().decode(imgBytes.slice(0, 100));
    if (sampleText.includes('<!DOCTYPE') || sampleText.includes('<html')) {
      return Response.json({
        ...result,
        error: 'Generated file contains HTML - processor failed',
        magicHeader,
        step: 'validate_magic'
      }, { status: 500 });
    }

    // Validate magic header (FF D8 for JPEG, 89 50 4E 47 for PNG)
    const isJpeg = magicHeader.substring(0, 5) === 'FF D8';
    const isPng = magicHeader.substring(0, 11) === '89 50 4E 47';

    if (!isJpeg && !isPng) {
      return Response.json({
        ...result,
        error: `Invalid image magic header: ${magicHeader}`,
        expected: 'FF D8 (JPEG) or 89 50 4E 47 (PNG)',
        step: 'validate_magic'
      }, { status: 500 });
    }

    // Extract dimensions
    let width = 0, height = 0;
    try {
      if (isJpeg && imgBytes.length > 10) {
        // JPEG: find SOF0 marker (FF C0)
        for (let i = 0; i < Math.min(imgBytes.length - 10, 2000); i++) {
          if (imgBytes[i] === 0xFF && imgBytes[i + 1] === 0xC0) {
            height = (imgBytes[i + 5] << 8) | imgBytes[i + 6];
            width = (imgBytes[i + 7] << 8) | imgBytes[i + 8];
            break;
          }
        }
      } else if (isPng && imgBytes.length > 24) {
        // PNG: dimensions at bytes 16-23
        width = (imgBytes[16] << 24) | (imgBytes[17] << 16) | (imgBytes[18] << 8) | imgBytes[19];
        height = (imgBytes[20] << 24) | (imgBytes[21] << 16) | (imgBytes[22] << 8) | imgBytes[23];
      }
    } catch (e) {
      console.log('Could not extract dimensions, skipping check');
    }

    console.log(`[repairThumbnailOnly] Dimensions: ${width}x${height}, ${imgBytes.length} bytes`);

    if (width <= 0 || height <= 0) {
      return Response.json({
        ...result,
        error: 'Invalid image dimensions',
        step: 'validate_dimensions'
      }, { status: 500 });
    }

    result.validation = {
      httpStatus: validateResponse.status,
      contentType,
      contentLength: parseInt(contentLength || '0', 10),
      magicHeader,
      width,
      height,
      fileSize: imgBytes.length,
      isJpeg,
      isPng
    };

    result.step = 'save_to_video';

    // Save to Video entity
    await base44.asServiceRole.entities.Video.update(video_id, {
      primary_thumbnail_url: newThumbnailUrl
    });

    console.log(`[repairThumbnailOnly] Saved to Video.primary_thumbnail_url`);

    result.ok = true;
    result.step = 'complete';
    result.error = null;

    return Response.json({
      ok: true,
      step: 'complete',
      message: 'Thumbnail repaired successfully',
      video_id,
      new_thumbnail_url: newThumbnailUrl,
      validation: result.validation,
      source_url: result.source_url,
      preview_url: result.preview_url
    });

  } catch (error) {
    console.error('repairThumbnailOnly error:', error);
    result.error = error.message || 'Unknown error';
    result.details = error.stack?.substring(0, 500);
    
    return Response.json(result, { status: 500 });
  }
});