/**
 * FLESHLAB Analytics Utility
 * 
 * Centralized GA4 tracking for SPA page views and custom events.
 * Privacy-safe: excludes admin/internal routes from public traffic tracking.
 * 
 * Usage:
 *   import { trackPageView, trackEvent, getRouteCategory } from '@/lib/analytics';
 */

// Public route patterns that should be tracked as normal page views
const PUBLIC_ROUTE_PATTERNS = [
  /^\/$/,
  /^\/videos$/,
  /^\/videos\/[a-z0-9-]+$/,
  /^\/performers$/,
  /^\/performers\/[a-z0-9-]+$/,
  /^\/news$/,
  /^\/news\/[a-z0-9-]+$/,
  /^\/fanclub$/,
  /^\/guest-production$/,
  /^\/fan-productions$/,
  /^\/become-performer$/,
  /^\/how-it-works$/,
  /^\/faq$/,
  /^\/brands$/,
  /^\/brands\/[a-z0-9-]+$/,
  /^\/terms$/,
  /^\/privacy$/,
  /^\/dmca$/,
  /^\/2257$/,
  /^\/imprint$/,
  /^\/cookie-policy$/,
];

// Routes to exclude from public analytics (admin, auth, performer dashboard)
const EXCLUDED_ROUTE_PATTERNS = [
  /^\/admin/,
  /^\/performer\/dashboard/,
  /^\/performerlogin/,
  /^\/performer\/login/,
  /^\/login/,
  /^\/register/,
  /^\/forgot-password/,
  /^\/reset-password/,
  /^\/account/,
  /^\/sign-contract/,
  /^\/application-upload/,
  /^\/client\/dashboard/,
];

// Legacy redirect routes (track separately)
const LEGACY_ROUTE_PATTERNS = [
  /^\/VideoDetail/,
  /^\/ActorDetail/,
  /^\/ArticleReader/,
  /^\/Videos/,
  /^\/Actors/,
  /^\/News/,
  /^\/NewsCenter/,
  /^\/Brands/,
  /^\/BecomePerformer/,
  /^\/HowItWorks/,
  /^\/Home/,
];

/**
 * Check if a route should be tracked as public traffic
 */
function isPublicRoute(path) {
  // Check exclusions first
  if (EXCLUDED_ROUTE_PATTERNS.some(pattern => pattern.test(path))) {
    return false;
  }
  // Check if it's a public route
  return PUBLIC_ROUTE_PATTERNS.some(pattern => pattern.test(path));
}

/**
 * Check if a route is a legacy redirect
 */
function isLegacyRoute(path) {
  return LEGACY_ROUTE_PATTERNS.some(pattern => pattern.test(path));
}

/**
 * Get route category for analytics classification
 */
function getRouteCategory(path) {
  if (EXCLUDED_ROUTE_PATTERNS.some(pattern => pattern.test(path))) {
    return 'excluded';
  }
  if (LEGACY_ROUTE_PATTERNS.some(pattern => pattern.test(path))) {
    return 'legacy_redirect';
  }
  if (PUBLIC_ROUTE_PATTERNS.some(pattern => pattern.test(path))) {
    return 'public';
  }
  return 'unknown';
}

/**
 * Send page_view event to GA4
 * 
 * @param {string} path - Current route path
 * @param {string} title - Page title
 * @param {string} category - Route category (public, legacy_redirect, excluded)
 */
function sendPageView(path, title = document.title, category = 'public') {
  if (typeof window === 'undefined' || typeof window.gtag === 'undefined') {
    console.warn('[Analytics] GA4 not initialized');
    return;
  }

  // Always send page views for debugging, but classify them
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
    page_category: category,
    send_to: 'G-3Z4DV3SVR8',
  });

  // Log for debugging in development
  if (import.meta.env.DEV) {
    console.log('[Analytics] page_view:', { path, title, category });
  }
}

/**
 * Track page view with route classification
 * 
 * @param {string} path - Current route path
 */
export function trackPageView(path) {
  const category = getRouteCategory(path);
  const title = document.title;
  
  sendPageView(path, title, category);
}

/**
 * Track custom event to GA4
 * 
 * @param {string} eventName - Event name (snake_case)
 * @param {Object} params - Event parameters
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag === 'undefined') {
    console.warn('[Analytics] GA4 not initialized');
    return;
  }

  // Add page context to all events
  const enrichedParams = {
    page_path: window.location.pathname,
    page_title: document.title,
    ...params,
  };

  window.gtag('event', eventName, enrichedParams);

  // Log for debugging in development
  if (import.meta.env.DEV) {
    console.log('[Analytics] event:', eventName, enrichedParams);
  }
}

/**
 * Track video card click
 */
export function trackVideoCardClick(videoSlug, sourcePage) {
  trackEvent('video_card_click', {
    video_slug: videoSlug,
    source_page: sourcePage,
  });
}

/**
 * Track video detail view
 */
