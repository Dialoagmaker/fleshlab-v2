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
  'wallet_selected',
  'wallet_spend_started',
  'wallet_spend_completed',
  'wallet_spend_failed',
  'wallet_purchase_completed',
  'wallet_purchase_failed',
  'wallet_abandoned',
  'topup_before_purchase',
  'recruitment_landing_viewed',
  'recruitment_hero_interaction',
  'recruitment_section_viewed',
  'recruitment_why_viewed',
  'recruitment_proof_viewed',
  'recruitment_experiment_exposed',
  'recruitment_creator_path_selected',
  'recruitment_private_intake_started',
  'recruitment_private_intake_completed',
  'recruitment_private_intake_error',
  'recruitment_verification_started',
  'recruitment_verification_completed',
  'recruitment_application_submitted',
  'recruitment_credibility_faq_opened',
]);

// Lightweight User-Agent parser — best-effort browser/OS/device detection.
// Never throws; falls back to 'unknown' fields on parse failure.
function parseUserAgent(ua) {
  if (!ua) return { browser: null, browser_version: null, operating_system: null, device_type: null };
  const browserMatch =
    ua.match(/Edg\/([\d.]+)/) ? ['Edge', RegExp.$1] :
    ua.match(/OPR\/([\d.]+)/) ? ['Opera', RegExp.$1] :
    ua.match(/Chrome\/([\d.]+)/) ? ['Chrome', RegExp.$1] :
    ua.match(/Firefox\/([\d.]+)/) ? ['Firefox', RegExp.$1] :
    ua.match(/Version\/([\d.]+).*Safari/) ? ['Safari', RegExp.$1] :
    [null, null];

  const os =
    /Windows/.test(ua) ? 'Windows' :
    /Mac OS X/.test(ua) ? 'macOS' :
    /Android/.test(ua) ? 'Android' :
    /iPhone|iPad|iOS/.test(ua) ? 'iOS' :
    /Linux/.test(ua) ? 'Linux' : null;

  const device_type =
    /iPad|Tablet/.test(ua) ? 'tablet' :
    /Mobi|Android(?!.*Tablet)|iPhone/.test(ua) ? 'mobile' : 'desktop';

  return { browser: browserMatch[0], browser_version: browserMatch[1], operating_system: os, device_type };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event_name, user_id, source_page, metadata } = body || {};

    if (!event_name || !ALLOWED_EVENTS.has(event_name)) {
      return Response.json({ error: 'Invalid or missing event_name' }, { status: 400 });
    }

    // Server-side enrichment — never overwrites fields already present in metadata
    const ua = req.headers.get('user-agent') || '';
    const uaInfo = parseUserAgent(ua);
    const country = req.headers.get('cf-ipcountry') || null;
    const referrer = req.headers.get('referer') || null;

    const enrichedMetadata = {
      browser: uaInfo.browser,
      browser_version: uaInfo.browser_version,
      operating_system: uaInfo.operating_system,
      device_type: uaInfo.device_type,
      country,
      referrer,
      ...(metadata || {}),
    };

    const created = await base44.asServiceRole.entities.ConversionEvent.create({
      user_id: user_id || undefined,
      event_name,
      source_page: source_page || null,
      metadata_json: JSON.stringify(enrichedMetadata),
    });

    return Response.json({ success: true, id: created.id });
  } catch (error) {
    // Never let logging errors surface loudly — this is best-effort telemetry
    console.error('[logEvent]', error.message);
    return Response.json({ success: false, error: error.message }, { status: 200 });
  }
});