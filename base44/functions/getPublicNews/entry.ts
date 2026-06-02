import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public endpoint — no user auth required.
// Uses service role to fetch published NewsArticle records with pagination.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const page = Math.max(1, parseInt(body.page) || 1);
    const limit = Math.min(24, Math.max(1, parseInt(body.limit) || 12));
    const skip = (page - 1) * limit;

    // Get total count first
    const allArticles = await base44.asServiceRole.entities.NewsArticle.filter(
      { status: 'published' },
      '-published_at',
      500
    );
    const total = allArticles?.length || 0;

    // Get paginated articles
    const articles = await base44.asServiceRole.entities.NewsArticle.filter(
      { status: 'published' },
      '-published_at',
      limit,
      skip
    );

    // Return only safe public fields
    const safe = (articles || []).map(a => ({
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
      hasMore: skip + safe.length < total
    });
  } catch (error) {
    console.error('getPublicNews error:', error);
    return Response.json({ articles: [], total: 0, page: 1, limit: 12, hasMore: false, error: error.message }, { status: 200 });
  }
});