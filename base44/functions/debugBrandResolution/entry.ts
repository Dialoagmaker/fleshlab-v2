/**
 * debugBrandResolution
 * Check which videos still have V1 brand_ids
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const [videos, brands] = await Promise.all([
      base44.asServiceRole.entities.Video.list(),
      base44.asServiceRole.entities.Brand.list(),
    ]);

    const brandIds = new Set(brands.map(b => b.id));
    const v1BrandIds = new Set(brands.map(b => b.v1_id));

    const unresolved = videos.filter(v => v.brand_id && !brandIds.has(v.brand_id));
    const resolved = videos.filter(v => v.brand_id && brandIds.has(v.brand_id));

    return Response.json({
      total_videos: videos.length,
      resolved_count: resolved.length,
      unresolved_count: unresolved.length,
      brand_ids_in_v2: brandIds.size,
      v1_brand_ids_in_v2: v1BrandIds.size,
      unresolved_samples: unresolved.slice(0, 10).map(v => ({
        id: v.id,
        title: v.title,
        brand_id: v.brand_id,
        brand_id_is_v1_format: v.brand_id?.startsWith('695') || v.brand_id?.length === 24,
      })),
      brand_info: brands.map(b => ({
        v2_id: b.id,
        v1_id: b.v1_id,
        name: b.name,
      })),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});