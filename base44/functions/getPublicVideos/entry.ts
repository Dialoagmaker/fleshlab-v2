import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public endpoint — no user auth required.
// Uses service role to fetch published Video records with pagination.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const page = Math.max(1, parseInt(body.page) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(body.limit) || 24));
    const skip = (page - 1) * limit;

    // Get total count first
    const allVideos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' },
      '-release_date',
      1000
    );
    const total = allVideos?.length || 0;

    // Get paginated videos
    const videos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' },
      '-release_date',
      limit,
      skip
    );

    const brands = await base44.asServiceRole.entities.Brand.list('-created_date', 100);

    // Return only safe public fields
    const safeVideos = (videos || []).map(v => ({
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

    return Response.json({
      videos: safeVideos,
      brands: safeBrands,
      total,
      page,
      limit,
      hasMore: skip + safeVideos.length < total
    });
  } catch (error) {
    console.error('getPublicVideos error:', error);
    return Response.json({ videos: [], brands: [], total: 0, page: 1, limit: 24, hasMore: false, error: error.message }, { status: 200 });
  }
});