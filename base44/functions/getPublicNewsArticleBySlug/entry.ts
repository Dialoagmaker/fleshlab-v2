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

    // Fetch article by slug
    const articles = await base44.asServiceRole.entities.NewsArticle.filter(
      { slug, status: 'published' },
      '-published_at',
      1
    );

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