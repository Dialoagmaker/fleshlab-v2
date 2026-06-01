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
      return Response.json({ error: 'video_id required' }, { status: 400 });
    }

    // Fetch video
    const video = await base44.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // STEP 3: Update video status to published
    await base44.entities.Video.update(video_id, {
      status: 'published',
      published_at: now,
      website_published_at: now,
    });

    // STEP 4: Create SEOPage record (only if doesn't exist)
    const existingSEOPage = await base44.entities.SEOPage.filter({
      page_type: 'video',
      entity_id: video_id,
    });

    if (!existingSEOPage || existingSEOPage.length === 0) {
      await base44.entities.SEOPage.create({
        page_type: 'video',
        entity_id: video_id,
        slug: video.slug,
        meta_title: video.meta_title || video.title,
        meta_description: video.meta_description || video.description?.substring(0, 160) || '',
        status: 'approved',
        schema_json: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: video.title,
          description: video.description,
          thumbnailUrl: video.primary_thumbnail_url,
          uploadDate: now,
          duration: video.duration_seconds ? `PT${video.duration_seconds}S` : undefined,
        }),
      });
    } else {
      // Update existing SEOPage
      await base44.entities.SEOPage.update(existingSEOPage[0].id, {
        status: 'approved',
        meta_title: video.meta_title || video.title,
        meta_description: video.meta_description || video.description?.substring(0, 160) || '',
      });
    }

    // STEP 5: Create AuditLog entry
    await base44.entities.AuditLog.create({
      entity_type: 'Video',
      entity_id: video_id,
      actor_id: user.id,
      actor_role: user.role,
      action: 'publish',
      changes_json: JSON.stringify({
        status: { from: video.status, to: 'published' },
        published_at: { from: video.published_at, to: now },
        website_published_at: { from: video.website_published_at, to: now },
      }),
      notes: `Published video "${video.title}" to website`,
    });

    // STEP 6: Update promotion_status if needed
    let newPromotionStatus = video.promotion_status;
    if (video.promotion_status === 'none') {
      newPromotionStatus = 'planned';
      await base44.entities.Video.update(video_id, {
        promotion_status: 'planned',
      });
    }

    return Response.json({
      status: 'ok',
      video_id: video_id,
      published_at: now,
      promotion_status: newPromotionStatus,
      message: 'Video published successfully',
    });

  } catch (error) {
    console.error('publishVideoToWebsite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});