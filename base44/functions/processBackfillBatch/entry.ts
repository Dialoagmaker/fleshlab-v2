import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BATCH_SIZE = 1; // Debug: 1 video per call. Increase to 3-5 after testing.

async function buildDraftForVideo(base44, video) {
  const credits = await base44.entities.VideoPerformer.filter({ video_id: video.id });
  let performerNames = [];
  if (credits.length > 0) {
    const performers = await Promise.all(
      credits.map(c => base44.entities.Performer.get(c.performer_id).catch(() => null))
    );
    performerNames = performers.filter(Boolean).map(p => p.display_name);
  }

  let brandName = '';
  if (video.brand_id) {
    const brand = await base44.entities.Brand.get(video.brand_id).catch(() => null);
    brandName = brand?.name || '';
  }

  let thumbnailUrl = video.primary_thumbnail_url || null;
  const thumbnailAssets = await base44.entities.VideoAsset.filter({ video_id: video.id, asset_type: 'thumbnail' });
  if (thumbnailAssets.length > 0 && thumbnailAssets[0].cdn_url) {
    thumbnailUrl = thumbnailAssets[0].cdn_url;
  }

  const contextBlock = [
    `Working title: ${video.title || 'Untitled'}`,
    video.description && `Existing description: ${video.description}`,
    performerNames.length && `Performers: ${performerNames.join(', ')}`,
    brandName && `Studio/Brand: ${brandName}`,
    video.categories?.length && `Categories: ${video.categories.join(', ')}`,
    video.tags?.length && `Existing tags: ${video.tags.join(', ')}`,
  ].filter(Boolean).join('\n');

  const draft = await base44.integrations.Core.InvokeLLM({
    ...(thumbnailUrl ? { file_urls: [thumbnailUrl] } : {}),
    model: thumbnailUrl ? 'gemini_3_flash' : undefined,
    prompt: `You are an expert adult SEO copywriter for FLESHLAB Studios — a premium gay adult studio with verified 18+ Asian twink and Filipino male performers.${thumbnailUrl ? ' Analyze the provided thumbnail/frame carefully for: performers visible, setting/location, acts depicted, physical details.' : ''}

Production context:
${contextBlock}

Generate a complete metadata package. Reply ONLY in this exact JSON:
{
  "title": "6-10 word punchy xHamster-optimized title",
  "description": "4-5 sentence explicit USP-led description",
  "short_teaser": "1 sentence punchy teaser for listings",
  "seo_title": "SEO page title under 60 chars — format: [Act] | FLESHLAB",
  "seo_description": "Meta description 120-158 chars with soft CTA",
  "categories": ["2-4 broad category names, e.g. Asian, Filipino, Solo, Twink"],
  "tags": ["8-15 lowercase specific tags"]
}

Duration context for tone/pacing only: ${video.duration_seconds ? Math.round(video.duration_seconds / 60) + ' minutes' : 'unknown'}.

AVOID: generic intros, "Don't miss", "HD studio quality", clichés.`,
    response_json_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        short_teaser: { type: 'string' },
        seo_title: { type: 'string' },
        seo_description: { type: 'string' },
        categories: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'description', 'short_teaser', 'seo_title', 'seo_description', 'categories', 'tags']
    }
  });

  let ppv_price = null;
  if (video.duration_seconds) {
    const mins = video.duration_seconds / 60;
    if (mins <= 5) ppv_price = 4.99;
    else if (mins <= 10) ppv_price = 6.99;
    else if (mins <= 20) ppv_price = 9.99;
    else ppv_price = 14.99;
  }

  return { ...draft, ppv_price, duration_missing: !video.duration_seconds, _source: 'backfill' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { job_id } = await req.json();
    if (!job_id) {
      return Response.json({ error: 'job_id required' }, { status: 400 });
    }

    // Load job
    const job = await base44.entities.JobQueue.get(job_id);
    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }
    if (job.status === 'cancelled' || job.status === 'completed' || job.status === 'failed') {
      return Response.json({ message: `Job already ${job.status}` });
    }

    const payload = JSON.parse(job.payload || '{}');
    const { mode, overwrite_existing, limit } = payload;

    // Load current progress
    let progress = {};
    try { progress = JSON.parse(job.result || '{}'); } catch {}

    const processed = progress.processed || 0;
    const skipped = progress.skipped || 0;
    const errors = progress.errors || [];
    let remaining_ids = progress.remaining_ids;

    // On first call: build the candidate list
    if (!remaining_ids) {
      let candidates = [];
      if (mode === 'missing_only') {
        const all = await base44.entities.Video.list('-created_date', 300);
        candidates = all.filter(v => !v.ai_metadata_draft);
      } else {
        candidates = await base44.entities.Video.list('-created_date', 300);
        if (!overwrite_existing) candidates = candidates.filter(v => !v.ai_metadata_draft);
      }
      remaining_ids = candidates.slice(0, limit || 25).map(v => v.id);
    }

    if (remaining_ids.length === 0) {
      // Done
      await base44.entities.JobQueue.update(job_id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: JSON.stringify({ processed, skipped, failed: errors.length, errors, remaining_ids: [] }),
      });
      return Response.json({ done: true, processed, skipped, failed: errors.length });
    }

    // Mark as running
    await base44.entities.JobQueue.update(job_id, {
      status: 'running',
      started_at: job.started_at || new Date().toISOString(),
    });

    // Take next batch
    const batch = remaining_ids.slice(0, BATCH_SIZE);
    const still_remaining = remaining_ids.slice(BATCH_SIZE);

    let batchProcessed = processed;
    let batchSkipped = skipped;
    const batchErrors = [...errors];
    let currentVideoId = null;

    for (const vid_id of batch) {
      currentVideoId = vid_id;
      let video;
      try {
        video = await base44.entities.Video.get(vid_id);
        if (!video) { batchSkipped++; continue; }

        const draft = await buildDraftForVideo(base44, video);
        await base44.entities.Video.update(video.id, {
          ai_metadata_draft: JSON.stringify(draft),
          ai_metadata_generated_at: new Date().toISOString(),
          processing_status: 'draft_ready',
        });
        batchProcessed++;
      } catch (err) {
        console.error(`processBackfillBatch failed for ${vid_id}:`, err.message);
        batchErrors.push({ video_id: vid_id, title: video?.title || vid_id, error: err.message });
      }
    }

    const newProgress = {
      processed: batchProcessed,
      skipped: batchSkipped,
      failed: batchErrors.length,
      errors: batchErrors,
      remaining_ids: still_remaining,
      current_video_id: still_remaining[0] || null,
      total: (batchProcessed + batchSkipped + batchErrors.length + still_remaining.length),
    };

    if (still_remaining.length === 0) {
      // All done
      await base44.entities.JobQueue.update(job_id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: JSON.stringify(newProgress),
      });
    } else {
      // Save progress and chain next batch (fire-and-forget)
      await base44.entities.JobQueue.update(job_id, {
        status: 'running',
        result: JSON.stringify(newProgress),
      });

      // Self-chain: process next batch asynchronously
      base44.asServiceRole.functions.invoke('processBackfillBatch', { job_id }).catch(err =>
        console.error('processBackfillBatch chain failed:', err?.message)
      );
    }

    return Response.json({ 
      ok: true, 
      batch_processed: batchProcessed - processed,
      remaining: still_remaining.length,
      progress: newProgress,
    });

  } catch (error) {
    console.error('processBackfillBatch error:', error);
    // Try to mark job as failed
    try {
      const base44 = createClientFromRequest(req);
      const { job_id } = await req.clone().json().catch(() => ({}));
      if (job_id) {
        await base44.asServiceRole.entities.JobQueue.update(job_id, {
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
        });
      }
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});