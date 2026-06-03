import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public endpoint — no user auth required.
// Returns a single video's safe marketing metadata + preview assets.
// NEVER returns source_video_url, r2_key, storage_key, or any private/admin fields.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { slug } = body;

    if (!slug) {
      return Response.json({ error: 'slug required' }, { status: 400 });
    }

    // Find video by slug
    const videos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published', slug },
      '-release_date',
      1
    );

    const video = videos[0];

    if (!video) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }

    // Fetch performer relations BEFORE exposing detail page
    const videoPerformerRecords = await base44.asServiceRole.entities.VideoPerformer.filter({
      video_id: video.id
    });

    // Phase 2D P1: Publish readiness check for direct public detail access
    // Incomplete published videos must not be exposed through this backend endpoint.
    const hasRequiredFields =
      (video.source_video_url || video.trailer_url) &&
      video.primary_thumbnail_url &&
      video.duration_seconds &&
      video.duration_seconds > 0 &&
      video.access_tier &&
      ['free', 'fanclub', 'ppv'].includes(video.access_tier) &&
      video.title &&
      video.title.trim().length >= 3;

    if (!hasRequiredFields || videoPerformerRecords.length === 0) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }

    // Fetch supporting data in parallel
    const [brands, allVideos, allVideoPerformerRecords] = await Promise.all([
      base44.asServiceRole.entities.Brand.filter({ status: 'active' }),
      base44.asServiceRole.entities.Video.filter({ status: 'published' }, '-release_date', 100),
      base44.asServiceRole.entities.VideoPerformer.filter({}, '-created_date', 1000),
    ]);

    const hasPerformerRelation = (videoId) =>
      allVideoPerformerRecords.some(vp => vp.video_id === videoId);

    const isPublicReadyVideo = (v) => {
      return (
        v &&
        v.status === 'published' &&
        (v.source_video_url || v.trailer_url) &&
        v.primary_thumbnail_url &&
        v.duration_seconds &&
        v.duration_seconds > 0 &&
        v.access_tier &&
        ['free', 'fanclub', 'ppv'].includes(v.access_tier) &&
        v.title &&
        v.title.trim().length >= 3 &&
        hasPerformerRelation(v.id)
      );
    };

    // Resolve performers — public fields only
    let performers = [];

    if (videoPerformerRecords.length > 0) {
      const performerIds = videoPerformerRecords
        .map(vp => vp.performer_id)
        .filter(Boolean);

      const allPerformers = await base44.asServiceRole.entities.Performer.filter({
        status: 'active'
      });

      performers = allPerformers
        .filter(p => performerIds.includes(p.id))
        .map(p => ({
          id: p.id,
          display_name: p.display_name,
          slug: p.slug,
          profile_image_url: p.profile_image_url,
          nationality: p.nationality,
          verified: p.verified,
          fanclub_enabled: p.fanclub_enabled,
        }));
    }

    // Sanitize a video record — STRICT: no storage/source/private fields
    const safeVideo = (v) => ({
      id: v.id,
      slug: v.slug,
      title: v.title,
      description: v.description,
      short_summary: v.short_summary,
      brand_id: v.brand_id,
      categories: v.categories,
      tags: v.tags,
      access_tier: v.access_tier,
      release_date: v.release_date,
      duration_seconds: v.duration_seconds,
      primary_thumbnail_url: v.primary_thumbnail_url,
      cover_image_url: v.cover_image_url,
      trailer_url: v.trailer_url,
      preview_gif_url: v.preview_gif_url,
      view_count: v.view_count,
      featured: v.featured,
      is_exclusive: v.is_exclusive,
      ppv_enabled: v.ppv_enabled,
      created_date: v.created_date,
      meta_title: v.meta_title,
      meta_description: v.meta_description,
      // source_video_url, r2_key, storage_key, xhamster_video_url,
      // production_cost and all admin/private fields intentionally excluded
    });

    const brand = brands.find(b => b.id === video.brand_id);

    const safeBrand = brand ? {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo_url: brand.logo_url,
      cover_image_url: brand.cover_image_url,
      description: brand.description,
    } : null;

    // Only use public-ready videos for related/studio/similar sections.
    // This prevents incomplete legacy videos from leaking into detail-page modules.
    const otherVideos = allVideos
      .filter(v => v.id !== video.id)
      .filter(isPublicReadyVideo);

    const studioVideos = otherVideos
      .filter(v => v.brand_id === video.brand_id)
      .slice(0, 6)
      .map(safeVideo);

    const similarVideos = otherVideos
      .filter(v => v.tags?.some(t => video.tags?.includes(t)))
      .slice(0, 4)
      .map(safeVideo);

    const relatedVideos = otherVideos
      .filter(v => v.brand_id === video.brand_id || v.tags?.some(t => video.tags?.includes(t)))
      .slice(0, 6)
      .map(safeVideo);

    const safeBrands = brands.map(b => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logo_url: b.logo_url,
    }));

    return Response.json({
      video: safeVideo(video),
      brand: safeBrand,
      performers,
      studioVideos,
      similarVideos,
      relatedVideos,
      brands: safeBrands,
    });
  } catch (error) {
    console.error('getPublicVideoDetail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});