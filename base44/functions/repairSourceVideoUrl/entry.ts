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
    
    // Update video entity with correct source URL
    await base44.entities.Video.update(video_id, {
      source_video_url: correctCdnUrl
    });

    return Response.json({
      success: true,
      video_id,
      old_source_url: video.source_video_url,
      new_source_url: correctCdnUrl,
      r2_key: sourceAsset.r2_key,
      message: 'Source URL repaired',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});