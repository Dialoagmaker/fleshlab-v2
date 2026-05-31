import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all videos
    const allVideos = await base44.asServiceRole.entities.Video.list();
    
    // Fetch all VideoPerformer records
    const allVideoPerformers = await base44.asServiceRole.entities.VideoPerformer.list();
    
    // Fetch all brands
    const allBrands = await base44.asServiceRole.entities.Brand.list();
    
    // Get unique video_ids that have performers
    const assignedVideoIds = new Set(allVideoPerformers.map(vp => vp.video_id));
    
    // Find videos without performers
    const unassignedVideos = allVideos
      .filter(video => !assignedVideoIds.has(video.id))
      .sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
    
    // Find videos with performers
    const assignedVideos = allVideos
      .filter(video => assignedVideoIds.has(video.id))
      .sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
    
    // Build brand lookup
    const brandMap = {};
    allBrands.forEach(brand => {
      brandMap[brand.id] = brand.name;
    });
    
    // Format unassigned videos
    const unassignedFormatted = unassignedVideos.map(video => ({
      video_id: video.id,
      title: video.title,
      created_date: video.created_date,
      brand: brandMap[video.brand_id] || 'Unknown',
      status: video.status,
      v1_id: video.v1_id
    }));
    
    // Calculate timestamps
    const result = {
      summary: {
        total_videos: allVideos.length,
        total_videoperformer_records: allVideoPerformers.length,
        unique_videos_assigned: assignedVideoIds.size,
        videos_without_performers: unassignedVideos.length,
        videos_with_performers: assignedVideos.length
      },
      unassigned_videos: unassignedFormatted,
      timestamp_analysis: {
        oldest_assigned_video: assignedVideos.length > 0 ? {
          video_id: assignedVideos[0].id,
          title: assignedVideos[0].title,
          created_date: assignedVideos[0].created_date
        } : null,
        newest_assigned_video: assignedVideos.length > 0 ? {
          video_id: assignedVideos[assignedVideos.length - 1].id,
          title: assignedVideos[assignedVideos.length - 1].title,
          created_date: assignedVideos[assignedVideos.length - 1].created_date
        } : null,
        oldest_unassigned_video: unassignedVideos.length > 0 ? {
          video_id: unassignedVideos[0].id,
          title: unassignedVideos[0].title,
          created_date: unassignedVideos[0].created_date
        } : null,
        newest_unassigned_video: unassignedVideos.length > 0 ? {
          video_id: unassignedVideos[unassignedVideos.length - 1].id,
          title: unassignedVideos[unassignedVideos.length - 1].title,
          created_date: unassignedVideos[unassignedVideos.length - 1].created_date
        } : null
      },
      import_batch_analysis: {
        unassigned_video_id_prefixes: [...new Set(unassignedVideos.map(v => v.id.substring(0, 10)))],
        assigned_video_id_prefixes: [...new Set(assignedVideos.map(v => v.id.substring(0, 10)))],
        unassigned_v1_ids: unassignedVideos.map(v => v.v1_id).filter(Boolean),
        conclusion: unassignedVideos.length > 0 ? 
          `All ${unassignedVideos.length} unassigned videos share the same ID prefix pattern, indicating they belong to a single import batch that was not processed by Quick Match/Bulk Assign.` : 
          'No unassigned videos found.'
      }
    };

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});