/**
 * sitemapXml — V2 Sitemap Generator
 *
 * Generates a valid sitemap.xml with canonical production URLs.
 * ALL urls use https://fleshlab.online — never staging/Base44 domains.
 *
 * Includes:
 *   - Static pages (/, /videos, /performers, /news, /brands, /become-performer, /guest-production)
 *   - /videos/:slug  — published videos with slug
 *   - /performers/:slug — active performers with slug
 *   - /news/:slug  — published articles with slug
 *   - /brands/:slug — active brands with slug
 *
 * Excludes:
 *   - Admin routes
 *   - Dashboard/auth/private routes
 *   - Drafts / unpublished / inactive records
 *   - Records missing slug
 *   - Duplicate slugs (deduped by Set)
 *   - Any signed/private/Base44 URLs
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BASE_URL = 'https://fleshlab.online';

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  const trimmed = slug.trim();
  if (!trimmed) return false;
  // Must not look like a DB ID (24-char hex)
  if (/^[0-9a-f]{24}$/.test(trimmed)) return false;
  // Must not contain query chars or spaces
  if (/[?#\s]/.test(trimmed)) return false;
  return true;
}

function urlEntry(loc, lastmod, changefreq, priority) {
  const parts = [`  <url>\n    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod) {
    const date = lastmod.substring(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) parts.push(`\n    <lastmod>${date}</lastmod>`);
  }
  if (changefreq) parts.push(`\n    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`\n    <priority>${priority}</priority>`);
  parts.push('\n  </url>');
  return parts.join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date().toISOString().substring(0, 10);

    // Fetch all public data using service role (no user auth required for sitemap)
    const [videos, performers, articles, brands, allVideoPerformers] = await Promise.all([
      base44.asServiceRole.entities.Video.filter({ status: 'published' }, '-updated_date', 1000),
      base44.asServiceRole.entities.Performer.filter({ status: 'active' }, '-updated_date', 500),
      base44.asServiceRole.entities.NewsArticle.filter({ status: 'published' }, '-published_at', 200),
      base44.asServiceRole.entities.Brand.filter({ status: 'active' }, 'name', 100),
      base44.asServiceRole.entities.VideoPerformer.filter({}),
    ]);

    const urls = [];
    const stats = {
      static: 0,
      videos: 0,
      performers: 0,
      articles: 0,
      brands: 0,
      skipped_videos: 0,
      skipped_performers: 0,
      skipped_articles: 0,
      skipped_brands: 0,
    };

    // --- Static pages ---
    const staticPages = [
      { path: '/',                 changefreq: 'daily',   priority: '1.0' },
      { path: '/videos',           changefreq: 'daily',   priority: '0.9' },
      { path: '/performers',       changefreq: 'daily',   priority: '0.9' },
      { path: '/news',             changefreq: 'weekly',  priority: '0.8' },
      { path: '/brands',           changefreq: 'weekly',  priority: '0.8' },
      { path: '/become-performer', changefreq: 'weekly',  priority: '0.9' },
      { path: '/gay-performer-recruitment-philippines', changefreq: 'weekly',  priority: '0.8' },
      { path: '/chaturbate-model-join-studio', changefreq: 'weekly',  priority: '0.8' },
      { path: '/gay-onlyfans-alternative', changefreq: 'weekly',  priority: '0.8' },
      { path: '/guest-production', changefreq: 'weekly',  priority: '0.8' },
      { path: '/fan-productions',  changefreq: 'weekly',  priority: '0.7' },
      { path: '/how-it-works',     changefreq: 'monthly', priority: '0.7' },
      { path: '/faq',              changefreq: 'monthly', priority: '0.7' },
      { path: '/terms',            changefreq: 'monthly', priority: '0.5' },
      { path: '/privacy',          changefreq: 'monthly', priority: '0.5' },
      { path: '/dmca',             changefreq: 'monthly', priority: '0.5' },
      { path: '/2257',             changefreq: 'monthly', priority: '0.5' },
      { path: '/imprint',          changefreq: 'monthly', priority: '0.5' },
      { path: '/cookie-policy',    changefreq: 'monthly', priority: '0.5' },
      { path: '/fanclub',          changefreq: 'weekly',  priority: '0.5' },
      { path: '/terms',            changefreq: 'yearly',  priority: '0.3' },
      { path: '/privacy',          changefreq: 'yearly',  priority: '0.3' },
      { path: '/dmca',             changefreq: 'yearly',  priority: '0.3' },
      { path: '/2257',             changefreq: 'yearly',  priority: '0.3' },
    ];
    for (const page of staticPages) {
      urls.push(urlEntry(`${BASE_URL}${page.path}`, today, page.changefreq, page.priority));
      stats.static++;
    }

    // --- Video pages ---
    // Phase 2D P0: Only include videos with complete publish readiness
    const seenVideoSlugs = new Set();
    for (const video of videos) {
      // Skip if missing required fields for public display
      if (!video.source_video_url || !video.primary_thumbnail_url) {
        stats.skipped_videos++; continue;
      }
      if (!video.trailer_url && !video.source_video_url) {
        stats.skipped_videos++; continue;
      }
      if (!video.duration_seconds || video.duration_seconds <= 0) {
        stats.skipped_videos++; continue;
      }
      
      // Phase 2D P0: Check performer relations
      const videoPerformerCount = allVideoPerformers.filter(vp => vp.video_id === video.id).length;
      if (videoPerformerCount === 0) {
        stats.skipped_videos++; continue;
      }
      
      if (!isValidSlug(video.slug)) { stats.skipped_videos++; continue; }
      if (seenVideoSlugs.has(video.slug)) { stats.skipped_videos++; continue; }
      seenVideoSlugs.add(video.slug);
      const lastmod = video.updated_date || video.published_at || today;
      urls.push(urlEntry(`${BASE_URL}/videos/${video.slug}`, lastmod, 'weekly', '0.8'));
      stats.videos++;
    }

    // --- Performer pages ---
    const seenPerformerSlugs = new Set();
    for (const performer of performers) {
      if (!isValidSlug(performer.slug)) { stats.skipped_performers++; continue; }
      if (seenPerformerSlugs.has(performer.slug)) { stats.skipped_performers++; continue; }
      seenPerformerSlugs.add(performer.slug);
      const lastmod = performer.updated_date || today;
      urls.push(urlEntry(`${BASE_URL}/performers/${performer.slug}`, lastmod, 'weekly', '0.9'));
      stats.performers++;
    }

    // --- News/article pages ---
    const seenArticleSlugs = new Set();
    for (const article of articles) {
      if (!isValidSlug(article.slug)) { stats.skipped_articles++; continue; }
      if (seenArticleSlugs.has(article.slug)) { stats.skipped_articles++; continue; }
      seenArticleSlugs.add(article.slug);
      const lastmod = article.updated_date || article.published_at || today;
      urls.push(urlEntry(`${BASE_URL}/news/${article.slug}`, lastmod, 'monthly', '0.7'));
      stats.articles++;
    }

    // --- Brand pages ---
    const seenBrandSlugs = new Set();
    for (const brand of brands) {
      if (!isValidSlug(brand.slug)) { stats.skipped_brands++; continue; }
      if (seenBrandSlugs.has(brand.slug)) { stats.skipped_brands++; continue; }
      seenBrandSlugs.add(brand.slug);
      const lastmod = brand.updated_date || today;
      urls.push(urlEntry(`${BASE_URL}/brands/${brand.slug}`, lastmod, 'weekly', '0.7'));
      stats.brands++;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Sitemap-Stats': JSON.stringify(stats),
      },
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});