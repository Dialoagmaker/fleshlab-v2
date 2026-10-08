import { canonicalUrl, isNoIndexRoute, PRODUCTION_DOMAIN } from '../src/lib/seoConfig.js';

export const STATIC_PUBLIC_PATHS = Object.freeze([
  '/',
  '/brands',
  '/become-performer',
  '/chaturbate-model-join-studio',
  '/dmca',
  '/faq',
  '/fan-productions',
  '/gay-onlyfans-alternative',
  '/gay-performer-recruitment-philippines',
  '/gay-twink-performer-recruitment',
  '/guest-production',
  '/how-it-works',
  '/how-to-become-gay-content-creator',
  '/imprint',
  '/news',
  '/performers',
  '/privacy',
  '/terms',
  '/2257',
  '/videos',
  '/v3/become-a-creator',
  '/v3/brands',
  '/v3/collections',
  '/v3/collections/new-releases',
  '/v3/performers',
  '/v3/pricing',
  '/v3/videos',
]);

function canonicalSitemapEntry(entry) {
  const path = typeof entry === 'string' ? entry : entry?.path;
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return null;

  let parsed;
  try {
    parsed = new URL(path, PRODUCTION_DOMAIN);
  } catch {
    return null;
  }
  if (parsed.origin !== PRODUCTION_DOMAIN || parsed.search || parsed.hash || isNoIndexRoute(parsed.pathname)) return null;

  const loc = canonicalUrl(parsed.pathname);
  if (!loc) return null;
  const lastmod = entry?.lastmod ? normalizeLastmod(entry.lastmod) : null;
  return { loc, lastmod };
}

function normalizeLastmod(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function xmlEscape(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character]);
}

export function renderSitemapXml(entries = []) {
  const unique = new Map();
  for (const entry of entries) {
    const normalized = canonicalSitemapEntry(entry);
    if (normalized && !unique.has(normalized.loc)) unique.set(normalized.loc, normalized);
  }
  if (unique.size > 50000) throw new Error('SITEMAP_URL_LIMIT_EXCEEDED');

  const rows = [...unique.values()].sort((a, b) => a.loc.localeCompare(b.loc)).map(({ loc, lastmod }) =>
    `  <url><loc>${xmlEscape(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

export function renderSitemapIndexXml(sitemapUrls = []) {
  const urls = [...new Set(sitemapUrls)].filter(value => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'https:' && parsed.origin === PRODUCTION_DOMAIN && !parsed.search && !parsed.hash;
    } catch {
      return false;
    }
  });
  const rows = urls.map(url => `  <sitemap><loc>${xmlEscape(url)}</loc></sitemap>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</sitemapindex>\n`;
}
