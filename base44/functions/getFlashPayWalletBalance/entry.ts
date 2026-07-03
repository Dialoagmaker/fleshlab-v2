/**
 * getFlashPayWalletBalance — Backend Function
 *
 * Phase 1: read-only balance lookup against the external FlashPay Asia
 * Platform API. Does NOT grant entitlements, does NOT spend balance.
 * Maps the FleshLab user via email.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
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

    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/getPlatformWallet`, {
      method: 'POST',
      headers: {
        'x-platform-key': platformKey,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: user.email }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[getFlashPayWalletBalance] FlashPay API error:', res.status, errText);
      return Response.json({
        configured: true,
        error: 'Could not reach FlashPay wallet service.',
      }, { status: 502 });
    }

    const data = await res.json();

    return Response.json({
      configured: true,
      balance_usd: data.balance_usd ?? data.balance ?? 0,
      status: data.status || 'unknown',
      currency: data.currency || 'usd',
    });
  } catch (err) {
    console.error('[getFlashPayWalletBalance]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});