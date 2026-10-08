import { useAuth } from '@/lib/AuthContext';
import { getSignupRedirect, getLoginRedirect } from '@/lib/pricingConfig';

/**
 * Hook for access-gated actions
 * Returns handlers that redirect to auth if not logged in
 */
export function useAccessControl() {
  const { isAuthenticated, user, navigateToLogin } = useAuth();

  /**
   * Handle gated action - redirect to signup if not authenticated
   * @param {string} nextUrl - URL to redirect to after auth
   * @returns {object} - { isAuthenticated, requireAuth, requireSignup }
   */
  const requireSignup = (nextUrl = window.location.pathname) => {
    if (!isAuthenticated) {
      // Redirect to registration with return URL
      window.location.href = getSignupRedirect(nextUrl);
      return false;
    }
    return true;
  };

  /**
   * Handle gated action - redirect to login if not authenticated
   * @param {string} nextUrl - URL to redirect to after auth
   */
  const requireLogin = (nextUrl = window.location.pathname) => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigateToLogin();
      return false;
    }
    return true;
  };

  /**
   * Get appropriate CTA text based on auth state
   * @param {string} actionType - 'fanclub' | 'ppv' | 'guest-production' | 'video'
   * @returns {object} - { primaryText, secondaryText, action }
   */
  const getCTA = (actionType, nextUrl = window.location.pathname) => {
    if (!isAuthenticated) {
      switch (actionType) {
        case 'fanclub':
          return {
            primaryText: 'Create Account to Join Fanclub',
            secondaryText: 'Sign In if you have an account',
            action: () => window.location.href = getSignupRedirect(nextUrl)
          };
        case 'ppv':
          return {
            primaryText: 'Create Account to Unlock',
            secondaryText: 'Sign In if you have an account',
            action: () => window.location.href = getSignupRedirect(nextUrl)
          };
        case 'guest-production':
          return {
            primaryText: 'Create Account to Apply',
            secondaryText: 'Sign In if you have an account',
            action: () => window.location.href = getSignupRedirect(nextUrl)
          };
        case 'video':
        default:
          return {
            primaryText: 'Sign Up to Watch',
            secondaryText: 'Create your free account',
            action: () => window.location.href = getSignupRedirect(nextUrl)
          };
      }
    }

    // Logged-in CTAs
    switch (actionType) {
      case 'fanclub':
        return {
          primaryText: 'Join Fanclub — $12.99/month',
          secondaryText: 'Exclusive member content',
          action: null // Proceed to checkout
        };
      case 'ppv':
        return {
          primaryText: 'Unlock Full Scene — $12.99',
          secondaryText: 'Permanent access',
          action: null // Proceed to checkout
        };
      case 'guest-production':
        return {
          primaryText: 'Request Guest Production Quote',
          secondaryText: 'Starting from $999',
          action: null // Proceed to application
        };
      case 'video':
      default:
        return {
          primaryText: 'Watch Free Video',
          secondaryText: 'Full access included',
          action: null // Can watch
        };
    }
  };

  return {
    isAuthenticated,
    user,
    requireSignup,
    requireLogin,
    getCTA
  };
}