// ⚠️  MIGRATION / CLEANUP TOOL — NOT FOR NORMAL PRODUCTION USE
// This function permanently deletes videos and their assets.
// It should only be invoked during controlled migration cleanup.
// For safety, only super-admins (role === 'admin') may call this,
// and only when a required confirmation token is provided in the request body.
// DO NOT expose this function in any UI button or scheduled automation.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json().catch(() => ({}));

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Extra confirmation guard — caller must pass { confirm: "DELETE_UNASSIGNED_VIDEOS" }
    if (body.confirm !== 'DELETE_UNASSIGNED_VIDEOS') {
      return Response.json({
        error: 'Confirmation required. Pass { "confirm": "DELETE_UNASSIGNED_VIDEOS" } in the request body.',
      }, { status: 400 });
    }

    // --- Core deletion logic (runs only with explicit confirmation) ---
    // Fetch all videos and VideoPerformer records
    const videos = await base44.entities.Video.list();
    const videoPerformers = await base44.entities.VideoPerformer.list();

    // Find videos without any VideoPerformer relationship
    const assignedVideoIds = new Set(videoPerformers.map(vp => vp.video_id));
    const unassignedVideos = videos.filter(v => !assignedVideoIds.has(v.id));

    if (unassignedVideos.length === 0) {
      return Response.json({ 
        message: 'No unassigned videos found',
        deleted: 0
      });
    }

    const unassignedVideoIds = unassignedVideos.map(v => v.id);
    const deletedVideoIds = [];
    const deletedAssetCount = { count: 0 };
    const errors = [];

    // Fetch VideoAssets for these videos
    const allAssets = await base44.entities.VideoAsset.list();
    const assetsToDelete = allAssets.filter(a => unassignedVideoIds.includes(a.video_id));

    // Delete VideoAssets first
    for (const asset of assetsToDelete) {
      try {
        await base44.entities.VideoAsset.delete(asset.id);
        deletedAssetCount.count++;
      } catch (err) {
        errors.push(`Failed to delete VideoAsset ${asset.id}: ${err.message}`);
      }
    }

    // Delete Videos
    for (const video of unassignedVideos) {
      try {
        await base44.entities.Video.delete(video.id);
        deletedVideoIds.push(video.id);
      } catch (err) {
        errors.push(`Failed to delete Video ${video.id}: ${err.message}`);
      }
    }

    // Validation
    const remainingVideos = await base44.entities.Video.list();
    const remainingVideoPerformers = await base44.entities.VideoPerformer.list();
    const remainingAssignedVideoIds = new Set(remainingVideoPerformers.map(vp => vp.video_id));
    const remainingUnassigned = remainingVideos.filter(v => !remainingAssignedVideoIds.has(v.id));

    return Response.json({
      success: true,
      deleted: {
        videos: deletedVideoIds.length,
        videoAssets: deletedAssetCount.count,
      },
      validation: {
        totalVideosRemaining: remainingVideos.length,
        videosWithoutPerformers: remainingUnassigned.length,
        videoPerformerRecords: remainingVideoPerformers.length,
      },
      errors: errors.length > 0 ? errors : null,
      message: `Successfully deleted ${deletedVideoIds.length} videos and ${deletedAssetCount.count} assets`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});