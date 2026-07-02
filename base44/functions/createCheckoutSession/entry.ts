/**
 * createCheckoutSession — Backend Function
 *
 * Creates a checkout session for fanclub / PPV / guest production deposit.
 * Amount is validated SERVER-SIDE only — client cannot override.
 * Returns checkoutUrl + paymentIntentId only if provider is configured.
 * Entitlements are NOT granted here. Only granted after confirmed IPN webhook.
 *
 * Supported providers (detected via env vars):
 *   NOWPayments: NOWPAYMENTS_API_KEY + NOWPAYMENTS_IPN_SECRET
 *   CCBill:      CCBILL_ACCOUNT_NUMBER + CCBILL_SUB_ACCOUNT + CCBILL_SALT
 *   Segpay:      SEGPAY_MERCHANT_ID + SEGPAY_API_KEY
 *
 * Security:
 *   - User must be authenticated
 *   - Amount resolved server-side from pricing config
 *   - return_url / cancel_url validated as internal paths only
 *   - No entitlement granted here
 *   - API keys never sent to frontend
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Server-side authoritative pricing (client CANNOT override) ──────────────
// NOWPayments LIVE MINIMUM FIX (2026-06-06): $19.07 live minimum + 5% buffer = $20.03 required.
// annual_pass is DISABLED (AsiaPay approval phase). Backend must reject it.
const SERVER_PRICING = {
  fanclub: {
    fanclub_monthly:  20.99,  // NOWPayments LIVE minimum + buffer
    premium_monthly:  29.99,  // passes minimum
    fanclub_3mo:      49.99,  // passes minimum
    // annual_pass: DISABLED — do not add back until payment provider approves
  },
  ppv: {
    standard:  20.99,  // NOWPayments LIVE minimum + buffer
    premium:   24.99,  // passes minimum
    exclusive: 29.99,  // passes minimum
  },
  guest_production_deposit: 999,
};

// Plans disabled during payment provider approval phase
const DISABLED_PLANS = ['annual_pass', 'fanclub_6mo', 'fanclub_annual']; // fanclub_3mo ENABLED for crypto-safe pricing

// Plans eligible for Summer Studio Special promo
const PROMO_ELIGIBLE_PLANS = ['fanclub_monthly', 'premium_monthly'];

// ── Crypto minimum (NOWPayments) ─────────────────────────────────────────────
// Dynamic minimum will be checked via API. This is fallback only.
// NOWPayments LIVE minimum: $19.07 + 5% buffer = $20.03 → rounded to $20.99
const CRYPTO_MINIMUM_USD = 20.99;

// ── URL safety guard (internal paths only) ────────────────────────────────────
function safeUrl(url) {
  if (!url || typeof url !== 'string') return '/';
  if (!url.startsWith('/')) return '/';
  if (/^(javascript|data):/i.test(url)) return '/';
  return url;
}

// ── Provider detection (priority: nowpayments > ccbill > segpay) ─────────────
function detectProvider() {
  const nowReady = !!(
    Deno.env.get('NOWPAYMENTS_API_KEY') &&
    Deno.env.get('NOWPAYMENTS_IPN_SECRET')
  );
  if (nowReady) return 'nowpayments';

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

  return null;
}

// ── Resolve amount server-side ────────────────────────────────────────────────
function resolveAmount(paymentType, planId, priceTier) {
  if (paymentType === 'fanclub') {
    // Reject disabled plans immediately
    if (DISABLED_PLANS.includes(planId)) {
      return { error: `Plan "${planId}" is not available. Annual passes and multi-month plans are disabled during the current payment provider approval phase.` };
    }
    const price = SERVER_PRICING.fanclub[planId];
    if (!price) return { error: `Invalid planId: ${planId}. Available plans: fanclub_monthly, premium_monthly.` };
    return { amount: price, promoEligible: PROMO_ELIGIBLE_PLANS.includes(planId) };
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

// ── NOWPayments currency strategy ────────────────────────────────────────────
// AUDIT FIX (2026-06-06): Force USDT TRC20 for low-ticket products to avoid BTC minimum failures.
// $19.99 passes USDT TRC20 minimum (~$11.23) but may fail BTC minimum with buffer.
// Per-invoice payout_currency is accepted by the API (field tested, invoice created).
function resolvePayCurrency({ paymentType, planId, priceAmount }) {
  // Force USDT TRC20 for fanclub monthly — avoids currency selection issues
  if (paymentType === 'fanclub' && planId === 'fanclub_monthly') {
    return 'usdttrc20';
  }
  
  // Force USDT TRC20 for PPV standard tier ($20.99)
  if (paymentType === 'ppv' && priceAmount <= 20.99) {
    return 'usdttrc20';
  }
  
  // Force USDT TRC20 for amounts below $25 to ensure reliable checkout
  if (priceAmount < 25) {
    return 'usdttrc20';
  }
  
  // For higher amounts ($25+), omit — customer picks from all enabled currencies
  return null;
}

// ── NOWPayments minimum amount check ──────────────────────────────────────────
async function checkNOWPaymentsMinimum({ priceAmount, payCurrency }) {
  const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
  const mode = Deno.env.get('NOWPAYMENTS_MODE') || 'test';
  const baseUrl = mode === 'live'
    ? 'https://api.nowpayments.io/v1'
    : 'https://api-sandbox.nowpayments.io/v1';

  // Get minimum for USD → pay_currency pair
  const targetCurrency = payCurrency || 'usdttrc20';
  const url = `${baseUrl}/min-amount?currency_from=usd&currency_to=${targetCurrency}`;
  const res = await fetch(url, {
    headers: { 'x-api-key': apiKey },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[checkNOWPaymentsMinimum] API error:', res.status, errText);
    // Fail safe — use fallback minimum
    return { minimumUsd: CRYPTO_MINIMUM_USD, currency: targetCurrency };
  }

  const data = await res.json();
  // API returns: { fiat_equivalent: 11.23, min_amount: 10, currency_from: 'usd', currency_to: 'usdttrc20' }
  const minimumUsd = parseFloat(data.fiat_equivalent) || parseFloat(data.min_amount) || CRYPTO_MINIMUM_USD;

  // Add 5% safety buffer for fluctuation
  return {
    minimumUsd: Math.ceil(minimumUsd * 1.05 * 100) / 100,
    currency: targetCurrency,
    rawMinimum: minimumUsd,
  };
}

// ── NOWPayments invoice creation ──────────────────────────────────────────────
async function createNOWPaymentsInvoice({ orderId, priceAmount, description, successUrl, cancelUrl }) {
  const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
  const mode = Deno.env.get('NOWPAYMENTS_MODE') || 'test';
  const baseUrl = mode === 'live'
    ? 'https://api.nowpayments.io/v1'
    : 'https://api-sandbox.nowpayments.io/v1';

  const appBase = (Deno.env.get('APP_BASE_URL') || 'https://fleshlab.online').replace(/\/$/, '');
  const absSuccessUrl = (successUrl && successUrl.startsWith('http')) ? successUrl : `${appBase}${successUrl || '/'}`;
  const absCancelUrl  = (cancelUrl && cancelUrl.startsWith('http'))  ? cancelUrl  : `${appBase}${cancelUrl || '/'}`;

  // AUDIT FIX: Force USDT TRC20 for low-ticket products
  const payCurrency = resolvePayCurrency({ paymentType: 'unknown', planId: null, priceAmount: priceAmount });

  // Use PROCESSOR_WEBHOOK_URL env var, or derive from APP_BASE_URL
  const webhookUrl = Deno.env.get('PROCESSOR_WEBHOOK_URL') || 
    `${appBase}/api/functions/paymentWebhook`;
  
  console.log('[createNOWPaymentsInvoice] Using webhook URL:', webhookUrl);
  
  const body = {
    price_amount:      priceAmount,
    price_currency:    'usd',
    pay_currency:      payCurrency || undefined,
    order_id:          orderId,
    order_description: description,
    ipn_callback_url:  webhookUrl,
    success_url:       absSuccessUrl,
    cancel_url:        absCancelUrl,
    is_fixed_rate:     false,
    is_fee_paid_by_user: false,
  };

  const res = await fetch(`${baseUrl}/invoice`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`NOWPayments invoice error: ${res.status} — ${errText}`);
  }

  return await res.json();
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // TASK 5: Verify server auth with detailed logging
    console.log('[createCheckoutSession] Stage: auth_check');
    const user = await base44.auth.me();
    if (!user) {
      console.log('[createCheckoutSession] Auth failed - no user');
      return Response.json({ 
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Please log in or create an account before starting checkout.',
        stage: 'auth_check'
      }, { status: 401 });
    }
    console.log('[createCheckoutSession] Auth success:', { userId: user.id, email: user.email });

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

    // Resolve amount server-side (client cannot supply this)
    const { amount, error: amountError } = resolveAmount(paymentType, planId, priceTier);
    if (amountError) return Response.json({ error: amountError }, { status: 400 });

    // Validate URLs — internal paths only
    const safeReturn = safeUrl(returnUrl || '/');
    const safeCancel = safeUrl(cancelUrl || '/');

    // ── Crypto minimum guard with enhanced logging ─────────────────────────────
    // Check actual NOWPayments minimum for selected currency before creating invoice
    const payCurrency = resolvePayCurrency({ paymentType, planId, priceAmount: amount });
    const payoutCurrency = Deno.env.get('NOWPAYMENTS_PAYOUT_CURRENCY') || 'usdttrc20';
    console.log('[createCheckoutSession] Checkout request (NOWPayments LIVE MINIMUM FIX):', {
      paymentType,
      planId,
      priceTier,
      amount,
      price_currency: 'usd',
      pay_currency: payCurrency,
      payout_currency: payoutCurrency,
      crypto_minimum_required: 20.03,
      user_id: user.id,
    });

    let minCheck;
    try {
      minCheck = await checkNOWPaymentsMinimum({ priceAmount: amount, payCurrency });
      console.log('[createCheckoutSession] NOWPayments minimum check:', minCheck);
    } catch (minErr) {
      console.error('[createCheckoutSession] Minimum check error:', minErr.message);
      minCheck = { minimumUsd: CRYPTO_MINIMUM_USD, currency: payCurrency || 'usdttrc20' };
    }

    if (amount < minCheck.minimumUsd) {
      console.warn('[createCheckoutSession] Stage: minimum_check - FAILED:', { amount, minimum: minCheck.minimumUsd });
      return Response.json({
        success: false,
        providerConfigured: true,
        blocked_reason: 'below_crypto_minimum',
        stage: 'minimum_check',
        minimum_usd: minCheck.minimumUsd,
        requested_amount: amount,
        currency: minCheck.currency,
        paymentType,
        planId,
        message: `Crypto checkout is currently not available for this amount. ${minCheck.currency.toUpperCase()} requires a minimum of $${minCheck.minimumUsd} USD. Your order is $${amount}. Please choose the 3-Month Access plan ($49.99) or contact support.`,
      }, { status: 422 });
    }

    // Detect provider
    const provider = detectProvider();

    if (!provider) {
      console.log('[createCheckoutSession] Stage: provider_detection - FAILED: No provider configured');
      // No provider configured — record intent for audit but do not create a checkout URL
      await base44.entities.PaymentIntent.create({
        user_id:        user.id,
        provider:       'mock',
        payment_type:   paymentType,
        plan_id:        planId || null,
        video_id:       videoId || null,
        application_id: applicationId || null,
        price_tier:     priceTier || null,
        amount,
        currency:       'usd',
        status:         'pending',
        return_url:     safeReturn,
        cancel_url:     safeCancel,
        error_message:  'No payment provider configured',
      });

      return Response.json({
        success: false,
        providerConfigured: false,
        stage: 'provider_detection',
        message: 'Secure crypto checkout is being configured. Please check back soon.',
      }, { status: 503 });
    }

    // ── NOWPayments checkout ─────────────────────────────────────────────────
    if (provider === 'nowpayments') {
      const orderId = `${paymentType}_${user.id}_${Date.now()}`;

      // Build rich product description with metadata
      let description;
      if (paymentType === 'fanclub') {
        if (planId === 'fanclub_3mo') {
          description = 'FLESHLAB Fanclub 3-Month Access — Multi-month bundle';
        } else if (planId === 'premium_monthly') {
          description = 'FLESHLAB Fanclub Premium Monthly Access — Premium tier subscription';
        } else {
          description = 'FLESHLAB Fanclub Monthly Access — Monthly subscription';
        }
      } else if (paymentType === 'ppv') {
        description = `FLESHLAB PPV Video Unlock — ${priceTier || 'standard'} tier access`;
      } else if (paymentType === 'guest_production_deposit') {
        description = 'FLESHLAB Fan Production Reservation — Deposit payment';
      } else {
        description = `FLESHLAB Order — ${paymentType}`;
      }

      let invoiceData;
      const mode = Deno.env.get('NOWPAYMENTS_MODE') || 'test';
      const baseUrl = mode === 'live'
        ? 'https://api.nowpayments.io/v1'
        : 'https://api-sandbox.nowpayments.io/v1';
      
      try {
        // Build absolute URLs for logging and API call
        const appBase = (Deno.env.get('APP_BASE_URL') || 'https://fleshlab.online').replace(/\/$/, '');
        const absSuccessUrl = (safeReturn && safeReturn.startsWith('http')) ? safeReturn : `${appBase}${safeReturn}`;
        const absCancelUrl = (safeCancel && safeCancel.startsWith('http')) ? safeCancel : `${appBase}${safeCancel}`;

        console.log('[createCheckoutSession] Calling NOWPayments invoice API:', {
          endpoint: `${baseUrl}/invoice`,
          mode,
          payload: {
            price_amount: amount,
            price_currency: 'usd',
            pay_currency: payCurrency,
            order_id: orderId,
            order_description: description,
            ipn_callback_url: 'https://api.base44.com/api/apps/68326eff4b3b5d60a8b4f285/functions/paymentWebhook',
            success_url: absSuccessUrl,
            cancel_url: absCancelUrl,
          },
        });

        invoiceData = await createNOWPaymentsInvoice({
          orderId,
          priceAmount: amount,
          description,
          successUrl: safeReturn,
          cancelUrl: safeCancel,
        });

        console.log('[createCheckoutSession] NOWPayments invoice created successfully:', {
          invoiceId: invoiceData.id,
          invoiceUrl: invoiceData.invoice_url,
          expectedAmount: invoiceData.expected_amount,
          payCurrency: invoiceData.pay_currency,
        });
      } catch (invoiceErr) {
        console.error('[createCheckoutSession] NOWPayments invoice error:', {
          message: invoiceErr.message,
          status: invoiceErr.status,
          paymentType,
          planId,
          amount,
          payCurrency,
          orderId,
        });
        
        // Still create a pending intent for audit
        await base44.entities.PaymentIntent.create({
          user_id:        user.id,
          provider:       'nowpayments',
          payment_type:   paymentType,
          plan_id:        planId || null,
          video_id:       videoId || null,
          application_id: applicationId || null,
          price_tier:     priceTier || null,
          amount,
          currency:       'usd',
          status:         'pending',
          return_url:     safeReturn,
          cancel_url:     safeCancel,
          error_message:  invoiceErr.message,
        });

        // Determine blocked_reason for frontend
        let blockedReason = 'unknown';
        const errMsg = invoiceErr.message.toLowerCase();
        if (errMsg.includes('minimum')) blockedReason = 'minimum_amount';
        else if (errMsg.includes('api key') || errMsg.includes('authentication')) blockedReason = 'provider_credentials';
        else if (errMsg.includes('currency') || errMsg.includes('not enabled')) blockedReason = 'provider_config';
        else if (errMsg.includes('baseurl') || errMsg.includes('abssuccessurl') || errMsg.includes('abscancelurl')) blockedReason = 'server_error';
        else blockedReason = 'provider_rejected';

        console.error('[createCheckoutSession] Checkout failed with blocked_reason:', blockedReason);

        // TASK 3: Return diagnostic info (safe fields only)
        return Response.json({
          success: false,
          providerConfigured: true,
          provider: 'nowpayments',
          blocked_reason: blockedReason,
          stage: 'nowpayments_invoice',
          paymentType,
          planId,
          resolvedAmount: amount,
          payCurrency,
          orderDescription: description,
          message: 'Checkout could not be created. Please try again or contact support.',
          error: invoiceErr.message,
        }, { status: 502 });
      }

      // Create PaymentIntent record with session info
      const intent = await base44.entities.PaymentIntent.create({
        user_id:             user.id,
        provider:            'nowpayments',
        payment_type:        paymentType,
        plan_id:             planId || null,
        video_id:            videoId || null,
        application_id:      applicationId || null,
        price_tier:          priceTier || null,
        amount,
        currency:            'usd',
        status:              'pending',
        provider_session_id: String(invoiceData.id),
        checkout_url:        invoiceData.invoice_url,
        return_url:          safeReturn,
        cancel_url:          safeCancel,
        metadata:            JSON.stringify({ order_id: orderId, nowpayments_invoice_id: invoiceData.id, pay_currency_strategy: resolvePayCurrency({ paymentType, planId, priceAmount: amount }) || 'customer_choice' }),
      });

      return Response.json({
        success: true,
        providerConfigured: true,
        provider: 'nowpayments',
        paymentIntentId: intent.id,
        checkoutUrl: invoiceData.invoice_url,
        message: 'Crypto checkout created. Pay securely with crypto via NOWPayments.',
      });
    }

    // ── Legacy stubs (CCBill / Segpay) ───────────────────────────────────────
    return Response.json({
      success: false,
      providerConfigured: true,
      provider,
      message: `Provider ${provider} detected but checkout not yet implemented.`,
    }, { status: 501 });

  } catch (err) {
    console.error('[createCheckoutSession] Unhandled error:', err);
    
    // Check if this is an auth error (shouldn't happen after our check above, but be safe)
    if (err.message?.includes('Unauthorized') || err.message?.includes('Authentication')) {
      return Response.json({ 
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Please log in or create an account before starting checkout.',
        stage: 'auth_check'
      }, { status: 401 });
    }
    
    // Generic error with stage info
    return Response.json({ 
      error: err.message, 
      stage: 'unknown',
      success: false 
    }, { status: 500 });
  }
});