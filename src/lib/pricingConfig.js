/**
 * FLESHLAB Pricing Configuration
 * Central source of truth for all pricing and access tiers
 *
 * NOWPayments crypto minimum: 12.99 USD
 * Any product below this threshold must be blocked at checkout.
 */

export const CRYPTO_MINIMUM_USD = 12.99;

export const PRICING = {
  // Fanclub membership
  fanclub: {
    monthly: {
      name: 'Monthly Fanclub',
      planId: 'fanclub_monthly',
      price: 12.99,
      currency: 'USD',
      billing: 'monthly',
    },
    quarterly: {
      name: '3-Month Fanclub',
      planId: 'fanclub_3mo',
      price: 29.99,
      currency: 'USD',
      billing: '3 months',
    },
    biannual: {
      name: '6-Month Fanclub',
      planId: 'fanclub_6mo',
      price: 49.99,
      currency: 'USD',
      billing: '6 months',
    },
    annual: {
      name: 'Annual Fanclub',
      planId: 'fanclub_annual',
      price: 89.99,
      currency: 'USD',
      billing: 'annual',
    },
    // Legacy flat reference (monthly price)
    price: 12.99,
    currency: 'USD',
    billing: 'monthly',
    features: [
      'Exclusive fanclub videos',
      'Early releases',
      'Behind the scenes',
      'Performer updates',
      'Member-only posts',
      'Bonus clips',
    ],
  },

  // PPV unlocks
  ppv: {
    standard: {
      name: 'Standard Scene',
      price: 12.99,
      currency: 'USD',
    },
    premium: {
      name: 'Premium Scene',
      price: 19.99,
      currency: 'USD',
    },
    exclusive: {
      name: 'Exclusive / Long Scene',
      price: 24.99,
      currency: 'USD',
    },
  },

  // Guest Production
  guestProduction: {
    startingPrice: 999,
    currency: 'USD',
    note: 'Final quote depends on production scope, compliance, filming time, performer compatibility and post-production.',
  },
};

export const ACCESS_TIERS = {
  free: {
    label: 'Free',
    description: 'Selected full free videos, free previews/trailers, public performer profiles, public video pages',
    price: 0,
  },
  fanclub: {
    label: 'Fanclub',
    description: 'Exclusive fanclub videos, early releases, behind the scenes, performer updates',
    price: PRICING.fanclub.price,
    billing: 'monthly',
  },
  ppv: {
    label: 'Premium PPV',
    description: 'Pay-per-view unlocks for premium exclusive scenes',
    priceRange: '$12.99 – $19.99',
  },
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