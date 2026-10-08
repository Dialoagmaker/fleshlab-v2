import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const page = Math.max(1, parseInt(body.page) || 1);
    const limit = Math.min(24, Math.max(1, parseInt(body.limit) || 12));
    const skip = (page - 1) * limit;
    const searchQuery = String(body.search || body.searchQuery || '').toLowerCase().trim();
    const category = String(body.category || '').trim();
    const year = String(body.year || '').trim();
    const creator = String(body.creator || '').toLowerCase().trim();
    const collection = String(body.collection || '').toLowerCase().trim();
    const sort = body.sort === 'oldest' ? 'oldest' : 'newest';

    const allArticles = await base44.asServiceRole.entities.NewsArticle.filter(
      { status: 'published' },
      '-published_at',
      200
    );

    const searchableText = (article) => [article.title, article.excerpt, article.meta_description, article.content, ...(article.tags || [])].filter(Boolean).join(' ').toLowerCase();

    let filtered = allArticles.filter((article) => {
      const text = searchableText(article);
      const articleYear = (article.published_at || article.created_date || '').substring(0, 4);
      const matchesSearch = !searchQuery || text.includes(searchQuery);
      const matchesCategory = !category || article.category === category || article.tags?.includes(category);
      const matchesYear = !year || articleYear === year;
      const matchesCreator = !creator || text.includes(creator);
      const matchesCollection = !collection || text.includes(collection);
      return matchesSearch && matchesCategory && matchesYear && matchesCreator && matchesCollection;
    });

    filtered = filtered.sort((a, b) => {
      const aDate = new Date(a.published_at || a.created_date || 0);
      const bDate = new Date(b.published_at || b.created_date || 0);
      return sort === 'oldest' ? aDate - bDate : bDate - aDate;
    });

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit + 1);
    const hasMore = paginated.length > limit;
    const articles = hasMore ? paginated.slice(0, limit) : paginated;

    const years = [...new Set(allArticles.map((article) => (article.published_at || article.created_date || '').substring(0, 4)).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    const tags = [...new Set(allArticles.flatMap((article) => article.tags || []))].filter(Boolean).sort();

    const safe = articles.map((article) => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      cover_image_url: article.cover_image_url,
      published_at: article.published_at,
      updated_date: article.updated_date,
      tags: article.tags,
      category: article.category,
      meta_description: article.meta_description,
    }));

    return Response.json({
      articles: safe,
      total,
      page,
      limit,
      hasMore,
      filters: { years, tags }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('getPublicNews error:', error);
    return Response.json({ articles: [], total: 0, page: 1, limit: 12, hasMore: false, filters: { years: [], tags: [] }, error: error.message }, { status: 200 });
  }
});