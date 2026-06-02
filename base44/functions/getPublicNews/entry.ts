import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public endpoint — no user auth required.
// Uses service role to fetch published NewsArticle records with pagination, search, and category filter.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const page = Math.max(1, parseInt(body.page) || 1);
    const limit = Math.min(24, Math.max(1, parseInt(body.limit) || 12));
    const skip = (page - 1) * limit;
    const searchQuery = body.searchQuery || '';
    const category = body.category || '';

    // Build filter query
    const baseQuery = { status: 'published' };
    
    // Fetch all published articles and filter client-side (simple approach)
    const allArticles = await base44.asServiceRole.entities.NewsArticle.filter(
      baseQuery,
      '-published_at',
      100 // Fetch up to 100 for filtering
    );

    // Client-side filtering
    let filtered = allArticles.filter(a => {
      const matchesSearch = !searchQuery || 
        a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !category || 
        a.category === category ||
        a.tags?.includes(category);
      
      return matchesSearch && matchesCategory;
    });

    // Apply pagination
    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit + 1); // +1 to check hasMore
    
    const hasMore = paginated.length > limit;
    const articles = hasMore ? paginated.slice(0, limit) : paginated;

    // Return only safe public fields
    const safe = articles.map(a => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      cover_image_url: a.cover_image_url,
      published_at: a.published_at,
      tags: a.tags,
      category: a.category,
    }));

    return Response.json({
      articles: safe,
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
    console.error('getPublicNews error:', error);
    return Response.json({ articles: [], total: 0, page: 1, limit: 12, hasMore: false, error: error.message }, { status: 200 });
  }
});