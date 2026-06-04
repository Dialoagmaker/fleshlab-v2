/**
 * createCheckoutSession — Backend Function
 *
 * Creates a checkout session for fanclub / PPV / guest production deposit.
 * Amount is validated SERVER-SIDE only — client cannot override.
 * Returns checkoutUrl + paymentIntentId.
 * Entitlements are NOT granted here. Only granted after confirmed webhook.
 *
 * Required env vars (to unlock real providers):
 *   CCBill:  CCBILL_ACCOUNT_NUMBER, CCBILL_SUB_ACCOUNT, CCBILL_SALT
 *   Segpay:  SEGPAY_MERCHANT_ID, SEGPAY_API_KEY
 *   Mode:    PAYMENT_PROVIDER_MODE=test|live
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Server-side authoritative pricing (client CANNOT override) ──────────────
const SERVER_PRICING = {
  fanclub: {
    fanclub_monthly: 12.99,
    fanclub_6mo:     59.99,
    fanclub_annual:  99.99,
  },
  ppv: {
    short_solo: 6.99,
    standard:   12.99,
    premium:    19.99,
  },
  guest_production_deposit: 999,
};

// ── URL safety guard ─────────────────────────────────────────────────────────
function safeUrl(url) {
  if (!url || typeof url !== 'string') return '/';
  if (!url.startsWith('/')) return '/';
  if (/^(javascript|data):/i.test(url)) return '/';
  return url;
}

// ── Provider detection ───────────────────────────────────────────────────────
function detectProvider() {
  const ccbillReady = !!(
    Deno.env.get('CCBILL_ACCOUNT_NUMBER') &&
    Deno.env.get('CCBILL_SUB_ACCOUNT') &&
    Deno.env.get('CCBILL_SALT')
  );
  if (ccbillReady) return 'ccbill';

  const segpayReady = !!(
    Deno.env.get('SEGPAY_MERCHANT_ID') &&
    Deno.env.get('SEGPAY_API_KEY')
  );
  if (segpayReady) return 'segpay';

  return null; // No provider configured
}

// ── Resolve amount ────────────────────────────────────────────────────────────
function resolveAmount(paymentType, planId, priceTier) {
  if (paymentType === 'fanclub') {
    const price = SERVER_PRICING.fanclub[planId];
    if (!price) return { error: `Invalid planId: ${planId}` };
    return { amount: price };
  }
  if (paymentType === 'ppv') {
    const tier = priceTier || 'standard';
    const price = SERVER_PRICING.ppv[tier];
    if (!price) return { error: `Invalid priceTier: ${tier}` };
    return { amount: price };
  }
  if (paymentType === 'guest_production_deposit') {
    return { amount: SERVER_PRICING.guest_production_deposit };
  }
  return { error: 'Unknown paymentType' };
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { paymentType, planId, videoId, applicationId, priceTier, returnUrl, cancelUrl } = body;

    // Validate paymentType
    const VALID_TYPES = ['fanclub', 'ppv', 'guest_production_deposit'];
    if (!VALID_TYPES.includes(paymentType)) {
      return Response.json({ error: 'Invalid paymentType' }, { status: 400 });
    }

    // Validate required fields per type
    if (paymentType === 'fanclub' && !planId) {
      return Response.json({ error: 'planId required for fanclub' }, { status: 400 });
    }
    if (paymentType === 'ppv' && !videoId) {
      return Response.json({ error: 'videoId required for PPV' }, { status: 400 });
    }
    if (paymentType === 'guest_production_deposit' && !applicationId) {
      return Response.json({ error: 'applicationId required for guest production deposit' }, { status: 400 });
    }

    // Resolve amount server-side
    const { amount, error: amountError } = resolveAmount(paymentType, planId, priceTier);
    if (amountError) return Response.json({ error: amountError }, { status: 400 });

    // Validate URLs
    const safeReturn = safeUrl(returnUrl || '/');
    const safeCancel = safeUrl(cancelUrl || '/');

    // Detect provider
    const provider = detectProvider();
    if (!provider) {
      // Create a pending PaymentIntent record even when provider not configured
      // so we can audit attempted purchases
      await base44.entities.PaymentIntent.create({
        user_id:      user.id,
        provider:     'mock',
        payment_type: paymentType,
        plan_id:      planId || null,
        video_id:     videoId || null,
        application_id: applicationId || null,
        price_tier:   priceTier || null,
        amount,
        currency:     'usd',
        status:       'pending',
        return_url:   safeReturn,
        cancel_url:   safeCancel,
        error_message: 'Provider not configured',
      });

      return Response.json({
        success: false,
        providerConfigured: false,
        message: 'Payment provider is being configured. Please check back soon.',
      }, { status: 503 });
    }

    // Provider IS configured — create checkout session
    // TODO: call real provider SDK here (CCBill / Segpay)
    // For now, stub — will throw so we surface clearly
    return Response.json({
      success: false,
      providerConfigured: true,
      provider,
      message: `Provider ${provider} detected but checkout not yet implemented. See lib/payment/providers/${provider}Provider.js`,
    }, { status: 501 });

  } catch (err) {
    console.error('[createCheckoutSession]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});