/**
 * testNOWPaymentsMinimums — Diagnostic Function
 * 
 * Tests NOWPayments minimum amounts for all supported currency pairs.
 * Use this to debug crypto checkout failures.
 * 
 * Call with: base44.functions.invoke('testNOWPaymentsMinimums', {})
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CURRENCY_PAIRS = [
  { from: 'usd', to: 'usdttrc20' },
  { from: 'usd', to: 'btc' },
  { from: 'usd', to: 'ltc' },
  { from: 'usd', to: 'trx' },
  { from: 'usd', to: 'doge' },
  { from: 'usd', to: 'eth' },
  { from: 'usdttrc20', to: 'usdttrc20' },
];

const TEST_AMOUNTS = {
  fanclub_monthly: 20.99,  // NOWPayments LIVE minimum compliant
  fanclub_3mo: 49.99,
  premium_monthly: 29.99,
  ppv_standard: 20.99,  // NOWPayments LIVE minimum compliant
  ppv_premium: 24.99,
  ppv_exclusive: 29.99,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Only admins can run this diagnostic
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    const mode = Deno.env.get('NOWPAYMENTS_MODE') || 'test';
    const baseUrl = mode === 'live'
      ? 'https://api.nowpayments.io/v1'
      : 'https://api-sandbox.nowpayments.io/v1';

    const results = [];

    for (const pair of CURRENCY_PAIRS) {
      const url = `${baseUrl}/min-amount?currency_from=${pair.from}&currency_to=${pair.to}`;
      
      try {
        const res = await fetch(url, {
          headers: { 'x-api-key': apiKey },
        });

        if (!res.ok) {
          const errText = await res.text();
          results.push({
            pair: `${pair.from} → ${pair.to}`,
            success: false,
            status: res.status,
            error: errText,
          });
          continue;
        }

        const data = await res.json();
        const minimumUsd = parseFloat(data.fiat_equivalent) || parseFloat(data.min_amount) || 0;
        const withBuffer = Math.ceil(minimumUsd * 1.05 * 100) / 100;

        // Check which test amounts pass
        const passingAmounts = [];
        const failingAmounts = [];
        
        for (const [productName, amount] of Object.entries(TEST_AMOUNTS)) {
          if (amount >= withBuffer) {
            passingAmounts.push({ name: productName, amount });
          } else {
            failingAmounts.push({ name: productName, amount });
          }
        }

        results.push({
          pair: `${pair.from} → ${pair.to}`,
          success: true,
          minimumUsd,
          withBuffer: withBuffer,
          passingAmounts,
          failingAmounts,
          rawData: data,
        });

      } catch (err) {
        results.push({
          pair: `${pair.from} → ${pair.to}`,
          success: false,
          error: err.message,
        });
      }
    }

    // Test invoice creation with Fanclub Monthly amount
    const testOrderId = `diagnostic_${user.id}_${Date.now()}`;
    let invoiceTest;
    try {
      const invoiceRes = await fetch(`${baseUrl}/invoice`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_amount: 19.99,
          price_currency: 'usd',
          pay_currency: 'usdttrc20',
          order_id: testOrderId,
          order_description: 'DIAGNOSTIC TEST — FLESHLAB Fanclub Monthly',
          ipn_callback_url: 'https://api.base44.com/api/apps/68326eff4b3b5d60a8b4f285/functions/paymentWebhook',
          success_url: 'https://fleshlab.online/fanclub?test=success',
          cancel_url: 'https://fleshlab.online/fanclub?test=cancel',
          is_fixed_rate: false,
          is_fee_paid_by_user: false,
        }),
      });

      if (!invoiceRes.ok) {
        const errText = await invoiceRes.text();
        invoiceTest = {
          success: false,
          status: invoiceRes.status,
          error: errText,
        };
      } else {
        const invoiceData = await invoiceRes.json();
        invoiceTest = {
          success: true,
          invoiceId: invoiceData.id,
          invoiceUrl: invoiceData.invoice_url,
          expectedAmount: invoiceData.expected_amount,
          payCurrency: invoiceData.pay_currency,
        };
      }
    } catch (err) {
      invoiceTest = { success: false, error: err.message };
    }

    return Response.json({
      timestamp: new Date().toISOString(),
      mode,
      baseUrl,
      currencyPairs: results,
      invoiceCreationTest: invoiceTest,
      testAmounts: TEST_AMOUNTS,
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});