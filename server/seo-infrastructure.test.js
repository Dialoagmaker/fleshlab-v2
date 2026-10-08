import test from 'node:test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {
  buildBreadcrumbListJsonLd,
  buildOrganizationJsonLd,
  buildSeoMetadata,
  buildVideoObjectJsonLd,
  buildWebSiteJsonLd,
  publicSeoImageUrl,
  publicSeoMediaUrl,
  serializeJsonLd,
} from '../src/lib/seoMetadata.js';
import { canonicalUrl, isNoIndexRoute, normalizeMetaText } from '../src/lib/seoConfig.js';
import { STATIC_PUBLIC_PATHS, renderSitemapIndexXml, renderSitemapXml } from './sitemap.js';
import { V3PublicService } from './v3-public.js';

test('metadata normalization preserves opaque wording while applying deterministic markup, whitespace and Unicode limits', () => {
  assert.equal(normalizeMetaText('  Sample <b>Product</b>\n catalogue  '), 'Sample Product catalogue');
  assert.equal(normalizeMetaText('A🙂BC', 3), 'A🙂B');
  assert.equal(normalizeMetaText(null), '');
});

test('canonical metadata strips query and fragment and emits unique social fields', () => {
  const result = buildSeoMetadata({
    title: 'Sample Product',
    description: 'Sample catalogue description',
    canonicalUrl: 'https://preview.example/v3/videos/sample?utm_source=test#details',
    imageUrl: '/media/sample.jpg',
    tags: ['sample', 'catalogue', 'Sample'],
    pageType: 'article',
    publishedAt: '2026-01-02T03:04:05Z',
    modifiedAt: null,
    production: true,
  });
  assert.equal(result.canonical, 'https://fleshlab.online/v3/videos/sample');
  assert.equal(result.description, 'Sample catalogue description');
  assert.deepEqual(result.keywords, ['sample', 'catalogue']);
  assert.equal(result.robots, 'index,follow');
  assert.equal(result.metaTags.find(tag => tag.key === 'og:title').content, 'Sample Product');
  assert.equal(result.metaTags.find(tag => tag.key === 'twitter:title').content, 'Sample Product');
  for (const key of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    assert.ok(result.metaTags.some(tag => tag.key === key));
  }
  assert.equal(result.metaTags.find(tag => tag.key === 'article:published_time').content, '2026-01-02T03:04:05.000Z');
  assert.equal(result.metaTags.find(tag => tag.key === 'article:modified_time').content, undefined);
  assert.equal(buildSeoMetadata({ publishedAt: 'not-a-date', production: true }).publishedAt, undefined);
  assert.equal(result.image, 'https://fleshlab.online/media/sample.jpg');
  const missing = buildSeoMetadata({ production: true });
  assert.equal(missing.title, '');
  assert.equal(missing.description, '');
  assert.equal(missing.image, undefined);
  assert.equal(missing.metaTags.some(tag => tag.key === 'og:image' && tag.content), false);
  assert.equal(buildSeoMetadata({ title: 'x'.repeat(240), description: 'y'.repeat(180), production: true }).title.length, 200);
  assert.equal(buildSeoMetadata({ title: 'x'.repeat(240), description: 'y'.repeat(180), production: true }).description.length, 160);
});

test('metadata noindexes private routes, non-tracking query variants and non-production hosts', () => {
  for (const path of ['/login', '/account', '/v3/library', '/api/v3/private/callback']) {
    assert.equal(isNoIndexRoute(path), true);
    assert.equal(buildSeoMetadata({ pathname: path, production: true }).robots, 'noindex,follow');
  }
  assert.equal(isNoIndexRoute('/v3/videos/sample', '?page=2'), true);
  assert.equal(isNoIndexRoute('/%61pi/v3/private/callback'), true);
  assert.equal(isNoIndexRoute('/v3/videos/sample', '?utm_source=test'), false);
  assert.equal(buildSeoMetadata({ pathname: '/v3/videos/sample', production: false }).robots, 'noindex,follow');
  assert.equal(canonicalUrl('/v3/videos/sample?tracking=1#part'), 'https://fleshlab.online/v3/videos/sample');
  assert.equal(canonicalUrl('/v3/videos/sample/'), 'https://fleshlab.online/v3/videos/sample');
});

