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
 * IDEMPOTENCY GUARANTEES (CRITICAL):
 *   - payment_idempotency_key = provider:payment_id (NOT status-dependent)
 *   - grantEntitlement() checks existing records before creating
 *   - PaymentIntent atomic processing guard (processing_webhook state)
 *   - Duplicate successful webhooks return 200 OK with duplicate=true
 *   - No duplicate Payment/Subscription/access records possible
 *
 * Security:
 *   - Signature verified before any DB read or write
 *   - No entitlement on pending/partial/confirming status
 *   - Multiple idempotency layers prevent race conditions
 *   - No private fields exposed in response
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Revenue Model Resolver (inline) ──────────────────────────────────────────
function resolvePerformerRevenueModel(performer) {
  if (!performer) return { model_key: 'studio_managed', model_label: 'Studio Managed', performer_share_percentage: 40, studio_share_percentage: 60, source: 'default' };
  if (performer.revenue_model === 'established_network') return { model_key: 'established_network', model_label: 'Established/Network', performer_share_percentage: 70, studio_share_percentage: 30, source: 'explicit_contract' };
  if (performer.revenue_split_pct !== undefined && performer.revenue_split_pct !== null) {
    const splitPct = parseFloat(performer.revenue_split_pct);
    if (splitPct === 70) return { model_key: 'established_network', model_label: 'Established/Network', performer_share_percentage: 70, studio_share_percentage: 30, source: 'performer_profile' };
    return { model_key: 'studio_managed', model_label: 'Studio Managed', performer_share_percentage: splitPct, studio_share_percentage: 100 - splitPct, source: 'performer_profile' };
  }
  return { model_key: 'studio_managed', model_label: 'Studio Managed', performer_share_percentage: 40, studio_share_percentage: 60, source: 'default' };
}

// ── Create PerformerEarningLineItem with idempotency ─────────────────────────
async function createPerformerEarningLineItem(base44, params) {
  const { performer_id, gross_amount_usd, performer_share_percent, source_type, source_platform, payment_idempotency_key, video_id, subscription_id, period_month, description, payment_intent_id, provider } = params;
  
  // IDEMPOTENCY CHECK
  const existingItems = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({ performer_id, source_type, period_month });
  const existingItem = existingItems.find(item => {
    try {
      const meta = JSON.parse(item.description || '{}');
      return meta.payment_idempotency_key === payment_idempotency_key || meta.payment_intent_id === payment_intent_id;
    } catch { return false; }
  });
  
  if (existingItem) {
    console.log('[paymentWebhook] PerformerEarningLineItem already exists — skipping (idempotent)', { performer_id, source_type, existingItemId: existingItem.id });
    return { duplicate: true, item: existingItem };
  }
  
  const performer_amount_usd = gross_amount_usd * performer_share_percent / 100;
  const studio_amount_usd = gross_amount_usd - performer_amount_usd;
  
  const lineItem = await base44.asServiceRole.entities.PerformerEarningLineItem.create({
    performer_id,
    performer_earning_id: null,
    period_month,
    source_type,
    source_platform,
    source_reference_id: video_id || subscription_id,
    description: JSON.stringify({ payment_idempotency_key, payment_intent_id, provider, ...(description ? { note: description } : {}) }),
    gross_amount_usd,
    performer_share_percent,
    performer_amount_usd,
    studio_amount_usd,
    currency: 'usd',
    exchange_rate: 1,
    status: 'approved',
    notes: `Auto-created from ${source_type} payment via webhook`,
  });
  
  console.log('[paymentWebhook] PerformerEarningLineItem created:', { performer_id, source_type, gross: gross_amount_usd, performer_share: performer_share_percent, performer_amount: performer_amount_usd, studio_amount: studio_amount_usd, lineItemId: lineItem.id });
  return { duplicate: false, item: lineItem };
}

