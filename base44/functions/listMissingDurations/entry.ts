import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all videos
    const allVideos = await base44.asServiceRole.entities.Video.list();
    const allPerformers = await base44.asServiceRole.entities.Performer.list();
    const allBrands = await base44.asServiceRole.entities.Brand.list();
    const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.list();

    // Create lookup maps
    const performerMap = new Map();
    allPerformers.forEach(p => performerMap.set(p.id, p));
    
    const brandMap = new Map();
    allBrands.forEach(b => brandMap.set(b.id, b));
    
    // Map video performers
    const videoPerformerMap = new Map();
    videoPerformers.forEach(vp => {
      const videoId = vp.video_id;
      if (!videoId) return;
      if (!videoPerformerMap.has(videoId)) {
        videoPerformerMap.set(videoId, []);
      }
      videoPerformerMap.get(videoId).push({
        performer_id: vp.performer_id,
        role: vp.role,
        lead: vp.lead_performer
      });
    });

    // Filter videos missing duration
    const missingDuration = allVideos
      .filter(v => !v.duration_seconds || v.duration_seconds <= 0)
      .map(video => {
        const vpList = videoPerformerMap.get(video.id) || [];
        const performerNames = vpList.map(vp => {
          const perf = performerMap.get(vp.performer_id);
          return perf ? perf.display_name : null;
        }).filter(Boolean);
        
        const brand = brandMap.get(video.brand_id);
        
        return {
          video_id: video.id,
          title: video.title,
          slug: video.slug,
          brand_name: brand?.name || 'Unknown',
          brand_id: video.brand_id,
          performers: performerNames,
          performer_ids: vpList.map(vp => vp.performer_id),
          current_duration_seconds: video.duration_seconds,
          trailer_url: video.trailer_url || null,
          source_video_url: video.source_video_url || null,
          primary_thumbnail_url: video.primary_thumbnail_url || null,
          preview_gif_url: video.preview_gif_url || null,
          status: video.status,
          published_at: video.published_at,
          created_date: video.created_date,
          admin_edit_url: '/admin/videos/' + video.id,
          public_url: '/videos/' + video.slug,
          auto_fix_possible: !!video.trailer_url || !!video.source_video_url,
          notes: video.trailer_url ? 'Duration may be extractable from trailer asset' : 
                 video.source_video_url ? 'Duration may be extractable from source video asset' :
                 'Manual entry required - no video assets found'
        };
      });

    return Response.json({
      count: missingDuration.length,
      videos: missingDuration
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});