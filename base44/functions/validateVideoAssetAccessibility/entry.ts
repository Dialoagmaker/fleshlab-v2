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

    const video = await base44.entities.Video.get(video_id);
    
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Test all asset URLs
    const assets = {
      thumbnail: { url: video.primary_thumbnail_url, accessible: false, status: null },
      trailer: { url: video.trailer_url, accessible: false, status: null },
      source: { url: video.source_video_url, accessible: false, status: null },
      cover: { url: video.cover_image_url, accessible: false, status: null },
      preview_gif: { url: video.preview_gif_url, accessible: false, status: null },
    };

    for (const [name, asset] of Object.entries(assets)) {
      if (!asset.url) {
        asset.status = 'missing';
        continue;
      }
      
      try {
        const resp = await fetch(asset.url, { method: 'HEAD', redirect: 'follow' });
        asset.status = resp.status;
        asset.accessible = resp.ok;
        asset.content_type = resp.headers.get('content-type');
        asset.content_length = resp.headers.get('content-length');
      } catch (e) {
        asset.status = 'error';
        asset.error = e.message;
      }
    }

    // Determine readiness
    const hasValidThumbnail = assets.thumbnail.accessible;
    const hasValidPreview = assets.trailer.accessible || assets.source.accessible;
    const hasValidSource = assets.source.accessible;
    const allAssetsReady = hasValidThumbnail && hasValidPreview;

    // Build diagnostic report
    const report = {
      video_id: video.id,
      video_title: video.title,
      video_slug: video.slug,
      video_status: video.status,
      processing_status: video.processing_status,
      asset_check: assets,
      readiness: {
        can_publish: allAssetsReady,
        missing_items: [
          !hasValidThumbnail && 'Thumbnail not accessible',
          !hasValidPreview && 'Preview/Trailer not accessible',
          !hasValidSource && 'Source video not accessible',
        ].filter(Boolean),
        legacy_urls_detected: Object.values(assets).some(a => a.url && /r2\.dev/i.test(a.url)),
      },
      recommendations: []
    };

    // Add recommendations
    if (!hasValidThumbnail) {
      report.recommendations.push('Upload or fix thumbnail URL');
    }
    if (!hasValidPreview && !assets.trailer.accessible) {
      report.recommendations.push('Generate or fix preview/trailer URL');
    }
    if (!hasValidSource) {
      report.recommendations.push('Upload source video or fix URL');
    }
    if (report.readiness.legacy_urls_detected) {
      report.recommendations.push('Video uses legacy R2.dev URLs - consider migration if assets become unavailable');
    }

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});