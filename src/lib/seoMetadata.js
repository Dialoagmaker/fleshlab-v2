import { canonicalUrl, isNoIndexRoute, normalizeMetaText, PRODUCTION_DOMAIN } from './seoConfig.js';
import { isPublicImageUrl, isPublicPreviewUrl } from './seoValidation.js';

const uniqueStrings = (values, maximumLength = 120) => {
  const seen = new Set();
  return (Array.isArray(values) ? values : [])
    .map(value => normalizeMetaText(value, maximumLength))
    .filter(value => {
      const key = value.toLowerCase();
      if (!value || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const compactObject = value => Object.fromEntries(
  Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== '')
);

function localPublicMediaUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[?#]|%(?:2f|5c|2e)/i.test(value)) return null;
  let parsed;
  try {
    parsed = new URL(value, PRODUCTION_DOMAIN);
  } catch {
    return null;
  }
  if (parsed.origin !== PRODUCTION_DOMAIN || /\/(?:playback|download|entitlement|private)(?:\/|$)/i.test(parsed.pathname)) return null;
  if (!(/^\/(?:media|assets)\//.test(parsed.pathname) || /^\/api\/v3\/public\/media\/[a-z0-9-]+\/file$/i.test(parsed.pathname))) return null;
  return parsed.href;
}

function sameOriginPublicMediaUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const parsed = new URL(value);
    return parsed.origin === PRODUCTION_DOMAIN && !parsed.search && !parsed.hash ? localPublicMediaUrl(parsed.pathname) : null;
  } catch {
    return null;
  }
}

function hasProductionOrigin(value) {
  try { return new URL(value).origin === PRODUCTION_DOMAIN; } catch { return false; }
}

function safeHttpsUrl(value) {
  if (typeof value !== 'string' || /[?#]/.test(value)) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password
      && !/token|signature|credential|expires|cookie|authorization|x-amz-/i.test(parsed.search)
      ? parsed.href
      : undefined;
  } catch {
    return undefined;
  }
}

function hasPrivateUrlMaterial(value) {
  return typeof value === 'string' && /(?:[?&](?:token|sig|signature|signed|expires|credential|authorization|cookie|se|sp|sv|skt|ske|skoid|sktid|sks|skv|key-pair-id|policy)=|x-amz-(?:algorithm|credential|signature|security-token))/i.test(value);
}

function safePublicPageUrl(value) {
  if (typeof value !== 'string') return undefined;
  try {
    const parsed = new URL(value, PRODUCTION_DOMAIN);
    if (parsed.origin !== PRODUCTION_DOMAIN || isNoIndexRoute(parsed.pathname, parsed.search)) return undefined;
    return canonicalUrl(parsed.pathname);
  } catch {
    return undefined;
  }
}

function safePublicIdentifierUrl(value) {
  if (typeof value !== 'string') return undefined;
  try {
    const parsed = new URL(value, PRODUCTION_DOMAIN);
    if (parsed.protocol !== 'https:' || parsed.origin !== PRODUCTION_DOMAIN || parsed.search) return undefined;
    return `${PRODUCTION_DOMAIN}${parsed.pathname}${parsed.hash}`;
  } catch {
    return undefined;
  }
}

function normalizeDate(value) {
  if (value == null || value === '') return undefined;
  if (typeof value === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return undefined;
    const day = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== value.slice(0, 10)) return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function normalizeDuration(value) {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return `PT${value}S`;
  if (typeof value !== 'string') return undefined;
  const duration = value.trim();
  return /\d/.test(duration) && /^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/i.test(duration)
    ? duration
    : undefined;
}

export function publicSeoImageUrl(value) {
  if (hasPrivateUrlMaterial(value)) return undefined;
  const local = localPublicMediaUrl(value);
  if (local) return local;
  if (hasProductionOrigin(value)) return sameOriginPublicMediaUrl(value) || undefined;
  if (typeof value !== 'string' || !isPublicImageUrl(value)) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.origin !== PRODUCTION_DOMAIN && !parsed.username && !parsed.password ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

export function publicSeoMediaUrl(value) {
  if (hasPrivateUrlMaterial(value)) return undefined;
  const local = localPublicMediaUrl(value);
  if (local) return local;
  if (hasProductionOrigin(value)) return sameOriginPublicMediaUrl(value) || undefined;
  if (typeof value !== 'string' || !isPublicPreviewUrl(value)) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.origin !== PRODUCTION_DOMAIN && !parsed.username && !parsed.password ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

export function buildSeoMetadata(input = {}) {
  const pathname = input.pathname || '/';
  const search = input.search || '';
  const title = normalizeMetaText(input.title, 200);
  const description = normalizeMetaText(input.description, 160);
  const canonical = canonicalUrl(input.canonicalUrl ?? input.canonical ?? pathname);
  const image = publicSeoImageUrl(input.imageUrl ?? input.ogImage);
  const keywords = uniqueStrings(input.tags);
  const routeNoindex = isNoIndexRoute(pathname, search);
  const initialRobots = String(input.initialRobots || '');
  const initialNoindex = /(?:^|[\s,])noindex(?:$|[\s,])/i.test(initialRobots);
  const initialIndex = /(?:^|[\s,])index(?:$|[\s,])/i.test(initialRobots);
  const pageNoindex = input.noindex && !initialIndex;
  const robots = !input.production || initialNoindex || pageNoindex || routeNoindex ? 'noindex,follow' : 'index,follow';
  const ogType = input.ogType || (input.pageType === 'article' ? 'article' : input.pageType === 'VideoObject' ? 'video.other' : 'website');
  const publishedAt = normalizeDate(input.publishedAt);
  const modifiedAt = normalizeDate(input.modifiedAt);
  const duration = normalizeDuration(input.duration);

  const metaTags = [
    { attribute: 'name', key: 'description', content: description },
    { attribute: 'property', key: 'og:title', content: title },
    { attribute: 'property', key: 'og:description', content: description },
    { attribute: 'property', key: 'og:url', content: canonical },
    { attribute: 'property', key: 'og:type', content: ogType },
    { attribute: 'property', key: 'og:site_name', content: 'FLESHLAB' },
    { attribute: 'property', key: 'og:image', content: image },
    { attribute: 'property', key: 'article:published_time', content: publishedAt },
    { attribute: 'property', key: 'article:modified_time', content: modifiedAt },
    { attribute: 'property', key: 'video:duration', content: duration },
    { attribute: 'name', key: 'twitter:card', content: input.twitterCard || 'summary_large_image' },
    { attribute: 'name', key: 'twitter:title', content: title },
    { attribute: 'name', key: 'twitter:description', content: description },
    { attribute: 'name', key: 'twitter:image', content: image },
    { attribute: 'name', key: 'twitter:site', content: input.twitterSite || '@fleshlabstudios' },
    { attribute: 'name', key: 'keywords', content: keywords.length ? keywords.join(', ') : undefined },
    { attribute: 'name', key: 'robots', content: robots },
    { attribute: 'name', key: 'googlebot', content: robots },
  ];

  return { title, description, canonical, image, ogType, keywords, robots, publishedAt, modifiedAt, duration, metaTags };
}

export function buildOrganizationJsonLd(input = {}) {
  const sameAs = uniqueStrings(input.sameAs, 500).filter(value => {
    try {
      const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      && !/token|signature|credential|expires|cookie|authorization|x-amz-/i.test(url.search);
    } catch {
      return false;
    }
  });
  return compactObject({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': input.id ? safePublicIdentifierUrl(input.id) : undefined,
    name: input.name,
    alternateName: input.alternateName,
    url: input.url ? safePublicPageUrl(input.url) : undefined,
    logo: publicSeoImageUrl(input.logo),
    sameAs: sameAs.length ? sameAs : undefined,
  });
}

export function buildWebSiteJsonLd(input = {}) {
  return compactObject({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': input.id ? safePublicIdentifierUrl(input.id) : undefined,
    name: input.name,
    url: input.url ? safePublicPageUrl(input.url) : undefined,
    publisher: input.organizationId ? { '@id': input.organizationId } : undefined,
  });
}

export function buildBreadcrumbListJsonLd(items = []) {
  const itemListElement = (Array.isArray(items) ? items : []).map((item, index) => {
    const url = item?.url || item?.path || item?.item;
    const name = normalizeMetaText(item?.name, 200);
    if (!url || !name) return null;
    return compactObject({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: safePublicPageUrl(url),
    });
  }).filter(item => item?.item);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

export function buildVideoObjectJsonLd(input = {}) {
  return compactObject({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': input.id ? safePublicIdentifierUrl(input.id) : undefined,
    url: input.url ? safePublicPageUrl(input.url) : undefined,
    name: normalizeMetaText(input.name ?? input.title, 300) || undefined,
    description: normalizeMetaText(input.description, 500) || undefined,
    thumbnailUrl: publicSeoImageUrl(input.thumbnailUrl),
    uploadDate: normalizeDate(input.uploadDate ?? input.publishedAt),
    dateModified: normalizeDate(input.modifiedAt),
    duration: normalizeDuration(input.duration),
    contentUrl: publicSeoMediaUrl(input.contentUrl),
    embedUrl: input.embedUrl ? safePublicPageUrl(input.embedUrl) : undefined,
  });
}

const PRIVATE_SCHEMA_KEY = /(?:private|storage.?reference|signed|authorization|cookie|credential|token|entitlement|playback.?url|source.?url)/i;

/** Remove unsafe URL/private fields without interpreting any supplied text values. */
export function sanitizeJsonLd(value, parentKey = '') {
  if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (parentKey === '@id') return safePublicIdentifierUrl(value);
    if (!/(?:url|image|logo|thumbnail|content|embed|sameas|item)$/i.test(parentKey)) return value;
    if (/sameas/i.test(parentKey)) return safeHttpsUrl(value);
    if (/thumbnail|image|logo/i.test(parentKey)) return publicSeoImageUrl(value);
    if (/content|embed/i.test(parentKey)) return publicSeoMediaUrl(value) || safePublicPageUrl(value);
    return safePublicPageUrl(value) || publicSeoImageUrl(value) || publicSeoMediaUrl(value);
  }
  if (Array.isArray(value)) return value.map(item => sanitizeJsonLd(item, parentKey)).filter(item => item !== undefined);
  if (typeof value !== 'object') return undefined;

  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (PRIVATE_SCHEMA_KEY.test(key)) continue;
    const safe = sanitizeJsonLd(item, key);
    if (safe !== undefined) result[key] = safe;
  }
  return result;
}

export function serializeJsonLd(value) {
  return JSON.stringify(sanitizeJsonLd(value));
}
