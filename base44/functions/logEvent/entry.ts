import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const ALLOWED_EVENTS = new Set(['registration_start','registration_complete','registration_completed','otp_verified','login_success','login_failed','logout','onboarding_viewed','onboarding_completed','performer_profile_view','video_detail_view','fanclub_cta_click','fanclub_join_click','checkout_start','payment_success','payment_failed','subscription_activated','wallet_selected','wallet_spend_started','wallet_spend_completed','wallet_spend_failed','wallet_purchase_completed','wallet_purchase_failed','wallet_abandoned','topup_before_purchase','become_performer_cta_click','guest_production_cta_click','performer_apply_click','whatsapp_click','whatsapp_recruitment_click','philippines_whatsapp_click','livecam_click','video_unlock_click','fan_production_request_click','application_start','application_step_complete','application_submit','application_complete','philippines_application_start','recruitment_landing_viewed','recruitment_hero_interaction','recruitment_section_viewed','recruitment_why_viewed','recruitment_proof_viewed','recruitment_experiment_exposed','recruitment_creator_path_selected','recruitment_private_intake_started','recruitment_private_intake_completed','recruitment_private_intake_error','recruitment_verification_started','recruitment_verification_completed','recruitment_application_submitted','recruitment_credibility_faq_opened']);
const BLOCKED_KEYS = ['email','phone','r2_key','r2_keys','document','document_url','id_document','selfie','token','signed_url'];
const STRONG_DEDUPE_EVENTS = new Set(['registration_completed','otp_verified','onboarding_completed','payment_success','subscription_activated','wallet_spend_completed','wallet_purchase_completed','application_submit','application_complete','recruitment_private_intake_completed','recruitment_application_submitted','recruitment_verification_completed']);
const REPEATABLE_EVENTS = new Set(['login_failed','payment_failed','wallet_spend_failed','wallet_purchase_failed','recruitment_private_intake_error']);

function parseUserAgent(ua) {
  if (!ua) return { browser:null, operating_system:null, device_type:null };
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : null;
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : null;
  const device_type = /iPad|Tablet/.test(ua) ? 'tablet' : /Mobi|Android(?!.*Tablet)|iPhone/.test(ua) ? 'mobile' : 'desktop';
  return { browser, operating_system: os, device_type };
}
async function sha(value) {
  const data = new TextEncoder().encode(value || 'unknown');
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0,32);
}
function minuteWindow() { return new Date(Math.floor(Date.now() / 60000) * 60000).toISOString(); }
function cleanMetadata(input) {
  const out = {};
  for (const [k,v] of Object.entries(input || {})) {
    const lower = k.toLowerCase();
    if (BLOCKED_KEYS.some(b => lower.includes(b))) continue;
    if (['dedupe_key','dedupe_bucket'].includes(lower)) continue;
    if (typeof v === 'string') out[k] = v.slice(0, 180);
    else if (typeof v === 'number' || typeof v === 'boolean' || v === null) out[k] = v;
  }
  return out;
}
function stableJson(obj) {
  const sorted = {};
  for (const key of Object.keys(obj || {}).sort()) sorted[key] = obj[key];
  return JSON.stringify(sorted);
}
function bucketFor(eventName, now = Date.now()) {
  const minutes = STRONG_DEDUPE_EVENTS.has(eventName) ? 1440 : REPEATABLE_EVENTS.has(eventName) ? 1 : eventName.includes('section_viewed') ? 10 : 5;
  return `${minutes}m:${Math.floor(now / (minutes * 60000))}`;
}
async function rateLimit(base44, key, max) {
  const window_start = minuteWindow();
  const found = await base44.asServiceRole.entities.RecruitmentRateLimit.filter({ rate_key:key, window_start });
  if (found?.length) {
    const row = found[0];
    if ((row.count || 0) >= max) return false;
    await base44.asServiceRole.entities.RecruitmentRateLimit.update(row.id, { count:(row.count || 0)+1, last_seen_at:new Date().toISOString() });
    return true;
  }
  await base44.asServiceRole.entities.RecruitmentRateLimit.create({ rate_key:key, window_start, count:1, last_seen_at:new Date().toISOString() });
  return true;
}

Deno.serve(async (req) => {
  try {
    if (Number(req.headers.get('content-length') || 0) > 12000) return Response.json({ error:'Payload too large' }, { status:413 });
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event_name, user_id, source_page, metadata } = body || {};
    if (!event_name || !ALLOWED_EVENTS.has(event_name)) return Response.json({ error:'Invalid or missing event_name' }, { status:400 });

    const ipHash = await sha(req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown');
    if (!(await rateLimit(base44, `event:ip:${ipHash}`, 120))) return Response.json({ success:false, throttled:true }, { status:200 });
    if (!(await rateLimit(base44, `event:name:${ipHash}:${event_name}`, 40))) return Response.json({ success:false, throttled:true }, { status:200 });

    const uaInfo = parseUserAgent(req.headers.get('user-agent') || '');
    const cleaned = cleanMetadata(metadata || {});
    const anonymousSessionId = String(cleaned.anonymous_session_id || cleaned.session_id || user_id || ipHash).slice(0, 120);
    const meaningfulMetadata = { ...cleaned };
    delete meaningfulMetadata.anonymous_session_id;
    delete meaningfulMetadata.session_id;

    const dedupeBucket = bucketFor(event_name);
    const dedupeMaterial = stableJson({ event_name, anonymousSessionId, source_page: source_page || null, metadata: meaningfulMetadata, bucket: dedupeBucket });
    const dedupeKey = await sha(dedupeMaterial);
    const existing = await base44.asServiceRole.entities.ConversionEvent.filter({ dedupe_key: dedupeKey });
    if (existing?.length) return Response.json({ success:true, deduplicated:true, id: existing[0].id, dedupe_key: dedupeKey });

    const enrichedMetadata = { browser:uaInfo.browser, operating_system:uaInfo.operating_system, device_type:uaInfo.device_type, country:req.headers.get('cf-ipcountry') || null, referrer:req.headers.get('referer') || null, ...cleaned };
    const created = await base44.asServiceRole.entities.ConversionEvent.create({
      user_id:user_id || undefined,
      anonymous_session_id: anonymousSessionId,
      event_name,
      source_page:source_page || null,
      dedupe_key: dedupeKey,
      dedupe_bucket: dedupeBucket,
      metadata_json: JSON.stringify(enrichedMetadata),
    });
    return Response.json({ success:true, accepted:true, id:created.id, dedupe_key: dedupeKey });
  } catch (error) {
    console.error('[logEvent]', error.message);
    return Response.json({ success:false, error:error.message }, { status:200 });
  }
});