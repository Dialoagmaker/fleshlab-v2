/**
 * Segpay Provider Adapter — STUB
 *
 * Replace stub methods with real Segpay API calls once credentials are configured.
 * Required env vars:
 *   SEGPAY_MERCHANT_ID, SEGPAY_API_KEY, SEGPAY_WEBHOOK_SECRET
 * Docs: https://segpay.com/developers
 */

export class SegpayProvider {
  constructor(env = {}) {
    // env is injected by the backend function (Deno.env.get) — never called from frontend
    this.merchantId    = env.SEGPAY_MERCHANT_ID    || '';
    this.apiKey        = env.SEGPAY_API_KEY        || '';
    this.webhookSecret = env.SEGPAY_WEBHOOK_SECRET || '';
    this.mode          = env.PAYMENT_PROVIDER_MODE === 'live' ? 'live' : 'test';
  }

  getName() { return 'segpay'; }

  isConfigured() {
    return !!(this.merchantId && this.apiKey);
  }

  // --- STUBS — replace with real API calls ---

  async createFanclubCheckout(params) {
    throw new Error('Segpay not configured. Set SEGPAY_MERCHANT_ID, SEGPAY_API_KEY.');
  }

  async createPPVCheckout(params) {
    throw new Error('Segpay not configured. Set SEGPAY_MERCHANT_ID, SEGPAY_API_KEY.');
  }

  async createGuestProductionDepositCheckout(params) {
    throw new Error('Segpay not configured. Set SEGPAY_MERCHANT_ID, SEGPAY_API_KEY.');
  }

  async verifyWebhookSignature(payload, headers) {
    return false;
  }

  async normalizeWebhookEvent(payload) {
    throw new Error('Segpay webhook normalization not implemented yet.');
  }

  async getPaymentStatus(paymentId) {
    throw new Error('Segpay status check not implemented yet.');
  }
}