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

    // Get VideoAssets
    const videoAssets = await base44.entities.VideoAsset.filter({ video_id });

    // Get Brand
    const brand = video.brand_id ? await base44.entities.Brand.get(video.brand_id) : null;

    // Test URLs
    const urlsToTest = {
      'primary_thumbnail_url': video.primary_thumbnail_url,
      'trailer_url': video.trailer_url,
      'source_video_url': video.source_video_url,
      'cover_image_url': video.cover_image_url,
      'preview_gif_url': video.preview_gif_url,
    };

    const urlTests = {};
    for (const [name, url] of Object.entries(urlsToTest)) {
      if (!url) {
        urlTests[name] = { status: 'missing', url: null };
        continue;
      }
      
      try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        urlTests[name] = {
          status: response.ok ? 'accessible' : 'error',
          http_status: response.status,
          content_type: response.headers.get('content-type'),
          content_length: response.headers.get('content-length'),
          url: url,
          final_url: response.url,
        };
      } catch (err) {
        urlTests[name] = {
          status: 'error',
          error: err.message,
          url: url,
        };
      }
    }

    // Check R2 keys if we have access
    const r2Check = {
      studio_id: video.brand_id,
      source_file: video.source_video_url?.split('/').pop()?.split('?')[0],
    };

    return Response.json({
      video_id: video.id,
      title: video.title,
      brand_id: video.brand_id,
      brand_name: brand?.name || null,
      video_entity_fields: {
        primary_thumbnail_url: video.primary_thumbnail_url,
        trailer_url: video.trailer_url,
        source_video_url: video.source_video_url,
        cover_image_url: video.cover_image_url,
        preview_gif_url: video.preview_gif_url,
        processing_status: video.processing_status,
        status: video.status,
      },
      video_assets_count: videoAssets.length,
      video_assets: videoAssets,
      url_tests: urlTests,
      r2_info: r2Check,
      frontend_uses: {
        thumbnail_field: 'primary_thumbnail_url',
        preview_field: 'trailer_url (priority 1) or source_video_url (priority 2)',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});