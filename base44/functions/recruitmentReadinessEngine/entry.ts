import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const ALLOWED_PATHS = new Set(['managed_40','network_70','not_sure','beginner','existing','cam','studio','couple','unsure']);
const APPROVED_STATES = new Set(['approved','contract_pending','contract_sent','contract_signed','performer_created','user_linked','active']);

function emailOk(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim()); }
function hasPhotos(app) { return (app.profile_photo_r2_keys || []).length >= 5; }
function hasVideos(app) { return !!app.intro_video_r2_key && !!app.hardcore_video_r2_key; }
function hasId(app) { return !!(app.id_document_front_r2_key || app.id_document_r2_key); }
function hasSelfie(app) { return !!app.selfie_with_id_r2_key; }
function hasConsent(app) { return !!(app.confirmed_18_plus || app.age_confirmed) && !!(app.confirmed_contact_consent || app.consent_review_materials); }
function err(field, code, message) { return { field, code, message }; }
async function sha(value) { const data = new TextEncoder().encode(value || 'unknown'); const digest = await crypto.subtle.digest('SHA-256', data); return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join(''); }

function evaluate(app, mode = 'review') {
  const errors = [];
  const warnings = [];
  const path = app.package_interest || 'not_sure';
  if (!app.applicant_name) errors.push(err('applicant_name','required','Applicant name is required.'));
  if (!emailOk(app.email)) errors.push(err('email','invalid','A valid email is required.'));
  if (!app.nationality && !app.source_country) errors.push(err('country','required','Country is required.'));
  if (!ALLOWED_PATHS.has(path)) errors.push(err('package_interest','invalid','Creator path is invalid.'));
  if (!hasConsent(app)) errors.push(err('consent','required','Age and review consent must be recorded.'));
  if (!hasPhotos(app)) errors.push(err('profile_photo_r2_keys','missing','At least 5 review photos are required.'));
  if (!hasVideos(app)) errors.push(err('videos','missing','Intro and performance videos are required.'));
  if (!hasId(app)) errors.push(err('id_document','missing','ID document is required.'));
  if (!hasSelfie(app)) errors.push(err('selfie_with_id','missing','Selfie with ID is required.'));
  if (!app.preferred_revenue_model || app.preferred_revenue_model === 'undecided') warnings.push(err('preferred_revenue_model','recommended','Revenue model should be selected before contract.'));
  if (mode === 'approval' && APPROVED_STATES.has(app.status) && !app.performer_id) warnings.push(err('status','already_approved','Application already has an approved status.'));
  return {
    ready_for_approval: errors.length === 0,
    ready_for_review: hasPhotos(app) && hasVideos(app) && hasId(app) && hasSelfie(app),
    media_complete: hasPhotos(app) && hasVideos(app),
    compliance_complete: hasId(app) && hasSelfie(app),
    errors,
    warnings,
    summary: errors.length ? `${errors.length} blocker(s)` : 'Ready',
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const body = await req.json();
    const { application_id, application, mode = 'review', token } = body || {};
    let app = application;

    if (application_id) {
      if (token) {
        const records = await base44.asServiceRole.entities.ApplicationUploadToken.filter({ token_hash: await sha(token) });
        const record = records?.[0];
        if (!record || record.application_id !== application_id || record.status !== 'issued' || new Date(record.expires_at) < new Date()) return Response.json({ error: 'Invalid token or application' }, { status: 403 });
        app = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
      } else {
        if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
        app = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
      }
    } else if (!app) {
      return Response.json({ error: 'application_id or application required' }, { status: 400 });
    }

    if (!app) return Response.json({ error: 'Application not found' }, { status: 404 });
    return Response.json({ success: true, readiness: evaluate(app, mode) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});