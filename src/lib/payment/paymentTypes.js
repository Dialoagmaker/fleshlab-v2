/**
 * Payment Provider Abstraction Layer — Interface & Constants
 * Frontend-safe module (no Deno/process deps)
 */

export const PAYMENT_PROVIDERS = {
  CCBILL: 'ccbill',
  SEGPAY: 'segpay',
  MOCK: 'mock',
};

export const PAYMENT_TYPES = {
  FANCLUB: 'fanclub',
  PPV: 'ppv',
  GUEST_PRODUCTION_DEPOSIT: 'guest_production_deposit',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

/**
 * Validate return/cancel URLs — only internal relative paths allowed.
 */
export function validateReturnUrl(url) {
  if (!url || typeof url !== 'string') return '/';
  if (!url.startsWith('/')) return '/';
  if (/^(javascript|data):/i.test(url)) return '/';
  return url;
}

/**
 * Server-side authoritative pricing.
 * Client MUST NOT override these values.
 */
export const SERVER_PRICING = {
  fanclub: {
    fanclub_monthly: 12.99,
    fanclub_6mo:     59.99,
    fanclub_annual:  99.99,
  },
  ppv: {
    short_solo: 6.99,
    standard:   12.99,
    premium:    19.99,
  },
  guest_production_deposit: 999,
};