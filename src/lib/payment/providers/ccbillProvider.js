/**
 * CCBill Provider Adapter — STUB
 *
 * Replace stub methods with real CCBill API calls once credentials are configured.
 * Required env vars:
 *   CCBILL_ACCOUNT_NUMBER, CCBILL_SUB_ACCOUNT, CCBILL_SALT, CCBILL_WEBHOOK_SECRET
 * Docs: https://ccbill.com/developers
 */

export class CCBillProvider {
  constructor(env = {}) {
    // env is injected by the backend function (Deno.env.get) — never called from frontend
    this.accountNumber  = env.CCBILL_ACCOUNT_NUMBER  || '';
    this.subAccount     = env.CCBILL_SUB_ACCOUNT     || '';
    this.salt           = env.CCBILL_SALT            || '';
    this.webhookSecret  = env.CCBILL_WEBHOOK_SECRET  || '';
    this.mode           = env.PAYMENT_PROVIDER_MODE === 'live' ? 'live' : 'test';
  }

  getName() { return 'ccbill'; }

  isConfigured() {
    return !!(this.accountNumber && this.subAccount && this.salt);
  }

  // --- STUBS — replace with real API calls ---

  async createFanclubCheckout(params) {
    throw new Error('CCBill not configured. Set CCBILL_ACCOUNT_NUMBER, CCBILL_SUB_ACCOUNT, CCBILL_SALT.');
  }

  async createPPVCheckout(params) {
    throw new Error('CCBill not configured. Set CCBILL_ACCOUNT_NUMBER, CCBILL_SUB_ACCOUNT, CCBILL_SALT.');
  }

  async createGuestProductionDepositCheckout(params) {
    throw new Error('CCBill not configured. Set CCBILL_ACCOUNT_NUMBER, CCBILL_SUB_ACCOUNT, CCBILL_SALT.');
  }

  async verifyWebhookSignature(payload, headers) {
    // TODO: implement HMAC-SHA256 verification with this.webhookSecret
    return false;
  }

  async normalizeWebhookEvent(payload) {
    throw new Error('CCBill webhook normalization not implemented yet.');
  }

  async getPaymentStatus(paymentId) {
    throw new Error('CCBill status check not implemented yet.');
  }
}