/**
 * SEO Configuration — Central source of truth for canonical URLs.
 *
 * RULE: Public canonicals ALWAYS point to the production domain.
 * Staging / Base44 / localhost URLs must NEVER appear in canonical tags,
 * og:url, structured data, or sitemap entries.
 */

export const PRODUCTION_DOMAIN = 'https://fleshlab.online';

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
    // Parse: works for both full URLs and bare paths
    const parsed = new URL(urlOrPath, PRODUCTION_DOMAIN);
    // CRITICAL: strip query params and hash from canonical — never leak ?performer=, ?page=, etc.
    return `${PRODUCTION_DOMAIN}${parsed.pathname}`;
  } catch {
    const path = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
    // Strip any query string from bare paths too
    return `${PRODUCTION_DOMAIN}${path.split('?')[0].split('#')[0]}`;
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