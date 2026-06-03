import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch sample video to check data structure
    const sampleVideos = await base44.asServiceRole.entities.Video.list(undefined, 3);
    
    // Return raw structure for debugging
    return Response.json({
      sample_count: sampleVideos.length,
      samples: sampleVideos.map(v => ({
        id: v.id,
        all_keys: Object.keys(v),
        status: v.status,
        title: v.title,
        slug: v.slug,
        duration: v.duration_seconds,
        thumbnail: v.primary_thumbnail_url,
        description_length: v.description?.length,
        tags_count: v.tags?.length,
        categories_count: v.categories?.length,
        meta_title: v.meta_title,
        meta_description: v.meta_description
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});