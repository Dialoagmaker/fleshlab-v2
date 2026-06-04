/**
 * paymentWebhook — Backend Function
 *
 * Receives inbound webhooks from CCBill / Segpay.
 * Verifies signature, updates PaymentIntent, grants entitlements.
 *
 * Security:
 *  - Signature verified BEFORE any DB writes
 *  - Entitlements only granted on payment.completed events
 *  - Idempotent: duplicate webhooks safe (status check before update)
 *
 * Required env vars:
 *   CCBILL_WEBHOOK_SECRET  (for CCBill signature verification)
 *   SEGPAY_WEBHOOK_SECRET  (for Segpay signature verification)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Provider detection from headers ──────────────────────────────────────────
function detectProviderFromHeaders(headers) {
  if (headers['x-ccbill-signature'] || headers['x-ccbill-event']) return 'ccbill';
  if (headers['x-segpay-signature'] || headers['x-segpay-event'])  return 'segpay';
  return null;
}

// ── Signature verification stubs ─────────────────────────────────────────────
async function verifySignature(provider, rawBody, headers) {
  if (provider === 'ccbill') {
    const secret = Deno.env.get('CCBILL_WEBHOOK_SECRET');
    if (!secret) {
      console.warn('[paymentWebhook] CCBILL_WEBHOOK_SECRET not set — rejecting');
      return false;
    }
    // TODO: implement HMAC-SHA256 with secret
    // const sig = headers['x-ccbill-signature'];
    // const expected = await hmacSha256(secret, rawBody);
    // return sig === expected;
    console.warn('[paymentWebhook] CCBill signature verification not implemented yet');
    return false;
  }

  if (provider === 'segpay') {
    const secret = Deno.env.get('SEGPAY_WEBHOOK_SECRET');
    if (!secret) {
      console.warn('[paymentWebhook] SEGPAY_WEBHOOK_SECRET not set — rejecting');
      return false;
    }
    // TODO: implement Segpay-specific verification
    console.warn('[paymentWebhook] Segpay signature verification not implemented yet');
    return false;
  }

  return false;
}

// ── Event normalization stubs ─────────────────────────────────────────────────
function normalizeEvent(provider, payload) {
  // TODO: parse provider-specific payload into common shape
  // Common shape: { eventType, paymentId, userId, amount, currency, paymentType, metadata }
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
      return Response.json({ error: 'Unknown webhook provider' }, { status: 400 });
    }

    // Verify signature FIRST — reject without DB access if invalid
    const signatureValid = await verifySignature(provider, rawBody, headers);
    if (!signatureValid) {
      console.error('[paymentWebhook] Signature verification failed for', provider);
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Normalize event
    const event = normalizeEvent(provider, payload);
    if (!event) {
      return Response.json({ error: 'Could not normalize webhook event' }, { status: 422 });
    }

    // Update PaymentIntent status
    if (event.paymentId) {
      const intents = await base44.asServiceRole.entities.PaymentIntent.filter({
        provider_session_id: event.paymentId,
      });

      if (intents.length > 0) {
        const intent = intents[0];

        // Idempotency: don't re-process completed intents
        if (intent.status === 'completed') {
          console.log('[paymentWebhook] Already completed, skipping', intent.id);
          return Response.json({ success: true, duplicate: true });
        }

        if (event.eventType === 'payment.completed') {
          await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
            status: 'completed',
            completed_at: new Date().toISOString(),
          });

          // ── Grant entitlements ───────────────────────────────────────────
          // IMPORTANT: entitlements granted HERE — only after verified webhook
          if (intent.payment_type === 'fanclub') {
            // TODO: create Subscription record for user
            console.log('[paymentWebhook] TODO: grant fanclub entitlement', {
              userId: intent.user_id, planId: intent.plan_id,
            });
          } else if (intent.payment_type === 'ppv') {
            // TODO: create PPV access record for user + video
            console.log('[paymentWebhook] TODO: grant PPV entitlement', {
              userId: intent.user_id, videoId: intent.video_id,
            });
          } else if (intent.payment_type === 'guest_production_deposit') {
            // TODO: update GuestProductionApplication status to deposit_paid
            console.log('[paymentWebhook] TODO: mark deposit paid', {
              userId: intent.user_id, applicationId: intent.application_id,
            });
          }
        } else if (event.eventType === 'payment.failed') {
          await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
            status: 'failed',
            failed_at: new Date().toISOString(),
            error_message: event.errorMessage || 'Payment failed',
          });
        }
      } else {
        console.warn('[paymentWebhook] No matching PaymentIntent for', event.paymentId);
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('[paymentWebhook]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});