test('hydration preserves the initial server indexation state', () => {
  const publicRoute = buildSeoMetadata({
    production: true,
    pathname: '/v3/videos/sample',
    initialRobots: 'index,follow',
    noindex: true,
  });
  assert.equal(publicRoute.robots, 'index,follow');

  const privateRoute = buildSeoMetadata({
    production: true,
    pathname: '/v3/library',
    initialRobots: 'noindex,follow',
  });
  assert.equal(privateRoute.robots, 'noindex,follow');
});

test('public media URL policy rejects signed, external and private asset URLs', () => {
  assert.equal(publicSeoImageUrl('/media/sample.jpg'), 'https://fleshlab.online/media/sample.jpg');
  assert.equal(publicSeoImageUrl('/api/v3/public/media/123e4567-e89b-12d3-a456-426614174000/file'), 'https://fleshlab.online/api/v3/public/media/123e4567-e89b-12d3-a456-426614174000/file');
  assert.equal(publicSeoImageUrl('/api/v3/commerce/library/item'), undefined);
  assert.equal(publicSeoImageUrl('https://fleshlab.online/api/v3/commerce/library/item'), undefined);
  assert.equal(publicSeoImageUrl('/media/%2e%2e%2fprivate/sample.jpg'), undefined);
  assert.equal(publicSeoImageUrl('https://cdn2.loyalfans.com/sample.jpg?token=secret'), undefined);
  assert.equal(publicSeoImageUrl('https://storage.example/private/sample.jpg'), undefined);
  assert.equal(publicSeoMediaUrl('https://cdn.fleshlab.online/sample.mp4?signature=secret'), undefined);
  assert.equal(publicSeoMediaUrl('https://fleshlab.online/api/v3/commerce/library/item'), undefined);
});

test('JSON-LD builders emit valid schema and remove unsafe/private URL fields', () => {
  const organization = buildOrganizationJsonLd({ id: 'https://fleshlab.online/#organization', name: 'FLESHLAB', url: '/', logo: '/media/sample.jpg' });
  const website = buildWebSiteJsonLd({ id: 'https://fleshlab.online/#website', name: 'FLESHLAB', url: '/', organizationId: organization['@id'] });
  const breadcrumbs = buildBreadcrumbListJsonLd([{ name: 'Sample Product', path: '/v3/videos/sample' }]);
  const video = buildVideoObjectJsonLd({
    id: 'https://fleshlab.online/v3/videos/sample#video',
    url: '/v3/videos/sample',
    name: 'Sample Product',
    description: 'Sample catalogue description',
    thumbnailUrl: '/media/sample.jpg',
    uploadDate: '2026-01-02T03:04:05Z',
    duration: 90,
    contentUrl: 'https://cdn2.loyalfans.com/sample.mp4?token=secret',
  });
  const serialized = serializeJsonLd({
    '@context': 'https://schema.org',
    '@graph': [organization, website, breadcrumbs, video, { storage_reference: 'private/object', contentUrl: 'https://cdn2.loyalfans.com/sample.mp4?token=secret' }],
  });
  const parsed = JSON.parse(serialized);
  assert.equal(parsed['@graph'].length, 5);
  assert.equal(parsed['@graph'][3].duration, 'PT90S');
  assert.equal(parsed['@graph'][3]['@id'], 'https://fleshlab.online/v3/videos/sample#video');
  assert.equal(parsed['@graph'][3].url, 'https://fleshlab.online/v3/videos/sample');
  assert.equal(buildVideoObjectJsonLd({ duration: 'PT' }).duration, undefined);
  assert.equal('contentUrl' in parsed['@graph'][3], false);
  assert.equal('storage_reference' in parsed['@graph'][4], false);
  assert.equal('contentUrl' in parsed['@graph'][4], false);
  assert.equal(parsed['@graph'][0].logo, 'https://fleshlab.online/media/sample.jpg');
});

