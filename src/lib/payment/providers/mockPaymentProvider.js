/**
 * Mock Payment Provider — DEVELOPMENT / TEST ONLY
 *
 * NEVER enable in production (guarded by NODE_ENV check in registry).
 * Does NOT grant entitlements — only simulates checkout flow structure.
 */

export class MockPaymentProvider {
  constructor() {
    console.warn('[MockProvider] ⚠️  MOCK PAYMENT PROVIDER ACTIVE — dev/test only');
  }

  getName() { return 'mock'; }
  isConfigured() { return true; }

  _session(paymentType, metadata) {
    const id = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return {
      provider: 'mock',
      checkoutUrl: `/mock-checkout/${id}`,
      providerSessionId: id,
      paymentType,
      amount: metadata.amount,
      currency: metadata.currency || 'usd',
      metadata,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  async createFanclubCheckout(p) {
    return this._session('fanclub', p);
  }

  async createPPVCheckout(p) {
    return this._session('ppv', p);
  }

  async createGuestProductionDepositCheckout(p) {
    return this._session('guest_production_deposit', p);
  }

  async verifyWebhookSignature(_payload, _headers) {
    return true; // always passes in mock
  }

  async normalizeWebhookEvent(payload) {
    return {
      provider: 'mock',
      eventType: payload.eventType || 'payment.completed',
      paymentId: payload.paymentId || `mock_${Date.now()}`,
      userId: payload.userId,
      amount: payload.amount || 0,
      currency: payload.currency || 'usd',
      paymentType: payload.paymentType || 'ppv',
      metadata: payload.metadata || {},
      timestamp: new Date(),
      rawEvent: payload,
    };
  }

  async getPaymentStatus(paymentId) {
    return { status: 'pending', amount: 0, currency: 'usd' };
  }
}