/**
 * createFleshPayTopup — Backend Function
 *
 * Creates a FleshPay wallet top-up order via NOWPayments.
 * Allowed amounts: 10, 25, 50, 100 USD only.
 * Returns a NOWPayments checkout URL for the user to pay.
 * Wallet is NOT credited here — crediting happens in paymentWebhook.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Allowed top-up tiers ──────────────────────────────────────────────────────
const ALLOWED_AMOUNTS = [10, 25, 50, 100];

// ── NOWPayments invoice creation ──────────────────────────────────────────────
async function createNOWPaymentsInvoice({ orderId, priceAmount, description }) {
  const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
  const mode = Deno.env.get('NOWPAYMENTS_MODE') || 'test';
  const baseUrl = mode === 'live'
    ? 'https://api.nowpayments.io/v1'
    : 'https://api-sandbox.nowpayments.io/v1';

  const appBase = (Deno.env.get('APP_BASE_URL') || 'https://fleshlab.online').replace(/\/$/, '');
  const webhookUrl = Deno.env.get('PROCESSOR_WEBHOOK_URL') ||
    `${appBase}/api/functions/paymentWebhook`;

  const body = {
    price_amount:      priceAmount,
    price_currency:    'usd',
    order_id:          orderId,
    order_description: description,
    ipn_callback_url:  webhookUrl,
    success_url:       `${appBase}/client/dashboard`,
    cancel_url:        `${appBase}/client/dashboard`,
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
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount_usd } = body;

    // Validate amount — only allowed tiers
    if (!amount_usd || !ALLOWED_AMOUNTS.includes(amount_usd)) {
      return Response.json({
        error: `Invalid amount. Allowed top-up amounts: ${ALLOWED_AMOUNTS.join(', ')} USD`,
      }, { status: 400 });
    }

    // Get or create wallet
    let wallets = await base44.entities.FleshPayWallet.filter({ user_id: user.id });
    let wallet;

    if (wallets.length === 0) {
      wallet = await base44.entities.FleshPayWallet.create({
        user_id: user.id,
        balance_usd: 0,
        currency: 'usd',
        status: 'active',
        lifetime_topups_usd: 0,
        lifetime_spends_usd: 0,
      });
    } else {
      wallet = wallets[0];
    }

    // Wallet must be active
    if (wallet.status !== 'active') {
      return Response.json({
        error: 'Wallet is not active. Please contact support.',
      }, { status: 403 });
    }

    // Create FleshPayTopupOrder
    const topupOrder = await base44.entities.FleshPayTopupOrder.create({
      user_id: user.id,
      wallet_id: wallet.id,
      amount_usd,
      currency: 'usd',
      provider: 'nowpayments',
      status: 'pending',
    });

    // Create PaymentIntent (payment_type = wallet_topup)
    const intent = await base44.entities.PaymentIntent.create({
      user_id:             user.id,
      provider:            'nowpayments',
      payment_type:        'wallet_topup',
      amount:              amount_usd,
      currency:            'usd',
      status:              'pending',
      related_entity_type: 'fleshpay_topup_order',
      related_entity_id:   topupOrder.id,
      return_url:          '/client/dashboard',
      cancel_url:          '/client/dashboard',
    });

    // Create NOWPayments invoice
    const orderId = `wallettopup_${user.id}_${Date.now()}`;
    const description = `FLESHLAB Wallet Top-up — $${amount_usd} USD`;

    let invoiceData;
    try {
      invoiceData = await createNOWPaymentsInvoice({
        orderId,
        priceAmount: amount_usd,
        description,
      });
    } catch (invoiceErr) {
      console.error('[createFleshPayTopup] NOWPayments invoice error:', invoiceErr.message);

      // Update records with error state
      await base44.entities.FleshPayTopupOrder.update(topupOrder.id, {
        status: 'failed',
        notes: `Invoice creation failed: ${invoiceErr.message}`,
      });
      await base44.entities.PaymentIntent.update(intent.id, {
        status: 'failed',
        error_message: invoiceErr.message,
      });

      return Response.json({
        success: false,
        error: 'Payment provider unavailable. Please try again.',
      }, { status: 502 });
    }

    // Update records with invoice data
    await base44.entities.FleshPayTopupOrder.update(topupOrder.id, {
      payment_intent_id: intent.id,
      checkout_url: invoiceData.invoice_url,
      provider_checkout_url: invoiceData.invoice_url,
      provider_invoice_id: String(invoiceData.id),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    await base44.entities.PaymentIntent.update(intent.id, {
      provider_session_id: String(invoiceData.id),
      checkout_url: invoiceData.invoice_url,
      metadata: JSON.stringify({
        order_id: orderId,
        nowpayments_invoice_id: invoiceData.id,
        fleshpay_topup_order_id: topupOrder.id,
      }),
    });

    console.log('[createFleshPayTopup] Top-up order created:', {
      topupOrderId: topupOrder.id,
      userId: user.id,
      amount_usd,
      invoiceId: invoiceData.id,
    });

    return Response.json({
      success: true,
      topupOrderId: topupOrder.id,
      paymentIntentId: intent.id,
      checkoutUrl: invoiceData.invoice_url,
      amount_usd,
    });
  } catch (err) {
    console.error('[createFleshPayTopup]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});