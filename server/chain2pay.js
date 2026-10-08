import crypto from 'node:crypto';
import { HttpError } from './errors.js';

const PROVIDER_CACHE_MS = 3 * 60 * 1000;
const safeBody = async response => {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { raw: text.slice(0, 500) }; }
};
const amountFromMinor = amount => Number((Number(amount) / 100).toFixed(2));

export class Chain2PayService {
  constructor(config, fetchImpl = globalThis.fetch) {
    this.config = config;
    this.fetchImpl = fetchImpl;
    this.providerCache = null;
    this.providerCacheAt = 0;
  }

  key() {
    return this.config.chain2payEnv === 'live' ? this.config.chain2payApiKey : (this.config.chain2paySandboxApiKey || this.config.chain2payApiKey);
  }

  isConfigured() {
    const key = this.key();
    return Boolean(key && /^c2p_(live|sandbox)_/i.test(key) && ((this.config.chain2payEnv === 'live' && /^c2p_live_/i.test(key)) || (this.config.chain2payEnv !== 'live' && /^c2p_sandbox_/i.test(key))));
  }

  assertConfigured() {
    if (!this.isConfigured()) throw new HttpError(503, 'CHAIN2PAY_NOT_CONFIGURED', `Chain2Pay ${this.config.chain2payEnv} credentials are not configured in the protected API runtime.`);
  }

  async request(path, options = {}) {
    this.assertConfigured();
    const response = await this.fetchImpl(`${this.config.chain2payApiBase}${path}`, {
      ...options,
      headers: { accept: 'application/json', authorization: `Bearer ${this.key()}`, 'x-api-key': this.key(), ...(options.headers || {}) }
    });
    const data = await safeBody(response);
    if (!response.ok) throw new HttpError(response.status >= 400 && response.status < 500 ? 422 : 502, 'CHAIN2PAY_API_ERROR', data?.error?.message || data?.message || 'Chain2Pay did not accept the request.');
    return data;
  }

  async providers({ force = false } = {}) {
    if (!force && this.providerCache && Date.now() - this.providerCacheAt < PROVIDER_CACHE_MS) return this.providerCache;
    const data = await this.request('/providers');
    this.providerCache = data;
    this.providerCacheAt = Date.now();
    return data;
  }

  providerRows(data) {
    return Array.isArray(data) ? data
      : Array.isArray(data?.providers) ? data.providers
      : Array.isArray(data?.data) ? data.data
      : [];
  }

  async selectProvider(amountMinor, currency = 'USD') {
    const requested = this.config.chain2payProviderMode === 'ALLOWLIST' ? this.config.chain2payAllowedProviders : ['multihosted'];
    const blocked = new Set(this.config.chain2payBlockedProviders || ['paypal', 'stripe']);
    const rows = this.providerRows(await this.providers());
    const active = rows.filter(item => String(item.status || '').toLowerCase() === 'active' && !blocked.has(String(item.id || item.name || '').toLowerCase()));
    const selected = active.find(item => requested.includes(String(item.id || item.name || '').toLowerCase()));
    if (!selected) throw new HttpError(503, 'CHAIN2PAY_PROVIDER_UNAVAILABLE', 'No configured Chain2Pay provider is active for checkout.');
    const minimums = selected.minimums || selected.currency_minimums || selected.minimum_amounts || selected.currency_specific || {};
    const minimum = Number(minimums[currency] ?? selected.minimum_amount ?? selected.minimum_amount_usd ?? 0);
    if (Number.isFinite(minimum) && amountFromMinor(amountMinor) < minimum) throw new HttpError(422, 'CHAIN2PAY_MINIMUM_AMOUNT', `The selected payment is below the provider minimum of ${minimum.toFixed(2)} ${currency}.`);
    return { id: String(selected.id || selected.name), display_name: selected.name || selected.id, minimum_amount: minimum, providers: rows.map(item => ({ id: item.id || item.name, name: item.name || item.id, status: item.status, minimum_amount: item.minimum_amount ?? null })) };
  }

  async createPayment({ amountMinor, currency = 'USD', callbackUrl, customerEmail, metadata }) {
    const provider = await this.selectProvider(amountMinor, currency);
    const result = await this.request('/payments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amount: amountFromMinor(amountMinor), currency, callback_url: callbackUrl, customer_email: customerEmail, provider: provider.id, metadata })
    });
    return { ...result, selected_provider: provider };
  }

  async getPayment(id) {
    return this.request(`/payments/${encodeURIComponent(String(id))}`);
  }

  async sandboxConfirm(id) {
    if (this.config.chain2payEnv !== 'sandbox') throw new HttpError(409, 'CHAIN2PAY_SANDBOX_ONLY', 'Sandbox confirmation is only available while Chain2Pay is configured for sandbox.');
    return this.request(`/payments/${encodeURIComponent(String(id))}/sandbox-confirm`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  }

  verifyWebhook(fullUrl, signature) {
    const secret = String(this.config.chain2payWebhookSecret || '');
    const supplied = String(signature || '').trim().toLowerCase();
    if (!secret || !supplied || !/^[a-f0-9]{64}$/.test(supplied)) return false;
    const expected = crypto.createHmac('sha256', secret).update(fullUrl).digest('hex');
    const left = Buffer.from(expected, 'hex'); const right = Buffer.from(supplied, 'hex');
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  }

  static amountFromMinor = amountFromMinor;
}
