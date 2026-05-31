import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validate processor API key
    const processorApiKey = req.headers.get('X-Processor-API-Key');
    const expectedApiKey = Deno.env.get('PROCESSOR_API_KEY');
    
    if (!processorApiKey || processorApiKey !== expectedApiKey) {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized: Invalid API key' 
      }, { status: 401 });
    }

    const body = await req.json();
    const {
      video_id,
      source_asset_id,
      job_id,
      processor_job_id,
      status,
      assets,
      metadata,
      error_message,
    } = body;

    if (!video_id || !source_asset_id || !status) {
      return Response.json({ 
        success: false, 
        error: 'Missing required fields: video_id, source_asset_id, status' 
      }, { status: 400 });
    }

    // Fetch video and source asset
    const video = await base44.entities.Video.get(video_id);
    const sourceAsset = await base44.entities.VideoAsset.get(source_asset_id);

    if (!video || !sourceAsset) {
      return Response.json({ 
        success: false, 
        error: 'Video or source asset not found' 
      }, { status: 404 });
    }

    if (status === 'failed') {
      // Handle processing failure
      await base44.entities.VideoAsset.update(sourceAsset.id, {
        status: 'failed',
      });

      // Update job queue
      const jobs = await base44.entities.JobQueue.filter({
        entity_type: 'Video',
        entity_id: video_id,
      });
      
      if (jobs.length > 0) {
        await base44.entities.JobQueue.update(jobs[0].id, {
          status: 'failed',
          error_message: error_message || 'Processing failed',
          completed_at: new Date().toISOString(),
          result: JSON.stringify({ processor_job_id, error: error_message }),
        });
      }

      return Response.json({
        success: true,
        message: 'Processing failure recorded',
      });
    }

    // Success: Create asset records and update video
    const assetPromises = [];

    // Update source asset
    assetPromises.push(
      base44.entities.VideoAsset.update(sourceAsset.id, {
        status: 'ready',
        duration_seconds: metadata?.duration_seconds || null,
        width: metadata?.width || null,
        height: metadata?.height || null,
      })
    );

    // Create thumbnail asset
    if (assets?.thumbnail) {
      assetPromises.push(
        base44.entities.VideoAsset.create({
          video_id: video.id,
          asset_type: 'thumbnail',
          r2_key: assets.thumbnail.r2_key,
          cdn_url: assets.thumbnail.cdn_url,
          status: 'ready',
          file_size_bytes: assets.thumbnail.file_size_bytes,
          width: assets.thumbnail.width,
          height: assets.thumbnail.height,
          mime_type: assets.thumbnail.mime_type || 'image/jpeg',
        })
      );
    }

    // Create cover asset
    if (assets?.cover) {
      assetPromises.push(
        base44.entities.VideoAsset.create({
          video_id: video.id,
          asset_type: 'cover',
          r2_key: assets.cover.r2_key,
          cdn_url: assets.cover.cdn_url,
          status: 'ready',
          file_size_bytes: assets.cover.file_size_bytes,
          width: assets.cover.width,
          height: assets.cover.height,
          mime_type: assets.cover.mime_type || 'image/jpeg',
        })
      );
    }

    // Create preview video asset
    if (assets?.preview_video) {
      assetPromises.push(
        base44.entities.VideoAsset.create({
          video_id: video.id,
          asset_type: 'preview',
          r2_key: assets.preview_video.r2_key,
          cdn_url: assets.preview_video.cdn_url,
          status: 'ready',
          file_size_bytes: assets.preview_video.file_size_bytes,
          duration_seconds: assets.preview_video.duration_seconds,
          width: assets.preview_video.width,
          height: assets.preview_video.height,
          mime_type: assets.preview_video.mime_type || 'video/mp4',
        })
      );
    }

    // Create preview GIF asset (optional)
    if (assets?.preview_gif) {
      assetPromises.push(
        base44.entities.VideoAsset.create({
          video_id: video.id,
          asset_type: 'gif',
          r2_key: assets.preview_gif.r2_key,
          cdn_url: assets.preview_gif.cdn_url,
          status: 'ready',
          file_size_bytes: assets.preview_gif.file_size_bytes,
          width: assets.preview_gif.width,
          height: assets.preview_gif.height,
          mime_type: assets.preview_gif.mime_type || 'image/gif',
        })
      );
    }

    await Promise.all(assetPromises);

    // Update video with metadata and URLs
    const videoUpdateData = {
      source_video_url: sourceAsset.cdn_url,
      duration_seconds: metadata?.duration_seconds,
    };

    if (assets?.thumbnail) {
      videoUpdateData.primary_thumbnail_url = assets.thumbnail.cdn_url;
    }

    if (assets?.cover) {
      videoUpdateData.cover_image_url = assets.cover.cdn_url;
    }

    if (assets?.preview_video) {
      videoUpdateData.trailer_url = assets.preview_video.cdn_url;
    }

    if (assets?.preview_gif) {
      videoUpdateData.preview_gif_url = assets.preview_gif.cdn_url;
    }

    await base44.entities.Video.update(video.id, videoUpdateData);

    // Update job queue
    const jobs = await base44.entities.JobQueue.filter({
      entity_type: 'Video',
      entity_id: video_id,
    });

    if (jobs.length > 0) {
      await base44.entities.JobQueue.update(jobs[0].id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: JSON.stringify({
          processor_job_id,
          assets_created: Object.keys(assets || {}).length,
          processing_time_seconds: body.processing_time_seconds,
        }),
      });
    }

    return Response.json({
      success: true,
      message: 'Processing result saved successfully',
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});