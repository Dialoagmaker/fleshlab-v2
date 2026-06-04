/**
 * checkPaymentProviderStatus — Backend Function
 *
 * Returns which payment providers are configured and in what mode.
 * Used by frontend to decide whether to show checkout or "coming soon" UI.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const ccbillConfigured = !!(
      Deno.env.get('CCBILL_ACCOUNT_NUMBER') &&
      Deno.env.get('CCBILL_SUB_ACCOUNT') &&
      Deno.env.get('CCBILL_SALT')
    );

    const segpayConfigured = !!(
      Deno.env.get('SEGPAY_MERCHANT_ID') &&
      Deno.env.get('SEGPAY_API_KEY')
    );

    const mode = Deno.env.get('PAYMENT_PROVIDER_MODE') === 'live' ? 'live' : 'test';

    let primary = null;
    if (ccbillConfigured) primary = 'ccbill';
    else if (segpayConfigured) primary = 'segpay';

    return Response.json({
      configured: !!primary,
      primary,
      mode: primary ? mode : 'not_configured',
      providers: {
        ccbill:  ccbillConfigured,
        segpay:  segpayConfigured,
      },
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
      message: 'Unable to check provider status',
    });
  }
});