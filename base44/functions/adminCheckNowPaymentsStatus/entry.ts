import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function safeUrlState(url) {
  if (!url) return { exists: false };
  try {
    return { exists: true, host: new URL(url).host };
  } catch {
    return { exists: true, host: 'invalid-url' };
  }
}

function mask(value) {
  if (!value) return null;
  const text = String(value);
  return text.length <= 8 ? text : `${text.slice(0, 4)}…${text.slice(-4)}`;
}

async function fetchNowPayments(path, apiKey, baseUrl) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'x-api-key': apiKey },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const paymentIntentId = body.payment_intent_id || body.paymentIntentId || null;
    const providerSessionIdInput = body.provider_session_id || body.providerSessionId || body.invoice_id || body.invoiceId || null;

    if (!paymentIntentId && !providerSessionIdInput) {
      return Response.json({ error: 'payment_intent_id or provider_session_id is required' }, { status: 400 });
    }

    let intent = null;
    let providerSessionId = providerSessionIdInput ? String(providerSessionIdInput) : null;

    if (paymentIntentId) {
      intent = await base44.asServiceRole.entities.PaymentIntent.get(paymentIntentId);
      if (!intent) return Response.json({ error: 'PaymentIntent not found' }, { status: 404 });
      if (intent.provider !== 'nowpayments') {
        return Response.json({ error: 'PaymentIntent is not a NOWPayments intent' }, { status: 400 });
      }
      providerSessionId = String(intent.provider_session_id || providerSessionId || '');
    }

    if (!providerSessionId) {
      return Response.json({ error: 'NOWPayments provider_session_id / invoice id is missing' }, { status: 400 });
    }

    let topupOrders = [];
    let webhookEvents = [];
    let payments = [];

    if (intent) {
      topupOrders = await base44.asServiceRole.entities.FleshPayTopupOrder.filter({ payment_intent_id: intent.id }, '-created_date', 10);
      payments = await base44.asServiceRole.entities.Payment.filter({ user_id: intent.user_id, amount_usd: intent.amount }, '-created_date', 20);
    }

    const byInvoice = await base44.asServiceRole.entities.PaymentWebhookEvent.filter({
      provider: 'nowpayments',
      provider_invoice_id: providerSessionId,
    }, '-created_date', 20);
    const byEvent = await base44.asServiceRole.entities.PaymentWebhookEvent.filter({
      provider: 'nowpayments',
      provider_event_id: providerSessionId,
    }, '-created_date', 20);
    webhookEvents = [...byInvoice, ...byEvent].filter((event, index, all) => all.findIndex(e => e.id === event.id) === index);

    const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    const mode = Deno.env.get('NOWPAYMENTS_MODE') || 'test';
    const baseUrl = mode === 'live' ? 'https://api.nowpayments.io/v1' : 'https://api-sandbox.nowpayments.io/v1';

    let livePaymentStatus = null;
    let liveInvoiceStatus = null;
    if (apiKey) {
      livePaymentStatus = await fetchNowPayments(`/payment/${encodeURIComponent(providerSessionId)}`, apiKey, baseUrl);
      liveInvoiceStatus = await fetchNowPayments(`/invoice/${encodeURIComponent(providerSessionId)}`, apiKey, baseUrl);
    }

    return Response.json({
      success: true,
      mode,
      local: {
        payment_intent: intent ? {
          id: mask(intent.id),
          created_date: intent.created_date,
          provider: intent.provider,
          payment_type: intent.payment_type,
          amount: intent.amount,
          currency: intent.currency,
          status: intent.status,
          provider_session_id: mask(intent.provider_session_id),
          checkout_url: safeUrlState(intent.checkout_url),
          completed_at: intent.completed_at || null,
          failed_at: intent.failed_at || null,
          cancelled_at: intent.cancelled_at || null,
          error_message: intent.error_message || null,
        } : null,
        topup_orders: topupOrders.map(order => ({
          id: mask(order.id),
          status: order.status,
          amount_usd: order.amount_usd,
          provider: order.provider,
          provider_invoice_id: mask(order.provider_invoice_id),
          provider_payment_id: mask(order.provider_payment_id),
        })),
        webhook_events: webhookEvents.map(event => ({
          id: mask(event.id),
          created_date: event.created_date,
          raw_status: event.raw_status,
          normalized_status: event.normalized_status,
          signature_valid: event.signature_valid,
          processed: event.processed,
          duplicate: event.duplicate,
          entitlement_granted: event.entitlement_granted,
          error_message: event.error_message || null,
        })),
        matching_payments: payments.map(payment => ({
          id: mask(payment.id),
          created_date: payment.created_date,
          status: payment.status,
          payment_type: payment.payment_type,
          amount_usd: payment.amount_usd,
          related_entity_type: payment.related_entity_type,
          related_entity_id: mask(payment.related_entity_id),
        })),
      },
      nowpayments: {
        api_key_configured: !!apiKey,
        payment_endpoint: livePaymentStatus,
        invoice_endpoint: liveInvoiceStatus,
      },
    });
  } catch (error) {
    console.error('[adminCheckNowPaymentsStatus]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});