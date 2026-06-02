import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public endpoint — no user auth required.
// Uses service role to fetch published NewsArticle records.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const articles = await base44.asServiceRole.entities.NewsArticle.filter(
      { status: 'published' },
      '-published_at',
      100
    );

    // Return only safe public fields
    const safe = (articles || []).map(a => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      cover_image_url: a.cover_image_url,
      published_at: a.published_at,
      created_date: a.created_date,
      status: a.status,
      tags: a.tags,
      category: a.category,
    }));

    return Response.json({ articles: safe });
  } catch (error) {
    console.error('getPublicNews error:', error);
    return Response.json({ articles: [], error: error.message }, { status: 200 });
  }
});