/**
 * FLESHLAB Pricing Configuration — CRYPTO SAFE
 * Central source of truth for all pricing and access tiers.
 *
 * ─── PRICING UPDATE (2026-06-06) ─────────────────────────────────────────────
 * All prices now set safely above NOWPayments crypto minimums.
 * Minimum crypto checkout: $14.99 USD (with buffer for fluctuation).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// NOWPayments crypto minimum with safety buffer
export const CRYPTO_MINIMUM_USD = 14.99; // safe minimum for USDT TRC20 and other common coins

// ── Fanclub plan definitions ──────────────────────────────────────────────────
export const FANCLUB_PLANS = {
  fanclub_monthly: {
    id: 'fanclub_monthly',
    name: 'Fanclub Monthly',
    price: 14.99, // crypto-safe pricing
    regularPrice: 19.99,
    currency: 'USD',
    interval: 'month',
    enabled: true,
    promoEligible: false, // promo disabled to avoid crypto minimum issues
  },

  premium_monthly: {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    price: 24.99, // crypto-safe pricing
    regularPrice: 29.99,
    currency: 'USD',
    interval: 'month',
    enabled: true,
    promoEligible: false,
  },

  fanclub_3mo: {
    id: 'fanclub_3mo',
    name: 'Fanclub 3-Month Access',
    price: 39.99, // better value bundle
    currency: 'USD',
    interval: '3-months',
    enabled: false, // can be enabled later
  },

  annual_pass: {
    id: 'annual_pass',
    name: 'Annual Pass',
    enabled: false,
    promoEligible: false,
    reason: 'Disabled during initial payment provider approval phase (AsiaPay requirement)',
  },
};

// ── Legacy PRICING export (used in other parts of the app) ───────────────────
export const PRICING = {
  fanclub: {
    monthly: {
      name: 'Fanclub Monthly',
      planId: 'fanclub_monthly',
      price: FANCLUB_PLANS.fanclub_monthly.price,
      regularPrice: FANCLUB_PLANS.fanclub_monthly.regularPrice,
      currency: 'USD',
      billing: 'monthly',
    },
    premium: {
      name: 'Premium Monthly',
      planId: 'premium_monthly',
      price: FANCLUB_PLANS.premium_monthly.price,
      regularPrice: FANCLUB_PLANS.premium_monthly.regularPrice,
      currency: 'USD',
      billing: 'monthly',
    },
    // Legacy flat reference
    price: FANCLUB_PLANS.fanclub_monthly.price,
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

  ppv: {
    standard: {
      name: 'Standard Scene',
      price: 14.99, // crypto-safe minimum
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
    priceRange: '$14.99 – $24.99',
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

  if (accessTier === 'fanclub') return `Join Fanclub — $${FANCLUB_PLANS.fanclub_monthly.price}/month`;
  if (accessTier === 'ppv') return 'Unlock Full Scene — $14.99';
  return 'Watch Free Video';
};

export const getSignupRedirect = (currentPath) => `/register?next=${encodeURIComponent(currentPath)}`;
export const getLoginRedirect = (currentPath) => `/login?next=${encodeURIComponent(currentPath)}`;