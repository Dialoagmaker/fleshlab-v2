import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const ALLOWED_AMOUNTS = [10, 25, 50, 100];

async function getOrCreateWallet(base44, userId) {
  const wallets = await base44.entities.FlashPayWallet.filter({ user_id: userId });
  if (wallets.length > 0) {
    const candidates = wallets.filter(wallet => wallet.status !== 'closed');
    return (candidates.length ? candidates : wallets).sort((a, b) => ((b.available_balance || 0) + (b.pending_balance || 0) + (b.lifetime_deposited || 0)) - ((a.available_balance || 0) + (a.pending_balance || 0) + (a.lifetime_deposited || 0)))[0];
  }
  const now = new Date().toISOString();
  return await base44.entities.FlashPayWallet.create({
    user_id: userId,
    currency: 'usd',
    available_balance: 0,
    pending_balance: 0,
    lifetime_deposited: 0,
    lifetime_spent: 0,
    status: 'active',
    created_at: now,
    updated_at: now,
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const amount = Number(body.amount_usd);
    if (!ALLOWED_AMOUNTS.includes(amount)) {
      return Response.json({ error: 'Invalid top-up amount.' }, { status: 400 });
    }

    const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    if (!apiKey) return Response.json({ error: 'Payment provider is not configured.' }, { status: 503 });

    const wallet = await getOrCreateWallet(base44, user.id);
    if (wallet.status !== 'active') return Response.json({ error: 'Wallet is not active.' }, { status: 403 });

    const now = new Date().toISOString();
    const intent = await base44.entities.PaymentIntent.create({
      user_id: user.id,
      provider: 'nowpayments',
      payment_type: 'wallet_topup',
      amount,
      currency: 'usd',
      status: 'pending',
      return_url: '/account/wallet',
      cancel_url: '/account/wallet',
      metadata: JSON.stringify({ flashpay_wallet_id: wallet.id, topup_amount_usd: amount }),
    });

    const pendingTransaction = await base44.entities.FlashPayTransaction.create({
      wallet_id: wallet.id,
      user_id: user.id,
      transaction_type: 'deposit',
      direction: 'credit',
      amount,
      currency: 'usd',
      status: 'pending',
      reference_type: 'payment_intent',
      reference_id: intent.id,
      provider: 'nowpayments',
      provider_transaction_id: '',
      idempotency_key: `flashpay_deposit_intent_${intent.id}`,
      description: `Pending FlashPay top-up — $${amount.toFixed(2)}`,
      balance_before: wallet.available_balance || 0,
      balance_after: wallet.available_balance || 0,
      metadata: JSON.stringify({ payment_intent_id: intent.id }),
    });

    const modeRaw = Deno.env.get('NOWPAYMENTS_MODE') || 'test';
    const mode = modeRaw.toLowerCase().includes('live') ? 'live' : 'test';
    const providerBase = mode === 'live' ? 'https://api.nowpayments.io/v1' : 'https://api-sandbox.nowpayments.io/v1';
    const appBase = (Deno.env.get('APP_BASE_URL') || 'https://fleshlab.online').replace(/\/$/, '');
    const orderId = `flashpay_topup_${intent.id}`;

    const invoiceBody = {
      price_amount: amount,
      price_currency: 'usd',
      order_id: orderId,
      order_description: `FLESHLAB FlashPay top-up — $${amount} USD`,
      ipn_callback_url: `${appBase}/api/functions/paymentWebhook`,
      success_url: `${appBase}/account/wallet?flashpay=success`,
      cancel_url: `${appBase}/account/wallet?flashpay=cancelled`,
      is_fixed_rate: false,
      is_fee_paid_by_user: false,
    };

    const res = await fetch(`${providerBase}/invoice`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceBody),
    });
    const raw = await res.text();
    if (!res.ok) {
      await base44.entities.PaymentIntent.update(intent.id, { status: 'failed', error_message: raw, failed_at: new Date().toISOString() });
      await base44.entities.FlashPayTransaction.update(pendingTransaction.id, { status: 'failed', failed_at: new Date().toISOString(), metadata: JSON.stringify({ payment_intent_id: intent.id, error: raw }) });
      return Response.json({ error: 'Could not create payment session.' }, { status: 502 });
    }

    const invoice = JSON.parse(raw);
    const checkoutUrl = invoice.invoice_url || invoice.checkout_url;
    if (!checkoutUrl) return Response.json({ error: 'Payment provider did not return a checkout URL.' }, { status: 502 });

    await base44.entities.PaymentIntent.update(intent.id, {
      provider_session_id: String(invoice.id),
      checkout_url: checkoutUrl,
      metadata: JSON.stringify({
        flashpay_wallet_id: wallet.id,
        flashpay_pending_transaction_id: pendingTransaction.id,
        order_id: orderId,
        nowpayments_invoice_id: invoice.id,
        topup_amount_usd: amount,
      }),
    });
    await base44.entities.FlashPayTransaction.update(pendingTransaction.id, {
      provider_transaction_id: String(invoice.id),
      metadata: JSON.stringify({ payment_intent_id: intent.id, order_id: orderId, nowpayments_invoice_id: invoice.id }),
    });

    return Response.json({ success: true, checkoutUrl, paymentIntentId: intent.id, transactionId: pendingTransaction.id, amount_usd: amount });
  } catch (error) {
    console.error('[createFlashPayTopup]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});