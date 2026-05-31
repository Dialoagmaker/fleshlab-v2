import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all videos and VideoPerformer records
    const videos = await base44.entities.Video.list();
    const videoPerformers = await base44.entities.VideoPerformer.list();

    // Find videos without any VideoPerformer relationship
    const assignedVideoIds = new Set(videoPerformers.map(vp => vp.video_id));
    const unassignedVideos = videos.filter(v => !assignedVideoIds.has(v.id));

    // Return detailed information for each unassigned video
    const results = unassignedVideos.map(v => ({
      id: v.id,
      title: v.title,
      slug: v.slug,
      brand_id: v.brand_id,
      status: v.status,
      access_tier: v.access_tier,
      primary_thumbnail_url: v.primary_thumbnail_url,
      created_date: v.created_date,
    }));

    return Response.json({
      count: results.length,
      videos: results,
      message: `Found ${results.length} videos without VideoPerformer relationships`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});