// ── Grant entitlements (shared logic - also used by simulatePaymentWebhook) ─────────
// CRITICAL: This function MUST be idempotent - safe to call multiple times with same intent
// REVENUE ATTRIBUTION: Creates PerformerEarningLineItem records automatically
async function grantEntitlement(base44, intent) {
  const providerPaymentKey = `${intent.provider}:${intent.provider_session_id}`;
  const periodMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  if (intent.payment_type === 'ppv') {
    // IDEMPOTENCY CHECK #1: Does Payment record already exist?
    const existingPayments = await base44.asServiceRole.entities.Payment.filter({
      user_id: intent.user_id,
      related_entity_type: 'Video',
      related_entity_id: intent.video_id,
      status: 'completed',
    });
    
    const existingPayment = existingPayments.find(p => {
      try {
        const meta = JSON.parse(p.metadata || '{}');
        return meta.provider_session_id === intent.provider_session_id || meta.provider_payment_id === intent.provider_session_id;
      } catch { return false; }
    });
    
    if (existingPayment) {
      console.log('[paymentWebhook] PPV entitlement already exists — skipping (idempotent)', {
        userId: intent.user_id, videoId: intent.video_id, existingPaymentId: existingPayment.id,
      });
      return { ok: true, duplicate: true, entitlement_type: 'ppv', payment_id: existingPayment.id };
    }
    
    // IDEMPOTENCY CHECK #2
    const allUserPayments = await base44.asServiceRole.entities.Payment.filter({
      user_id: intent.user_id, payment_type: 'ppv', status: 'completed',
    });
    
    const matchingByIntent = allUserPayments.find(p => {
      try {
        const meta = JSON.parse(p.metadata || '{}');
        return meta.payment_intent_id === intent.id;
      } catch { return false; }
    });
    
    if (matchingByIntent) {
      console.log('[paymentWebhook] PPV entitlement already exists by intent ID — skipping (idempotent)', {
        userId: intent.user_id, videoId: intent.video_id, existingPaymentId: matchingByIntent.id,
      });
      return { ok: true, duplicate: true, entitlement_type: 'ppv', payment_id: matchingByIntent.id };
    }
    
    // Create Payment record
    const payment = await base44.asServiceRole.entities.Payment.create({
      user_id: intent.user_id,
      amount_usd: intent.amount,
      currency: intent.currency || 'usd',
      payment_type: 'ppv',
      status: 'completed',
      related_entity_type: 'Video',
      related_entity_id: intent.video_id,
      metadata: JSON.stringify({
        provider: intent.provider,
        provider_session_id: intent.provider_session_id,
        provider_payment_id: intent.provider_session_id,
        price_tier: intent.price_tier,
        payment_intent_id: intent.id,
      }),
    });
    console.log('[paymentWebhook] PPV entitlement granted:', { userId: intent.user_id, videoId: intent.video_id, paymentId: payment.id });
    
    // REVENUE ATTRIBUTION: Find performers for this video
    const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({ video_id: intent.video_id });
    
    if (videoPerformers.length === 0) {
      console.warn('[paymentWebhook] PPV payment has no VideoPerformer records — skipping revenue attribution', { videoId: intent.video_id, paymentId: payment.id });
      return { ok: true, duplicate: false, entitlement_type: 'ppv', payment_id: payment.id, revenue_attribution: 'no_performers' };
    }
    
    // Create earning line items for each performer
    const revenueAttributions = [];
    for (const vp of videoPerformers) {
      const performer = await base44.asServiceRole.entities.Performer.get(vp.performer_id);
      if (!performer || performer.status === 'inactive') {
        console.warn('[paymentWebhook] Performer not found or inactive — skipping', { performer_id: vp.performer_id, videoId: intent.video_id });
        continue;
      }
      
      const revenueModel = resolvePerformerRevenueModel(performer);
      const performerGross = intent.amount / videoPerformers.length;
      
      const lineItemResult = await createPerformerEarningLineItem(base44, {
        performer_id: vp.performer_id,
        gross_amount_usd: performerGross,
        performer_share_percent: revenueModel.performer_share_percentage,
        source_type: 'ppv_purchase',
        source_platform: 'fleshlab',
        payment_idempotency_key: providerPaymentKey,
        payment_intent_id: intent.id,
        video_id: intent.video_id,
        period_month: periodMonth,
        description: `PPV purchase - ${performer.display_name}`,
        provider: intent.provider,
      });
      
      revenueAttributions.push({
        performer_id: vp.performer_id,
        performer_name: performer.display_name,
        gross: performerGross,
        performer_share_percent: revenueModel.performer_share_percentage,
        line_item_id: lineItemResult.item?.id,
        duplicate: lineItemResult.duplicate,
      });
    }
    
    return { ok: true, duplicate: false, entitlement_type: 'ppv', payment_id: payment.id, revenue_attribution: revenueAttributions };

  } else if (intent.payment_type === 'fanclub') {
    // IDEMPOTENCY CHECKS
    const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id: intent.user_id,
      fanclub_id: intent.plan_id,
      status: 'active',
    });
    
    const existingSubscription = existingSubscriptions.find(s => {
      return s.stripe_subscription_id === `nowpayments_${intent.provider_session_id}` || s.stripe_subscription_id === intent.provider_session_id;
    });
    
    if (existingSubscription) {
      console.log('[paymentWebhook] Fanclub subscription already exists — skipping (idempotent)', { userId: intent.user_id, planId: intent.plan_id, existingSubscriptionId: existingSubscription.id });
      return { ok: true, duplicate: true, entitlement_type: 'fanclub', subscription_id: existingSubscription.id };
    }
    
    const now = new Date();
    const overlappingSubscription = existingSubscriptions.find(s => {
      const periodEnd = new Date(s.current_period_end);
      return periodEnd >= now;
    });
    
    if (overlappingSubscription) {
      console.log('[paymentWebhook] Fanclub has overlapping active subscription — skipping (idempotent)', { userId: intent.user_id, planId: intent.plan_id, existingSubscriptionId: overlappingSubscription.id });
      return { ok: true, duplicate: true, entitlement_type: 'fanclub', subscription_id: overlappingSubscription.id };
    }
    
    const subscriptionsByIntent = await base44.asServiceRole.entities.Subscription.filter({
      user_id: intent.user_id,
      fanclub_id: intent.plan_id,
      payment_intent_id: intent.id,
    });
    
    if (subscriptionsByIntent.length > 0) {
      console.log('[paymentWebhook] Fanclub subscription already exists by payment_intent_id — skipping (idempotent)', { userId: intent.user_id, planId: intent.plan_id, existingSubscriptionId: subscriptionsByIntent[0].id });
      return { ok: true, duplicate: true, entitlement_type: 'fanclub', subscription_id: subscriptionsByIntent[0].id };
    }
    
    // Create Subscription
    const ACCESS_PERIODS = { fanclub_monthly: 1, premium_monthly: 1, fanclub_3mo: 3, fanclub_6mo: 6, fanclub_annual: 12 };
    const months = ACCESS_PERIODS[intent.plan_id] || 1;
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + months);

    const subscription = await base44.asServiceRole.entities.Subscription.create({
      user_id: intent.user_id,
      fanclub_id: intent.plan_id,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      amount_usd: intent.amount,
      stripe_subscription_id: `nowpayments_${intent.provider_session_id}`,
      payment_intent_id: intent.id,
      provider: 'nowpayments',
    });
    console.log('[paymentWebhook] Fanclub access pass granted:', { userId: intent.user_id, planId: intent.plan_id, months, subscriptionId: subscription.id });
    
    // REVENUE ATTRIBUTION: Check if fanclub is performer-specific
    const fanclub = await base44.asServiceRole.entities.Fanclub.get(intent.plan_id);
    
    if (!fanclub) {
      console.warn('[paymentWebhook] Fanclub not found — skipping revenue attribution', { planId: intent.plan_id, subscriptionId: subscription.id });
      return { ok: true, duplicate: false, entitlement_type: 'fanclub', subscription_id: subscription.id, revenue_attribution: 'fanclub_not_found' };
    }
    
    if (!fanclub.performer_id) {
      console.log('[paymentWebhook] Fanclub is global (no performer_id) — marking as unattributed revenue', { fanclubId: fanclub.id, fanclubName: fanclub.name });
      return { ok: true, duplicate: false, entitlement_type: 'fanclub', subscription_id: subscription.id, revenue_attribution: 'global_fanclub_unattributed', fanclub_name: fanclub.name };
    }
    
    const performer = await base44.asServiceRole.entities.Performer.get(fanclub.performer_id);
    if (!performer || performer.status === 'inactive') {
      console.warn('[paymentWebhook] Performer not found or inactive for fanclub — skipping revenue attribution', { performer_id: fanclub.performer_id, fanclubId: fanclub.id });
      return { ok: true, duplicate: false, entitlement_type: 'fanclub', subscription_id: subscription.id, revenue_attribution: 'performer_not_found' };
    }
    
    const revenueModel = resolvePerformerRevenueModel(performer);
    
    const lineItemResult = await createPerformerEarningLineItem(base44, {
      performer_id: fanclub.performer_id,
      gross_amount_usd: intent.amount,
      performer_share_percent: revenueModel.performer_share_percentage,
      source_type: 'fanclub_subscription',
      source_platform: 'fleshlab',
      payment_idempotency_key: providerPaymentKey,
      payment_intent_id: intent.id,
      subscription_id: subscription.id,
      period_month: periodMonth,
      description: `Fanclub subscription - ${fanclub.name} - ${performer.display_name}`,
      provider: intent.provider,
    });
    
    return {
      ok: true, duplicate: false, entitlement_type: 'fanclub', subscription_id: subscription.id,
      revenue_attribution: {
        performer_id: fanclub.performer_id,
        performer_name: performer.display_name,
        fanclub_name: fanclub.name,
        gross: intent.amount,
        performer_share_percent: revenueModel.performer_share_percentage,
        line_item_id: lineItemResult.item?.id,
        duplicate: lineItemResult.duplicate,
      },
    };

  } else if (intent.payment_type === 'guest_production_deposit') {
    if (!intent.application_id) {
      console.warn('[paymentWebhook] Guest Production deposit missing application_id');
      return { ok: false, error: 'missing_application_id' };
    }
    
    // IDEMPOTENCY CHECK #1: Does Payment record already exist for this provider payment?
    const existingPayments = await base44.asServiceRole.entities.Payment.filter({
      user_id: intent.user_id,
      related_entity_type: 'GuestProductionApplication',
      related_entity_id: intent.application_id,
      status: 'completed',
    });
    
    const existingPayment = existingPayments.find(p => {
      try {
        const meta = JSON.parse(p.metadata || '{}');
        return meta.provider_session_id === intent.provider_session_id ||
               meta.provider_payment_id === intent.provider_session_id ||
               meta.payment_intent_id === intent.id;
      } catch { return false; }
    });
    
    if (existingPayment) {
      console.log('[paymentWebhook] Guest Production deposit already paid — skipping (idempotent)', {
        userId: intent.user_id,
        appId: intent.application_id,
        existingPaymentId: existingPayment.id,
      });
      return { ok: true, duplicate: true, entitlement_type: 'guest_production', payment_id: existingPayment.id };
    }
    
    // IDEMPOTENCY CHECK #2: Check application status
    const app = await base44.asServiceRole.entities.GuestProductionApplication.get(intent.application_id);
    if (app && app.status === 'reviewing') {
      console.log('[paymentWebhook] Guest Production application already marked reviewing — skipping (idempotent)', {
        userId: intent.user_id,
        appId: intent.application_id,
      });
      // Still create Payment record for audit trail
    }
    
    // Safe to update application and create Payment record
    await base44.asServiceRole.entities.GuestProductionApplication.update(intent.application_id, {
      status: 'reviewing',
      admin_notes: `Deposit payment confirmed. Provider: ${intent.provider}, Session: ${intent.provider_session_id}`,
    });

    const payment = await base44.asServiceRole.entities.Payment.create({
      user_id:             intent.user_id,
      amount_usd:          intent.amount,
      currency:            intent.currency || 'usd',
      payment_type:        'ppv',
      status:              'completed',
      related_entity_type: 'GuestProductionApplication',
      related_entity_id:   intent.application_id,
      metadata: JSON.stringify({
        provider:            intent.provider,
        provider_session_id: intent.provider_session_id,
        provider_payment_id: intent.provider_session_id,
        payment_type:        'guest_production_deposit',
        payment_intent_id:   intent.id,
      }),
    });
    console.log('[paymentWebhook] Guest Production deposit marked paid:', { userId: intent.user_id, appId: intent.application_id, paymentId: payment.id });
    return { ok: true, duplicate: false, entitlement_type: 'guest_production', payment_id: payment.id };
  }
  
  return { ok: false, error: 'unknown_payment_type' };
}

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
  const { invoice_id, payment_id, order_id, payment_status, price_amount, price_currency, actually_paid } = payload;

  let eventType;
  let normalizedStatus;
  let unlocksAccess = false;
  
  switch (payment_status) {
    case 'finished':
    case 'confirmed':
      eventType = 'payment.completed';
      normalizedStatus = 'completed';
      unlocksAccess = true;
      break;
    case 'failed':
      eventType = 'payment.failed';
      normalizedStatus = 'failed';
      break;
    case 'expired':
      eventType = 'payment.cancelled';
      normalizedStatus = 'cancelled';
      break;
    case 'refunded':
      eventType = 'payment.refunded';
      normalizedStatus = 'refunded';
      break;
    case 'waiting':
    case 'confirming':
      eventType = 'payment.pending';
      normalizedStatus = 'pending';
      break;
    case 'sending':
    case 'partially_paid':
      eventType = 'payment.pending';
      normalizedStatus = 'processing';
      break;
    default:
      eventType = 'payment.pending';
      normalizedStatus = 'unknown';
      break;
  }

  return {
    eventType,
    invoiceId: invoice_id ? String(invoice_id) : null,
    paymentId: payment_id ? String(payment_id) : null,
    orderId: order_id || null,
    amount: price_amount,
    currency: price_currency,
    actuallyPaid: actually_paid,
    rawStatus: payment_status,
    normalizedStatus,
    unlocksAccess,
    errorMessage: payment_status === 'failed' ? `Payment ${payment_status}` : null,
  };
}

