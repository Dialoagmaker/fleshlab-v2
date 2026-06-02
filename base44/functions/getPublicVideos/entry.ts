import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public endpoint — no user auth required.
// Uses service role to fetch published Video records.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const videos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' },
      '-release_date',
      200
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
      status: v.status,
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
      created_date: v.created_date,
    }));

    const safeBrands = (brands || []).map(b => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      logo_url: b.logo_url,
      status: b.status,
    }));

    return Response.json({ videos: safeVideos, brands: safeBrands });
  } catch (error) {
    console.error('getPublicVideos error:', error);
    return Response.json({ videos: [], brands: [], error: error.message }, { status: 200 });
  }
});