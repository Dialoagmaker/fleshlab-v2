/**
 * logEvent — lightweight internal analytics logging endpoint.
 *
 * Persists conversion/activity events to the ConversionEvent entity.
 * Called both from authenticated and unauthenticated contexts
 * (e.g. registration_start / login_failed happen before a session exists),
 * so this endpoint does NOT require auth — it only accepts a whitelisted
 * set of event names to prevent abuse.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_EVENTS = new Set([
  'registration_start',
  'registration_completed',
  'otp_verified',
  'login_success',
  'login_failed',
  'logout',
  'onboarding_viewed',
  'onboarding_completed',
  'performer_profile_view',
  'video_detail_view',
  'fanclub_cta_click',
  'checkout_start',
  'payment_success',
  'payment_failed',
  'subscription_activated',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event_name, user_id, source_page, metadata } = body || {};

    if (!event_name || !ALLOWED_EVENTS.has(event_name)) {
      return Response.json({ error: 'Invalid or missing event_name' }, { status: 400 });
    }

    await base44.asServiceRole.entities.ConversionEvent.create({
      user_id: user_id || undefined,
      event_name,
      source_page: source_page || null,
      metadata_json: metadata ? JSON.stringify(metadata) : null,
    });

    return Response.json({ success: true });
  } catch (error) {
    // Never let logging errors surface loudly — this is best-effort telemetry
    console.error('[logEvent]', error.message);
    return Response.json({ success: false, error: error.message }, { status: 200 });
  }
});