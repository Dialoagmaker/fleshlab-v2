/**
 * paymentWebhook — Backend Function
 *
 * Receives inbound IPN/webhook events from NOWPayments, CCBill, Segpay.
 * Verifies signature FIRST — rejects without DB access if invalid.
 * Grants entitlements ONLY after payment.completed status confirmed.
 *
 * NOWPayments IPN:
 *   Header:  x-nowpayments-sig  (HMAC-SHA512 of sorted JSON body)
 *   Secret:  NOWPAYMENTS_IPN_SECRET
 *   Statuses:
 *     finished / confirmed   → payment.completed
 *     failed                 → payment.failed
 *     expired                → payment.cancelled
 *     refunded               → payment.refunded
 *     waiting / confirming   → payment.pending (no entitlement)
 *
 * Security:
 *   - Signature verified before any DB read or write
 *   - No entitlement on pending/partial/confirming status
 *   - Idempotent: already-completed intents not re-processed
 *   - No private fields exposed in response
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Provider detection from headers ──────────────────────────────────────────
function detectProviderFromHeaders(headers) {
  if (headers['x-nowpayments-sig'])                              return 'nowpayments';
  if (headers['x-ccbill-signature'] || headers['x-ccbill-event']) return 'ccbill';
  if (headers['x-segpay-signature'] || headers['x-segpay-event']) return 'segpay';
  return null;
}

// ── NOWPayments HMAC-SHA512 signature verification ────────────────────────────
async function verifyNOWPaymentsSignature(rawBody, headers) {
  const secret = Deno.env.get('NOWPAYMENTS_IPN_SECRET');
  if (!secret) {
    console.error('[paymentWebhook] NOWPAYMENTS_IPN_SECRET not set — rejecting');
    return false;
  }

  const signature = headers['x-nowpayments-sig'];
  if (!signature) {
    console.error('[paymentWebhook] Missing x-nowpayments-sig header');
    return false;
  }

  try {
    // NOWPayments: sort keys of JSON body, then HMAC-SHA512
    const parsedBody = JSON.parse(rawBody);
    const sortedJson = JSON.stringify(parsedBody, Object.keys(parsedBody).sort());

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(sortedJson);

    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false, ['sign']
    );

    const hashBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return hashHex.toLowerCase() === signature.toLowerCase();
  } catch (err) {
    console.error('[paymentWebhook] NOWPayments signature error:', err);
    return false;
  }
}

// ── Signature verification router ─────────────────────────────────────────────
async function verifySignature(provider, rawBody, headers) {
  if (provider === 'nowpayments') {
    return await verifyNOWPaymentsSignature(rawBody, headers);
  }
  if (provider === 'ccbill') {
    const secret = Deno.env.get('CCBILL_WEBHOOK_SECRET');
    if (!secret) { console.warn('[paymentWebhook] CCBILL_WEBHOOK_SECRET not set'); return false; }
    // TODO: CCBill HMAC verification
    console.warn('[paymentWebhook] CCBill signature verification not implemented yet');
    return false;
  }
  if (provider === 'segpay') {
    const secret = Deno.env.get('SEGPAY_WEBHOOK_SECRET');
    if (!secret) { console.warn('[paymentWebhook] SEGPAY_WEBHOOK_SECRET not set'); return false; }
    console.warn('[paymentWebhook] Segpay signature verification not implemented yet');
    return false;
  }
  return false;
}

// ── NOWPayments event normalization ──────────────────────────────────────────
function normalizeNOWPaymentsEvent(payload) {
  const { payment_id, order_id, payment_status, price_amount, price_currency, actually_paid } = payload;

  let eventType;
  switch (payment_status) {
    case 'finished':
    case 'confirmed':
      eventType = 'payment.completed';
      break;
    case 'failed':
      eventType = 'payment.failed';
      break;
    case 'expired':
      eventType = 'payment.cancelled';
      break;
    case 'refunded':
      eventType = 'payment.refunded';
      break;
    case 'waiting':
    case 'confirming':
    case 'sending':
    case 'partially_paid':
    default:
      eventType = 'payment.pending';
      break;
  }

  return {
    eventType,
    paymentId: String(payment_id),
    orderId: order_id || null,
    amount: price_amount,
    currency: price_currency,
    actuallyPaid: actually_paid,
    rawStatus: payment_status,
    errorMessage: payment_status === 'failed' ? `Payment ${payment_status}` : null,
  };
}

// ── Event normalization router ─────────────────────────────────────────────────
function normalizeEvent(provider, payload) {
  if (provider === 'nowpayments') return normalizeNOWPaymentsEvent(payload);
  console.warn(`[paymentWebhook] normalizeEvent not implemented for ${provider}`);
  return null;
}

// ── Grant entitlements (only called after verified payment.completed) ─────────
async function grantEntitlement(base44, intent) {
  if (intent.payment_type === 'ppv') {
    // Create completed Payment record for PPV unlock
    await base44.asServiceRole.entities.Payment.create({
      user_id:             intent.user_id,
      amount_usd:          intent.amount,
      currency:            intent.currency || 'usd',
      payment_type:        'ppv',
      status:              'completed',
      related_entity_type: 'Video',
      related_entity_id:   intent.video_id,
      metadata: JSON.stringify({
        provider:            intent.provider,
        provider_session_id: intent.provider_session_id,
        price_tier:          intent.price_tier,
      }),
    });
    console.log('[paymentWebhook] PPV entitlement granted:', { userId: intent.user_id, videoId: intent.video_id });

  } else if (intent.payment_type === 'fanclub') {
    // One-time access pass (6mo / annual only)
    // Access period calculated from plan_id
    const ACCESS_PERIODS = {
      fanclub_6mo:    6,   // months
      fanclub_annual: 12,  // months
    };
    const months = ACCESS_PERIODS[intent.plan_id] || 1;
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + months);

    await base44.asServiceRole.entities.Subscription.create({
      user_id:                intent.user_id,
      fanclub_id:             intent.plan_id,
      status:                 'active',
      current_period_start:   new Date().toISOString(),
      current_period_end:     periodEnd.toISOString(),
      amount_usd:             intent.amount,
      stripe_subscription_id: `nowpayments_${intent.provider_session_id}`,
    });
    console.log('[paymentWebhook] Fanclub access pass granted:', { userId: intent.user_id, planId: intent.plan_id, months });

  } else if (intent.payment_type === 'guest_production_deposit') {
    // Update GuestProductionApplication deposit status
    if (intent.application_id) {
      await base44.asServiceRole.entities.GuestProductionApplication.update(intent.application_id, {
        status: 'reviewing',
        admin_notes: `Deposit payment confirmed. Provider: ${intent.provider}, Session: ${intent.provider_session_id}`,
      });

      // Also create a completed Payment record for the deposit
      await base44.asServiceRole.entities.Payment.create({
        user_id:             intent.user_id,
        amount_usd:          intent.amount,
        currency:            intent.currency || 'usd',
        payment_type:        'ppv', // closest type; 'deposit' not in enum
        status:              'completed',
        related_entity_type: 'GuestProductionApplication',
        related_entity_id:   intent.application_id,
        metadata: JSON.stringify({
          provider:            intent.provider,
          provider_session_id: intent.provider_session_id,
          payment_type:        'guest_production_deposit',
        }),
      });
    }
    console.log('[paymentWebhook] Guest Production deposit marked paid:', { userId: intent.user_id, appId: intent.application_id });
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Detect provider
    const provider = detectProviderFromHeaders(headers);
    if (!provider) {
      console.warn('[paymentWebhook] Unknown provider — no matching header');
      return Response.json({ error: 'Unknown webhook provider' }, { status: 400 });
    }

    // Verify signature FIRST — reject without DB access if invalid
    const signatureValid = await verifySignature(provider, rawBody, headers);
    if (!signatureValid) {
      console.error('[paymentWebhook] Signature verification failed for provider:', provider);
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Normalize event to common shape
    const event = normalizeEvent(provider, payload);
    if (!event) {
      return Response.json({ error: 'Could not normalize webhook event' }, { status: 422 });
    }

    console.log(`[paymentWebhook] ${provider} event:`, event.eventType, 'paymentId:', event.paymentId, 'status:', event.rawStatus);

    // Look up PaymentIntent by provider_session_id
    if (!event.paymentId && !event.orderId) {
      console.warn('[paymentWebhook] No paymentId or orderId in event — cannot match intent');
      return Response.json({ success: true, skipped: true });
    }

    // Try to find intent by provider_session_id (invoice ID) or order_id (our internal order)
    let intents = await base44.asServiceRole.entities.PaymentIntent.filter({
      provider_session_id: event.paymentId,
    });

    // Fallback: search by order_id in metadata if not found by session ID
    if (intents.length === 0 && event.orderId) {
      const allIntents = await base44.asServiceRole.entities.PaymentIntent.filter({
        provider: provider,
        status: 'pending',
      });
      intents = allIntents.filter(i => {
        try {
          const meta = JSON.parse(i.metadata || '{}');
          return meta.order_id === event.orderId;
        } catch { return false; }
      });
    }

    if (intents.length === 0) {
      console.warn('[paymentWebhook] No matching PaymentIntent for paymentId:', event.paymentId, 'orderId:', event.orderId);
      // Still return 200 so NOWPayments doesn't retry indefinitely
      return Response.json({ success: true, matched: false });
    }

    const intent = intents[0];

    // Idempotency: don't re-process already completed intents
    if (intent.status === 'completed') {
      console.log('[paymentWebhook] Intent already completed — skipping', intent.id);
      return Response.json({ success: true, duplicate: true });
    }

    // ── Handle by event type ─────────────────────────────────────────────────

    if (event.eventType === 'payment.completed') {
      // Update PaymentIntent to completed
      await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
        status:       'completed',
        completed_at: new Date().toISOString(),
        metadata: JSON.stringify({
          ...JSON.parse(intent.metadata || '{}'),
          nowpayments_payment_id: event.paymentId,
          actually_paid: event.actuallyPaid,
          raw_status: event.rawStatus,
        }),
      });

      // Grant entitlement — ONLY here, ONLY after verified completed event
      await grantEntitlement(base44, intent);

    } else if (event.eventType === 'payment.failed') {
      await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
        status:        'failed',
        failed_at:     new Date().toISOString(),
        error_message: event.errorMessage || `Payment failed (${event.rawStatus})`,
      });

    } else if (event.eventType === 'payment.cancelled') {
      await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
        status:       'cancelled',
        cancelled_at: new Date().toISOString(),
        error_message: 'Payment expired or cancelled',
      });

    } else if (event.eventType === 'payment.refunded') {
      await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
        status:        'refunded',
        error_message: 'Payment refunded',
      });

    } else {
      // payment.pending / confirming — log only, no DB update, no entitlement
      console.log('[paymentWebhook] Pending/confirming status — no action taken:', event.rawStatus);
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error('[paymentWebhook]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});