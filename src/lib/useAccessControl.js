import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { storeAuthIntent, createFanclubIntent, createPPVIntent, createGuestProductionIntent, createFreeWatchIntent } from '@/lib/authRedirect';
import { PRICING as CENTRAL_PRICING } from '@/lib/pricingConfig';

/**
 * Pricing configuration for FLESHLAB Studios
 * All prices in USD - sourced from central pricingConfig.js
 */
export const PRICING = CENTRAL_PRICING;

/**
 * Access control hook for gating monetized actions behind registration/login
 */
export function useAccessControl() {
  const { isAuthenticated, navigateToLogin } = useAuth();

  /**
   * Redirect to signup/login with return URL
   * @param {string} nextUrl - URL to redirect to after auth
   */
  const requireSignup = (nextUrl, actionType = null, metadata = {}) => {
    if (!isAuthenticated) {
      // Store intent before redirect
      if (actionType) {
        let intent;
        switch (actionType) {
          case 'fanclub':
            intent = createFanclubIntent(metadata.planId, nextUrl);
            break;
          case 'ppv':
            intent = createPPVIntent(metadata.videoId, metadata.videoSlug, metadata.priceTier, nextUrl);
            break;
          case 'guest-production':
            intent = createGuestProductionIntent(nextUrl);
            break;
          case 'free-watch':
            intent = createFreeWatchIntent(metadata.videoSlug, nextUrl);
            break;
          default:
            intent = { actionType: 'general', nextUrl };
        }
        storeAuthIntent(intent);
      }
      
      // Use Base44 auth redirect with return URL
      const redirectUrl = nextUrl || window.location.pathname;
      base44.auth.redirectToLogin(redirectUrl);
      return true; // indicates redirect happened
    }
    return false; // no redirect, user is authenticated
  };

  /**
   * Get appropriate CTA text and behavior based on auth state
   * @param {string} actionType - 'fanclub' | 'ppv' | 'guest-production' | 'full-video'
   * @param {object} metadata - Optional metadata (price, video, etc.)
   * @returns {object} CTA configuration
   */
  const getCTA = (actionType, metadata = {}) => {
    if (!isAuthenticated) {
      // Logged-out CTAs - all route to signup
      switch (actionType) {
        case 'fanclub':
          return {
            text: 'Create Account to Join Fanclub',
            action: () => requireSignup('/fanclub', 'fanclub', { planId: metadata.planId || 'fanclub_monthly' }),
            variant: 'default',
            requiresAuth: true
          };
        case 'ppv':
          return {
            text: 'Create Account to Unlock',
            action: () => requireSignup(window.location.pathname, 'ppv', {
              videoId: metadata.videoId,
              videoSlug: metadata.videoSlug,
              priceTier: metadata.priceTier || 'standard'
            }),
            variant: 'default',
            requiresAuth: true
          };
        case 'guest-production':
          return {
            text: 'Create Account to Apply',
            action: () => requireSignup('/guest-production', 'guest-production'),
            variant: 'default',
            requiresAuth: true
          };
        case 'full-video':
          return {
            text: 'Sign Up to Watch',
            action: () => requireSignup(window.location.pathname, 'free-watch', {
              videoSlug: metadata.videoSlug
            }),
            variant: 'default',
            requiresAuth: true
          };
        default:
          return {
            text: 'Create Free Account',
            action: () => requireSignup('/'),
            variant: 'default',
            requiresAuth: true
          };
      }
    } else {
      // Logged-in CTAs - proceed to checkout/action
      switch (actionType) {
        case 'fanclub':
          return {
            text: `Join Fanclub — $${PRICING.fanclub.monthly}/month`,
            action: () => {
              // Proceed to fanclub checkout
              window.location.href = '/fanclub';
            },
            variant: 'default',
            requiresAuth: false
          };
        case 'ppv':
          const price = metadata.price || PRICING.ppv.standard.price;
          return {
            text: `Unlock Full Scene — $${price}`,
            action: () => {
              // Proceed to PPV checkout
              // This would integrate with payment flow
              console.log('Proceed to PPV checkout:', metadata);
            },
            variant: 'default',
            requiresAuth: false
          };
        case 'guest-production':
          return {
            text: 'Request Guest Production Quote',
            action: () => {
              window.location.href = '/guest-production';
            },
            variant: 'outline',
            requiresAuth: false
          };
        case 'full-video':
          return {
            text: 'Watch Free Video',
            action: () => {
              // Proceed to playback
              console.log('Start free video playback');
            },
            variant: 'default',
            requiresAuth: false
          };
        default:
          return {
            text: 'Continue',
            action: () => {},
            variant: 'default',
            requiresAuth: false
          };
      }
    }
  };

  /**
   * Check if user can access content based on tier
   * @param {string} accessTier - 'free' | 'fanclub' | 'ppv'
   * @param {object} entitlements - User's entitlements
   * @returns {boolean}
   */
  const canAccess = (accessTier, entitlements = {}) => {
    if (!isAuthenticated) {
      return accessTier === 'free';
    }

    switch (accessTier) {
      case 'free':
        return true;
      case 'fanclub':
        return entitlements.isFanclubMember || false;
      case 'ppv':
        return entitlements.hasPurchased || false;
      default:
        return false;
    }
  };

  return {
    isAuthenticated,
    requireSignup,
    getCTA,
    canAccess,
    PRICING
  };
}