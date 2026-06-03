/**
 * FLESHLAB Pricing Configuration
 * Central source of truth for all pricing and access tiers
 */

export const PRICING = {
  // Fanclub membership
  fanclub: {
    name: 'Fanclub Membership',
    price: 12.99,
    currency: 'USD',
    billing: 'monthly',
    features: [
      'Exclusive fanclub videos',
      'Early releases',
      'Behind the scenes',
      'Performer updates',
      'Member-only posts',
      'Bonus clips'
    ]
  },

  // PPV unlocks
  ppv: {
    short_solo: {
      name: 'Short / Solo Clip',
      price: 6.99,
      currency: 'USD'
    },
    standard: {
      name: 'Standard Scene',
      price: 12.99,
      currency: 'USD'
    },
    premium: {
      name: 'Premium Exclusive Scene',
      price: 19.99,
      currency: 'USD'
    }
  },

  // Guest Production
  guestProduction: {
    startingPrice: 999,
    currency: 'USD',
    note: 'Final quote depends on production scope, compliance, filming time, performer compatibility and post-production.'
  }
};

export const ACCESS_TIERS = {
  free: {
    label: 'Free',
    description: 'Selected full free videos, free previews/trailers, public performer profiles, public video pages',
    price: 0
  },
  fanclub: {
    label: 'Fanclub',
    description: 'Exclusive fanclub videos, early releases, behind the scenes, performer updates',
    price: PRICING.fanclub.price,
    billing: 'monthly'
  },
  ppv: {
    label: 'Premium PPV',
    description: 'Pay-per-view unlocks for premium exclusive scenes',
    priceRange: '$6.99 - $19.99'
  }
};

/**
 * Get CTA text based on auth state and access tier
 */
export const getCTAText = (isAuthenticated, accessTier, isExclusive) => {
  if (!isAuthenticated) {
    if (accessTier === 'fanclub') return 'Create Account to Join Fanclub';
    if (accessTier === 'ppv') return 'Create Account to Unlock';
    return 'Sign Up to Watch';
  }

  // Logged-in user CTAs
  if (accessTier === 'fanclub') return 'Join Fanclub — $12.99/month';
  if (accessTier === 'ppv') return 'Unlock Full Scene — $12.99';
  return 'Watch Free Video';
};

/**
 * Get signup redirect URL with next parameter
 */
export const getSignupRedirect = (currentPath) => {
  return `/register?next=${encodeURIComponent(currentPath)}`;
};

/**
 * Get login redirect URL with next parameter
 */
export const getLoginRedirect = (currentPath) => {
  return `/login?next=${encodeURIComponent(currentPath)}`;
};