/**
 * FLESHLAB Analytics Utility
 * 
 * Centralized GA4 tracking for SPA page views and custom events.
 * Privacy-safe: excludes admin/internal routes from public traffic tracking.
 * 
 * Usage:
 *   import { trackPageView, trackEvent, getRouteCategory } from '@/lib/analytics';
 */

import { base44 } from '@/api/base44Client';

// ── Internal DB event logging (parallel to GA4) ─────────────────────────────
// Current authenticated user id, kept in sync by AuthContext so DB-logged
// events can be tied to a user_id when available (null for anonymous events).
let _currentUserId = null;

export function setAnalyticsUserId(userId) {
  _currentUserId = userId || null;
}

export function clearAnalyticsUserId() {
  _currentUserId = null;
}

// Events also persisted to the ConversionEvent table via the logEvent function.
// Keep in sync with base44/functions/logEvent/entry.ts ALLOWED_EVENTS.
const DB_TRACKED_EVENTS = new Set([
  'registration_start',
  'registration_completed',
  'otp_verified',
  'login_success',
  'login_failed',
  'logout',
  'onboarding_viewed',
  'onboarding_completed',
  'performer_profile_view',
  'video_detail_view',
  'fanclub_cta_click',
  'checkout_start',
  'payment_success',
  'payment_failed',
  'subscription_activated',
]);

