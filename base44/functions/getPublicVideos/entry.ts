import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public endpoint — no user auth required.
// Uses service role to fetch published Video records with filtering and pagination.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    
    // Pagination
    const page = Math.max(1, parseInt(body.page) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(body.limit) || 24));
    const skip = (page - 1) * limit;
    
    // Filters
    const { search, category, access_tier, exclusive, brand, duration, sort } = body;
    
    // Build filter query - Phase 2D P0: Filter by publish readiness, not just status
    const baseQuery = { status: 'published' };
    
    // Access tier filter
    if (access_tier) {
      baseQuery.access_tier = access_tier;
    }
    
    // Exclusive filter (uses is_exclusive boolean field, NOT access_tier)
    if (exclusive === true) {
      // Note: We filter in-memory below since is_exclusive is a boolean
    }
    
    // Brand filter
    if (brand) {
      baseQuery.brand_id = brand;
    }
    
    // Fetch all published videos for filtering (we'll filter in memory for search/categories)
    // For production with large datasets, this should use database-level filtering
    const allVideos = await base44.asServiceRole.entities.Video.filter(
      baseQuery,
      '-release_date',
      500 // Fetch up to 500 for filtering
    );
    
    // Fetch brands and performer relationships for search matching
    const allBrands = await base44.asServiceRole.entities.Brand.list('-created_date', 100);
    const allVideoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({});
    const allPerformers = await base44.asServiceRole.entities.Performer.filter({ status: 'active' }, '-created_date', 500);
    
    // Create lookup maps
    const brandMap = new Map(allBrands.map(b => [b.id, b]));
    const performerMap = new Map(allPerformers.map(p => [p.id, p]));
    
    // Phase 2D P0: Filter by publish readiness first (before any other filters)
    const readyVideos = allVideos.filter(v => {
      // Must have required fields for public display
      if (!v.source_video_url || !v.primary_thumbnail_url) return false;
      if (!v.trailer_url && !v.source_video_url) return false;
      if (!v.duration_seconds || v.duration_seconds <= 0) return false;
      if (!v.access_tier || !['free', 'fanclub', 'ppv'].includes(v.access_tier)) return false;
      if (!v.title || v.title.trim().length < 3) return false;
      
      // Must have at least one performer
      const videoPerformerIds = allVideoPerformers
        .filter(vp => vp.video_id === v.id)
        .map(vp => vp.performer_id);
      if (videoPerformerIds.length === 0) return false;
      
      return true;
    });
    
    // Filter by search - STRICT matching on searchable fields only
    let filteredVideos = readyVideos;
    if (search) {
      const searchLower = search.toLowerCase().trim();
      filteredVideos = filteredVideos.filter(v => {
        // Video fields
        const titleMatch = v.title?.toLowerCase().includes(searchLower);
        const metaTitleMatch = v.meta_title?.toLowerCase().includes(searchLower);
        const summaryMatch = v.short_summary?.toLowerCase().includes(searchLower);
        const descriptionMatch = v.description?.toLowerCase().includes(searchLower);
        const categoryMatch = v.categories?.some(c => c.toLowerCase().includes(searchLower));
        const tagMatch = v.tags?.some(t => t.toLowerCase().includes(searchLower));
        
        // Brand name match
        const brand = brandMap.get(v.brand_id);
        const brandMatch = brand?.name?.toLowerCase().includes(searchLower);
        
        // Performer name match (check VideoPerformer relationships)
        const videoPerformerIds = allVideoPerformers
          .filter(vp => vp.video_id === v.id)
          .map(vp => vp.performer_id);
        const performerNames = videoPerformerIds
          .map(id => performerMap.get(id))
          .filter(Boolean)
          .map(p => p.display_name?.toLowerCase() || '');
        const performerMatch = performerNames.some(name => name.includes(searchLower));
        
        // STRICT: only include if at least one field matches
        const matches = titleMatch || metaTitleMatch || summaryMatch || descriptionMatch || categoryMatch || tagMatch || brandMatch || performerMatch;
        return matches;
      });
    }
    
    // Filter by category
    if (category) {
      const categoryLower = category.toLowerCase();
      filteredVideos = filteredVideos.filter(v => 
        v.categories?.some(c => c.toLowerCase().includes(categoryLower)) ||
        v.tags?.some(t => t.toLowerCase().includes(categoryLower))
      );
    }
    
    // Filter by exclusive (uses is_exclusive boolean field)
    if (exclusive === true) {
      filteredVideos = filteredVideos.filter(v => v.is_exclusive === true);
    }
    
    // Filter by duration
    if (duration && duration.min !== undefined) {
      filteredVideos = filteredVideos.filter(v => {
        if (!v.duration_seconds) return false;
        if (duration.max === null) return v.duration_seconds >= duration.min;
        return v.duration_seconds >= duration.min && v.duration_seconds <= duration.max;
      });
    }
    
    // Sort
    let sortedVideos = filteredVideos;
    switch (sort) {
      case 'views':
        sortedVideos = filteredVideos.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'longest':
        sortedVideos = filteredVideos.sort((a, b) => (b.duration_seconds || 0) - (a.duration_seconds || 0));
        break;
      case 'trending':
        // Fallback: newest + high views
        sortedVideos = filteredVideos.sort((a, b) => {
          const dateA = new Date(a.release_date || a.created_date || 0).getTime();
          const dateB = new Date(b.release_date || b.created_date || 0).getTime();
          const viewA = a.view_count || 0;
          const viewB = b.view_count || 0;
          return (dateB - dateA) + (viewB - viewA) * 0.01;
        });
        break;
      case 'newest':
      default:
        // Already sorted by release_date desc from fetch
        break;
    }
    
    // Pagination
    const total = sortedVideos.length;
    const paginatedVideos = sortedVideos.slice(skip, skip + limit + 1);
    
    // Determine hasMore from extra record
    const hasMore = paginatedVideos.length > limit;
    const limitedVideos = hasMore ? paginatedVideos.slice(0, limit) : paginatedVideos;
    
    // Brands already fetched above for search
    const brands = allBrands;
    
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
    
    return Response.json({
      videos: safeVideos,
      brands: safeBrands,
      total,
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
    return Response.json({ 
      videos: [], 
      brands: [], 
      total: 0, 
      page: 1, 
      limit: 24, 
      hasMore: false,
      error: error.message 
    }, { status: 200 });
  }
});