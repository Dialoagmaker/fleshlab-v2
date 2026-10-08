import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { loadConfig } from './config.js';
import { Chain2PayService } from './chain2pay.js';
import { V3Chain2PayService } from './v3-chain2pay.js';

const response = (body, ok = true, status = 200) => ({ ok, status, text: async () => JSON.stringify(body) });

test('Chain2Pay configuration keeps credentials server-side and blocks PayPal/Stripe by default', () => {
  const config = loadConfig({ NODE_ENV: 'test', PUBLIC_ORIGIN: 'https://fleshlab.online', CHAIN2PAY_ENV: 'live', CHAIN2PAY_API_KEY: 'c2p_live_test' });
  assert.equal(config.chain2payApiBase, 'https://chain2pay.is/api/v2');
  assert.equal(config.chain2payEnv, 'live');
  assert.deepEqual(config.chain2payBlockedProviders, ['paypal', 'stripe']);
  assert.equal(config.chain2payApiKey, 'c2p_live_test');
});

test('Chain2Pay provider routing uses multihosted, respects minimums and never selects blocked routes', async () => {
  const calls = [];
  const service = new Chain2PayService({ chain2payEnv: 'live', chain2payApiKey: 'c2p_live_test', chain2payApiBase: 'https://chain2pay.is/api/v2', chain2payProviderMode: 'AUTO', chain2payBlockedProviders: ['paypal', 'stripe'] }, async (url, options) => { calls.push({ url, options }); return response({ providers: [{ id: 'multihosted', name: 'MultiHosted', status: 'active', minimum_amount: 6 }, { id: 'paypal', status: 'active', minimum_amount: 1 }] }); });
  await assert.rejects(() => service.selectProvider(599, 'USD'), { code: 'CHAIN2PAY_MINIMUM_AMOUNT' });
  const selected = await service.selectProvider(600, 'USD');
  assert.equal(selected.id, 'multihosted');
  assert.equal(calls[0].url, 'https://chain2pay.is/api/v2/providers');
});

test('Chain2Pay accepts the live provider catalogue response shape', async () => {
  const service = new Chain2PayService({ chain2payEnv: 'live', chain2payApiKey: 'c2p_live_test', chain2payApiBase: 'https://chain2pay.is/api/v2', chain2payProviderMode: 'AUTO', chain2payBlockedProviders: ['paypal', 'stripe'] }, async () => response({ object: 'list', data: [{ id: 'multihosted', name: 'MultiHosted Aggregator', status: 'active', minimum_amount: 6, currency_specific: { USD: 6 } }] }));
  const selected = await service.selectProvider(600, 'USD');
  assert.equal(selected.id, 'multihosted');
  await assert.rejects(() => service.selectProvider(599, 'USD'), { code: 'CHAIN2PAY_MINIMUM_AMOUNT' });
});

test('Chain2Pay create payment sends backend price and metadata, never a browser secret', async () => {
  const calls = [];
  const service = new Chain2PayService({ chain2payEnv: 'live', chain2payApiKey: 'c2p_live_test', chain2payApiBase: 'https://chain2pay.is/api/v2', chain2payProviderMode: 'AUTO', chain2payBlockedProviders: ['paypal', 'stripe'] }, async (url, options) => { calls.push({ url, options }); return url.endsWith('/providers') ? response({ providers: [{ id: 'multihosted', status: 'active', minimum_amount: 6 }] }) : response({ id: 'c2p-order-1', status: 'pending', checkout_url: 'https://chain2pay.is/checkout/c2p-order-1', provider: 'multihosted', merchant_wallet: '0xverified' }); });
  const result = await service.createPayment({ amountMinor: 799, currency: 'USD', callbackUrl: 'https://fleshlab.online/api/v3/payments/chain2pay/webhook', customerEmail: 'customer@example.com', metadata: { internal_order_id: 'order-1', purchase_type: 'ppv', product_id: 'video-1' } });
  assert.equal(result.id, 'c2p-order-1');
  const createCall = calls.find(call => call.url.endsWith('/payments'));
  const payload = JSON.parse(createCall.options.body);
  assert.equal(payload.amount, 7.99);
  assert.equal(payload.provider, 'multihosted');
  assert.equal(payload.metadata.internal_order_id, 'order-1');
  assert.equal(createCall.options.headers.authorization, 'Bearer c2p_live_test');
});

test('Chain2Pay webhook signature uses full URL and constant-time comparison', () => {
  const secret = 'webhook-secret'; const fullUrl = 'https://fleshlab.online/api/v3/payments/chain2pay/webhook?chain2pay_order_id=c2p-1&sandbox=true';
  const signature = crypto.createHmac('sha256', secret).update(fullUrl).digest('hex');
  const service = new Chain2PayService({ chain2payEnv: 'live', chain2payApiKey: 'c2p_live_test', chain2payWebhookSecret: secret });
  assert.equal(service.verifyWebhook(fullUrl, signature), true);
  assert.equal(service.verifyWebhook(`${fullUrl}&tampered=true`, signature), false);
  assert.equal(service.verifyWebhook(fullUrl, 'not-a-signature'), false);
});

