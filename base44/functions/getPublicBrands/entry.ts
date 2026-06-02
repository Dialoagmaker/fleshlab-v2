import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public endpoint — no user auth required.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await req.json().catch(() => ({})); // Consume body (not used)

    const [videos, brands] = await Promise.all([
      base44.asServiceRole.entities.Video.filter({ status: 'published' }, '-release_date', 10),
      base44.asServiceRole.entities.Brand.filter({ status: 'active' }, 'name', 100),
    ]);

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

    return Response.json({ videos: safeVideos, brands: safeBrands });
  } catch (error) {
    console.error('getPublicBrands error:', error);
    return Response.json({ videos: [], brands: [], error: error.message }, { status: 200 });
  }
});