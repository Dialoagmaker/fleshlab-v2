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

    let video = videos[0];
    let redirectedFromLegacy = false;

    // Legacy slug fallback — resolve old slugs to their current canonical video server-side,
    // so the client always renders/canonicalizes on the true current slug (no client-side flip).
    if (!video) {
      const allPublished = await base44.asServiceRole.entities.Video.filter({ status: 'published' }, '-release_date', 500);
      video = allPublished.find(v => v.legacy_slugs?.includes(slug));
      redirectedFromLegacy = !!video;
    }

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
    const [brands, allVideos, allVideoPerformerRecords, allVideoAssets] = await Promise.all([
      base44.asServiceRole.entities.Brand.filter({ status: 'active' }),
      base44.asServiceRole.entities.Video.filter({ status: 'published' }, '-release_date', 100),
      base44.asServiceRole.entities.VideoPerformer.filter({}, '-created_date', 1000),
      base44.asServiceRole.entities.VideoAsset.filter({}, '-updated_date', 5000),
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

    const normalizePublicUrl = (url) => {
      if (!url || typeof url !== 'string') return '';
      return url.split('#')[0].split('?')[0].replace(/\/+$/, '');
    };

    const getPublicTrailerDuration = (v) => {
      if (!v?.trailer_url) return null;
      const trailerUrl = normalizePublicUrl(v.trailer_url);
      const trailerAsset = allVideoAssets.find(asset =>
        asset.video_id === v.id &&
        ['trailer', 'preview'].includes(asset.asset_type) &&
        asset.cdn_url &&
        normalizePublicUrl(asset.cdn_url) === trailerUrl &&
        Number(asset.duration_seconds) > 0
      );
      return trailerAsset ? Number(trailerAsset.duration_seconds) : null;
    };

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
      trailer_duration_seconds: getPublicTrailerDuration(v),
      primary_thumbnail_url: v.primary_thumbnail_url,
      cover_image_url: v.cover_image_url,
      trailer_url: v.trailer_url,
      preview_gif_url: v.preview_gif_url,
      view_count: v.view_count,
      featured: v.featured,
      is_exclusive: v.is_exclusive,
      ppv_enabled: v.ppv_enabled,
      download_price: v.download_price,
      created_date: v.created_date,
      updated_date: v.updated_date, // For cache-busting
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

    // "More from performer" — videos featuring the primary (first) performer of this video
    const primaryPerformerId = performers[0]?.id || null;
    const morePerformerVideoIds = primaryPerformerId
      ? new Set(allVideoPerformerRecords.filter(vp => vp.performer_id === primaryPerformerId).map(vp => vp.video_id))
      : new Set();
    const morePerformerVideos = otherVideos
      .filter(v => morePerformerVideoIds.has(v.id))
      .slice(0, 6)
      .map(safeVideo);

    // Exclusion set — a video must not appear in both "More from Performer" and "Similar Videos"
    const excludedIds = new Set(morePerformerVideos.map(v => v.id));

    const similarVideos = otherVideos
      .filter(v => !excludedIds.has(v.id) && v.tags?.some(t => video.tags?.includes(t)))
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
      morePerformerVideos,
      similarVideos,
      relatedVideos,
      brands: safeBrands,
      redirected_from_legacy: redirectedFromLegacy,
    });
  } catch (error) {
    console.error('getPublicVideoDetail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});