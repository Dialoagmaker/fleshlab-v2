import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { video_id } = await req.json();
    if (!video_id) {
      return Response.json({ error: 'Missing video_id' }, { status: 400 });
    }

    // Fetch video
    const video = await base44.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Fetch performers
    const credits = await base44.entities.VideoPerformer.filter({ video_id });
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

    // Fetch thumbnail URL (prefer existing VideoAsset, fallback to video field)
    let thumbnailUrl = video.primary_thumbnail_url || null;
    const thumbnailAssets = await base44.entities.VideoAsset.filter({ video_id, asset_type: 'thumbnail' });
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

AVOID: generic intros, "Don't miss", "HD studio quality", clichés, escalating scene beyond what's described.`,
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

    // Store draft as JSON string on video
    await base44.entities.Video.update(video_id, {
      ai_metadata_draft: JSON.stringify(draft),
      ai_metadata_generated_at: new Date().toISOString(),
      processing_status: 'draft_ready',
    });

    return Response.json({ status: 'ok', draft });

  } catch (error) {
    console.error('generateVideoMetadata error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});