/**
 * NOWPayments Provider Adapter
 *
 * Integrates NOWPayments as an interim payment provider for:
 *   - PPV one-time unlocks
 *   - Guest Production deposits
 *   - Fanclub one-time access passes (6-month / annual only — NOT recurring subscriptions)
 *
 * Required env vars:
 *   NOWPAYMENTS_API_KEY         — NOWPayments API key
 *   NOWPAYMENTS_IPN_SECRET      — HMAC secret for IPN signature verification
 *   NOWPAYMENTS_PAYOUT_CURRENCY — e.g. usdttrc20, usdc, btc (default: usdttrc20)
 *   NOWPAYMENTS_MODE            — test | live (default: test)
 *
 * Security:
 *   - API key NEVER exposed to frontend
 *   - Amount resolved server-side only
 *   - IPN signature verified before any DB write
 *   - No entitlement without verified webhook
 */

const NOWPAYMENTS_API = 'https://api.nowpayments.io/v1';
const NOWPAYMENTS_SANDBOX_API = 'https://api-sandbox.nowpayments.io/v1';

export class NOWPaymentsProvider {
  /**
   * @param {object} config
   * @param {string} config.apiKey          - NOWPAYMENTS_API_KEY
   * @param {string} config.ipnSecret       - NOWPAYMENTS_IPN_SECRET
   * @param {string} [config.payoutCurrency] - e.g. usdttrc20 (default)
   * @param {string} [config.mode]           - 'test' | 'live' (default: 'test')
   */
  constructor({ apiKey, ipnSecret, payoutCurrency = 'usdttrc20', mode = 'test' } = {}) {
    this.apiKey = apiKey || null;
    this.ipnSecret = ipnSecret || null;
    this.payoutCurrency = payoutCurrency;
    this.mode = mode;
    this.baseUrl = mode === 'live' ? NOWPAYMENTS_API : NOWPAYMENTS_SANDBOX_API;
  }

  get name() { return 'nowpayments'; }

  get isConfigured() {
    return !!(this.apiKey && this.ipnSecret);
  }

  // ── Shared invoice creation ─────────────────────────────────────────────────
  async _createInvoice({ orderId, priceAmount, priceCurrency = 'usd', description, successUrl, cancelUrl }) {
    const body = {
      price_amount: priceAmount,
      price_currency: priceCurrency,
      pay_currency: this.payoutCurrency,
      order_id: orderId,
      order_description: description,
      success_url: successUrl,
      cancel_url: cancelUrl,
      is_fixed_rate: false,
      is_fee_paid_by_user: false,
    };

    const res = await fetch(`${this.baseUrl}/invoice`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`NOWPayments invoice creation failed: ${res.status} ${errText}`);
    }

