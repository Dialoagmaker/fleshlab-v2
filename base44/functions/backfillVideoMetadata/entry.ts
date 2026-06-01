import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Single-video helper (used for mode=single only — fast, synchronous)
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
  if (thumbnailAssets.length > 0 && thumbnailAssets[0].cdn_url) thumbnailUrl = thumbnailAssets[0].cdn_url;

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

Duration context: ${video.duration_seconds ? Math.round(video.duration_seconds / 60) + ' minutes' : 'unknown'}.
AVOID: generic intros, "Don't miss", "HD studio quality", clichés.`,
    response_json_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' }, description: { type: 'string' }, short_teaser: { type: 'string' },
        seo_title: { type: 'string' }, seo_description: { type: 'string' },
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
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { video_id, mode = 'missing_only', overwrite_existing = false, limit = 25 } = await req.json();

    // ── Single video: run synchronously (just 1 LLM call, fast) ──────────────
    if (mode === 'single') {
      if (!video_id) return Response.json({ error: 'video_id required for mode=single' }, { status: 400 });
      const video = await base44.entities.Video.get(video_id);
      if (!video) return Response.json({ error: 'Video not found' }, { status: 404 });

      const draft = await buildDraftForVideo(base44, video);
      await base44.entities.Video.update(video.id, {
        ai_metadata_draft: JSON.stringify(draft),
        ai_metadata_generated_at: new Date().toISOString(),
        processing_status: 'draft_ready',
      });

      return Response.json({ status: 'ok', mode: 'single', processed: 1, draft });
    }

    // ── Batch modes: create job + fire-and-forget ─────────────────────────────
    const job = await base44.entities.JobQueue.create({
      job_type: 'backfill_video_metadata_batch',
      status: 'pending',
      priority: 5,
      entity_type: 'Video',
      payload: JSON.stringify({ mode, overwrite_existing, limit }),
      result: JSON.stringify({ processed: 0, skipped: 0, failed: 0, errors: [], remaining_ids: null }),
    });

    // Kick off first batch immediately (fire-and-forget)
    base44.asServiceRole.functions.invoke('processBackfillBatch', { job_id: job.id }).catch(err =>
      console.error('processBackfillBatch kick-off failed:', err?.message)
    );

    return Response.json({
      success: true,
      job_id: job.id,
      message: 'Backfill queued — processing in background',
    });

  } catch (error) {
    console.error('backfillVideoMetadata error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});