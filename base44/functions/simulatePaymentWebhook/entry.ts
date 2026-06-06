/**
 * simulatePaymentWebhook — Admin-Only Test Function
 *
 * Simulates a NOWPayments IPN/webhook payload for testing purposes.
 * This allows testing the complete payment flow without real money.
 *
 * SECURITY:
 *   - Admin-only function (role check required)
 *   - Does NOT bypass signature verification in real webhook handler
 *   - Uses the EXACT same grantEntitlement logic as paymentWebhook
 *   - Creates audit trail in PaymentIntent metadata
 *
 * USAGE:
 *   - Call with paymentIntentId and desired status
 *   - Function will simulate the webhook processing
 *   - Returns detailed results for verification
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Grant entitlements (COPY from paymentWebhook — exact same logic) ─────────
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
    console.log('[simulatePaymentWebhook] PPV entitlement granted:', { userId: intent.user_id, videoId: intent.video_id });

  } else if (intent.payment_type === 'fanclub') {
    // One-time access pass (monthly / 3mo / 6mo / annual)
    const ACCESS_PERIODS = {
      fanclub_monthly:  1,   // months
      premium_monthly:  1,   // months
      fanclub_3mo:      3,   // months
      fanclub_6mo:      6,   // months
      fanclub_annual:   12,  // months
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
    console.log('[simulatePaymentWebhook] Fanclub access pass granted:', { userId: intent.user_id, planId: intent.plan_id, months });

  } else if (intent.payment_type === 'guest_production_deposit') {
    // Update GuestProductionApplication deposit status
    if (intent.application_id) {
      await base44.asServiceRole.entities.GuestProductionApplication.update(intent.application_id, {
        status: 'reviewing',
        admin_notes: `Deposit payment confirmed (SIMULATED). Provider: ${intent.provider}, Session: ${intent.provider_session_id}`,
      });

      // Also create a completed Payment record for the deposit
      await base44.asServiceRole.entities.Payment.create({
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
          payment_type:        'guest_production_deposit',
        }),
      });
    }
    console.log('[simulatePaymentWebhook] Guest Production deposit marked paid:', { userId: intent.user_id, appId: intent.application_id });
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ADMIN-ONLY CHECK
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Admin access required',
        success: false 
      }, { status: 403 });
    }

    const body = await req.json();
    const { 
      paymentIntentId, 
      simulatedStatus,    // 'finished' | 'failed' | 'expired' | 'refunded' | 'waiting'
      actuallyPaid,       // Optional: amount actually paid (for testing partial payments)
    } = body;

    // Validate input
    if (!paymentIntentId) {
      return Response.json({ error: 'paymentIntentId required' }, { status: 400 });
    }

    const VALID_STATUSES = ['finished', 'confirmed', 'failed', 'expired', 'refunded', 'waiting', 'confirming'];
    const testStatus = simulatedStatus || 'finished';
    if (!VALID_STATUSES.includes(testStatus)) {
      return Response.json({ 
        error: `Invalid simulatedStatus. Must be one of: ${VALID_STATUSES.join(', ')}` 
      }, { status: 400 });
    }

    console.log('[simulatePaymentWebhook] Starting simulation:', { 
      paymentIntentId, 
      simulatedStatus: testStatus,
      adminUser: user.email 
    });

    // Fetch the PaymentIntent
    const intent = await base44.asServiceRole.entities.PaymentIntent.get(paymentIntentId);
    if (!intent) {
      return Response.json({ error: 'PaymentIntent not found' }, { status: 404 });
    }

    // Check idempotency — don't re-process already completed
    if (intent.status === 'completed' && testStatus === 'finished') {
      return Response.json({ 
        success: true, 
        duplicate: true,
        message: 'Intent already completed — idempotency check passed',
        intentId: paymentIntentId,
        currentStatus: intent.status,
      });
    }

    // Build simulated webhook payload (matches NOWPayments format)
    const simulatedPayload = {
      payment_id: intent.provider_session_id || 'SIMULATED_' + Date.now(),
      order_id: JSON.parse(intent.metadata || '{}').order_id || `simulated_${paymentIntentId}`,
      payment_status: testStatus,
      price_amount: intent.amount,
      price_currency: intent.currency || 'usd',
      actually_paid: actuallyPaid !== undefined ? actuallyPaid : intent.amount,
      pay_currency: JSON.parse(intent.metadata || '{}').pay_currency_strategy || 'usdttrc20',
      outcome_plan: testStatus === 'finished' ? 'finished' : testStatus,
    };

    console.log('[simulatePaymentWebhook] Simulated webhook payload:', simulatedPayload);

    // Normalize event (same logic as paymentWebhook)
    let eventType;
    switch (testStatus) {
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
      default:
        eventType = 'payment.pending';
        break;
    }

    console.log('[simulatePaymentWebhook] Normalized event:', { eventType, rawStatus: testStatus });

    // ── Process by event type (same logic as paymentWebhook) ──────────────────

    if (eventType === 'payment.completed') {
      // Update PaymentIntent to completed
      await base44.asServiceRole.entities.PaymentIntent.update(paymentIntentId, {
        status:       'completed',
        completed_at: new Date().toISOString(),
        metadata: JSON.stringify({
          ...JSON.parse(intent.metadata || '{}'),
          nowpayments_payment_id: simulatedPayload.payment_id,
          actually_paid: simulatedPayload.actually_paid,
          raw_status: testStatus,
          simulated: true,
          simulated_at: new Date().toISOString(),
          simulated_by: user.email,
        }),
      });

      // Grant entitlement — ONLY here, ONLY after completed status
      await grantEntitlement(base44, intent);

      return Response.json({
        success: true,
        action: 'payment.completed',
        intentId: paymentIntentId,
        newStatus: 'completed',
        entitlementGranted: true,
        simulatedPayload,
        message: 'Payment marked as completed and entitlements granted',
      });

    } else if (eventType === 'payment.failed') {
      await base44.asServiceRole.entities.PaymentIntent.update(paymentIntentId, {
        status:        'failed',
        failed_at:     new Date().toISOString(),
        error_message: `Payment failed (${testStatus}) [SIMULATED]`,
        metadata: JSON.stringify({
          ...JSON.parse(intent.metadata || '{}'),
          simulated: true,
          simulated_at: new Date().toISOString(),
          simulated_by: user.email,
        }),
      });

      return Response.json({
        success: true,
        action: 'payment.failed',
        intentId: paymentIntentId,
        newStatus: 'failed',
        entitlementGranted: false,
        simulatedPayload,
        message: 'Payment marked as failed — no entitlements granted',
      });

    } else if (eventType === 'payment.cancelled') {
      await base44.asServiceRole.entities.PaymentIntent.update(paymentIntentId, {
        status:        'cancelled',
        cancelled_at:  new Date().toISOString(),
        error_message: 'Payment expired or cancelled [SIMULATED]',
        metadata: JSON.stringify({
          ...JSON.parse(intent.metadata || '{}'),
          simulated: true,
          simulated_at: new Date().toISOString(),
          simulated_by: user.email,
        }),
      });

      return Response.json({
        success: true,
        action: 'payment.cancelled',
        intentId: paymentIntentId,
        newStatus: 'cancelled',
        entitlementGranted: false,
        simulatedPayload,
        message: 'Payment marked as cancelled — no entitlements granted',
      });

    } else if (eventType === 'payment.refunded') {
      await base44.asServiceRole.entities.PaymentIntent.update(paymentIntentId, {
        status:        'refunded',
        error_message: 'Payment refunded [SIMULATED]',
        metadata: JSON.stringify({
          ...JSON.parse(intent.metadata || '{}'),
          simulated: true,
          simulated_at: new Date().toISOString(),
          simulated_by: user.email,
        }),
      });

      return Response.json({
        success: true,
        action: 'payment.refunded',
        intentId: paymentIntentId,
        newStatus: 'refunded',
        entitlementGranted: false,
        simulatedPayload,
        message: 'Payment marked as refunded — no entitlements granted',
      });

    } else {
      // payment.pending / confirming — log only, no DB update, no entitlement
      return Response.json({
        success: true,
        action: 'payment.pending',
        intentId: paymentIntentId,
        currentStatus: intent.status,
        entitlementGranted: false,
        simulatedPayload,
        message: 'Pending/confirming status — no action taken (same as production webhook)',
      });
    }

  } catch (err) {
    console.error('[simulatePaymentWebhook] Error:', err);
    return Response.json({ 
      error: err.message,
      success: false 
    }, { status: 500 });
  }
});