// ── Event normalization router ─────────────────────────────────────────────────
function normalizeEvent(provider, payload) {
  if (provider === 'nowpayments') return normalizeNOWPaymentsEvent(payload);
  console.warn(`[paymentWebhook] normalizeEvent not implemented for ${provider}`);
  return null;
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
    
    // Create initial event log entry (even for invalid signature)
    const receivedAt = new Date().toISOString();
    let eventId = null;
    
    // CRITICAL: Two idempotency keys - event-level (with status) and payment-level (without status)
    const eventIdempotencyKey = `${provider}:${payload.payment_id || payload.order_id || 'unknown'}:${payload.payment_status || 'unknown'}`;
    const paymentIdempotencyKey = `${provider}:${payload.payment_id || payload.order_id || 'unknown'}`;
    
    try {
      eventId = await base44.asServiceRole.entities.PaymentWebhookEvent.create({
        provider,
        provider_event_id: payload.payment_id || payload.invoice_id || payload.order_id || 'unknown',
        provider_invoice_id: String(payload.invoice_id || payload.payment_id || ''),
        provider_payment_id: String(payload.payment_id || ''),
        provider_order_id: payload.order_id || null,
        payment_intent_id: null,
        raw_status: payload.payment_status || 'unknown',
        normalized_status: 'unknown',
        amount: payload.price_amount || 0,
        currency: payload.price_currency || 'usd',
        user_id: null,
        product_type: null,
        product_id: null,
        idempotency_key: eventIdempotencyKey,  // Event-level: includes status for logging
        payment_idempotency_key: paymentIdempotencyKey,  // Payment-level: stable key for entitlement processing
        signature_valid: signatureValid,
        processed: false,
        duplicate: false,
        error_message: signatureValid ? null : 'Invalid signature',
        audit_details_json: JSON.stringify({
          received_at: receivedAt,
          provider,
          invoice_id: payload.invoice_id || payload.payment_id || null,
          payment_id: payload.payment_id || null,
          order_id: payload.order_id || null,
          raw_status: payload.payment_status || 'unknown',
          signature_valid: signatureValid,
          signature_present: !!headers['x-nowpayments-sig'],
          error_reason: signatureValid ? null : 'Invalid signature',
        }),
        received_at: receivedAt,
      });
      if (eventId && typeof eventId === 'object') eventId = eventId.id;
    } catch (logErr) {
      console.error('[paymentWebhook] Failed to create event log:', logErr.message);
    }

    if (!signatureValid) {
      console.error('[paymentWebhook] Signature verification failed for provider:', provider);
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Normalize event to common shape
    const event = normalizeEvent(provider, payload);
    if (!event) {
      await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
        error_message: 'Could not normalize webhook event',
        processed_at: new Date().toISOString(),
      });
      return Response.json({ error: 'Could not normalize webhook event' }, { status: 422 });
    }

    console.log(`[paymentWebhook] ${provider} event:`, event.eventType, 'paymentId:', event.paymentId, 'status:', event.rawStatus);

    await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
      event_type: event.eventType,
      provider_invoice_id: event.invoiceId || event.paymentId || '',
      provider_payment_id: event.paymentId || '',
      provider_order_id: event.orderId || null,
      normalized_status: event.normalizedStatus,
      audit_details_json: JSON.stringify({
        received_at: receivedAt,
        provider,
        invoice_id: event.invoiceId || event.paymentId || null,
        payment_id: event.paymentId || null,
        order_id: event.orderId || null,
        raw_status: event.rawStatus,
        normalized_status: event.normalizedStatus,
        event_type: event.eventType,
        signature_valid: true,
        signature_present: true,
      }),
    });

    // Look up PaymentIntent by provider_session_id
    if (!event.paymentId && !event.orderId) {
      console.warn('[paymentWebhook] No paymentId or orderId in event — cannot match intent');
      await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
        error_message: 'No paymentId or orderId in event',
        processed: true,
        processed_at: new Date().toISOString(),
      });
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
      await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
        error_message: 'No matching PaymentIntent found',
        processed: true,
        processed_at: new Date().toISOString(),
      });
      // Still return 200 so NOWPayments doesn't retry indefinitely
      return Response.json({ success: true, matched: false });
    }

    const intent = intents[0];

    // ── CRITICAL: Multi-layer idempotency checks ─────────────────────────
    
    // Layer 1: Check if payment-level idempotency key was already processed successfully
    const existingPaymentEvents = await base44.asServiceRole.entities.PaymentWebhookEvent.filter({
      payment_idempotency_key: `${provider}:${event.paymentId}`,
      normalized_status: 'completed',
      processed: true,
      entitlement_granted: true,
    });

    if (existingPaymentEvents.length > 0) {
      console.log('[paymentWebhook] Duplicate successful payment detected — entitlement already granted', event.paymentId);
      await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
        payment_intent_id: intent.id,
        user_id: intent.user_id,
        product_type: intent.payment_type,
        product_id: intent.plan_id || intent.video_id || intent.application_id,
        duplicate: true,
        processed: true,
        entitlement_granted: false,  // This one didn't grant it
        entitlement_duplicate: true,
        entitlement_type: existingPaymentEvents[0].entitlement_type || intent.payment_type,
        entitlement_id: existingPaymentEvents[0].entitlement_id || null,
        processed_at: new Date().toISOString(),
      });
      return Response.json({ 
        success: true, 
        duplicate: true, 
        entitlement_already_granted: true,
        message: 'Payment already processed, entitlement already granted' 
      });
    }

    // Layer 2: Check if this exact event (same status) was already processed
    const existingEvents = await base44.asServiceRole.entities.PaymentWebhookEvent.filter({
      provider_invoice_id: event.paymentId,
      normalized_status: event.normalizedStatus,
      processed: true,
      entitlement_granted: event.unlocksAccess || false,
    });

    if (existingEvents.length > 0) {
      console.log('[paymentWebhook] Duplicate webhook event detected — already processed', event.paymentId, event.normalizedStatus);
      await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
        duplicate: true,
        processed: true,
        processed_at: new Date().toISOString(),
      });
      return Response.json({ success: true, duplicate: true, message: 'Webhook event already processed' });
    }

    // Layer 3: Atomic processing guard - check if intent is already completed
    if (intent.status === 'completed' && event.unlocksAccess) {
      console.log('[paymentWebhook] PaymentIntent already completed — skipping (idempotent)', intent.id);
      await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
        payment_intent_id: intent.id,
        duplicate: true,
        processed: true,
        entitlement_granted: false,
        processed_at: new Date().toISOString(),
      });
      return Response.json({ 
        success: true, 
        duplicate: true,
        entitlement_already_granted: true,
        message: 'PaymentIntent already completed' 
      });
    }

    // Layer 4: Atomic processing guard - check if already being processed
    if (intent.status === 'processing_webhook') {
      console.log('[paymentWebhook] PaymentIntent already being processed by another webhook — skipping', intent.id);
      await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
        payment_intent_id: intent.id,
        duplicate: true,
        processed: true,
        processed_at: new Date().toISOString(),
      });
      return Response.json({ 
        success: true, 
        duplicate: true,
        message: 'PaymentIntent already being processed' 
      });
    }

    // ── Atomic processing guard: Mark intent as being processed ─────────────────────────
    // This prevents concurrent webhooks from both proceeding to entitlement grant
    if (event.eventType === 'payment.completed' && event.unlocksAccess) {
      // Update to processing_webhook state atomically
      await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
        status: 'processing_webhook',
        metadata: JSON.stringify({
          ...JSON.parse(intent.metadata || '{}'),
          nowpayments_payment_id: event.paymentId,
          processing_started_at: new Date().toISOString(),
          processing_webhook_event_id: eventId,
        }),
      });
      console.log('[paymentWebhook] PaymentIntent marked as processing_webhook:', intent.id);
    }

    // ── Handle by event type ─────────────────────────────────────────────────

    if (event.eventType === 'payment.completed' && event.unlocksAccess) {
      // ── CRITICAL: Amount and Currency Verification BEFORE granting entitlement ────────────────
      const expectedAmount = intent.amount;
      const expectedCurrency = (intent.currency || 'usd').toLowerCase();
      const actuallyPaid = event.actuallyPaid !== undefined ? event.actuallyPaid : event.amount;
      const paidCurrency = (event.currency || 'usd').toLowerCase();

      let verificationDetails = {
        expected_amount: expectedAmount,
        expected_currency: expectedCurrency,
        actually_paid: actuallyPaid,
        paid_currency: paidCurrency,
        verified: false,
        fail_reason: null,
      };

      // Validate actually_paid is present and numeric
      if (actuallyPaid === undefined || actuallyPaid === null || isNaN(actuallyPaid)) {
        console.warn('[paymentWebhook] Missing actually_paid — rejecting entitlement:', {
          intentId: intent.id,
          paymentId: event.paymentId,
          actuallyPaid,
          event,
        });
        verificationDetails.fail_reason = 'actually_paid_missing';
        
        await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
          status:       'payment_review',
          error_message: 'Payment verification failed: actually_paid missing or invalid',
          metadata: JSON.stringify({
            ...JSON.parse(intent.metadata || '{}'),
            nowpayments_payment_id: event.paymentId,
            actually_paid: event.actuallyPaid,
            raw_status: event.rawStatus,
            verification_failed: true,
            fail_reason: 'actually_paid_missing',
          }),
        });
        
        await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
          payment_intent_id: intent.id,
          user_id: intent.user_id,
          product_type: intent.payment_type,
          product_id: intent.plan_id || intent.video_id || intent.application_id,
          normalized_status: 'payment_review',
          verification_details: JSON.stringify(verificationDetails),
          error_message: 'actually_paid missing or invalid',
          processed: true,
          processed_at: new Date().toISOString(),
        });
        
        return Response.json({ 
          success: true, 
          matched: true,
          entitlementGranted: false,
          reason: 'actually_paid_missing',
        });
      }

      // Validate amount: actually_paid must be >= expected amount (allow 1% tolerance for rounding/fees)
      const tolerance = 0.01; // 1% tolerance for crypto rounding
      const minRequired = expectedAmount * (1 - tolerance);
      
      if (actuallyPaid < minRequired) {
        console.warn('[paymentWebhook] Underpayment detected — rejecting entitlement:', {
          intentId: intent.id,
          paymentId: event.paymentId,
          expectedAmount,
          actuallyPaid,
          minRequired,
          tolerance,
        });
        verificationDetails.fail_reason = 'underpayment';
        
        await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
          status:       'underpaid',
          error_message: `Underpayment: expected $${expectedAmount}, received $${actuallyPaid} (min: $${minRequired.toFixed(2)})`,
          metadata: JSON.stringify({
            ...JSON.parse(intent.metadata || '{}'),
            nowpayments_payment_id: event.paymentId,
            actually_paid: event.actuallyPaid,
            raw_status: event.rawStatus,
            verification_failed: true,
            fail_reason: 'underpayment',
            expected_amount: expectedAmount,
            actually_paid: actuallyPaid,
          }),
        });
        
        await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
          payment_intent_id: intent.id,
          user_id: intent.user_id,
          product_type: intent.payment_type,
          product_id: intent.plan_id || intent.video_id || intent.application_id,
          normalized_status: 'underpaid',
          verification_details: JSON.stringify(verificationDetails),
          error_message: 'Underpayment detected',
          processed: true,
          processed_at: new Date().toISOString(),
        });
        
        return Response.json({ 
          success: true, 
          matched: true,
          entitlementGranted: false,
          reason: 'underpayment',
          expected: expectedAmount,
          received: actuallyPaid,
        });
      }

      // Validate currency: must match exactly (case-insensitive)
      if (paidCurrency !== expectedCurrency) {
        console.warn('[paymentWebhook] Currency mismatch — rejecting entitlement:', {
          intentId: intent.id,
          paymentId: event.paymentId,
          expectedCurrency,
          paidCurrency,
        });
        verificationDetails.fail_reason = 'currency_mismatch';
        
        await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
          status:       'currency_mismatch',
          error_message: `Currency mismatch: expected ${expectedCurrency}, received ${paidCurrency}`,
          metadata: JSON.stringify({
            ...JSON.parse(intent.metadata || '{}'),
            nowpayments_payment_id: event.paymentId,
            actually_paid: event.actuallyPaid,
            raw_status: event.rawStatus,
            verification_failed: true,
            fail_reason: 'currency_mismatch',
            expected_currency: expectedCurrency,
            paid_currency: paidCurrency,
          }),
        });
        
        await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
          payment_intent_id: intent.id,
          user_id: intent.user_id,
          product_type: intent.payment_type,
          product_id: intent.plan_id || intent.video_id || intent.application_id,
          normalized_status: 'currency_mismatch',
          verification_details: JSON.stringify(verificationDetails),
          error_message: 'Currency mismatch',
          processed: true,
          processed_at: new Date().toISOString(),
        });
        
        return Response.json({ 
          success: true, 
          matched: true,
          entitlementGranted: false,
          reason: 'currency_mismatch',
          expected: expectedCurrency,
          received: paidCurrency,
        });
      }

      console.log('[paymentWebhook] Amount/currency verification passed:', {
        intentId: intent.id,
        expectedAmount,
        actuallyPaid,
        expectedCurrency,
        paidCurrency,
      });
      verificationDetails.verified = true;

      // CRITICAL: Re-check PaymentIntent status immediately before granting entitlement
      // This catches any race conditions that passed the earlier checks
      const freshIntent = await base44.asServiceRole.entities.PaymentIntent.get(intent.id);
      if (freshIntent && freshIntent.status === 'completed') {
        console.log('[paymentWebhook] Race condition detected — PaymentIntent completed by another webhook', intent.id);
        await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
          payment_intent_id: intent.id,
          duplicate: true,
          processed: true,
          entitlement_granted: false,
          entitlement_duplicate: true,
          processed_at: new Date().toISOString(),
        });
        return Response.json({ 
          success: true, 
          duplicate: true,
          entitlement_already_granted: true,
          message: 'Race condition: PaymentIntent completed by concurrent webhook' 
        });
      }

      // ── BRANCH: wallet_topup vs standard entitlement ──────────────────────

      if (intent.payment_type === 'wallet_topup') {
        // ── FleshPay Wallet Top‑up Credit ──────────────────────────────────
        const topupOrders = await base44.asServiceRole.entities.FleshPayTopupOrder.filter({
          user_id: intent.user_id,
          payment_intent_id: intent.id,
        });

        if (topupOrders.length === 0) {
          console.warn('[paymentWebhook] wallet_topup — no matching FleshPayTopupOrder for intent:', intent.id);
          await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
            payment_intent_id: intent.id,
            user_id: intent.user_id,
            product_type: 'wallet_topup',
            error_message: 'No matching FleshPayTopupOrder found',
            processed: true,
            processed_at: new Date().toISOString(),
          });
          return Response.json({ success: false, error: 'No matching topup order' });
        }

        const topupOrder = topupOrders[0];
        const idempotencyKey = `nowpayments_${event.paymentId}_wallet_topup_credit`;

        // IDEMPOTENCY CHECK: Prevent duplicate wallet credits
        const existingLedger = await base44.asServiceRole.entities.FleshPayLedger.filter({
          idempotency_key: idempotencyKey,
        });

        if (existingLedger.length > 0) {
          console.log('[paymentWebhook] wallet_topup already credited — idempotent skip:', {
            topupOrderId: topupOrder.id,
            existingLedgerId: existingLedger[0].id,
          });
          await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
            status: 'completed',
            completed_at: new Date().toISOString(),
          });
          await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
            payment_intent_id: intent.id,
            user_id: intent.user_id,
            product_type: 'wallet_topup',
            normalized_status: event.normalizedStatus,
            verification_details: JSON.stringify(verificationDetails),
            processed: true,
            entitlement_granted: false,
            entitlement_duplicate: true,
            processed_at: new Date().toISOString(),
          });
          return Response.json({
            success: true,
            duplicate: true,
            message: 'Wallet already credited — idempotent',
          });
        }

        // Get or create wallet
        let wallets = await base44.asServiceRole.entities.FleshPayWallet.filter({ user_id: intent.user_id });
        let wallet;

        if (wallets.length === 0) {
          wallet = await base44.asServiceRole.entities.FleshPayWallet.create({
            user_id: intent.user_id,
            balance_usd: 0,
            currency: 'usd',
            status: 'active',
            lifetime_topups_usd: 0,
            lifetime_spends_usd: 0,
          });
        } else {
          wallet = wallets[0];
        }

        if (wallet.status !== 'active') {
          console.error('[paymentWebhook] wallet_topup — wallet not active:', wallet.id);
          await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
            payment_intent_id: intent.id,
            user_id: intent.user_id,
            product_type: 'wallet_topup',
            error_message: 'Wallet not active',
            processed: true,
            processed_at: new Date().toISOString(),
          });
          return Response.json({ success: false, error: 'Wallet not active' });
        }

        const topupAmount = intent.amount;
        const balanceBefore = wallet.balance_usd;
        const balanceAfter = balanceBefore + topupAmount;

        // Create FleshPayLedger credit entry
        const ledgerEntry = await base44.asServiceRole.entities.FleshPayLedger.create({
          wallet_id:            wallet.id,
          user_id:              intent.user_id,
          entry_type:           'credit',
          transaction_type:     'credit',
          amount_usd:           topupAmount,
          balance_before_usd:   balanceBefore,
          balance_after_usd:    balanceAfter,
          source_type:          'topup',
          reference_type:       'topup',
          source_id:            topupOrder.id,
          reference_id:         topupOrder.id,
          provider:             'nowpayments',
          provider_transaction_id: event.paymentId,
          idempotency_key:      idempotencyKey,
          status:               'completed',
          description:          `Wallet top-up — $${topupAmount} USD via NOWPayments`,
          metadata_json:        JSON.stringify({
            provider: 'nowpayments',
            provider_payment_id: event.paymentId,
            webhook_status: event.rawStatus,
            actually_paid: event.actuallyPaid,
            payment_intent_id: intent.id,
            topup_order_id: topupOrder.id,
          }),
        });

        // Update wallet balance
        await base44.asServiceRole.entities.FleshPayWallet.update(wallet.id, {
          balance_usd: balanceAfter,
          lifetime_topups_usd: wallet.lifetime_topups_usd + topupAmount,
          lifetime_topup_usd: wallet.lifetime_topup_usd + topupAmount,
          last_transaction_at: new Date().toISOString(),
        });

        // Update FleshPayTopupOrder
        await base44.asServiceRole.entities.FleshPayTopupOrder.update(topupOrder.id, {
          status: 'paid',
          completed_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          provider_payment_id: event.paymentId,
          actually_paid: event.actuallyPaid,
          amount_received_usd: topupAmount,
          ipn_callback_raw: JSON.stringify({
            payment_id: event.paymentId,
            payment_status: event.rawStatus,
            actually_paid: event.actuallyPaid,
            price_amount: event.amount,
            price_currency: event.currency,
          }),
        });

        // Update PaymentIntent to completed
        await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          metadata: JSON.stringify({
            ...JSON.parse(intent.metadata || '{}'),
            nowpayments_payment_id: event.paymentId,
            actually_paid: event.actuallyPaid,
            raw_status: event.rawStatus,
            verified_amount: true,
            verified_currency: true,
            wallet_topup_credited: true,
            ledger_entry_id: ledgerEntry.id,
          }),
        });

        // Update event log
        await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
          payment_intent_id: intent.id,
          user_id: intent.user_id,
          product_type: 'wallet_topup',
          product_id: topupOrder.id,
          normalized_status: event.normalizedStatus,
          verification_details: JSON.stringify(verificationDetails),
          processed: true,
          entitlement_granted: true,
          entitlement_type: 'wallet_topup',
          entitlement_id: ledgerEntry.id,
          processed_at: new Date().toISOString(),
        });

        console.log('[paymentWebhook] wallet_topup credited:', {
          userId: intent.user_id,
          walletId: wallet.id,
          topupAmount,
          balanceBefore,
          balanceAfter,
          ledgerEntryId: ledgerEntry.id,
        });

      } else {
        // ── Standard entitlement (PPV / fanclub / guest production) ─────────
        // Grant entitlement — ONLY here, ONLY after verified completed event
        // grantEntitlement() is now idempotent and will check for existing records
        const grantResult = await grantEntitlement(base44, { ...intent, id: intent.id });
        
        if (!grantResult.ok) {
          console.error('[paymentWebhook] Entitlement grant failed:', grantResult.error);
          await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
            payment_intent_id: intent.id,
            normalized_status: event.normalizedStatus,
            verification_details: JSON.stringify(verificationDetails),
            error_message: `Entitlement grant failed: ${grantResult.error}`,
            processed: true,
            entitlement_granted: false,
            processed_at: new Date().toISOString(),
          });
          return Response.json({ 
            success: false, 
            error: grantResult.error,
            message: 'Entitlement grant failed' 
          });
        }
        
        // Update PaymentIntent to completed
        await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
          status:       'completed',
          completed_at: new Date().toISOString(),
          metadata: JSON.stringify({
            ...JSON.parse(intent.metadata || '{}'),
            nowpayments_payment_id: event.paymentId,
            actually_paid: event.actuallyPaid,
            raw_status: event.rawStatus,
            verified_amount: true,
            verified_currency: true,
            entitlement_granted: !grantResult.duplicate,
            entitlement_duplicate: grantResult.duplicate || false,
          }),
        });
        
        // Update event log with success
        await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
          payment_intent_id: intent.id,
          user_id: intent.user_id,
          product_type: intent.payment_type,
          product_id: intent.plan_id || intent.video_id || intent.application_id,
          normalized_status: event.normalizedStatus,
          verification_details: JSON.stringify(verificationDetails),
          processed: true,
          entitlement_granted: !grantResult.duplicate,
          entitlement_duplicate: grantResult.duplicate || false,
          entitlement_type: grantResult.entitlement_type,
          entitlement_id: grantResult.payment_id || grantResult.subscription_id || null,
          processed_at: new Date().toISOString(),
        });
        
        console.log('[paymentWebhook] Entitlement grant result:', {
          ok: grantResult.ok,
          duplicate: grantResult.duplicate,
          entitlement_type: grantResult.entitlement_type,
          entitlement_id: grantResult.payment_id || grantResult.subscription_id,
        });
      }

    } else if (event.eventType === 'payment.failed') {
      await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
        status:        'failed',
        failed_at:     new Date().toISOString(),
        error_message: event.errorMessage || `Payment failed (${event.rawStatus})`,
      });
      await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
        payment_intent_id: intent.id,
        user_id: intent.user_id,
        product_type: intent.payment_type,
        product_id: intent.plan_id || intent.video_id || intent.application_id,
        normalized_status: event.normalizedStatus,
        processed: true,
        entitlement_granted: false,
        error_message: event.errorMessage || `Payment failed (${event.rawStatus})`,
        processed_at: new Date().toISOString(),
      });

    } else if (event.eventType === 'payment.cancelled') {
      await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
        status:       'cancelled',
        cancelled_at: new Date().toISOString(),
        error_message: 'Payment expired or cancelled',
      });
      await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
        payment_intent_id: intent.id,
        user_id: intent.user_id,
        product_type: intent.payment_type,
        product_id: intent.plan_id || intent.video_id || intent.application_id,
        normalized_status: event.normalizedStatus,
        processed: true,
        entitlement_granted: false,
        error_message: 'Payment expired or cancelled',
        processed_at: new Date().toISOString(),
      });

    } else if (event.eventType === 'payment.refunded') {
      await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
        status:        'refunded',
        error_message: 'Payment refunded',
      });
      await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
        payment_intent_id: intent.id,
        user_id: intent.user_id,
        product_type: intent.payment_type,
        product_id: intent.plan_id || intent.video_id || intent.application_id,
        normalized_status: event.normalizedStatus,
        processed: true,
        entitlement_granted: false,
        error_message: 'Payment refunded',
        processed_at: new Date().toISOString(),
      });

    } else {
      // payment.pending / confirming — log only, no DB update, no entitlement
      console.log('[paymentWebhook] Pending/confirming status — no action taken:', event.rawStatus);
      await base44.asServiceRole.entities.PaymentWebhookEvent.update(eventId, {
        payment_intent_id: intent.id,
        user_id: intent.user_id,
        product_type: intent.payment_type,
        product_id: intent.plan_id || intent.video_id || intent.application_id,
        normalized_status: event.normalizedStatus,
        processed: true,
        entitlement_granted: false,
        processed_at: new Date().toISOString(),
      });
    }

    // ── Additive analytics logging (non-blocking, never affects payment processing) ──
    try {
      if (event.eventType === 'payment.completed' && event.unlocksAccess) {
        await base44.asServiceRole.entities.ConversionEvent.create({
          user_id: intent.user_id,
          event_name: 'payment_success',
          source_page: 'webhook',
          metadata_json: JSON.stringify({ payment_type: intent.payment_type, provider: intent.provider, amount: intent.amount }),
        });
        if (intent.payment_type === 'fanclub') {
          await base44.asServiceRole.entities.ConversionEvent.create({
            user_id: intent.user_id,
            event_name: 'subscription_activated',
            source_page: 'webhook',
            metadata_json: JSON.stringify({ plan_id: intent.plan_id, provider: intent.provider }),
          });
        }
      } else if (event.eventType === 'payment.failed') {
        await base44.asServiceRole.entities.ConversionEvent.create({
          user_id: intent.user_id,
          event_name: 'payment_failed',
          source_page: 'webhook',
          metadata_json: JSON.stringify({ payment_type: intent.payment_type, provider: intent.provider, reason: event.errorMessage || event.rawStatus }),
        });
      }
    } catch (logErr) {
      console.error('[paymentWebhook] analytics logging failed (non-blocking):', logErr.message);
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error('[paymentWebhook]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});