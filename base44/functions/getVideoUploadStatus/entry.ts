import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    const videoId = url.searchParams.get('video_id');

    if (!videoId) {
      return Response.json({ error: 'Missing required parameter: video_id' }, { status: 400 });
    }

    // Fetch video
    const video = await base44.entities.Video.get(videoId);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Fetch all assets for this video
    const allAssets = await base44.entities.VideoAsset.filter({ video_id: videoId });
    
    // Fetch job queue entries
    const jobs = await base44.entities.JobQueue.filter({
      entity_type: 'Video',
      entity_id: videoId,
    });

    // Determine upload status
    const sourceAsset = allAssets.find(a => a.asset_type === 'source');
    let uploadStatus = 'pending';
    
    if (sourceAsset) {
      if (sourceAsset.status === 'pending') uploadStatus = 'pending';
      else if (sourceAsset.status === 'uploaded') uploadStatus = 'uploaded';
      else if (sourceAsset.status === 'processing') uploadStatus = 'processing';
      else if (sourceAsset.status === 'ready') uploadStatus = 'completed';
      else if (sourceAsset.status === 'failed') uploadStatus = 'failed';
    }

    // Calculate processing progress
    const requiredAssets = ['source', 'thumbnail', 'cover', 'preview'];
    const readyAssets = allAssets.filter(a => a.status === 'ready');
    const completedSteps = readyAssets.length;
    const totalSteps = requiredAssets.length;

    const processingProgress = {
      current_step: completedSteps < totalSteps ? `Processing ${requiredAssets[completedSteps] || 'remaining'}` : 'Complete',
      total_steps: totalSteps,
      completed_steps: completedSteps,
    };

    // Format assets for response
    const assets = allAssets.map(asset => ({
      asset_id: asset.id,
      asset_type: asset.asset_type,
      status: asset.status,
      cdn_url: asset.cdn_url,
      file_size_bytes: asset.file_size_bytes,
      width: asset.width,
      height: asset.height,
      duration_seconds: asset.duration_seconds,
      mime_type: asset.mime_type,
    }));

    // Format job queue for response
    const jobQueue = jobs.length > 0 ? {
      job_id: jobs[0].id,
      status: jobs[0].status,
      progress: jobs[0].status === 'running' ? processingProgress : null,
      error_message: jobs[0].error_message,
      retry_count: jobs[0].retry_count,
      started_at: jobs[0].started_at,
      completed_at: jobs[0].completed_at,
    } : null;

    return Response.json({
      video_id: videoId,
      video_status: video.status,
      upload_status: uploadStatus,
      assets,
      job_queue: jobQueue,
      processing_progress: uploadStatus === 'processing' ? processingProgress : null,
      metadata: {
        duration_seconds: video.duration_seconds,
        has_thumbnail: !!video.primary_thumbnail_url,
        has_cover: !!video.cover_image_url,
        has_preview: !!video.trailer_url,
        ready_for_publish: !!(video.source_video_url && video.primary_thumbnail_url),
      },
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});