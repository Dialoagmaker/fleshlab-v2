/**
 * SEO Configuration — Central source of truth for canonical URLs.
 *
 * RULE: Public canonicals ALWAYS point to the production domain.
 * Staging / Base44 / localhost URLs must NEVER appear in canonical tags,
 * og:url, structured data, or sitemap entries.
 */

export const PRODUCTION_DOMAIN = 'https://fleshlab.online';

export const NOINDEX_EXACT_PATHS = Object.freeze([
  '/admin',
  '/account',
  '/account/wallet',
  '/application-upload',
  '/client',
  '/fan-productions/request',
  '/forgot-password',
  '/login',
  '/logout',
  '/checkout',
  '/callback',
  '/oauth/consent',
  '/onboarding',
  '/performer/login',
  '/performer',
  '/performerlogin',
  '/register',
  '/reset-password',
  '/search',
  '/sign-contract',
  '/tools',
  '/wallet',
  '/v3/admin',
  '/v3/checkout',
  '/v3/library',
  '/v3/performer-application',
  '/v3/account',
  '/v3/login',
  '/v3/auth/callback',
  '/client/dashboard',
  '/api',
]);

export const NOINDEX_PATH_PREFIXES = Object.freeze([
  '/admin/',
  '/api/',
  '/auth/callback/',
  '/callback/',
  '/client/',
  '/checkout/',
  '/fanclub/',
  '/go/',
  '/payment/',
  '/performer/',
  '/tools/',
  '/v3/admin/',
  '/v3/account/',
  '/v3/auth/callback/',
  '/v3/checkout/',
  '/v3/library/',
  '/v3/performer-application/',
]);

export const TRACKING_QUERY_KEYS = Object.freeze([
  'fbclid',
  'gclid',
  'msclkid',
  'utm_campaign',
  'utm_content',
  'utm_id',
  'utm_medium',
  'utm_source',
  'utm_term',
].map(value => value.toLowerCase()));

/** Mark private, temporary, and parameter-generated views as noindex. */
export function isNoIndexRoute(pathname = '/', search = '') {
  let decodedPath;
  try { decodedPath = decodeURIComponent(String(pathname)); } catch { return true; }
  const path = `/${decodedPath.split('/').filter(Boolean).join('/')}`;
  const normalizedPath = (path === '/' ? '/' : path.replace(/\/$/, '')).toLowerCase();

  if (NOINDEX_EXACT_PATHS.includes(normalizedPath)) return true;
  if (NOINDEX_PATH_PREFIXES.some(prefix => normalizedPath.startsWith(prefix))) return true;

  const params = new URLSearchParams(String(search).replace(/^\?/, ''));
  for (const key of params.keys()) {
    if (!TRACKING_QUERY_KEYS.includes(key.toLowerCase())) return true;
  }

  return false;
}

/** Strip markup and normalize spacing/length while preserving existing wording. */
export function normalizeMetaText(value, maximumLength = 160) {
  if (value == null) return '';
  const normalized = String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const limit = Number.isFinite(Number(maximumLength)) ? Math.max(0, Math.trunc(Number(maximumLength))) : 160;
  return Array.from(normalized).slice(0, limit).join('');
}

/**
 * Converts any URL or path to a fully-qualified production canonical URL.
 * Strips the current host (staging/localhost/Base44) and always uses PRODUCTION_DOMAIN.
 *
 * @param {string} urlOrPath  Full URL (any host) or a bare path like "/videos/my-slug"
 * @returns {string} Canonical URL on fleshlab.online
 *
 * Examples:
 *   canonicalUrl('/videos/my-slug')                                  → https://fleshlab.online/videos/my-slug
 *   canonicalUrl('https://abc.base44.app/performers/jameson-official') → https://fleshlab.online/performers/jameson-official
 *   canonicalUrl(window.location.pathname)                            → https://fleshlab.online/<current-path>
 */
export function canonicalUrl(urlOrPath) {
  if (!urlOrPath) return null;
  try {
    const parsed = new URL(String(urlOrPath), PRODUCTION_DOMAIN);
    const rawPath = parsed.pathname.startsWith('/') ? parsed.pathname : `/${parsed.pathname}`;
    const pathname = rawPath === '/' ? '/' : rawPath.replace(/\/+$/, '');
    return `${PRODUCTION_DOMAIN}${pathname}`;
  } catch {
    const path = String(urlOrPath).startsWith('/') ? String(urlOrPath) : `/${urlOrPath}`;
    const pathname = path.split('?')[0].split('#')[0];
    return `${PRODUCTION_DOMAIN}${pathname || '/'}`;
  }
}

/**
 * True only when the app is running on the real production domain.
 * All other environments (Base44 staging, localhost, preview) return false.
 */
export function isProduction() {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname === 'fleshlab.online' ||
    window.location.hostname === 'www.fleshlab.online'
  );
}

/**
 * Returns the correct robots directive based on current environment.
 * Staging always returns noindex to protect from competing with V1.
 */
export function getRobotsDirective() {
  return isProduction() ? 'index,follow' : 'noindex,nofollow';
}
