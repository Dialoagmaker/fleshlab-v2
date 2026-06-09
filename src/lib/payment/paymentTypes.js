/**
 * Payment Provider Abstraction Layer — Interface & Constants
 * Frontend-safe module (no Deno/process deps)
 * 
 * DEPRECATED: Pricing now sourced from lib/pricingConfig.js (central source of truth)
 * This file kept for PAYMENT_* constants only.
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
 * DEPRECATED: Use lib/pricingConfig.js instead.
 * This export kept for backward compatibility only.
 */
export const SERVER_PRICING = {
  fanclub: {
    fanclub_monthly: 20.99,  // Synced with pricingConfig.js (crypto-safe minimum)
    fanclub_3mo:     49.99,  // ENABLED - crypto-safe pricing
    premium_monthly: 29.99,  // ENABLED - crypto-safe pricing
  },
  ppv: {
    standard:  20.99,  // Synced with pricingConfig.js (crypto-safe minimum)
    premium:   24.99,  // Synced with pricingConfig.js
    exclusive: 29.99,  // Synced with pricingConfig.js
  },
  guest_production_deposit: 999,
};