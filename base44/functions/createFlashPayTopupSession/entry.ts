/**
 * createFlashPayTopupSession — Backend Function
 *
 * Phase 1: creates a top-up session on the external FlashPay Asia Platform
 * API and returns its hosted checkout_url. FlashPay itself handles
 * Stripe/PayPal/crypto for the actual charge.
 * Does NOT grant entitlements or touch NOWPayments/internal FleshPay wallet.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_AMOUNTS = [10, 25, 50, 100];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const amount = Number(body.amount_usd);

    if (!ALLOWED_AMOUNTS.includes(amount)) {
      return Response.json({ error: 'Invalid top-up amount.' }, { status: 400 });
    }

    const baseUrl = Deno.env.get('FLASHPAY_API_BASE_URL');
    const platformKey = Deno.env.get('FLASHPAY_PLATFORM_KEY');
    const apiKey = Deno.env.get('FLASHPAY_PLATFORM_API_KEY');

    if (!baseUrl || !platformKey || !apiKey) {
      return Response.json({
        configured: false,
        message: 'FlashPay is not fully configured yet.',
      }, { status: 503 });
    }

    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/createPlatformTopup`, {
      method: 'POST',
      headers: {
        'x-platform-key': platformKey,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: user.email, amount_usd: amount }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[createFlashPayTopupSession] FlashPay API error:', res.status, errText);
      return Response.json({
        configured: true,
        error: 'Could not create FlashPay top-up session.',
      }, { status: 502 });
    }

    const data = await res.json();

    if (!data.checkout_url) {
      return Response.json({ error: 'FlashPay did not return a checkout URL.' }, { status: 502 });
    }

    return Response.json({ checkoutUrl: data.checkout_url });
  } catch (err) {
    console.error('[createFlashPayTopupSession]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});