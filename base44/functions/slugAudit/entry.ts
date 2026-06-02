/**
 * slugAudit — P0 Slug Audit for Videos, Performers, News
 *
 * Admin-only. Reports on slug coverage across all public content types.
 * Identifies: missing slugs, duplicate slugs, DB-ID slugs, invalid slugs.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  const trimmed = slug.trim();
  if (!trimmed) return false;
  if (/^[0-9a-f]{24}$/.test(trimmed)) return false; // Looks like a DB ID
  if (/[?#\s]/.test(trimmed)) return false; // Contains query chars or spaces
  return true;
}

function isDatabaseId(slug) {
  return slug && /^[0-9a-f]{24}$/.test(slug.trim());
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [allVideos, allPerformers, allArticles] = await Promise.all([
      base44.asServiceRole.entities.Video.list('-created_date', 1000),
      base44.asServiceRole.entities.Performer.list('-created_date', 500),
      base44.asServiceRole.entities.NewsArticle.list('-created_date', 200),
    ]);

    // ---- VIDEO AUDIT ----
    const publishedVideos = allVideos.filter(v => v.status === 'published');
    const videoSlugMap = {};
    const videoResults = {
      total: allVideos.length,
      published: publishedVideos.length,
      with_valid_slug: 0,
      missing_slug: [],
      db_id_slug: [],
      invalid_slug: [],
      duplicate_slug: [],
      valid_slugs: [],
    };

    for (const v of publishedVideos) {
      if (!v.slug) {
        videoResults.missing_slug.push({ id: v.id, title: v.title });
      } else if (isDatabaseId(v.slug)) {
        videoResults.db_id_slug.push({ id: v.id, title: v.title, slug: v.slug });
      } else if (!isValidSlug(v.slug)) {
        videoResults.invalid_slug.push({ id: v.id, title: v.title, slug: v.slug });
      } else {
        if (videoSlugMap[v.slug]) {
          videoResults.duplicate_slug.push({ id: v.id, title: v.title, slug: v.slug, conflict_id: videoSlugMap[v.slug] });
        } else {
          videoSlugMap[v.slug] = v.id;
          videoResults.with_valid_slug++;
          videoResults.valid_slugs.push(v.slug);
        }
      }
    }

    // ---- PERFORMER AUDIT ----
    const activePerformers = allPerformers.filter(p => p.status === 'active');
    const performerSlugMap = {};
    const performerResults = {
      total: allPerformers.length,
      active: activePerformers.length,
      with_valid_slug: 0,
      missing_slug: [],
      db_id_slug: [],
      invalid_slug: [],
      duplicate_slug: [],
      valid_slugs: [],
    };

    for (const p of activePerformers) {
      if (!p.slug) {
        performerResults.missing_slug.push({ id: p.id, name: p.display_name });
      } else if (isDatabaseId(p.slug)) {
        performerResults.db_id_slug.push({ id: p.id, name: p.display_name, slug: p.slug });
      } else if (!isValidSlug(p.slug)) {
        performerResults.invalid_slug.push({ id: p.id, name: p.display_name, slug: p.slug });
      } else {
        if (performerSlugMap[p.slug]) {
          performerResults.duplicate_slug.push({ id: p.id, name: p.display_name, slug: p.slug, conflict_id: performerSlugMap[p.slug] });
        } else {
          performerSlugMap[p.slug] = p.id;
          performerResults.with_valid_slug++;
          performerResults.valid_slugs.push(p.slug);
        }
      }
    }

    // ---- NEWS AUDIT ----
    const publishedArticles = allArticles.filter(a => a.status === 'published');
    const articleSlugMap = {};
    const articleResults = {
      total: allArticles.length,
      published: publishedArticles.length,
      with_valid_slug: 0,
      missing_slug: [],
      db_id_slug: [],
      invalid_slug: [],
      duplicate_slug: [],
      valid_slugs: [],
    };

    for (const a of publishedArticles) {
      if (!a.slug) {
        articleResults.missing_slug.push({ id: a.id, title: a.title });
      } else if (isDatabaseId(a.slug)) {
        articleResults.db_id_slug.push({ id: a.id, title: a.title, slug: a.slug });
      } else if (!isValidSlug(a.slug)) {
        articleResults.invalid_slug.push({ id: a.id, title: a.title, slug: a.slug });
      } else {
        if (articleSlugMap[a.slug]) {
          articleResults.duplicate_slug.push({ id: a.id, title: a.title, slug: a.slug, conflict_id: articleSlugMap[a.slug] });
        } else {
          articleSlugMap[a.slug] = a.id;
          articleResults.with_valid_slug++;
          articleResults.valid_slugs.push(a.slug);
        }
      }
    }

    return Response.json({
      generated_at: new Date().toISOString(),
      summary: {
        videos: {
          total: videoResults.total,
          published: videoResults.published,
          sitemap_ready: videoResults.with_valid_slug,
          blocked: videoResults.missing_slug.length + videoResults.db_id_slug.length + videoResults.invalid_slug.length + videoResults.duplicate_slug.length,
        },
        performers: {
          total: performerResults.total,
          active: performerResults.active,
          sitemap_ready: performerResults.with_valid_slug,
          blocked: performerResults.missing_slug.length + performerResults.db_id_slug.length + performerResults.invalid_slug.length + performerResults.duplicate_slug.length,
        },
        articles: {
          total: articleResults.total,
          published: articleResults.published,
          sitemap_ready: articleResults.with_valid_slug,
          blocked: articleResults.missing_slug.length + articleResults.db_id_slug.length + articleResults.invalid_slug.length + articleResults.duplicate_slug.length,
        },
      },
      videos: videoResults,
      performers: performerResults,
      articles: articleResults,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});