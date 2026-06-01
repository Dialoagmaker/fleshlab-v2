import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { video_id, kit_type } = await req.json();
    if (!video_id) {
      return Response.json({ error: 'video_id required' }, { status: 400 });
    }

    // Fetch video with performers and brand
    const video = await base44.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Fetch performers
    const videoPerformers = await base44.entities.VideoPerformer.filter({ video_id });
    const performerIds = videoPerformers?.map(vp => vp.performer_id) || [];
    const performers = await Promise.all(
      performerIds.map(id => base44.entities.Performer.get(id))
    );

    // Fetch brand
    const brand = video.brand_id ? await base44.entities.Brand.get(video.brand_id) : null;

    // Fetch assets
    const assets = await base44.entities.VideoAsset.filter({ video_id });
    const coverAsset = assets?.find(a => a.is_approved_cover);
    const thumbnailAsset = assets?.find(a => a.asset_type === 'thumbnail');
    const previewAsset = assets?.find(a => a.asset_type === 'preview');

    // Generate platform-specific content using LLM
    const llmPrompt = `
Generate promotional content for a video with the following details:
- Title: ${video.title}
- Description: ${video.description || 'N/A'}
- Performers: ${performers.map(p => p?.display_name).join(', ') || 'N/A'}
- Brand: ${brand?.name || 'Independent'}
- Categories: ${video.categories?.join(', ') || 'N/A'}
- Tags: ${video.tags?.join(', ') || 'N/A'}

Generate the following content:
1. xHamster Title (SEO-optimized, 60-80 chars)
2. xHamster Description (150-300 chars, include performer names and categories)
3. xHamster Tags (10-15 relevant tags)
4. Social Short Caption (for X/Twitter, 280 chars max, include hashtags)
5. Social Long Caption (for Reddit/Telegram, 500 chars max, include call-to-action)
6. Hashtags (15-20 trending adult industry hashtags)

Return as JSON with these exact keys:
{
  "xhamster_title": "...",
  "xhamster_description": "...",
  "xhamster_tags": ["tag1", "tag2"],
  "social_short_caption": "...",
  "social_long_caption": "...",
  "hashtags": ["#tag1", "#tag2"]
}
`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: llmPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          xhamster_title: { type: 'string' },
          xhamster_description: { type: 'string' },
          xhamster_tags: { type: 'array', items: { type: 'string' } },
          social_short_caption: { type: 'string' },
          social_long_caption: { type: 'string' },
          hashtags: { type: 'array', items: { type: 'string' } },
        },
        required: ['xhamster_title', 'xhamster_description', 'xhamster_tags', 'social_short_caption', 'social_long_caption', 'hashtags'],
      },
    });

    const generatedContent = JSON.parse(llmResponse.data.response);

    // Create VideoPromoKit record
    const promoKit = await base44.entities.VideoPromoKit.create({
      video_id: video_id,
      kit_type: kit_type || 'full',
      xhamster_title: generatedContent.xhamster_title,
      xhamster_description: generatedContent.xhamster_description,
      xhamster_tags: generatedContent.xhamster_tags,
      social_short_caption: generatedContent.social_short_caption,
      social_long_caption: generatedContent.social_long_caption,
      hashtags: generatedContent.hashtags,
      cover_url: coverAsset?.cdn_url || video.cover_image_url,
      thumbnail_url: thumbnailAsset?.cdn_url || video.primary_thumbnail_url,
      preview_url: previewAsset?.cdn_url || video.trailer_url,
      generated_at: new Date().toISOString(),
      generated_by: user.id,
    });

    // Update Video.promo_kit_generated_at
    await base44.entities.Video.update(video_id, {
      promo_kit_generated_at: new Date().toISOString(),
    });

    // Create AuditLog entry
    await base44.entities.AuditLog.create({
      entity_type: 'VideoPromoKit',
      entity_id: promoKit.id,
      actor_id: user.id,
      actor_role: user.role,
      action: 'create',
      changes_json: JSON.stringify({
        video_id: video_id,
        kit_type: kit_type || 'full',
        generated_by: user.id,
      }),
      notes: `Generated promo kit for video "${video.title}"`,
    });

    return Response.json({
      status: 'ok',
      promo_kit_id: promoKit.id,
      kit: promoKit,
      message: 'Promo kit generated successfully',
    });

  } catch (error) {
    console.error('generatePromoKit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});