export function trackVideoDetailView(videoSlug) {
  trackEvent('video_detail_view', {
    video_slug: videoSlug,
  });
}

/**
 * Track performer profile view
 */
export function trackPerformerProfileView(performerSlug) {
  trackEvent('performer_profile_view', {
    performer_slug: performerSlug,
  });
}

/**
 * Track fanclub CTA click
 */
export function trackFanclubCtaClick(planId, performerSlug, ctaLocation) {
  trackEvent('fanclub_cta_click', {
    plan_id: planId,
    performer_slug: performerSlug || 'general',
    cta_location: ctaLocation,
    plan_or_product_type: 'fanclub',
  });
}

/**
 * Track guest production CTA click
 */
export function trackGuestProductionCtaClick(ctaLocation, isAuthenticated) {
  trackEvent('guest_production_cta_click', {
    cta_location: ctaLocation,
    is_authenticated: isAuthenticated,
    plan_or_product_type: 'guest_production',
  });
}

/**
 * Track become performer CTA click
 */
export function trackBecomePerformerCtaClick(ctaLocation) {
  trackEvent('become_performer_cta_click', {
    cta_location: ctaLocation,
    plan_or_product_type: 'performer_recruitment',
  });
}

/**
 * Track registration started (canonical: registration_start)
 */
export function trackRegistrationStarted(source, checkoutParam) {
  // Fire both events for backward compatibility + canonical naming
  trackEvent('registration_start', {
    source: source || 'direct',
    checkout_intent: checkoutParam || null,
  });
  trackEvent('registration_started', {
    source: source || 'direct',
    checkout_intent: checkoutParam || null,
  });
}

/**
 * Track checkout started (canonical: checkout_start)
 */
export function trackCheckoutStarted(paymentType, planId, videoId, priceTier) {
  // Fire both events for backward compatibility + canonical naming
  trackEvent('checkout_start', {
    payment_type: paymentType,
    plan_id: planId || null,
    video_id: videoId || null,
    price_tier: priceTier || null,
    plan_or_product_type: paymentType === 'ppv' ? 'ppv_unlock' : paymentType === 'fanclub' ? 'fanclub_membership' : 'guest_production_deposit',
  });
  trackEvent('checkout_started', {
    payment_type: paymentType,
    plan_id: planId || null,
    video_id: videoId || null,
    price_tier: priceTier || null,
    plan_or_product_type: paymentType === 'ppv' ? 'ppv_unlock' : paymentType === 'fanclub' ? 'fanclub_membership' : 'guest_production_deposit',
  });
}

/**
 * Track external platform click (e.g., xHamster link)
 */
export function trackExternalPlatformClick(platformName, sourcePage) {
  trackEvent('external_platform_click', {
    platform_name: platformName,
    source_page: sourcePage,
  });
}

/**
 * Track WhatsApp recruitment click
 */
export function trackWhatsappRecruitmentClick(sourcePage) {
  trackEvent('whatsapp_recruitment_click', {
    source_page: sourcePage,
  });
}

/**
 * Track Philippines application start
 */
export function trackPhilippinesApplicationStart(utmParams = {}) {
  trackEvent('philippines_application_start', {
    source_page: 'gay-performer-recruitment-philippines',
    source_country: 'Philippines',
    utm_source: utmParams.utm_source || 'philippines-recruitment',
    utm_market: utmParams.utm_market || 'philippines',
    utm_campaign: utmParams.utm_campaign || 'pinoy_recruitment',
  });
}

/**
 * Track payment success (server-side event, called from webhook)
 * This is for client-side tracking only - server-side uses PaymentWebhookEvent entity
 */
export function trackPaymentSuccess(paymentType, provider, amount) {
  trackEvent('payment_success', {
    payment_type: paymentType,
    provider,
    amount_usd: amount,
    plan_or_product_type: paymentType === 'ppv' ? 'ppv_unlock' : paymentType === 'fanclub' ? 'fanclub_membership' : 'guest_production_deposit',
  });
}

/**
 * Track payment failure (server-side event, called from webhook)
 */
export function trackPaymentFailed(paymentType, provider, reason) {
  trackEvent('payment_failed', {
    payment_type: paymentType,
    provider,
    failure_reason: reason,
    plan_or_product_type: paymentType === 'ppv' ? 'ppv_unlock' : paymentType === 'fanclub' ? 'fanclub_membership' : 'guest_production_deposit',
  });
}

/**
 * Track provider error (server-side event)
 */
export function trackProviderError(provider, errorType, paymentType) {
  trackEvent('provider_error', {
    provider,
    error_type: errorType,
    payment_type: paymentType || null,
  });
}

/**
 * Initialize analytics on app startup
 * Tracks initial page load
 */
export function initAnalytics() {
  if (typeof window === 'undefined') return;
  
  // Track initial page load
  const initialPath = window.location.pathname;
  trackPageView(initialPath);
}

export { getRouteCategory };