test('sitemap includes canonical public identifiers and excludes private, query and duplicate entries', () => {
  const xml = renderSitemapXml([
    { path: '/v3/videos/sample', lastmod: '2026-10-01T00:00:00Z' },
    '/v3/videos/sample',
    '/v3/performers/sample-person',
    '/v3/library',
    '/v3/videos/sample?page=2',
    '/api/v3/public/sitemap.xml',
    '//outside.example/path',
  ]);
  assert.equal((xml.match(/<url>/g) || []).length, 2);
  assert.match(xml, /https:\/\/fleshlab\.online\/v3\/videos\/sample/);
  assert.match(xml, /<lastmod>2026-10-01<\/lastmod>/);
  assert.doesNotMatch(xml, /library|page=2|outside\.example|\/api\//);
  const index = renderSitemapIndexXml(['https://fleshlab.online/sitemap.xml', 'https://fleshlab.online/sitemap.xml?x=1', 'http://fleshlab.online/unsafe.xml']);
  assert.equal((index.match(/<sitemap>/g) || []).length, 1);
});

test('database sitemap source selects public route identifiers and timestamps only', async () => {
  const calls = [];
  const db = { query: async (sql, values) => {
    calls.push({ sql, values });
    return { rows: [{ slug: 'sample', lastmod: '2026-10-01T00:00:00Z' }] };
  } };
  const paths = await new V3PublicService(db).sitemapEntries();
  assert.equal(calls.length, 5);
  assert.deepEqual(paths.map(item => item.path), [
    '/v3/videos/sample', '/v3/performers/sample', '/v3/brands/sample', '/v3/collections/sample', '/news/sample',
  ]);
  for (const { sql } of calls) {
    assert.match(sql, /SELECT (?:[vpb]\.)?slug/);
    assert.doesNotMatch(sql, /title|description|content|source_payload|video_url/i);
  }
  assert.match(calls[0].sql, /v3_lifecycle='published'/);
  assert.match(calls[1].sql, /public_visibility=true/);
  assert.match(calls[3].sql, /visibility='public'/);
  assert.match(calls[4].sql, /status='published'/);
});

test('dynamic sitemap includes runtime public catalogue additions without selecting content or media fields', async () => {
  const calls = [];
  const db = { query: async sql => {
    calls.push(sql);
    if (sql.includes('FROM catalog_videos')) {
      return { rows: Array.from({ length: 116 }, (_, index) => ({ slug: `sample-product-${index + 1}`, lastmod: '2026-10-01T00:00:00Z' })) };
    }
    if (sql.includes('FROM catalog_performers')) return { rows: [{ slug: 'sample-performer', lastmod: null }] };
    if (sql.includes('FROM catalog_brands')) return { rows: [{ slug: 'sample-brand', lastmod: null }] };
    if (sql.includes('FROM v3_catalogue_collections')) return { rows: [{ slug: 'sample-collection', lastmod: null }] };
    if (sql.includes('FROM news_articles')) return { rows: [{ slug: 'sample-article', lastmod: null }] };
    throw new Error('Unexpected sitemap query');
  } };
  const entries = await new V3PublicService(db).sitemapEntries();
  const xml = renderSitemapXml([...STATIC_PUBLIC_PATHS, ...entries]);
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]));

  assert.equal(entries.filter(entry => entry.path.startsWith('/v3/videos/')).length, 116);
  assert.ok(entries.some(entry => entry.path === '/v3/videos/sample-product-116'));
  assert.ok(entries.some(entry => entry.path === '/v3/performers/sample-performer'));
  assert.ok(entries.some(entry => entry.path === '/v3/brands/sample-brand'));
  assert.ok(entries.some(entry => entry.path === '/v3/collections/sample-collection'));
  assert.ok(entries.some(entry => entry.path === '/news/sample-article'));
  assert.ok(STATIC_PUBLIC_PATHS.includes('/v3/collections/new-releases'));
  assert.equal(new Set(locations.map(url => url.href)).size, locations.length);
  assert.ok(locations.every(url => url.origin === 'https://fleshlab.online' && !url.search && !url.hash && !isNoIndexRoute(url.pathname)));
  assert.equal(calls.length, 5);
  for (const sql of calls) {
    assert.match(sql, /SELECT (?:v\.|p\.|b\.)?slug/);
    assert.doesNotMatch(sql, /title|description|content|source_payload|video_url|storage_reference|token/i);
  }
  assert.doesNotMatch(xml, /\.blob\.core\.windows\.net|loyalfans\.com|signature=|token=/i);
});

