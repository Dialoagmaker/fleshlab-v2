import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { video_ids } = await req.json();
    
    if (!video_ids || !Array.isArray(video_ids) || video_ids.length === 0) {
      return Response.json({ error: 'video_ids array required' }, { status: 400 });
    }

    const results = {
      deleted: [],
      failed: [],
      summary: {
        total_requested: video_ids.length,
        successful: 0,
        failed: 0
      }
    };

    for (const video_id of video_ids) {
      try {
        const video = await base44.entities.Video.get(video_id);
        
        if (!video) {
          results.failed.push({ video_id, error: 'Video not found' });
          results.summary.failed++;
          continue;
        }

        // Delete related records
        const videoPerformers = await base44.entities.VideoPerformer.filter({ video_id });
        for (const vp of videoPerformers) await base44.entities.VideoPerformer.delete(vp.id);

        const videoAssets = await base44.entities.VideoAsset.filter({ video_id });
        for (const va of videoAssets) await base44.entities.VideoAsset.delete(va.id);

        const videoStats = await base44.entities.VideoStatSnapshot.filter({ video_id });
        for (const vs of videoStats) await base44.entities.VideoStatSnapshot.delete(vs.id);

        const videoDeals = await base44.entities.VideoDeal.filter({ video_id });
        for (const vd of videoDeals) await base44.entities.VideoDeal.delete(vd.id);

        const jobs = await base44.entities.JobQueue.filter({ entity_type: 'Video', entity_id: video_id });
        for (const job of jobs) await base44.entities.JobQueue.delete(job.id);

        await base44.entities.Video.delete(video_id);

        results.deleted.push({ video_id, title: video.title, slug: video.slug, status: video.status });
        results.summary.successful++;

      } catch (error) {
        results.failed.push({ video_id, error: error.message });
        results.summary.failed++;
      }
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});