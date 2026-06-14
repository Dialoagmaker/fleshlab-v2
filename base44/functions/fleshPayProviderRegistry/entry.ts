/**
 * fleshPayProviderRegistry — Backend Function
 *
 * Central provider registry for FleshPay top-up providers.
 * Defines which providers exist, their capabilities, and enablement status.
 * Used by createFleshPayTopup for gating and by adminGetPaymentProviders for admin UI.
 *
 * STRIPE AND PAYPAL MUST NOT BE ENABLED WITHOUT WRITTEN APPROVAL.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Provider Registry ──────────────────────────────────────────────────────────
const PROVIDER_REGISTRY = {
  nowpayments: {
    enabled: true,
    public_enabled: true,
    supports_wallet_topup: true,
    supports_ppv_direct_checkout: true,
    provider_type: 'crypto',
    risk_status: 'active',
    public_label: 'Crypto top-up via NOWPayments',
    admin_note: null,
  },
  stripe: {
    enabled: false,
    public_enabled: false,
    supports_wallet_topup: true,
    supports_ppv_direct_checkout: false,
    provider_type: 'card',
    risk_status: 'approval_required',
    public_label: 'Card top-up',
    admin_note: 'Do not enable without written approval for this business model.',
  },
  paypal: {
    enabled: false,
    public_enabled: false,
    supports_wallet_topup: true,
    supports_ppv_direct_checkout: false,
    provider_type: 'paypal',
    risk_status: 'approval_required',
    public_label: 'PayPal top-up',
    admin_note: 'Do not enable without written approval for this business model.',
  },
  ccbill: {
    enabled: false,
    public_enabled: false,
    supports_wallet_topup: true,
    supports_ppv_direct_checkout: true,
    provider_type: 'adult_card_processor',
    risk_status: 'future',
    public_label: 'CCBill top-up',
    admin_note: null,
  },
  segpay: {
    enabled: false,
    public_enabled: false,
    supports_wallet_topup: true,
    supports_ppv_direct_checkout: true,
    provider_type: 'adult_card_processor',
    risk_status: 'future',
    public_label: 'Segpay top-up',
    admin_note: null,
  },
  asiapay: {
    enabled: false,
    public_enabled: false,
    supports_wallet_topup: true,
    supports_ppv_direct_checkout: true,
    provider_type: 'regional_card_processor',
    risk_status: 'future',
    public_label: 'AsiaPay top-up',
    admin_note: null,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Get a single provider config.
 * Returns null if provider does not exist in the registry.
 */
export function getProviderConfig(provider) {
  const config = PROVIDER_REGISTRY[provider];
  if (!config) return null;
  return { key: provider, ...config };
}

/**
 * Check if a provider is enabled for wallet top-ups.
 */
export function isProviderEnabled(provider) {
  const config = PROVIDER_REGISTRY[provider];
  if (!config) return false;
  return config.enabled === true && config.supports_wallet_topup === true;
}

/**
 * Get all providers in the registry.
 */
export function getAllProviders() {
  return Object.entries(PROVIDER_REGISTRY).map(([key, config]) => ({
    key,
    ...config,
  }));
}

/**
 * Get only publicly enabled providers (for public UI).
 * Currently only returns NOWPayments.
 */
export function getPublicProviders() {
  return Object.entries(PROVIDER_REGISTRY)
    .filter(([_, config]) => config.public_enabled === true)
    .map(([key, config]) => ({ key, ...config }));
}

/**
 * Get the default provider (always NOWPayments).
 */
export function getDefaultProvider() {
  return 'nowpayments';
}

// ── HTTP Handler ───────────────────────────────────────────────────────────────
// Exposed as a backend function so admin UI can query the registry.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const providers = getAllProviders();

    // Check which providers have secrets configured
    // Only read env vars for providers whose secrets have been declared.
    // Disabled providers with undeclared secrets would block function deployment.
    const providerSecrets = {};
    for (const p of providers) {
      const secretChecks = {};
      if (p.key === 'nowpayments') {
        secretChecks.NOWPAYMENTS_API_KEY = !!Deno.env.get('NOWPAYMENTS_API_KEY');
        secretChecks.NOWPAYMENTS_IPN_SECRET = !!Deno.env.get('NOWPAYMENTS_IPN_SECRET');
        secretChecks.NOWPAYMENTS_MODE = Deno.env.get('NOWPAYMENTS_MODE') || 'not set';
      }
      // NOTE: Do NOT add Deno.env.get() for stripe/paypal/ccbill/segpay/asiapay here
      // until their secrets are declared via set_secrets. The platform pre-scans for
      // env var reads and requires those secrets to exist before the function can run.
      // When a provider is enabled, add its secret checks here and declare its secrets.
      providerSecrets[p.key] = secretChecks;
    }

    return Response.json({
      providers,
      providerSecrets,
    });
  } catch (err) {
    console.error('[fleshPayProviderRegistry]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});