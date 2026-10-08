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

    const appBaseUrl = Deno.env.get('APP_BASE_URL') || '';
    const requestBody = {
      user_email: user.email,
      external_user_id: user.id,
      amount_usd: amount,
      return_url: `${appBaseUrl}/client/dashboard?tab=wallet&flashpay=success`,
      cancel_url: `${appBaseUrl}/client/dashboard?tab=wallet&flashpay=cancelled`,
    };

    console.log('[createFlashPayTopupSession] URL:', `${baseUrl.replace(/\/$/, '')}/createPlatformTopup`);
    console.log('[createFlashPayTopupSession] Request body:', JSON.stringify(requestBody));

    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/createPlatformTopup`, {
      method: 'POST',
      headers: {
        'x-platform-key': platformKey,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const rawText = await res.text();
    console.log('[createFlashPayTopupSession] FlashPay response status:', res.status);
    console.log('[createFlashPayTopupSession] FlashPay response body:', rawText);

    if (!res.ok) {
      console.error('[createFlashPayTopupSession] FlashPay API error:', res.status, rawText);
      return Response.json({
        configured: true,
        error: 'Could not create FlashPay top-up session.',
      }, { status: 502 });
    }

    const data = JSON.parse(rawText);

    if (!data.checkout_url) {
      return Response.json({ error: 'FlashPay did not return a checkout URL.' }, { status: 502 });
    }

    return Response.json({ checkoutUrl: data.checkout_url });
  } catch (err) {
    console.error('[createFlashPayTopupSession]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});