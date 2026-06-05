import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const allVideos = await base44.asServiceRole.entities.Video.list();
    const inventory = [];

    // Classify and test URL helper
    const classifyAndTest = async (url) => {
      if (!url || typeof url !== 'string' || !url.trim()) {
        return { type: 'invalid', isReachable: false, httpStatus: null, contentType: null, contentLength: null };
      }
      const trimmed = url.trim();
      let type;
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        type = 'relative_r2_key';
      } else if (/pub-[a-f0-9]+\.r2\.dev/i.test(trimmed)) {
        type = 'legacy_r2_dev';
      } else if (trimmed.startsWith('https://video.fleshlab.online/')) {
        type = 'canonical_cdn';
      } else {
        type = 'external';
      }
      
      // Test reachability
      try {
        const resp = await fetch(trimmed, { method: 'HEAD', redirect: 'follow' });
        return {
          type,
          isReachable: resp.ok,
          httpStatus: resp.status,
          contentType: resp.headers.get('content-type'),
          contentLength: resp.headers.get('content-length')
        };
      } catch (e) {
        return { type, isReachable: false, httpStatus: 0, error: e.message };
      }
    };

    // Process videos in batches to avoid timeout
    const batchSize = 20;
    for (let i = 0; i < allVideos.length; i += batchSize) {
      const batch = allVideos.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(batch.map(async (video) => {
        const fields = {
          source_video_url: await classifyAndTest(video.source_video_url),
          primary_thumbnail_url: await classifyAndTest(video.primary_thumbnail_url),
          trailer_url: await classifyAndTest(video.trailer_url),
          cover_image_url: await classifyAndTest(video.cover_image_url),
          preview_gif_url: await classifyAndTest(video.preview_gif_url)
        };

        // Compute health status
        const hasReachableThumbnail = fields.primary_thumbnail_url.isReachable;
        const hasReachablePreview = fields.trailer_url.isReachable || fields.source_video_url.isReachable;
        const hasReachableSource = fields.source_video_url.isReachable;
        const hasLegacyUrls = Object.values(fields).some(f => f.type === 'legacy_r2_dev');
        
        let asset_health = 'incomplete';
        if (hasReachableThumbnail && hasReachablePreview) {
          asset_health = hasLegacyUrls ? 'healthy_legacy' : 'healthy_canonical';
        } else if (!hasReachableSource) {
          asset_health = 'missing_source';
        } else if (Object.values(fields).some(f => f.httpStatus === 404 || f.httpStatus === 0)) {
          asset_health = 'broken';
        }

        return {
          video_id: video.id,
          title: video.title,
          slug: video.slug,
          status: video.status,
          processing_status: video.processing_status,
          asset_health,
          fields,
          health_summary: {
            status: asset_health,
            canPublish: hasReachableThumbnail && hasReachablePreview && video.title?.trim() && video.slug?.trim(),
            hasLegacyUrls,
            legacyUrlCount: Object.values(fields).filter(f => f.type === 'legacy_r2_dev').length
          }
        };
      }));

      inventory.push(...batchResults);
    }

    // Generate summary statistics
    const summary = {
      total_videos: inventory.length,
      by_health_status: {
        healthy_canonical: inventory.filter(v => v.asset_health === 'healthy_canonical').length,
        healthy_legacy: inventory.filter(v => v.asset_health === 'healthy_legacy').length,
        incomplete: inventory.filter(v => v.asset_health === 'incomplete').length,
        broken: inventory.filter(v => v.asset_health === 'broken').length,
        missing_source: inventory.filter(v => v.asset_health === 'missing_source').length
      },
      legacy_usage: {
        videos_with_legacy_urls: inventory.filter(v => v.health_summary.hasLegacyUrls).length,
        total_legacy_fields: inventory.reduce((sum, v) => sum + v.health_summary.legacyUrlCount, 0)
      },
      can_publish_count: inventory.filter(v => v.health_summary.canPublish).length,
      cannot_publish_count: inventory.filter(v => !v.health_summary.canPublish).length
    };

    return Response.json({
      generated_at: new Date().toISOString(),
      summary,
      inventory
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});