test('public document shells are indexable before hydration', async () => {
  const [v3Index, rootIndex] = await Promise.all([
    fs.readFile(new URL('../v3/index.html', import.meta.url), 'utf8'),
    fs.readFile(new URL('../index.html', import.meta.url), 'utf8'),
  ]);
  assert.doesNotMatch(v3Index, /<meta[^>]+name="robots"[^>]+content="noindex/i);
  assert.doesNotMatch(rootIndex, /<meta[^>]+name="robots"[^>]+content="noindex/i);
});

test('route SEO renderers use DOM APIs, canonical handoff, and hydration robots consistency', async () => {
  const [legacyMeta, v3Public, v3Index, rootIndex, serverIndex, sitemapXml, robots] = await Promise.all([
    fs.readFile(new URL('../src/components/SEOMeta.jsx', import.meta.url), 'utf8'),
    fs.readFile(new URL('../v3/src/public.jsx', import.meta.url), 'utf8'),
    fs.readFile(new URL('../v3/index.html', import.meta.url), 'utf8'),
    fs.readFile(new URL('../index.html', import.meta.url), 'utf8'),
    fs.readFile(new URL('./index.js', import.meta.url), 'utf8'),
    fs.readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8'),
    fs.readFile(new URL('../public/robots.txt', import.meta.url), 'utf8'),
  ]);
  assert.match(legacyMeta, /setAttribute\('content', content\)/);
  assert.match(legacyMeta, /initialRobots/);
  assert.match(legacyMeta, /__FLESHLAB_CANONICAL__/);
  assert.match(v3Public, /buildSeoMetadata\(/);
  assert.match(v3Public, /initialRobots/);
  assert.match(v3Public, /__FLESHLAB_CANONICAL__/);
  assert.match(v3Public, /serializeJsonLd\(/);
  assert.doesNotMatch(legacyMeta, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(v3Public, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(v3Index, /<title>[^<]*V3[^<]*<\/title>/);
  assert.match(v3Index, /name="robots" content="__FLESHLAB_ROBOTS__"/);
  assert.match(v3Index, /rel="canonical" href="__FLESHLAB_CANONICAL__"/);
  assert.match(rootIndex, /window\.__FLESHLAB_CANONICAL__ = canonical/);
  assert.match(serverIndex, /\/api\/v3\/public\/sitemap\.xml/);
  assert.match(serverIndex, /sendXml\(res, 200, renderSitemapXml/);
  assert.match(serverIndex, /application\/xml; charset=utf-8/);
  assert.match(serverIndex, /renderSitemapXml\(\[\.\.\.STATIC_PUBLIC_PATHS, \.\.\.await v3Public\.sitemapEntries\(\)\]\)/);
  const locations = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]));
  assert.ok(locations.length > 0);
  assert.equal(new Set(locations.map(url => url.href)).size, locations.length);
  assert.ok(locations.every(url => url.protocol === 'https:' && url.hostname === 'fleshlab.online' && !url.search && !url.hash && !isNoIndexRoute(url.pathname)));
  assert.match(robots, /Sitemap: https:\/\/fleshlab\.online\/api\/v3\/public\/sitemap\.xml/);
});
