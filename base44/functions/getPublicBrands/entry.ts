import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [brands, videos] = await Promise.all([
      base44.asServiceRole.entities.Brand.filter({ status: 'active' }),
      base44.asServiceRole.entities.Video.filter({ status: 'published' }, '-release_date', 500),
    ]);

    // Count videos per brand
    const videoCounts = {};
    for (const v of videos) {
      if (v.brand_id) {
        videoCounts[v.brand_id] = (videoCounts[v.brand_id] || 0) + 1;
      }
    }

    // Sanitize brands
    const sanitizedBrands = brands.map(b => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      logo_url: b.logo_url,
      cover_image_url: b.cover_image_url,
      status: b.status,
      meta_title: b.meta_title,
      meta_description: b.meta_description,
      video_count: videoCounts[b.id] || 0,
    }));

    // Sanitize videos (for brand detail pages) — no internal/admin fields
    const sanitizedVideos = videos.map(v => ({
      id: v.id,
      title: v.title,
      slug: v.slug,
      description: v.description,
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
      view_count: v.view_count,
      featured: v.featured,
      is_exclusive: v.is_exclusive,
      created_date: v.created_date,
    }));

    return Response.json({ brands: sanitizedBrands, videos: sanitizedVideos });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});