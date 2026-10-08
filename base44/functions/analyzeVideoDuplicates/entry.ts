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
    
    // Check 1: Duplicate titles (normalized)
    const titleMap = new Map();
    allVideos.forEach(video => {
      const normalizedTitle = video.title.toLowerCase().trim().replace(/\s+/g, ' ');
      if (!titleMap.has(normalizedTitle)) {
        titleMap.set(normalizedTitle, []);
      }
      titleMap.get(normalizedTitle).push(video);
    });

    // Check 2: Duplicate slugs
    const slugMap = new Map();
    allVideos.forEach(video => {
      if (!slugMap.has(video.slug)) {
        slugMap.set(video.slug, []);
      }
      slugMap.get(video.slug).push(video);
    });

    // Check 3: Duplicate source_video_url (same video file)
    const sourceMap = new Map();
    allVideos.forEach(video => {
      if (video.source_video_url) {
        // Extract filename from URL
        const urlParts = video.source_video_url.split('/');
        const filename = urlParts[urlParts.length - 1];
        if (!sourceMap.has(filename)) {
          sourceMap.set(filename, []);
        }
        sourceMap.get(filename).push(video);
      }
    });

    // Check 4: Similar slugs (potential migration duplicates)
    const slugPatterns = new Map();
    allVideos.forEach(video => {
      // Check if slug has numeric suffix pattern (e.g., "my-video-1", "my-video-2")
      const baseSlug = video.slug.replace(/-\d+$/, '');
      if (!slugPatterns.has(baseSlug)) {
        slugPatterns.set(baseSlug, []);
      }
      slugPatterns.get(baseSlug).push(video);
    });

    // Compile results
    const results = {
      total_videos: allVideos.length,
      duplicate_titles: [],
      duplicate_slugs: [],
      duplicate_source_files: [],
      similar_slugs: []
    };

    // Title duplicates
    titleMap.forEach((videos, title) => {
      if (videos.length > 1) {
        videos.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
        results.duplicate_titles.push({
          title,
          count: videos.length,
          videos: videos.map(v => ({
            id: v.id,
            created_date: v.created_date,
            status: v.status,
            slug: v.slug
          }))
        });
      }
    });

    // Slug duplicates
    slugMap.forEach((videos, slug) => {
      if (videos.length > 1) {
        videos.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
        results.duplicate_slugs.push({
          slug,
          count: videos.length,
          videos: videos.map(v => ({
            id: v.id,
            title: v.title,
            created_date: v.created_date,
            status: v.status
          }))
        });
      }
    });

    // Source file duplicates
    sourceMap.forEach((videos, filename) => {
      if (videos.length > 1) {
        videos.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
        results.duplicate_source_files.push({
          filename,
          count: videos.length,
          videos: videos.map(v => ({
            id: v.id,
            title: v.title,
            slug: v.slug,
            created_date: v.created_date,
            status: v.status
          }))
        });
      }
    });

    // Similar slug groups (more than 1 video with same base)
    slugPatterns.forEach((videos, baseSlug) => {
      if (videos.length > 1) {
        videos.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
        results.similar_slugs.push({
          base_slug: baseSlug,
          count: videos.length,
          videos: videos.map(v => ({
            id: v.id,
            slug: v.slug,
            title: v.title,
            created_date: v.created_date,
            status: v.status
          }))
        });
      }
    });

    // Summary
    const totalDuplicates = 
      results.duplicate_titles.reduce((sum, g) => sum + (g.count - 1), 0) +
      results.duplicate_slugs.reduce((sum, g) => sum + (g.count - 1), 0) +
      results.duplicate_source_files.reduce((sum, g) => sum + (g.count - 1), 0);

    return Response.json({
      ...results,
      summary: {
        duplicate_title_groups: results.duplicate_titles.length,
        duplicate_slug_groups: results.duplicate_slugs.length,
        duplicate_source_file_groups: results.duplicate_source_files.length,
        similar_slug_groups: results.similar_slugs.length,
        total_duplicate_videos_to_delete: totalDuplicates
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});