    return await res.json();
  }

  // ── PPV one-time unlock ─────────────────────────────────────────────────────
  async createPPVCheckout({ userId, videoId, priceTier, amount, currency = 'usd', returnUrl, cancelUrl }) {
    const orderId = `ppv_${userId}_${videoId}_${Date.now()}`;
    const invoice = await this._createInvoice({
      orderId,
      priceAmount: amount,
      priceCurrency: currency,
      description: `FLESHLAB PPV Unlock — ${priceTier}`,
      successUrl: returnUrl,
      cancelUrl,
    });

    return {
      providerSessionId: invoice.id,
      checkoutUrl: invoice.invoice_url,
      orderId,
      providerPaymentId: invoice.id,
    };
  }

  // ── Guest Production deposit ────────────────────────────────────────────────
  async createGuestProductionDepositCheckout({ userId, applicationId, amount, currency = 'usd', returnUrl, cancelUrl }) {
    const orderId = `guestdep_${userId}_${applicationId}_${Date.now()}`;
    const invoice = await this._createInvoice({
      orderId,
      priceAmount: amount,
      priceCurrency: currency,
      description: `FLESHLAB Guest Production Deposit`,
      successUrl: returnUrl,
      cancelUrl,
    });

    return {
      providerSessionId: invoice.id,
      checkoutUrl: invoice.invoice_url,
      orderId,
      providerPaymentId: invoice.id,
    };
  }

  // ── Fanclub one-time access pass (6mo / annual only — NOT recurring) ────────
  // This creates a one-time payment. Subscription/access is granted only after
  // IPN webhook confirms payment.completed.
  async createFanclubCheckout({ userId, planId, amount, currency = 'usd', returnUrl, cancelUrl }) {
    // Only allow non-monthly plans as one-time passes
    const ONE_TIME_PLANS = ['fanclub_6mo', 'fanclub_annual'];
    if (!ONE_TIME_PLANS.includes(planId)) {
      throw new Error(`Fanclub plan "${planId}" is not supported as a one-time NOWPayments pass. Monthly plans require recurring subscription support.`);
    }

    const orderId = `fanclub_${userId}_${planId}_${Date.now()}`;
    const invoice = await this._createInvoice({
      orderId,
      priceAmount: amount,
      priceCurrency: currency,
      description: `FLESHLAB Fanclub Access Pass — ${planId}`,
      successUrl: returnUrl,
      cancelUrl,
    });

    return {
      providerSessionId: invoice.id,
      checkoutUrl: invoice.invoice_url,
      orderId,
      providerPaymentId: invoice.id,
    };
  }

  // ── IPN signature verification ──────────────────────────────────────────────
  // NOWPayments signs IPN payloads with HMAC-SHA512 using NOWPAYMENTS_IPN_SECRET.
  // Header: x-nowpayments-sig
  async verifyWebhookSignature({ rawBody, headers }) {
    const signature = headers['x-nowpayments-sig'];
    if (!signature || !this.ipnSecret) return false;

    try {
      // Sort JSON keys and HMAC-SHA512
      const parsedBody = JSON.parse(rawBody);
      const sortedJson = JSON.stringify(parsedBody, Object.keys(parsedBody).sort());

      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.ipnSecret);
      const msgData = encoder.encode(sortedJson);

      const cryptoKey = await crypto.subtle.importKey(
        'raw', keyData,
        { name: 'HMAC', hash: 'SHA-512' },
        false, ['sign']
      );

      const hashBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return hashHex.toLowerCase() === signature.toLowerCase();
    } catch (err) {
      console.error('[NOWPayments] Signature verification error:', err);
      return false;
    }
  }

  // ── Normalize IPN event to common shape ─────────────────────────────────────
  // NOWPayments IPN statuses:
  //   waiting | confirming | confirmed | sending | partially_paid
  //   finished | failed | refunded | expired
  normalizeWebhookEvent({ payload }) {
    const {
      payment_id,
      order_id,
      payment_status,
      price_amount,
      price_currency,
      actually_paid,
      pay_currency,
    } = payload;

    let eventType;
    switch (payment_status) {
      case 'finished':
      case 'confirmed':
        eventType = 'payment.completed';
        break;
      case 'failed':
        eventType = 'payment.failed';
        break;
      case 'expired':
        eventType = 'payment.cancelled';
        break;
      case 'refunded':
        eventType = 'payment.refunded';
        break;
      case 'waiting':
      case 'confirming':
      case 'sending':
      case 'partially_paid':
      default:
        eventType = 'payment.pending';
        break;
    }

    return {
      eventType,
      paymentId: String(payment_id),      // NOWPayments internal payment ID
      orderId: order_id,                   // Our internal order ID
      amount: price_amount,
      currency: price_currency,
      actuallyPaid: actually_paid,
      payCurrency: pay_currency,
      rawStatus: payment_status,
    };
  }

  // ── Get payment status ──────────────────────────────────────────────────────
  async getPaymentStatus(paymentId) {
    const res = await fetch(`${this.baseUrl}/payment/${paymentId}`, {
      headers: { 'x-api-key': this.apiKey },
    });
    if (!res.ok) throw new Error(`NOWPayments status check failed: ${res.status}`);
    return await res.json();
  }
}