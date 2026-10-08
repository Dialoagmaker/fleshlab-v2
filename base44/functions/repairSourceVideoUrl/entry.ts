import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { video_id } = await req.json();
    
    if (!video_id) {
      return Response.json({ error: 'video_id required' }, { status: 400 });
    }

    // Get video
    const video = await base44.entities.Video.get(video_id);
    
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Get source VideoAsset
    const sourceAssets = await base44.entities.VideoAsset.filter({ 
      video_id, 
      asset_type: 'source' 
    });

    if (!sourceAssets || sourceAssets.length === 0) {
      return Response.json({ 
        error: 'No source VideoAsset found',
        video_id,
      }, { status: 404 });
    }

    const sourceAsset = sourceAssets[0];
    
    // Build correct CDN URL from R2 key
    const correctCdnUrl = `https://video.fleshlab.online/${sourceAsset.r2_key}`;
    
    // Validate the new URL before saving
    console.log(`🔍 Validating source URL: ${correctCdnUrl}`);
    let validationStatus = 'unknown';
    let httpStatus = null;
    let contentType = null;
    let contentLength = null;
    
    try {
      const res = await fetch(correctCdnUrl, { method: 'HEAD' });
      httpStatus = res.status;
      contentType = res.headers.get('content-type');
      contentLength = res.headers.get('content-length');
      
      console.log(`HTTP ${httpStatus}, Content-Type: ${contentType}, Length: ${contentLength}`);
      
      // Check if it's a valid video URL
      const isValidVideo = (
        (res.ok || res.status === 206) &&
        contentLength && parseInt(contentLength) > 0 &&
        (contentType?.includes('video/') || contentType?.includes('application/octet-stream'))
      );
      
      if (isValidVideo) {
        validationStatus = 'valid';
        console.log(`✅ Source URL is valid`);
      } else {
        validationStatus = 'invalid';
        console.error(`❌ Source URL validation failed`);
        return Response.json({
          error: 'Source URL validation failed',
          video_id,
          r2_key: sourceAsset.r2_key,
          built_url: correctCdnUrl,
          http_status: httpStatus,
          content_type: contentType,
          content_length: contentLength,
          message: 'Built URL does not return valid video content',
        }, { status: 500 });
      }
    } catch (err) {
      validationStatus = 'error';
      console.error(`❌ Source URL fetch error:`, err);
      return Response.json({
        error: 'Source URL validation error',
        video_id,
        r2_key: sourceAsset.r2_key,
        built_url: correctCdnUrl,
        validation_error: err.message,
        message: 'Cannot validate source URL',
      }, { status: 500 });
    }
    
    // Only update if validation passed
    await base44.entities.Video.update(video_id, {
      source_video_url: correctCdnUrl
    });

    return Response.json({
      success: true,
      video_id,
      old_source_url: video.source_video_url,
      new_source_url: correctCdnUrl,
      r2_key: sourceAsset.r2_key,
      validation_status: validationStatus,
      http_status: httpStatus,
      content_type: contentType,
      content_length: contentLength,
      message: 'Source URL repaired and validated',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});