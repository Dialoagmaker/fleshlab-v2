import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public endpoint to fetch a single news article by slug
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const slug = body.slug;

    if (!slug) {
      return Response.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Fetch article by slug — with legacy slug fallback
    let articles = await base44.asServiceRole.entities.NewsArticle.filter(
      { slug, status: 'published' },
      '-published_at',
      1
    );

    // If not found by current slug, check legacy_slugs array
    if (articles.length === 0) {
      // Fetch all published articles and check legacy_slugs
      const allArticles = await base44.asServiceRole.entities.NewsArticle.filter(
        { status: 'published' },
        '-published_at',
        100
      );
      
      // Find article where legacy_slugs contains the requested slug
      const articleViaLegacy = allArticles.find(a => a.legacy_slugs?.includes(slug));
      
      if (articleViaLegacy) {
        articles = [articleViaLegacy];
      }
    }

    if (articles.length === 0) {
      return Response.json({ error: 'Article not found' }, { status: 404 });
    }

    const article = articles[0];

    // Return safe public fields including full content for detail page
    const safe = {
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      cover_image_url: article.cover_image_url,
      published_at: article.published_at,
      tags: article.tags,
      category: article.category,
      meta_title: article.meta_title,
      meta_description: article.meta_description,
      updated_date: article.updated_date,
      created_date: article.created_date,
    };

    return Response.json({ article: safe }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('getPublicNewsArticleBySlug error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});