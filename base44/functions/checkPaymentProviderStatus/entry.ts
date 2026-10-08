/**
 * checkPaymentProviderStatus — Backend Function
 *
 * Returns which payment providers are configured and in what mode.
 * Used by frontend to decide whether to show checkout or "coming soon" UI.
 *
 * Provider priority: nowpayments > ccbill > segpay
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const nowConfigured = !!(
      Deno.env.get('NOWPAYMENTS_API_KEY') &&
      Deno.env.get('NOWPAYMENTS_IPN_SECRET')
    );

    const ccbillConfigured = !!(
      Deno.env.get('CCBILL_ACCOUNT_NUMBER') &&
      Deno.env.get('CCBILL_SUB_ACCOUNT') &&
      Deno.env.get('CCBILL_SALT')
    );

    const segpayConfigured = !!(
      Deno.env.get('SEGPAY_MERCHANT_ID') &&
      Deno.env.get('SEGPAY_API_KEY')
    );

    // Priority: nowpayments > ccbill > segpay
    let primary = null;
    if (nowConfigured) primary = 'nowpayments';
    else if (ccbillConfigured) primary = 'ccbill';
    else if (segpayConfigured) primary = 'segpay';

    const mode = Deno.env.get('NOWPAYMENTS_MODE') || Deno.env.get('PAYMENT_PROVIDER_MODE') || 'test';

    return Response.json({
      configured: !!primary,
      primary,
      mode: primary ? mode : 'not_configured',
      providers: {
        nowpayments: nowConfigured,
        ccbill:      ccbillConfigured,
        segpay:      segpayConfigured,
      },
      // Friendly label for UI copy
      checkoutLabel: nowConfigured
        ? 'Secure crypto checkout'
        : 'Secure checkout',
      message: primary
        ? `Payment provider (${primary}) configured in ${mode} mode`
        : 'Payment provider not configured yet',
    });
  } catch (err) {
    console.error('[checkPaymentProviderStatus]', err);
    return Response.json({
      configured: false,
      primary: null,
      mode: 'not_configured',
      checkoutLabel: 'Secure checkout',
      message: 'Unable to check provider status',
    });
  }
});