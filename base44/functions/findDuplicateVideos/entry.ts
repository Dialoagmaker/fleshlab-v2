import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all videos
    const allVideos = await base44.entities.Video.list();
    
    // Group by normalized title (lowercase, trimmed)
    const titleMap = new Map();
    
    allVideos.forEach(video => {
      const normalizedTitle = video.title.toLowerCase().trim();
      if (!titleMap.has(normalizedTitle)) {
        titleMap.set(normalizedTitle, []);
      }
      titleMap.get(normalizedTitle).push(video);
    });

    // Find duplicates
    const duplicates = [];
    const toDelete = [];
    
    titleMap.forEach((videos, title) => {
      if (videos.length > 1) {
        // Sort by created_date, keep the newest
        videos.sort((a, b) => {
          const dateA = new Date(a.created_date).getTime();
          const dateB = new Date(b.created_date).getTime();
          return dateB - dateA; // Newest first
        });
        
        // Keep first (newest), mark rest for deletion
        const keep = videos[0];
        const remove = videos.slice(1);
        
        duplicates.push({
          title,
          keep: { id: keep.id, created_date: keep.created_date, status: keep.status },
          remove: remove.map(v => ({ 
            id: v.id, 
            created_date: v.created_date, 
            status: v.status,
            slug: v.slug 
          }))
        });
        
        toDelete.push(...remove);
      }
    });

    // Also check for duplicate slugs
    const slugMap = new Map();
    allVideos.forEach(video => {
      if (!slugMap.has(video.slug)) {
        slugMap.set(video.slug, []);
      }
      slugMap.get(video.slug).push(video);
    });

    const slugDuplicates = [];
    slugMap.forEach((videos, slug) => {
      if (videos.length > 1 && videos.some(v => !toDelete.find(d => d.id === v.id))) {
        videos.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
        slugDuplicates.push({
          slug,
          videos: videos.map(v => ({ id: v.id, title: v.title, created_date: v.created_date }))
        });
      }
    });

    return Response.json({
      total_videos: allVideos.length,
      duplicate_groups: duplicates.length,
      videos_to_delete: toDelete.length,
      duplicates,
      slug_duplicates: slugDuplicates,
      summary: `Found ${duplicates.length} duplicate title groups with ${toDelete.length} videos to delete`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});