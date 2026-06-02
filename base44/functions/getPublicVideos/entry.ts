import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public endpoint — no user auth required.
// Uses service role to fetch published Video records with pagination.
Deno.serve(async (req) => {
  try {
    const perfStart = Date.now();
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const page = Math.max(1, parseInt(body.page) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(body.limit) || 24));
    console.log(`PUBLIC_PERF getPublicVideos start - page:${page} limit:${limit}`);
    const skip = (page - 1) * limit;

    // OPTIMIZATION: Fetch limit+1 to determine hasMore without separate count query
    const queryLimit = limit + 1;
    const videosStart = Date.now();
    const videos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' },
      '-release_date',
      queryLimit,
      skip
    );
    const videosMs = Date.now() - videosStart;
    console.log(`PUBLIC_PERF getPublicVideos dbListMs=${videosMs}`);

    // Fetch brands (cached separately, should be fast)
    const brandsStart = Date.now();
    const brands = await base44.asServiceRole.entities.Brand.list('-created_date', 100);
    const brandsMs = Date.now() - brandsStart;
    console.log(`PUBLIC_PERF getPublicVideos brandsMs=${brandsMs}`);

    // Determine hasMore from extra record
    const hasMore = videos.length > limit;
    const limitedVideos = hasMore ? videos.slice(0, limit) : videos;
    const returnedCount = limitedVideos.length;

    // Return only safe public fields
    const safeVideos = limitedVideos.map(v => ({
      id: v.id,
      slug: v.slug,
      title: v.title,
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
    }));

    const safeBrands = (brands || []).map(b => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      logo_url: b.logo_url,
      status: b.status,
    }));

    const totalMs = Date.now() - perfStart;
    console.log(`PUBLIC_PERF getPublicVideos totalMs=${totalMs} returnedCount=${returnedCount} hasMore=${hasMore}`);

    return Response.json({
      videos: safeVideos,
      brands: safeBrands,
      total: returnedCount, // Approximate for pagination display
      page,
      limit,
      hasMore
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('getPublicVideos error:', error);
    return Response.json({ videos: [], brands: [], total: 0, page: 1, limit: 24, hasMore: false, error: error.message }, { status: 200 });
  }
});