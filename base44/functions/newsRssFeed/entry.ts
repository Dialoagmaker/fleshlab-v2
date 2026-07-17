import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const BASE_URL = 'https://fleshlab.online';

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const feeds = {
  all: { title: 'FLESHLAB News Center', description: 'Official FLESHLAB updates, announcements and releases.', categories: [] },
  'platform-updates': { title: 'FLESHLAB Platform Updates', description: 'Official platform updates and feature rollouts from FLESHLAB.', categories: ['studioUpdates', 'platformNews'] },
  'new-releases': { title: 'FLESHLAB New Releases', description: 'New production releases from FLESHLAB.', categories: ['production', 'guestProduction'] },
  'creator-news': { title: 'FLESHLAB Creator News', description: 'Creator announcements and community updates from FLESHLAB.', categories: ['creatorStories', 'casting', 'fanclub'] },
  'press-releases': { title: 'FLESHLAB Press Releases', description: 'Official FLESHLAB press releases and company announcements.', categories: ['pressRelease'] },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const feedKey = body.feed || url.searchParams.get('feed') || 'all';
    const feed = feeds[feedKey] || feeds.all;

    const allArticles = await base44.asServiceRole.entities.NewsArticle.filter(
      { status: 'published' },
      '-published_at',
      100
    );

    const articles = allArticles
      .filter((article) => !feed.categories.length || feed.categories.includes(article.category) || article.tags?.some((tag) => feed.categories.includes(tag)))
      .sort((a, b) => new Date(b.published_at || b.created_date || 0) - new Date(a.published_at || a.created_date || 0))
      .slice(0, 50);

    const items = articles.map((article) => {
      const link = `${BASE_URL}/news/${article.slug}`;
      const description = stripHtml(article.excerpt || article.meta_description || article.content || '').substring(0, 500);
      const image = article.cover_image_url ? `<media:content url="${escapeXml(article.cover_image_url)}" medium="image" />` : '';
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${new Date(article.published_at || article.created_date || Date.now()).toUTCString()}</pubDate>
      <category>${escapeXml(article.category || 'Studio News')}</category>
      ${image}
    </item>`;
    }).join('\n');

    const selfUrl = `${BASE_URL}/api/apps/${Deno.env.get('BASE44_APP_ID')}/functions/newsRssFeed${feedKey !== 'all' ? `?feed=${feedKey}` : ''}`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(feed.title)}</title>
    <link>${BASE_URL}/news</link>
    <description>${escapeXml(feed.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=900, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('newsRssFeed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});