function logDbEvent(eventName, params) {
  try {
    base44.functions.invoke('logEvent', {
      event_name: eventName,
      user_id: _currentUserId,
      source_page: window.location.pathname,
      metadata: params,
    }).catch(() => {}); // best-effort, never block the UI
  } catch (_) {}
}

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
  const enrichedParams = {
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    page_title: typeof document !== 'undefined' ? document.title : '',
    ...params,
  };

  if (typeof window === 'undefined' || typeof window.gtag === 'undefined') {
    console.warn('[Analytics] GA4 not initialized');
  } else {
    window.gtag('event', eventName, enrichedParams);
  }

  // Log for debugging in development
  if (import.meta.env.DEV) {
    console.log('[Analytics] event:', eventName, enrichedParams);
  }

  // Persist a subset of events to our own DB (in parallel to GA4)
  if (DB_TRACKED_EVENTS.has(eventName)) {
    logDbEvent(eventName, params);
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
 * Track performer apply CTA click
 */
export function trackPerformerApplyClick(ctaLocation, sourcePage) {
  trackEvent('performer_apply_click', {
    cta_location: ctaLocation,
    source_page: sourcePage,
    landing_page_type: 'recruitment',
  });
}

/**
 * Track fan production request click
 */
export function trackFanProductionRequestClick(ctaLocation, sourcePage) {
  trackEvent('fan_production_request_click', {
    cta_location: ctaLocation,
    source_page: sourcePage,
    landing_page_type: 'fan_production',
  });
}

/**
 * Track fanclub join click
 */
export function trackFanclubJoinClick(planId, performerSlug, ctaLocation, sourcePage) {
  trackEvent('fanclub_join_click', {
    plan_id: planId,
    performer_slug: performerSlug || 'general',
    cta_location: ctaLocation,
    source_page: sourcePage,
  });
}

/**
 * Track video unlock click
 */
export function trackVideoUnlockClick(videoId, priceTier, ctaLocation, sourcePage) {
  trackEvent('video_unlock_click', {
    video_id: videoId,
    price_tier: priceTier,
    cta_location: ctaLocation,
    source_page: sourcePage,
  });
}

/**
 * Track application start
 */
export function trackApplicationStart(applicationType, sourcePage) {
  trackEvent('application_start', {
    application_type: applicationType,
    source_page: sourcePage,
  });
}

/**
 * Track application step complete
 */
export function trackApplicationStepComplete(stepNumber, applicationType) {
  trackEvent('application_step_complete', {
    step_number: stepNumber,
    application_type: applicationType,
  });
}

/**
 * Track application submit (Phase 2)
 * Privacy-safe: no PII, no file names, no r2_keys
 */
export function trackApplicationSubmit(params) {
  trackEvent('application_submit', {
    application_type: params.application_type,
    source_page: params.source_page,
    source_country: params.source_country || null,
    landing_page_type: params.landing_page_type,
    photos_count: params.photos_count,
    videos_count: params.videos_count,
    id_uploaded: params.id_uploaded,
    selfie_uploaded: params.selfie_uploaded,
    missing_count: params.missing_count,
    upload_status: params.upload_status,
  });
}

/**
 * Track upload link opened (Phase 2)
 * Privacy-safe: no application_id, no token values
 */
export function trackApplicationUploadOpened(params) {
  trackEvent('application_upload_link_opened', {
    upload_status: params.upload_status,
    photos_count: params.photos_count || 0,
    videos_count: params.videos_count || 0,
    id_uploaded: params.id_uploaded || false,
    selfie_uploaded: params.selfie_uploaded || false,
    missing_count: params.missing_count,
    token_valid: params.token_valid,
    token_expired: params.token_expired,
  });
}

/**
 * Track upload complete (Phase 2)
 * Privacy-safe: no file names, no r2_keys, no signed URLs
 */
export function trackUploadComplete(params) {
  trackEvent('application_upload_complete', {
    upload_type: params.upload_type,
    upload_category: params.upload_category,
    photos_count: params.photos_count,
    videos_count: params.videos_count,
    id_uploaded: params.id_uploaded,
    selfie_uploaded: params.selfie_uploaded,
    missing_count: params.missing_count,
    ready_for_review: params.ready_for_review,
  });
}

/**
 * Track application ready for review (Phase 2)
 * Privacy-safe: no application_id to avoid PII linkage
 * Should only fire once when status changes from incomplete to ready
 */
export function trackApplicationReadyForReview(params) {
  trackEvent('application_ready_for_review', {
    photos_count: params.photos_count,
    videos_count: params.videos_count,
    id_uploaded: params.id_uploaded,
    selfie_uploaded: params.selfie_uploaded,
    required_complete: params.required_complete,
    upload_status: params.upload_status,
  });
}

/**
 * Track fan production request start (Phase 2)
 * Privacy-safe: no personal fantasies, messages, or sensitive request details
 */
export function trackFanProductionRequestStart(params) {
  trackEvent('fan_production_request_start', {
    source_page: params.source_page,
    package_type: params.package_type || null,
  });
}

/**
 * Track fan production request submit (Phase 2)
 * Privacy-safe: no personal data, no performer names, no fantasies
 */
export function trackFanProductionRequestSubmit(params) {
  trackEvent('fan_production_request_submit', {
    package_type: params.package_type,
    package_price: params.package_price || null,
    source_page: params.source_page,
    cta_location: params.cta_location || 'form_submit',
  });
}

/**
 * Track fan production WhatsApp click
 */
export function trackFanProductionWhatsappClick(sourcePage) {
  trackEvent('fan_production_whatsapp_click', {
    source_page: sourcePage,
  });
}

/**
 * Track package select (Phase 2)
 * Privacy-safe: only package metadata, no user data
 */
export function trackPackageSelect(params) {
  trackEvent('package_select', {
    package_type: params.package_type,
    package_price: params.package_price || null,
    source_page: params.source_page,
    cta_location: params.cta_location || 'package_card',
  });
}

/**
 * Track checkout cancel (Phase 2)
 * Privacy-safe: no user data, only checkout metadata
 */
export function trackCheckoutCancel(params) {
  trackEvent('checkout_cancel', {
    payment_type: params.payment_type,
    plan_id: params.plan_id || null,
    source_page: params.source_page,
    price_tier: params.price_tier || null,
  });
}

/**
 * Track plan select
 */
export function trackPlanSelect(planId, price, billingPeriod, sourcePage) {
  trackEvent('plan_select', {
    plan_id: planId,
    price: price,
    billing_period: billingPeriod,
    source_page: sourcePage,
  });
}

/**
 * Track checkout success
 */
export function trackCheckoutSuccess(paymentType, provider, amount, planId) {
  trackEvent('checkout_success', {
    payment_type: paymentType,
    provider: provider,
    amount_usd: amount,
    plan_id: planId,
  });
}



/**
 * Track performer dashboard view
 */
export function trackPerformerDashboardView() {
  trackEvent('performer_dashboard_view', {});
}

/**
 * Track payout summary view
 */
export function trackPayoutSummaryView() {
  trackEvent('payout_summary_view', {});
}

/**
 * Track application review open
 */
export function trackApplicationReviewOpen(applicationId) {
  trackEvent('application_review_open', {
    application_id: applicationId,
  });
}

/**
 * Track application file preview open
 */
export function trackApplicationFilePreviewOpen(fileType, applicationId) {
  trackEvent('application_file_preview_open', {
    file_type: fileType,
    application_id: applicationId,
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

// ========================================================
// CONVERSION FUNNEL TRACKING (Phase 3)
// ========================================================

/**
 * Track registration completed (after OTP verification)
 */
export function trackRegistrationCompleted(source) {
  trackEvent("registration_completed", {
    source: source || "direct",
  });
}

/**
 * Track OTP verified
 */
export function trackOtpVerified(source) {
  trackEvent("otp_verified", {
    source: source || "direct",
  });
}

/**
 * Track onboarding viewed
 */
export function trackOnboardingViewed() {
  trackEvent("onboarding_viewed", {});
}

/**
 * Track onboarding CTA clicks
 */
export function trackOnboardingCtaClick(action) {
  trackEvent("onboarding_cta_click", {
    action: action,
  });
}

/**
 * Track dashboard viewed
 */
export function trackDashboardViewed(source) {
  trackEvent("dashboard_viewed", {
    source: source || "direct",
  });
}

/**
 * Track dashboard CTA clicks
 */
export function trackDashboardCtaClick(action, destination) {
  trackEvent("dashboard_cta_click", {
    action: action,
    destination: destination,
  });
}

/**
 * Track payment page reached
 */
export function trackPaymentPageReached(provider, paymentType) {
  trackEvent("payment_page_reached", {
    provider: provider,
    payment_type: paymentType,
  });
}

/**
 * Track subscription activated
 */
export function trackSubscriptionActivated(planId, provider) {
  trackEvent("subscription_activated", {
    plan_id: planId,
    provider: provider,
  });
}

/**
 * Track successful login
 */
export function trackLoginSuccess(role) {
  trackEvent("login_success", { role: role || null });
}

/**
 * Track failed login attempt
 */
export function trackLoginFailed(reason, email) {
  trackEvent("login_failed", { reason: reason || "invalid_credentials", email: email || null });
}

/**
 * Track logout
 */
export function trackLogout() {
  trackEvent("logout", {});
}

// Phase 2 GA4 Conversion Tracking - Privacy-safe event wrappers