test('webhook HMAC URL uses the external forwarded host instead of the internal reverse-proxy host', () => {
  const service = new V3Chain2PayService({}, {}, { chain2payCallbackUrl: 'https://fleshlab.online/api/v3/payments/chain2pay/webhook' });
  assert.equal(service.webhookUrl({
    headers: { host: 'fleshlab-test-233ab.eastus.cloudapp.azure.com', 'x-forwarded-host': 'fleshlab-test-233ab.eastus.cloudapp.azure.com', 'x-forwarded-proto': 'http' },
    url: '/api/v3/payments/chain2pay/webhook?chain2pay_order_id=c2p-1&sandbox=true'
  }), 'https://fleshlab.online/api/v3/payments/chain2pay/webhook?chain2pay_order_id=c2p-1&sandbox=true');
});

test('a valid unknown sandbox webhook is acknowledged without fulfillment', async () => {
  const service = new V3Chain2PayService({ query: async () => ({ rowCount: 0, rows: [] }) }, { verifyWebhook: () => true }, { chain2payEnv: 'sandbox', chain2payCallbackUrl: 'https://fleshlab.online/api/v3/payments/chain2pay/webhook' });
  const result = await service.handleWebhook({ headers: { host: 'fleshlab-test-233ab.eastus.cloudapp.azure.com' }, url: '/api/v3/payments/chain2pay/webhook?chain2pay_order_id=test&sandbox=true' }, new URL('https://fleshlab.online/api/v3/payments/chain2pay/webhook?chain2pay_order_id=test&sandbox=true'));
  assert.deepEqual(result, { received: true, payment_id: null, status: 'ignored_unknown_sandbox_payment', fulfilled: false });
});

test('sandbox confirmation cannot run in live mode and missing credentials fail closed', async () => {
  const live = new Chain2PayService({ chain2payEnv: 'live', chain2payApiKey: 'c2p_live_test' });
  await assert.rejects(() => live.sandboxConfirm('payment-1'), { code: 'CHAIN2PAY_SANDBOX_ONLY' });
  const absent = new Chain2PayService({ chain2payEnv: 'live', chain2payApiKey: '' });
  await assert.rejects(() => absent.providers(), { code: 'CHAIN2PAY_NOT_CONFIGURED' });
});

test('Chain2Pay migration is additive, creates offers/entitlements and leaves execution disabled', async () => {
  const sql = await fs.readFile(new URL('../migrations/0036_chain2pay_payment_flow.sql', import.meta.url), 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS v3_commerce_plan_offers/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS v3_commerce_content_entitlements/);
  assert.match(sql, /processor_payment_id/);
  assert.match(sql, /UPDATE v3_feature_flags SET enabled=false/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});

test('public checkout code has no Chain2Pay secret and uses provider-backed order URLs', async () => {
  const source = await fs.readFile(new URL('../v3/src/public-payment.jsx', import.meta.url), 'utf8');
  assert.match(source, /api\/v3\/commerce\/checkout/);
  assert.match(source, /CHOOSE HOW/);
  assert.match(source, /Visa/);
  assert.match(source, /Apple Pay/);
  assert.doesNotMatch(source, /CHAIN2PAY_API_KEY|CHAIN2PAY_WEBHOOK_SECRET|Bearer/);
});

test('public membership offers expose only active global subscription offers', async () => {
  const calls = [];
  const service = new V3Chain2PayService({ query: async (sql) => {
    calls.push(sql);
    if (sql.includes("key='v3_commerce_execution'")) return { rows: [{ flag_enabled: true, provider_configured: true, provider_status: 'healthy' }] };
    return { rows: [{ offer_id: 'offer-1', purchase_type: 'subscription', plan_key: 'fleshlab_monthly', name: 'Fleshlab Month', description: null, amount_minor: 1299, currency: 'USD', interval: 'month' }] };
  } }, { isConfigured: () => true }, {});
  const result = await service.publicMembershipOffers();
  assert.deepEqual(result[0], { offer_id: 'offer-1', purchase_type: 'subscription', product_id: null, membership_included: true, plan_key: 'fleshlab_monthly', name: 'Fleshlab Month', description: null, amount_minor: 1299, currency: 'USD', interval: 'month', label: 'SUBSCRIBE', href: '/v3/checkout?offer=offer-1&type=subscription', availability: 'Payment options appear in FLESHLAB checkout.' });
  assert.match(calls.at(-1), /o\.purchase_type='subscription'/);
  assert.match(calls.at(-1), /o\.product_id IS NULL/);
});
