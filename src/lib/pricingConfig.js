/**
 * FLESHLAB Pricing Configuration
 * Central source of truth for all pricing and access tiers.
 *
 * ─── ACTIVE PROMOTION ────────────────────────────────────────────────────────
 * Campaign:   Summer Studio Special
 * Discount:   50% off for the first 3 months
 * Eligible:   fanclub_monthly, premium_monthly ONLY
 * Excluded:   annual_pass (disabled), PPV, Guest Production, all other products
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * NOWPayments crypto minimum: $12.99 USD
 * Any product below this threshold must be blocked at checkout.
 */

export const CRYPTO_MINIMUM_USD = 9.99; // lowered to allow promo prices through

// ── Active promotion config ──────────────────────────────────────────────────
export const SUMMER_PROMO = {
  campaignName: 'Summer Studio Special',
  publicLabel: '50% OFF',
  discountPercent: 50,
  durationMonths: 3,
  active: true,
};

// ── Fanclub plan definitions ──────────────────────────────────────────────────
export const FANCLUB_PLANS = {
  fanclub_monthly: {
    id: 'fanclub_monthly',
    name: 'Fanclub Monthly',
    regularPrice: 19.99,
    promoPrice: 9.99,
    currency: 'USD',
    interval: 'month',
    enabled: true,
    promoEligible: true,
    promo: {
      ...SUMMER_PROMO,
      renewalPrice: 19.99,
    },
  },

  premium_monthly: {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    regularPrice: 29.99,
    promoPrice: 14.99,
    currency: 'USD',
    interval: 'month',
    enabled: true,
    promoEligible: true,
    promo: {
      ...SUMMER_PROMO,
      renewalPrice: 29.99,
    },
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
      price: FANCLUB_PLANS.fanclub_monthly.promoPrice,
      regularPrice: FANCLUB_PLANS.fanclub_monthly.regularPrice,
      currency: 'USD',
      billing: 'monthly',
    },
    premium: {
      name: 'Premium Monthly',
      planId: 'premium_monthly',
      price: FANCLUB_PLANS.premium_monthly.promoPrice,
      regularPrice: FANCLUB_PLANS.premium_monthly.regularPrice,
      currency: 'USD',
      billing: 'monthly',
    },
    // Legacy flat reference
    price: FANCLUB_PLANS.fanclub_monthly.promoPrice,
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

  if (accessTier === 'fanclub') return 'Join Fanclub — $9.99/month';
  if (accessTier === 'ppv') return 'Unlock Full Scene — $12.99';
  return 'Watch Free Video';
};

export const getSignupRedirect = (currentPath) => `/register?next=${encodeURIComponent(currentPath)}`;
export const getLoginRedirect = (currentPath) => `/login?next=${encodeURIComponent(currentPath)}`;