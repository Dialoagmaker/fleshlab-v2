import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MAX_PER_RUN = 25;

async function buildDraftForVideo(base44, video) {
  // Fetch performers
  const credits = await base44.entities.VideoPerformer.filter({ video_id: video.id });
  let performerNames = [];
  if (credits.length > 0) {
    const performers = await Promise.all(
      credits.map(c => base44.entities.Performer.get(c.performer_id).catch(() => null))
    );
    performerNames = performers.filter(Boolean).map(p => p.display_name);
  }

  // Fetch brand
  let brandName = '';
  if (video.brand_id) {
    const brand = await base44.entities.Brand.get(video.brand_id).catch(() => null);
    brandName = brand?.name || '';
  }

  // Fetch thumbnail URL
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
  "tags": ["8-15 lowercase specific tags"],
  "ppv_price": 6.99
}

PPV price rules: 0-5min = 4.99, 5-10min = 6.99, 10-20min = 9.99, 20+min = 14.99. Duration: ${video.duration_seconds ? Math.round(video.duration_seconds / 60) + ' minutes' : 'unknown — use 6.99'}.

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
        ppv_price: { type: 'number' }
      },
      required: ['title', 'description', 'short_teaser', 'seo_title', 'seo_description', 'categories', 'tags', 'ppv_price']
    }
  });

  return { ...draft, _source: 'backfill' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { video_id, mode = 'missing_only', overwrite_existing = false } = await req.json();

    // Build candidate list
    let candidates = [];

    if (mode === 'single') {
      if (!video_id) {
        return Response.json({ error: 'video_id required for mode=single' }, { status: 400 });
      }
      const v = await base44.entities.Video.get(video_id);
      if (!v) return Response.json({ error: 'Video not found' }, { status: 404 });
      candidates = [v];
    } else if (mode === 'missing_only') {
      const all = await base44.entities.Video.list('-created_date', 200);
      candidates = all.filter(v => !v.ai_metadata_draft);
    } else if (mode === 'all') {
      candidates = await base44.entities.Video.list('-created_date', 200);
    } else {
      return Response.json({ error: 'Invalid mode. Use: single | missing_only | all' }, { status: 400 });
    }

    // Apply overwrite filter unless overwrite_existing = true
    if (!overwrite_existing && mode !== 'single') {
      candidates = candidates.filter(v => !v.ai_metadata_draft);
    }

    // Hard cap
    const batch = candidates.slice(0, MAX_PER_RUN);
    const skippedDueToCap = candidates.length - batch.length;

    let processed = 0;
    let skipped = 0;
    const errors = [];

    for (const video of batch) {
      // Skip if has draft and overwrite not requested
      if (video.ai_metadata_draft && !overwrite_existing) {
        skipped++;
        continue;
      }

      try {
        const draft = await buildDraftForVideo(base44, video);

        await base44.entities.Video.update(video.id, {
          ai_metadata_draft: JSON.stringify(draft),
          ai_metadata_generated_at: new Date().toISOString(),
          processing_status: 'draft_ready',
        });

        processed++;
      } catch (err) {
        console.error(`backfill failed for video ${video.id}:`, err.message);
        errors.push({ video_id: video.id, title: video.title, error: err.message });
      }
    }

    return Response.json({
      status: 'ok',
      mode,
      overwrite_existing,
      total_candidates: candidates.length,
      batch_size: batch.length,
      skipped_due_to_cap: skippedDueToCap,
      processed,
      skipped,
      failed: errors.length,
      errors,
    });

  } catch (error) {
    console.error('backfillVideoMetadata error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});