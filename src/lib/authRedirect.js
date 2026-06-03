/**
 * Auth Intent Preservation & Safe Redirect Validation
 * 
 * Preserves user intent before auth redirects and restores after successful authentication.
 * Prevents users from losing their monetization context (fanclub, PPV, guest production) after signup/login.
 */

const INTENT_STORAGE_KEY = 'fleshlab_auth_intent';
const INTENT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Allowed redirect path patterns for safe navigation
 */
const ALLOWED_REDIRECT_PATTERNS = [
  '/',
  '/videos',
  '/videos/*',
  '/performers',
  '/performers/*',
  '/fanclub',
  '/guest-production',
  '/account',
  '/become-performer',
  '/how-it-works',
  '/faq',
  '/login',
  '/register',
  '/pricing',
  '/news',
  '/brands',
];

/**
 * Validate redirect URL - only allow internal relative paths
 * @param {string} url - URL to validate
 * @returns {string} - Validated URL or fallback to '/'
 */
export function validateRedirectUrl(url) {
  if (!url || typeof url !== 'string') {
    return '/';
  }

  // Block external URLs
  if (url.match(/^https?:\/\//i)) {
    console.warn('[AuthRedirect] Blocked external HTTP/HTTPS URL:', url);
    return '/';
  }

  // Block protocol-relative URLs (//evil.com)
  if (url.match(/^\/\//)) {
    console.warn('[AuthRedirect] Blocked protocol-relative URL:', url);
    return '/';
  }

  // Block javascript: and data: URLs
  if (url.match(/^(javascript|data):/i)) {
    console.warn('[AuthRedirect] Blocked dangerous protocol:', url);
    return '/';
  }

  // Block malformed paths
  if (url.match(/[<>\"\'\\]/)) {
    console.warn('[AuthRedirect] Blocked malformed URL:', url);
    return '/';
  }

  // Must start with /
  if (!url.startsWith('/')) {
    console.warn('[AuthRedirect] Blocked non-relative URL:', url);
    return '/';
  }

  // Check against allowed patterns
  for (const pattern of ALLOWED_REDIRECT_PATTERNS) {
    if (pattern.endsWith('*')) {
      // Wildcard pattern (e.g., /videos/*)
      const prefix = pattern.slice(0, -1);
      if (url.startsWith(prefix)) {
        return url;
      }
    } else {
      // Exact match
      if (url === pattern || url.startsWith(pattern + '/') || url.startsWith(pattern + '?')) {
        return url;
      }
    }
  }

  // If no pattern matches, fallback to homepage
  console.warn('[AuthRedirect] URL not in allowlist, falling back to /:', url);
  return '/';
}

/**
 * Store auth intent before redirecting to login/register
 * @param {object} intent - Intent object with action details
 */
export function storeAuthIntent(intent) {
  if (!intent || typeof intent !== 'object') {
    console.warn('[AuthIntent] Invalid intent object');
    return;
  }

  const intentWithTimestamp = {
    ...intent,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(INTENT_STORAGE_KEY, JSON.stringify(intentWithTimestamp));
    console.log('[AuthIntent] Stored intent:', intentWithTimestamp);
  } catch (error) {
    console.error('[AuthIntent] Failed to store intent:', error);
  }
}

/**
 * Retrieve stored auth intent from localStorage
 * @returns {object|null} - Intent object or null if none exists/expired
 */
export function getStoredAuthIntent() {
  try {
    const stored = localStorage.getItem(INTENT_STORAGE_KEY);
    if (!stored) return null;
    
    const intent = JSON.parse(stored);
    
    // Check if intent is expired (15 minutes)
    if (Date.now() - intent.timestamp > INTENT_TIMEOUT_MS) {
      localStorage.removeItem(INTENT_STORAGE_KEY);
      return null;
    }
    
    return intent;
  } catch {
    return null;
  }
}

/**
 * Build redirect URL from intent
 * @param {object} intent - Intent object
 * @returns {string} - Redirect URL
 */
export function buildRedirectUrl(intent) {
  if (!intent || !intent.actionType) {
    return validateRedirectUrl(intent?.nextUrl) || '/';
  }
  
  switch (intent.actionType) {
    case 'fanclub':
      return `/fanclub${intent.planId ? `?plan=${intent.planId}` : ''}`;
    case 'ppv':
      return `/videos/${intent.videoSlug || ''}?unlock=true${intent.priceTier ? `&tier=${intent.priceTier}` : ''}`;
    case 'guest-production':
      return '/guest-production?apply=true';
    case 'free-watch':
      return validateRedirectUrl(intent.nextUrl) || '/videos';
    default:
      return validateRedirectUrl(intent.nextUrl) || '/';
  }
}

/**
 * Clear stored intent
 */
export function clearAuthIntent() {
  localStorage.removeItem(INTENT_STORAGE_KEY);
}

/**
 * Create intent object for fanclub actions
 * @param {string} planId - Plan ID (fanclub_monthly, fanclub_6mo, fanclub_annual)
 * @param {string} nextUrl - Current page URL
 * @returns {object} - Intent object
 */
export function createFanclubIntent(planId = 'fanclub_monthly', nextUrl = null) {
  return {
    actionType: 'fanclub',
    planId,
    nextUrl: nextUrl || '/fanclub',
  };
}

/**
 * Create intent object for PPV unlock actions
 * @param {string} videoId - Video ID
 * @param {string} videoSlug - Video slug
 * @param {string} priceTier - Price tier (short_solo, standard, premium)
 * @param {string} nextUrl - Current page URL
 * @returns {object} - Intent object
 */
export function createPPVIntent(videoId, videoSlug, priceTier = 'standard', nextUrl = null) {
  return {
    actionType: 'ppv',
    videoId,
    videoSlug,
    priceTier,
    nextUrl: nextUrl || `/videos/${videoSlug}`,
  };
}

/**
 * Create intent object for guest production actions
 * @param {string} nextUrl - Current page URL
 * @returns {object} - Intent object
 */
export function createGuestProductionIntent(nextUrl = null) {
  return {
    actionType: 'guest-production',
    nextUrl: nextUrl || '/guest-production',
  };
}

/**
 * Create intent object for free video watch actions
 * @param {string} videoSlug - Video slug
 * @param {string} nextUrl - Current page URL
 * @returns {object} - Intent object
 */
export function createFreeWatchIntent(videoSlug, nextUrl = null) {
  return {
    actionType: 'free-watch',
    videoSlug,
    nextUrl: nextUrl || `/videos/${videoSlug}`,
  };
}