import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import {
  buildDistributionIdempotencyKey,
  calculateAgeAt,
  calculateRevenueSplit,
  matchesOfficialPlatformDomain,
  parseCanonicalCsv,
  validatePlatformMetadata,
  validatePublicationReadiness,
} from '../shared/distributionPolicy.js';

const REGISTRY_SEEDS = [
  {
    platform_key: 'loyalfans', name: 'LoyalFans', partner_program: 'Creator account', priority: 'P0',
    official_url: 'https://www.loyalfans.com/', application_url: 'https://www.loyalfans.com/',
    evidence_url: 'https://www.loyalfans.com/legal/creator-supplement', evidence_verified_at: '2026-10-14T00:00:00.000Z',
    evidence_summary: 'Creator Supplement states a 20% platform fee on Fan Payments (80% to the creator, before tax) and says account registration is for the creator’s own use. Confirm FLESHLAB-managed account eligibility and any delegated access directly with LoyalFans.',
    workflow_status: 'RESEARCHED', studio_eligibility: 'REQUIRES_REVIEW', approval_status: 'NOT_REQUESTED',
    integration_mode: 'OPERATOR_ASSISTED', authentication_status: 'UNCONNECTED', monetization_model: 'MIXED',
    revenue_share_terms: 'Official Creator Supplement: 20% platform fee / 80% creator earnings on Fan Payments, exclusive of tax; check current account-specific promotions and payout terms.',
    upload_capabilities: 'Creator account offers uploads; no authorized public API or bulk-feed capability verified for this studio.',
    reporting_capabilities: 'Operator export/import capability not verified; use official account reports.',
    content_rules: 'Co-authored content requires appropriate tagging/account information or verified age, identity and written informed consent as required by the Terms.',
    exclusivity_notes: 'No exclusivity conclusion recorded; review current account and content terms before publication.',
    next_action: 'Confirm existing FLESHLAB creator account, authorized operator access, bulk upload options and reporting export.',
  },
  {
    platform_key: 'faphouse', name: 'FapHouse', partner_program: 'Registered Studio Operator', priority: 'P0',
    official_url: 'https://faphouse.com/', application_url: 'https://studio.faphouse.com/',
    evidence_url: 'https://faphouse2.com/pages/trust-and-safety', evidence_verified_at: '2026-10-14T00:00:00.000Z',
    evidence_summary: 'Official Trust and Safety page links Registered Studio Operator terms and says only verified operators can upload; legal entities undergo company verification and KYC. Approval and account state for FLESHLAB are not confirmed here.',
    workflow_status: 'RESEARCHED', studio_eligibility: 'STUDIO_OR_PRODUCER', approval_status: 'NOT_REQUESTED',
    integration_mode: 'OPERATOR_ASSISTED', authentication_status: 'UNCONNECTED', monetization_model: 'MIXED',
    revenue_share_terms: 'Not established from the reviewed official source; obtain the current account-specific agreement.',
    upload_capabilities: 'Verified studio operator access is required. Public API, feed or bulk upload capability not verified.',
    reporting_capabilities: 'Not verified from reviewed public material.',
    content_rules: 'Follow the current Registered Studio Operator terms and record-keeping requirements; human approval required.',
    exclusivity_notes: 'Review signed studio terms and per-title restrictions before cross-posting.',
    next_action: 'Verify the active FLESHLAB studio account, approval, revenue terms, bulk upload and reporting capabilities.',
  },
  {
    platform_key: 'xhamster', name: 'xHamster', partner_program: 'Creator / monetization program', priority: 'P0',
    official_url: 'https://xhamster.com/', application_url: 'https://xhamster.com/',
    evidence_url: 'https://xhamster.com/info/terms', evidence_verified_at: '2026-10-14T00:00:00.000Z',
    evidence_summary: 'Current official terms say creators must apply and be accepted into the Creators’ Program; verified members also must enter a separate Ad Revenue Agreement before they can publish and monetize where applicable. This does not establish FLESHLAB studio acceptance or an API/bulk-feed right.',
    workflow_status: 'RESEARCHED', studio_eligibility: 'REQUIRES_REVIEW', approval_status: 'NOT_REQUESTED',
    integration_mode: 'OPERATOR_ASSISTED', authentication_status: 'UNCONNECTED', monetization_model: 'AD_REVENUE',
    revenue_share_terms: 'No current studio revenue percentage verified; review the Ad Revenue Agreement before accepting or publishing.',
    upload_capabilities: 'Verified-member creator program and uploads are described in the current terms; studio-managed account eligibility, API and bulk upload are not verified.',
    reporting_capabilities: 'Partner reporting export/API not verified.',
    content_rules: 'Creator program application and a separate Ad Revenue Agreement are required before publication/monetization where applicable. Confirm current co-performer releases and recordkeeping terms.',
    next_action: 'Ask xHamster to confirm studio/producer onboarding, delegated access, revenue terms, payout eligibility, reporting exports and approved bulk upload.',
  },
  {
    platform_key: 'pornhub', name: 'Pornhub', partner_program: 'Content Partner Program', priority: 'P1',
    official_url: 'https://www.pornhub.com/', application_url: 'https://www.pornhub.lifestyle/partners/cpp',
    evidence_url: 'https://help.pornhub.lifestyle/hc/en-us/articles/4419872356243-How-do-I-join', evidence_verified_at: '2026-10-14T00:00:00.000Z',
    evidence_summary: 'Official help says partners apply and undergo review; selected scenes may require performer ID/release records and production safety/compliance evidence. Do not submit legally binding declarations or share site credentials through this app.',
    workflow_status: 'RESEARCHED', studio_eligibility: 'APPLICATION_REQUIRED', approval_status: 'NOT_REQUESTED',
    integration_mode: 'OPERATOR_ASSISTED', authentication_status: 'UNCONNECTED', monetization_model: 'AD_REVENUE',
    revenue_share_terms: 'Studio-specific share not verified. Do not infer model-program terms apply to the Content Partner Program.',
    upload_capabilities: 'Application and compliance review documented; approved upload method and API/bulk capability not verified.',
    reporting_capabilities: 'Partner-specific exports/API not verified.',
    content_rules: 'Selected scenes may require 2257 records, performer releases and valid IDs; additional production safety evidence may be requested.',
    exclusivity_notes: 'Treat network properties as separate destinations unless the signed partner agreement explicitly grants broader rights.',
    next_action: 'Prepare a non-binding application draft; confirm eligibility, secure submission channel and current partner commercial terms.',
  },
  {
    platform_key: 'clips4sale', name: 'Clips4Sale', partner_program: 'Creator / authorized content reseller', priority: 'P1',
    official_url: 'https://www.clips4sale.com/', application_url: 'https://www.clips4sale.com/user/signup#creator',
    evidence_url: 'https://clips4salecreator.freshdesk.com/en/support/solutions/articles/151000157732-learn-about-what-c4s-offers-you-', evidence_verified_at: '2026-10-14T00:00:00.000Z',
    evidence_summary: 'Official creator support says approved creators and authorized resellers can open a store and upload through the site. It states 60% of clip sales and 80% of tips; payout minimums vary by country. Producer documentation requires dated releases and age-at-filming IDs.',
    workflow_status: 'RESEARCHED', studio_eligibility: 'STUDIO_OR_PRODUCER', approval_status: 'NOT_REQUESTED',
    integration_mode: 'OPERATOR_ASSISTED', authentication_status: 'UNCONNECTED', monetization_model: 'CLIP_SALES',
    revenue_share_terms: 'Official creator page: 60% of clip sales and 80% of tips; minimum payout stated as USD 50 (US), USD 100 (Canada), USD 150 (international). Confirm current contract and payout eligibility.',
    upload_capabilities: 'Official website uploader documented; API or authorized bulk upload not verified.',
    reporting_capabilities: 'Creator page says 24/7 clip statistics and sales; API/export format not verified.',
    content_rules: 'Official producer guidance requires signed dated consent/content releases for each production date and valid government photo IDs proving age 18+ at filming; licensed content needs a licensing agreement and model releases.',
    exclusivity_notes: 'No exclusivity conclusion recorded; check the account agreement and clip-specific rights.',
    next_action: 'Confirm studio reseller onboarding, accepted territories, current payout route and any bulk upload/report export options.',
  },
  {
    platform_key: 'fansly', name: 'Fansly', partner_program: 'Creator / agency or producer application', priority: 'P1',
    official_url: 'https://fansly.com/', application_url: 'https://help.fansly.com/en/articles/12315622-applying-as-an-agency-producer-or-other',
    evidence_url: 'https://help.fansly.com/en/articles/12315241-getting-started-on-fansly', evidence_verified_at: '2026-10-14T00:00:00.000Z',
    evidence_summary: 'Official help has an agency/studio application path and says creators receive 80% of subscriptions, sold media, messages and tips. The primary account owner is the payout beneficiary; collaborator consent and tax documentation requirements apply.',
    workflow_status: 'RESEARCHED', studio_eligibility: 'APPLICATION_REQUIRED', approval_status: 'NOT_REQUESTED',
    integration_mode: 'OPERATOR_ASSISTED', authentication_status: 'UNCONNECTED', monetization_model: 'MIXED',
    revenue_share_terms: 'Official help states 80% creator revenue for listed sales; verify current agreement, tax withholding, payment availability and payout terms for Taiwan.',
    upload_capabilities: 'Creator tools support media uploads and scheduling after approval; API/bulk upload not verified.',
    reporting_capabilities: 'Creator statistics page exists; CSV/API export not verified.',
    content_rules: 'Agency/producer applicants must follow the platform’s co-performer consent and identity verification workflow; each on-camera participant must be cleared before publication.',
    exclusivity_notes: 'No exclusivity conclusion recorded; review terms per content item.',
    next_action: 'Review the official agency/producer application path and confirm Taiwan payout and account structure.',
  },
  {
    platform_key: 'xvideos', name: 'XVideos', partner_program: 'Studio / creator program', priority: 'P2',
    official_url: 'https://www.xvideos.com/', application_url: 'https://www.xvideos.com/', workflow_status: 'NOT_RESEARCHED',
    studio_eligibility: 'UNKNOWN', approval_status: 'NOT_REQUESTED', integration_mode: 'OPERATOR_ASSISTED', authentication_status: 'UNCONNECTED',
    monetization_model: 'AD_REVENUE', evidence_summary: 'Studio acceptance, monetization terms, account requirements, upload API and reporting are not verified.', next_action: 'Verify only through current official platform sources.',
  },
  {
    platform_key: 'xnxx', name: 'XNXX', partner_program: 'Studio / creator program', priority: 'P2',
    official_url: 'https://www.xnxx.com/', application_url: 'https://www.xnxx.com/', workflow_status: 'NOT_RESEARCHED',
    studio_eligibility: 'UNKNOWN', approval_status: 'NOT_REQUESTED', integration_mode: 'OPERATOR_ASSISTED', authentication_status: 'UNCONNECTED',
    monetization_model: 'AD_REVENUE', evidence_summary: 'Studio acceptance, monetization terms, account requirements, upload API and reporting are not verified.', next_action: 'Verify separately from XVideos; do not assume shared ownership grants shared publication rights.',
  },
  {
    platform_key: 'manyvids', name: 'ManyVids', partner_program: 'Creator / studio', priority: 'P2',
    official_url: 'https://www.manyvids.com/', application_url: 'https://www.manyvids.com/', workflow_status: 'NOT_RESEARCHED',
    studio_eligibility: 'UNKNOWN', approval_status: 'NOT_REQUESTED', integration_mode: 'OPERATOR_ASSISTED', authentication_status: 'UNCONNECTED',
    monetization_model: 'MIXED', evidence_summary: 'Current studio acceptance, commission and producer rights terms have not been verified.', next_action: 'Verify creator/studio onboarding, commission, payout country, API and bulk upload from official sources.',
  },
  {
    platform_key: 'fancentro', name: 'FanCentro', partner_program: 'Creator / agency', priority: 'P2',
    official_url: 'https://fancentro.com/', application_url: 'https://fancentro.com/', workflow_status: 'NOT_RESEARCHED',
    studio_eligibility: 'UNKNOWN', approval_status: 'NOT_REQUESTED', integration_mode: 'OPERATOR_ASSISTED', authentication_status: 'UNCONNECTED',
    monetization_model: 'MIXED', evidence_summary: 'Current studio onboarding and account delegation terms have not been verified.', next_action: 'Verify creator/agency eligibility, payout territories, commissions and approved upload/reporting methods.',
  },
  {
    platform_key: 'paidperview', name: 'PaidPerView', partner_program: 'Studio / creator monetization', priority: 'P2',
    official_url: 'https://www.paidperview.com/', application_url: 'https://www.paidperview.com/',
    evidence_url: 'https://www.paidperview.com/', evidence_verified_at: '2026-10-14T00:00:00.000Z',
    evidence_summary: 'The official homepage states the PaidPerView program is closed. Do not prepare uploads or forecast income unless the operator verifies that the program has reopened.',
    workflow_status: 'BLOCKED', studio_eligibility: 'INELIGIBLE', approval_status: 'NOT_REQUESTED',
    integration_mode: 'UNAVAILABLE', authentication_status: 'NOT_APPLICABLE', monetization_model: 'UNKNOWN',
    next_action: 'Re-check official status before any future work; no active distribution.',
  },
  {
    platform_key: 'youporn', name: 'YouPorn', partner_program: 'Aylo network destination', priority: 'P2',
    official_url: 'https://www.youporn.com/', application_url: 'https://www.youporn.com/', workflow_status: 'NOT_RESEARCHED',
    studio_eligibility: 'UNKNOWN', approval_status: 'NOT_REQUESTED', integration_mode: 'OPERATOR_ASSISTED', authentication_status: 'UNCONNECTED',
    monetization_model: 'AD_REVENUE', evidence_summary: 'Studio onboarding and whether partner agreements permit this destination have not been verified.', next_action: 'Research separately and confirm network publication rights in the signed agreement.',
  },
  {
    platform_key: 'redtube', name: 'RedTube', partner_program: 'Aylo network destination', priority: 'P2',
    official_url: 'https://www.redtube.com/', application_url: 'https://www.redtube.com/', workflow_status: 'NOT_RESEARCHED',
    studio_eligibility: 'UNKNOWN', approval_status: 'NOT_REQUESTED', integration_mode: 'OPERATOR_ASSISTED', authentication_status: 'UNCONNECTED',
    monetization_model: 'AD_REVENUE', evidence_summary: 'Studio onboarding and whether partner agreements permit this destination have not been verified.', next_action: 'Research separately and confirm network publication rights in the signed agreement.',
  },
  {
    platform_key: 'tube8', name: 'Tube8', partner_program: 'Aylo network destination', priority: 'P2',
    official_url: 'https://www.tube8.com/', application_url: 'https://www.tube8.com/', workflow_status: 'NOT_RESEARCHED',
    studio_eligibility: 'UNKNOWN', approval_status: 'NOT_REQUESTED', integration_mode: 'OPERATOR_ASSISTED', authentication_status: 'UNCONNECTED',
    monetization_model: 'AD_REVENUE', evidence_summary: 'Studio onboarding and whether partner agreements permit this destination have not been verified.', next_action: 'Research separately and confirm network publication rights in the signed agreement.',
  },
];

const SAFE_PLATFORM_PATCH_FIELDS = new Set([
  'workflow_status', 'studio_eligibility', 'approval_status', 'integration_mode',
  'authentication_status', 'account_owner', 'evidence_url', 'evidence_verified_at',
  'application_submitted_at',
  'evidence_summary', 'revenue_share_terms', 'payout_restrictions', 'supported_countries',
  'document_requirements', 'upload_capabilities', 'reporting_capabilities', 'content_rules',
  'exclusivity_notes', 'last_sync_at', 'last_error', 'next_action', 'metadata_limits_json',
]);

const NON_BINDING_APPLICATION_WARNING = 'Draft for operator review only. Do not submit until all facts are checked. No agreement is accepted and no partner status is represented as approved.';
const APPLICATION_PROFILE_FIELD_LIMITS = Object.freeze({
  legal_entity_name: 300,
  jurisdiction: 200,
  contact_name: 200,
  contact_email: 320,
  official_website: 1000,
  brand_description: 2000,
  content_portfolio: 4000,
  studio_capabilities: 3000,
  requested_access: 2000,
});

function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

function parseJsonField(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function makeApplicationDraft(platform, profile) {
  const missing = [];
  const value = (field, label) => {
    const current = String(profile[field] || '').trim();
    if (!current) missing.push(label);
    return current || `[ADD ${label.toUpperCase()}]`;
  };
  const legalEntity = value('legal_entity_name', 'legal entity name');
  const jurisdiction = value('jurisdiction', 'jurisdiction of registration');
  const contactName = value('contact_name', 'authorized contact name');
  const contactEmail = value('contact_email', 'authorized contact email');
  const website = value('official_website', 'official website');
  const brandDescription = value('brand_description', 'brand description');
  const portfolio = value('content_portfolio', 'content portfolio');
  const capabilities = value('studio_capabilities', 'studio capabilities');
  const requestedAccess = value('requested_access', 'requested partner access');
  const draft = [
    `Subject: FLESHLAB — request for ${platform.partner_program || 'studio/producer'} onboarding`,
    '',
    `Hello ${platform.name} Partner Team,`,
    '',
    `I am writing on behalf of ${legalEntity}, a studio based in ${jurisdiction}, to ask about the current onboarding process for ${platform.name}.`,
    '',
    `Authorized contact: ${contactName} (${contactEmail})`,
    `Official website: ${website}`,
    '',
    `Studio overview: ${brandDescription}`,
    `Content portfolio: ${portfolio}`,
    `Studio capabilities: ${capabilities}`,
    '',
    `We would like to request: ${requestedAccess}`,
    '',
    'Please confirm whether your current program accepts studio-owned or properly licensed third-party productions, which rights and performer records are required for each production, the approved upload and reporting methods, current commercial terms, payout availability for Taiwan, and any exclusivity or network-distribution restrictions.',
    'We will provide documentation only through a secure channel designated by your team. This draft does not assert that any application has been submitted, that a platform has approved FLESHLAB, or that any content is cleared for publication.',
    '',
    'Kind regards,',
    contactName,
    'FLESHLAB',
    '',
    `Operator note: ${NON_BINDING_APPLICATION_WARNING}`,
  ].join('\n');
  return { draft, missing };
}

function validHttpsUrl(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

function numberFromCsv(value, field) {
  const normalized = String(value || '').replace(/,/g, '').trim();
  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) throw new TypeError(`${field} must be a plain decimal number`);
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) throw new TypeError(`${field} must be non-negative`);
  return number;
}

function validPeriod(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('');
}

async function createAudit(base44, user, action, entityType, entityId, notes, changes = {}) {
  await base44.entities.AuditLog.create({
    entity_type: entityType,
    entity_id: entityId,
    actor_id: user.id,
    actor_role: user.role,
    action,
    changes_json: JSON.stringify(changes),
    notes,
  });
}

async function loadReadiness(base44, video, platform, variant, metadata) {
  const [videoPerformers, assets, qaResults] = await Promise.all([
    base44.entities.VideoPerformer.filter({ video_id: video.id }),
    base44.entities.VideoAsset.filter({ video_id: video.id }),
    base44.entities.ProductionQAResult.filter({ video_id: video.id }, '-qa_timestamp', 10),
  ]);
  const performerIds = [...new Set((videoPerformers || []).map((row) => row.performer_id).filter(Boolean))];
  const performerResults = await Promise.all(performerIds.map(async (id) => {
    try { return await base44.entities.Performer.get(id); } catch { return null; }
  }));
  const performers = performerResults.filter(Boolean);
  const complianceRows = await Promise.all(performerIds.map(async (performer_id) => {
    const [documents, contracts] = await Promise.all([
      base44.entities.ComplianceDocument.filter({ performer_id }),
      base44.entities.Contract.filter({ performer_id }),
    ]);
    return { documents: documents || [], contracts: contracts || [] };
  }));
  const rightsGrants = await base44.entities.DistributionRightsGrant.filter({ video_id: video.id });
  const result = validatePublicationReadiness({
    video,
    platform,
    variant,
    videoPerformers: videoPerformers || [],
    performers,
    documents: complianceRows.flatMap((row) => row.documents),
    contracts: complianceRows.flatMap((row) => row.contracts),
    rightsGrants: rightsGrants || [],
    assets: assets || [],
    latestQa: qaResults?.[0] || null,
  });
  const limits = parseJsonField(platform.metadata_limits_json, {});
  const metadataErrors = validatePlatformMetadata({ ...metadata, limits });
  return { ...result, errors: [...result.errors, ...metadataErrors], source_asset: assets?.find((asset) => asset.id === result.source_asset_id) || null };
}

async function getPlatform(base44, platformKey) {
  const rows = await base44.entities.DistributionPlatform.filter({ platform_key: platformKey });
  return rows?.[0] || null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > 1_000_000) return json({ error: 'Request exceeds the 1 MB limit' }, 413);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return json({ error: 'Admin access required' }, 403);

    const body = await req.json();
    const action = body?.action;

    if (action === 'list') {
      const [platforms, applications, jobs, revenueImports, agreements, videos] = await Promise.all([
        base44.entities.DistributionPlatform.list('name', 100),
        base44.entities.DistributionApplication.list('-created_date', 100),
        base44.entities.DistributionJob.list('-created_date', 200),
        base44.entities.DistributionRevenueImport.list('-imported_at', 100),
        base44.entities.DistributionPartnerAgreement.list('-created_date', 100),
        base44.entities.Video.list('-updated_date', 200),
      ]);
      return json({
        platforms: platforms || [],
        applications: applications || [],
        jobs: jobs || [],
        revenueImports: (revenueImports || []).map(({ source_report_text, ...report }) => report),
        agreements: agreements || [],
        videos: (videos || []).map((video) => ({
          id: video.id,
          title: video.title,
          status: video.status,
          processing_status: video.processing_status,
          access_tier: video.access_tier,
          duration_seconds: video.duration_seconds,
          description: video.description,
          tags: video.tags || [],
          primary_category: video.primary_category,
        })),
      });
    }

    if (action === 'seed_platforms') {
      const existing = await base44.entities.DistributionPlatform.list('name', 200);
      const keys = new Set((existing || []).map((platform) => platform.platform_key));
      const created = [];
      for (const seed of REGISTRY_SEEDS) {
        if (!keys.has(seed.platform_key)) {
          created.push(await base44.entities.DistributionPlatform.create(seed));
        }
      }
      await createAudit(base44, user, 'distribution_registry_seed', 'DistributionPlatform', 'registry', `Initialized ${created.length} missing platform records`);
      return json({ created: created.length });
    }

    if (action === 'update_platform') {
      const current = await getPlatform(base44, body.platform_key);
      if (!current) return json({ error: 'Platform record not found' }, 404);
      const patch = body.patch || {};
      const keys = Object.keys(patch);
      if (!keys.length || keys.some((key) => !SAFE_PLATFORM_PATCH_FIELDS.has(key))) return json({ error: 'Unsupported platform fields' }, 400);
      const next = { ...current, ...patch };
      if (['APPROVED', 'CONNECTED'].includes(next.workflow_status)) {
        if (next.approval_status !== 'APPROVED' || !validHttpsUrl(next.evidence_url) || !next.evidence_verified_at) {
          return json({ error: 'Approval status requires an HTTPS evidence URL and a verification timestamp' }, 400);
        }
      }
      if (next.workflow_status === 'CONNECTED') {
        return json({ error: 'CONNECTED is reserved for a verified adapter health check; this release has no connected platform adapter' }, 409);
      }
      if (['APPLICATION_SUBMITTED', 'AWAITING_APPROVAL'].includes(next.workflow_status) && (!next.application_submitted_at || !validHttpsUrl(next.evidence_url))) {
        return json({ error: 'Submitted status requires an application date and HTTPS submission evidence' }, 400);
      }
      await base44.entities.DistributionPlatform.update(current.id, patch);
      await createAudit(base44, user, 'distribution_platform_update', 'DistributionPlatform', current.id, `Updated platform record ${current.name}`, { from: current.workflow_status, to: next.workflow_status });
      return json({ status: 'ok' });
    }

    if (action === 'prepare_application') {
      const platform = await getPlatform(base44, body.platform_key);
      if (!platform) return json({ error: 'Platform record not found' }, 404);
      if (platform.workflow_status === 'BLOCKED' || platform.workflow_status === 'REJECTED') return json({ error: 'Platform workflow is blocked' }, 409);
      const profile = body.profile || {};
      const profileFields = Object.fromEntries(Object.entries(APPLICATION_PROFILE_FIELD_LIMITS).map(([field, limit]) => [field, String(profile[field] || '').trim().slice(0, limit)]));
      if (profileFields.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileFields.contact_email)) return json({ error: 'Authorized contact email is invalid' }, 400);
      if (profileFields.official_website && !validHttpsUrl(profileFields.official_website)) return json({ error: 'Official website must use HTTPS' }, 400);
      const { draft, missing } = makeApplicationDraft(platform, profileFields);
      const application = await base44.entities.DistributionApplication.create({
        platform_key: platform.platform_key,
        workflow_status: 'APPLICATION_PREPARED',
        ...profileFields,
        draft_text: draft,
        created_by: user.id,
      });
      await base44.entities.DistributionPlatform.update(platform.id, {
        workflow_status: 'APPLICATION_PREPARED',
        next_action: 'Operator review and manual submission through the official platform channel; do not submit from this app.',
      });
      await createAudit(base44, user, 'distribution_application_prepare', 'DistributionApplication', application.id, `Prepared a non-binding draft for ${platform.name}`, { missing_fields: missing });
      return json({ application, missing_fields: missing, warning: NON_BINDING_APPLICATION_WARNING });
    }

    if (action === 'record_application_status') {
      const application = await base44.entities.DistributionApplication.get(body.application_id);
      if (!application) return json({ error: 'Application record not found' }, 404);
      const allowed = ['APPLICATION_SUBMITTED', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED', 'BLOCKED'];
      if (!allowed.includes(body.workflow_status)) return json({ error: 'Invalid application status' }, 400);
      if (body.workflow_status === 'APPLICATION_SUBMITTED' && (body.operator_confirmed_submitted !== true || !validHttpsUrl(body.evidence_url) || !body.submitted_at)) {
        return json({ error: 'Record submission only after an operator confirms it and adds a date and HTTPS evidence URL' }, 400);
      }
      if (body.workflow_status === 'APPROVED' && (!validHttpsUrl(body.evidence_url) || !body.evidence_verified_at)) {
        return json({ error: 'Approval requires verified HTTPS evidence' }, 400);
      }
      if (body.workflow_status === 'AWAITING_APPROVAL' && !['APPLICATION_SUBMITTED', 'AWAITING_APPROVAL'].includes(application.workflow_status)) {
        return json({ error: 'An application must be recorded as submitted before it can await approval' }, 409);
      }
      if (body.workflow_status === 'APPROVED' && !['APPLICATION_SUBMITTED', 'AWAITING_APPROVAL'].includes(application.workflow_status)) {
        return json({ error: 'Approval evidence can only be recorded after a submitted application' }, 409);
      }
      const patch = {
        workflow_status: body.workflow_status,
        ...(body.submitted_at ? { submitted_at: body.submitted_at } : {}),
        ...(body.response_summary ? { response_summary: String(body.response_summary).slice(0, 4000) } : {}),
        ...(body.follow_up_at ? { follow_up_at: body.follow_up_at } : {}),
        ...(body.evidence_url ? { evidence_url: body.evidence_url } : {}),
        ...(body.evidence_verified_at ? { evidence_verified_at: body.evidence_verified_at } : {}),
      };
      await base44.entities.DistributionApplication.update(application.id, patch);
      const platform = await getPlatform(base44, application.platform_key);
      if (platform) await base44.entities.DistributionPlatform.update(platform.id, {
        workflow_status: body.workflow_status,
        ...(body.workflow_status === 'APPROVED' ? { approval_status: 'APPROVED', evidence_url: body.evidence_url, evidence_verified_at: body.evidence_verified_at } : {}),
        ...(body.workflow_status === 'APPLICATION_SUBMITTED' ? { application_submitted_at: body.submitted_at, evidence_url: body.evidence_url } : {}),
        next_action: body.workflow_status === 'APPROVED' ? 'Confirm account access and permitted upload/report methods.' : 'Track the official platform response and follow-up date.',
      });
      await createAudit(base44, user, 'distribution_application_status', 'DistributionApplication', application.id, `Recorded operator-confirmed status ${body.workflow_status}`);
      return json({ status: 'ok' });
    }

    if (action === 'rights_evidence') {
      const video = await base44.entities.Video.get(body.video_id);
      if (!video) return json({ error: 'Video not found' }, 404);
      const assignments = await base44.entities.VideoPerformer.filter({ video_id: video.id });
      const performerIds = [...new Set((assignments || []).map((row) => row.performer_id).filter(Boolean))];
      const participants = await Promise.all(performerIds.map(async (performerId) => {
        const [performer, documents, contracts, grants] = await Promise.all([
          base44.entities.Performer.get(performerId).catch(() => null),
          base44.entities.ComplianceDocument.filter({ performer_id: performerId }),
          base44.entities.Contract.filter({ performer_id: performerId }),
          base44.entities.DistributionRightsGrant.filter({ video_id: video.id, performer_id: performerId }),
        ]);
        if (!performer) return null;
        const safeDocuments = (documents || []).map((document) => ({
          id: ['model_release', 'release_agreement', 'consent_form', 'performer_contract'].includes(document.document_type) ? document.id : undefined,
          document_type: document.document_type,
          status: document.status,
          title: document.title,
        }));
        const safeContracts = (contracts || []).map((contract) => ({
          contract_type: contract.contract_type,
          status: contract.status,
          verified: contract.verified === true,
          signed: Boolean(contract.signed_at),
          performer_signature_consent_checked: contract.performer_signature_consent_checked === true,
        }));
        const grant = grants?.[0] || null;
        const age = body.production_date ? calculateAgeAt(performer.date_of_birth, body.production_date) : null;
        return {
          performer_id: performer.id,
          display_name: performer.display_name || 'Performer',
          identity_verified: performer.verified === true && performer.kyc_status === 'approved',
          compliance_locked: performer.compliance_locked === true && performer.compliance_override !== true,
          age_at_production_eligible: age !== null && age >= 18,
          id_document_approved: safeDocuments.some((document) => document.status === 'approved' && ['id_front', 'age_verification'].includes(document.document_type)),
          selfie_approved: safeDocuments.some((document) => document.status === 'approved' && document.document_type === 'selfie_with_id'),
          documents: safeDocuments,
          contracts: safeContracts,
          existing_grant: grant ? {
            id: grant.id,
            production_date: grant.production_date || '',
            platform_keys: grant.platform_keys || [],
            variants: grant.variants || [],
            territories: grant.territories || [],
            release_document_ids: grant.release_document_ids || [],
            status: grant.status,
            distribution_rights_verified: grant.distribution_rights_verified === true,
            sublicensing_verified: grant.sublicensing_verified === true,
            identity_review_complete: grant.identity_review_complete === true,
            voluntary_consent_review_complete: grant.voluntary_consent_review_complete === true,
            production_safety_review_complete: grant.production_safety_review_complete === true,
            no_coercion_review_complete: grant.no_coercion_review_complete === true,
            no_hidden_recording_review_complete: grant.no_hidden_recording_review_complete === true,
            no_impairment_review_complete: grant.no_impairment_review_complete === true,
            release_production_match_review_complete: grant.release_production_match_review_complete === true,
            lawfulness_review_complete: grant.lawfulness_review_complete === true,
            expires_at: grant.expires_at || '',
          } : null,
        };
      }));
      return json({
        video: { id: video.id, title: video.title || 'Untitled' },
        participants: participants.filter(Boolean),
        limitation: 'Document file URLs and ID/selfie contents are intentionally not returned. Review original evidence through the existing restricted compliance workflow.',
      });
    }

    if (action === 'save_rights_grant') {
      const video = await base44.entities.Video.get(body.video_id);
      if (!video) return json({ error: 'Video not found' }, 404);
      const performer = await base44.entities.Performer.get(body.performer_id);
      if (!performer) return json({ error: 'Performer not found' }, 404);
      const assignments = await base44.entities.VideoPerformer.filter({ video_id: video.id });
      if (!(assignments || []).some((row) => row.performer_id === performer.id)) return json({ error: 'Performer is not assigned to this video' }, 409);

      const platformKeys = [...new Set((body.platform_keys || []).map((key) => String(key).trim()).filter(Boolean))];
      const variants = [...new Set(body.variants || [])];
      const territories = [...new Set((body.territories || []).map((value) => String(value).trim().toUpperCase()).filter(Boolean))];
      const releaseIds = [...new Set(body.release_document_ids || [])];
      const status = body.status || 'UNDER_REVIEW';
      if (!['MISSING_DOCUMENTS', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'SUSPENDED', 'LEGAL_HOLD'].includes(status)) return json({ error: 'Invalid rights review status' }, 400);
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(body.production_date || ''))) return json({ error: 'Production date is required' }, 400);
      if (!platformKeys.length || !variants.length || !territories.length) return json({ error: 'Choose at least one platform, distribution profile and territory' }, 400);
      if (variants.some((variant) => !['FREE_MONETIZED', 'PROMOTIONAL', 'PREMIUM_PAID'].includes(variant))) return json({ error: 'Unsupported distribution profile' }, 400);
      const [platformRows, documents, contracts, existingRows] = await Promise.all([
        base44.entities.DistributionPlatform.list('name', 200),
        base44.entities.ComplianceDocument.filter({ performer_id: performer.id }),
        base44.entities.Contract.filter({ performer_id: performer.id }),
        base44.entities.DistributionRightsGrant.filter({ video_id: video.id, performer_id: performer.id }),
      ]);
      if (platformKeys.some((key) => !(platformRows || []).some((platform) => platform.platform_key === key))) return json({ error: 'A selected platform is not registered' }, 400);

      if (status === 'APPROVED') {
        if (body.operator_confirmed_review !== true) return json({ error: 'Confirm that the underlying records were personally reviewed' }, 400);
        if (performer.verified !== true || performer.kyc_status !== 'approved' || (performer.compliance_locked === true && performer.compliance_override !== true)) {
          return json({ error: 'Performer identity or compliance status is not eligible for approval' }, 409);
        }
        const ageAtProduction = calculateAgeAt(performer.date_of_birth, body.production_date);
        if (ageAtProduction === null || ageAtProduction < 18) return json({ error: 'Verified date of birth does not establish age 18 or older at filming' }, 409);
        const safeDocuments = documents || [];
        const approvedDocuments = safeDocuments.filter((document) => document.status === 'approved' && document.file_uri);
        const approvedReleases = approvedDocuments.filter((document) => ['model_release', 'release_agreement', 'consent_form', 'performer_contract'].includes(document.document_type));
        if (!approvedDocuments.some((document) => ['id_front', 'age_verification'].includes(document.document_type))) return json({ error: 'An approved government ID document is required' }, 409);
        if (!approvedDocuments.some((document) => document.document_type === 'selfie_with_id')) return json({ error: 'An approved ID selfie document is required' }, 409);
        if (!releaseIds.length || releaseIds.some((id) => !approvedReleases.some((document) => document.id === id))) return json({ error: 'Select an approved release document for this performer' }, 409);
        const signedContract = (contracts || []).some((contract) => contract.status === 'signed' && contract.verified === true && contract.signed_at && contract.performer_signature_consent_checked === true);
        if (!signedContract) return json({ error: 'A verified signed contract with recorded consent is required' }, 409);
        const requiredReviews = [
          'distribution_rights_verified', 'sublicensing_verified', 'identity_review_complete',
          'voluntary_consent_review_complete', 'production_safety_review_complete',
          'no_coercion_review_complete', 'no_hidden_recording_review_complete',
          'no_impairment_review_complete', 'release_production_match_review_complete',
          'lawfulness_review_complete',
        ];
        if (requiredReviews.some((field) => body[field] !== true)) return json({ error: 'All rights, consent, safety and recordkeeping reviews must be explicitly completed' }, 409);
        if (body.expires_at && new Date(body.expires_at).getTime() <= Date.now()) return json({ error: 'Rights approval expiry must be in the future' }, 400);
      }
      if (status === 'EXPIRED' && (!body.expires_at || new Date(body.expires_at).getTime() > Date.now())) return json({ error: 'EXPIRED status requires an elapsed expiry date' }, 400);

      const current = existingRows?.[0] || null;
      const now = new Date().toISOString();
      const grantData = {
        video_id: video.id,
        performer_id: performer.id,
        production_date: body.production_date,
        platform_keys: platformKeys,
        variants,
        territories,
        release_document_ids: releaseIds,
        distribution_rights_verified: body.distribution_rights_verified === true,
        sublicensing_verified: body.sublicensing_verified === true,
        identity_review_complete: body.identity_review_complete === true,
        voluntary_consent_review_complete: body.voluntary_consent_review_complete === true,
        production_safety_review_complete: body.production_safety_review_complete === true,
        no_coercion_review_complete: body.no_coercion_review_complete === true,
        no_hidden_recording_review_complete: body.no_hidden_recording_review_complete === true,
        no_impairment_review_complete: body.no_impairment_review_complete === true,
        release_production_match_review_complete: body.release_production_match_review_complete === true,
        lawfulness_review_complete: body.lawfulness_review_complete === true,
        status,
        reviewed_by: status === 'APPROVED' ? user.id : '',
        reviewed_at: status === 'APPROVED' ? now : '',
        expires_at: body.expires_at || '',
        notes: String(body.notes || '').slice(0, 2000),
      };
      const grant = current
        ? await base44.entities.DistributionRightsGrant.update(current.id, grantData)
        : await base44.entities.DistributionRightsGrant.create(grantData);
      await createAudit(base44, user, 'distribution_rights_grant_review', 'DistributionRightsGrant', grant.id, `Recorded ${status} rights review for a video participant`, { video_id: video.id, performer_id: performer.id, status, platform_count: platformKeys.length, variant_count: variants.length });
      return json({ status: 'ok', grant_id: grant.id, grant_status: status });
    }

    if (action === 'prepare_publication') {
      const video = await base44.entities.Video.get(body.video_id);
      if (!video) return json({ error: 'Video not found' }, 404);
      const platform = await getPlatform(base44, body.platform_key);
      if (!platform) return json({ error: 'Platform record not found' }, 404);
      if (platform.integration_mode === 'UNAVAILABLE') return json({ error: 'Platform has no available distribution path' }, 409);
      const metadata = {
        title: String(body.title || video.title || '').trim(),
        description: String(body.description || video.description || '').trim(),
        tags: Array.isArray(body.tags) ? body.tags.slice(0, 100).map((tag) => String(tag).slice(0, 100)) : (video.tags || []).slice(0, 100),
        category: String(body.category || video.primary_category || ''),
        language: String(body.language || 'en'),
      };
      const readiness = await loadReadiness(base44, video, platform, body.variant, metadata);
      const idempotencyKey = buildDistributionIdempotencyKey(video.id, platform.platform_key, body.variant);
      const existingJobs = await base44.entities.DistributionJob.filter({ idempotency_key: idempotencyKey });
      if (existingJobs?.length) return json({ job: existingJobs[0], duplicate: true, readiness: { can_prepare: existingJobs[0].status === 'READY', errors: parseJsonField(existingJobs[0].validation_errors_json, []) } });
      const complianceCodes = new Set([
        'PERFORMER_ASSIGNMENT_REQUIRED', 'PERFORMER_RECORD_MISSING', 'PERFORMER_IDENTITY_NOT_VERIFIED',
        'APPROVED_GOVERNMENT_ID_REQUIRED', 'APPROVED_ID_SELFIE_REQUIRED', 'APPROVED_MODEL_RELEASE_REQUIRED',
        'VERIFIED_SIGNED_CONTRACT_REQUIRED', 'VIDEO_SPECIFIC_RIGHTS_APPROVAL_REQUIRED', 'AGE_AT_PRODUCTION_NOT_VERIFIED',
        'PAID_CONTENT_CANNOT_BE_FREE_DISTRIBUTION', 'VARIANT_NOT_AUTHORIZED', 'DISTRIBUTION_TERRITORIES_REQUIRED', 'PRODUCTION_RELEASE_LINK_REQUIRED',
        'DISTRIBUTION_RIGHTS_NOT_VERIFIED', 'SUBLICENSING_RIGHTS_NOT_VERIFIED', 'IDENTITY_REVIEW_REQUIRED',
        'CONSENT_REVIEW_REQUIRED', 'PRODUCTION_SAFETY_REVIEW_REQUIRED', 'LEGAL_RECORDKEEPING_REVIEW_REQUIRED',
        'RIGHTS_GRANT_REVIEWER_REQUIRED', 'NO_COERCION_REVIEW_REQUIRED', 'NO_HIDDEN_RECORDING_REVIEW_REQUIRED',
        'NO_IMPAIRMENT_REVIEW_REQUIRED', 'RELEASE_PRODUCTION_MATCH_REQUIRED', 'RIGHTS_GRANT_EXPIRED',
        'CREATIVE_APPROVAL_REQUIRED', 'PRODUCTION_QA_APPROVAL_REQUIRED',
        'EXECUTIVE_APPROVAL_REQUIRED', 'GOVERNANCE_VALIDATION_REQUIRED',
      ]);
      const complianceBlocked = readiness.errors.some((code) => complianceCodes.has(code));
      const status = readiness.errors.length ? (complianceBlocked ? 'BLOCKED_COMPLIANCE' : 'DRAFT') : 'READY';
      const now = new Date().toISOString();
      const job = await base44.entities.DistributionJob.create({
        video_id: video.id,
        platform_key: platform.platform_key,
        distribution_variant: body.variant,
        idempotency_key: idempotencyKey,
        status,
        validation_errors_json: JSON.stringify(readiness.errors),
        metadata_snapshot_json: JSON.stringify({ ...metadata, generated_at: now, platform_key: platform.platform_key, variant: body.variant, package_type: 'METADATA_ONLY_OPERATOR_PACKAGE' }),
        source_asset_id: readiness.source_asset_id || '',
        source_sha256: readiness.source_sha256 || '',
        status_history_json: JSON.stringify([{ from: null, to: status, at: now, actor_id: user.id }]),
        created_by: user.id,
      });
      await createAudit(base44, user, 'distribution_package_prepare', 'DistributionJob', job.id, `Prepared operator metadata package for ${platform.name}`, { status, error_codes: readiness.errors });
      return json({
        job,
        duplicate: false,
        readiness: { can_prepare: status === 'READY', errors: readiness.errors },
        limitation: 'This step creates a metadata-only operator package. It does not upload media or publish externally; the media master still requires a secure operator retrieval workflow.',
      }, status === 'READY' ? 201 : 422);
    }

    if (action === 'record_publication') {
      const job = await base44.entities.DistributionJob.get(body.job_id);
      if (!job) return json({ error: 'Distribution job not found' }, 404);
      const platform = await getPlatform(base44, job.platform_key);
      if (!platform || !['APPROVED', 'CONNECTED'].includes(platform.workflow_status) || platform.approval_status !== 'APPROVED' || !platform.evidence_url || !platform.evidence_verified_at) {
        return json({ error: 'Verified platform approval is required before recording publication' }, 409);
      }
      if (job.status !== 'READY' && job.status !== 'AWAITING_REVIEW') return json({ error: 'Only ready or review-pending jobs can be recorded as published' }, 409);
      if (body.operator_confirmed_external_upload !== true || !String(body.external_content_id || '').trim() || !validHttpsUrl(body.publication_url)) {
        return json({ error: 'Operator confirmation, external content ID and HTTPS publication URL are required' }, 400);
      }
      if (!matchesOfficialPlatformDomain(body.publication_url, platform.official_url)) return json({ error: 'Publication URL must use the official platform domain' }, 400);
      const video = await base44.entities.Video.get(job.video_id);
      if (!video) return json({ error: 'Video not found' }, 404);
      if (job.platform_key === 'xhamster' && String(video.xhamster_video_url || '').trim()) {
        return json({ error: 'A legacy xHamster mapping already exists. Reconcile that publication before recording another one.' }, 409);
      }
      const metadata = parseJsonField(job.metadata_snapshot_json, {});
      const readiness = await loadReadiness(base44, video, platform, job.distribution_variant, metadata);
      if (readiness.errors.length) return json({ error: 'Publication gate no longer passes', errors: readiness.errors }, 409);
      const duplicates = await base44.entities.DistributionJob.filter({ platform_key: job.platform_key, external_content_id: String(body.external_content_id).trim() });
      if (duplicates?.some((candidate) => candidate.id !== job.id && candidate.status === 'PUBLISHED')) return json({ error: 'External publication ID is already recorded for this platform' }, 409);
      const now = new Date().toISOString();
      const history = parseJsonField(job.status_history_json, []);
      history.push({ from: job.status, to: 'PUBLISHED', at: now, actor_id: user.id, source: 'operator_confirmation' });
      await base44.entities.DistributionJob.update(job.id, {
        status: 'PUBLISHED',
        external_content_id: String(body.external_content_id).trim().slice(0, 250),
        publication_url: body.publication_url,
        published_at: now,
        status_history_json: JSON.stringify(history),
      });
      await base44.entities.DistributionPlatform.update(platform.id, { last_sync_at: now, last_error: '' });
      await createAudit(base44, user, 'distribution_publication_record', 'DistributionJob', job.id, `Operator recorded external publication on ${platform.name}`, { platform_key: platform.platform_key, external_content_id: String(body.external_content_id).trim() });
      return json({ status: 'ok', published_at: now });
    }

    if (action === 'import_revenue') {
      const platform = await getPlatform(base44, body.platform_key);
      if (!platform) return json({ error: 'Platform record not found' }, 404);
      const csv = String(body.csv_text || '');
      if (!csv || csv.length > 250_000) return json({ error: 'CSV content is required and may not exceed 250 KB' }, 413);
      const reportHash = await sha256(csv);
      const duplicateImports = await base44.entities.DistributionRevenueImport.filter({ report_hash: reportHash });
      if (duplicateImports?.some((report) => report.import_status === 'IMPORTED')) return json({ duplicate: true, import_id: duplicateImports.find((report) => report.import_status === 'IMPORTED').id, status: 'IMPORTED' });
      const rows = parseCanonicalCsv(csv);
      if (rows.length > 500) return json({ error: 'Revenue reports may contain at most 500 data rows' }, 413);
      const normalized = rows.map((row, index) => {
        const periodStart = row.period_start;
        const periodEnd = row.period_end;
        if (!validPeriod(periodStart) || !validPeriod(periodEnd) || periodStart > periodEnd) throw new TypeError(`CSV row ${index + 2} has an invalid report period`);
        const currency = String(row.currency || '').toUpperCase();
        if (!/^[A-Z]{3}$/.test(currency)) throw new TypeError(`CSV row ${index + 2} has an invalid ISO currency code`);
        const classification = String(row.classification || '').toUpperCase();
        if (!['PLATFORM_REPORTED', 'ESTIMATE'].includes(classification)) throw new TypeError(`CSV row ${index + 2} classification must be PLATFORM_REPORTED or ESTIMATE`);
        const revenueType = String(row.revenue_type || '').toUpperCase();
        if (!['AD_REVENUE', 'PPV', 'SUBSCRIPTION', 'CLIP_SALES', 'OTHER'].includes(revenueType)) throw new TypeError(`CSV row ${index + 2} has an unsupported revenue type`);
        const gross = numberFromCsv(row.gross_sales, 'gross_sales');
        const deductions = numberFromCsv(row.platform_deductions, 'platform_deductions');
        const refunds = numberFromCsv(row.refunds, 'refunds');
        const chargebacks = numberFromCsv(row.chargebacks, 'chargebacks');
        const net = gross - deductions - refunds - chargebacks;
        const countValue = (value, field) => {
          if (value === undefined || value === '') return 0;
          if (!/^\d+$/.test(String(value))) throw new TypeError(`${field} must be a whole number`);
          return Number(value);
        };
        return {
          row_hash: '',
          platform_key: platform.platform_key,
          video_id: String(row.video_id || '').trim(),
          external_content_id: String(row.external_content_id || '').trim(),
          revenue_type: revenueType,
          currency,
          gross_sales: gross,
          platform_deductions: deductions,
          refunds,
          chargebacks,
          net_distribution_revenue: net,
          views: countValue(row.views, 'views'),
          qualified_monetized_views: countValue(row.qualified_monetized_views, 'qualified_monetized_views'),
          classification,
          period_start: periodStart,
          period_end: periodEnd,
        };
      });
      const keys = new Set(normalized.map((row) => `${row.period_start}:${row.period_end}:${row.currency}:${row.classification}`));
      if (keys.size !== 1) return json({ error: 'One import must contain a single period, currency and data classification' }, 400);
      const report = duplicateImports?.[0] || await base44.entities.DistributionRevenueImport.create({
        platform_key: platform.platform_key,
        report_hash: reportHash,
        source_file_name: String(body.file_name || 'platform-report.csv').slice(0, 250),
        source_report_text: csv,
        period_start: normalized[0].period_start,
        period_end: normalized[0].period_end,
        currency: normalized[0].currency,
        classification: normalized[0].classification,
        row_count: normalized.length,
        gross_sales: 0,
        platform_deductions: 0,
        refunds: 0,
        chargebacks: 0,
        net_distribution_revenue: 0,
        payout_status: 'UNCONFIRMED',
        import_status: 'IMPORTING',
        imported_by: user.id,
        imported_at: new Date().toISOString(),
      });
      try {
        let gross = 0;
        let deductions = 0;
        let refunds = 0;
        let chargebacks = 0;
        const existingLines = await base44.entities.DistributionRevenueLine.filter({ import_id: report.id });
        const existingHashes = new Set((existingLines || []).map((line) => line.row_hash));
        for (const row of normalized) {
          row.row_hash = await sha256(JSON.stringify(row));
          if (!existingHashes.has(row.row_hash)) await base44.entities.DistributionRevenueLine.create({ import_id: report.id, ...row });
          gross += row.gross_sales;
          deductions += row.platform_deductions;
          refunds += row.refunds;
          chargebacks += row.chargebacks;
        }
        const totals = calculateRevenueSplit({ grossSales: gross, platformDeductions: deductions, refunds, chargebacks, creatorSharePercent: 70, fleshlabSharePercent: 30 });
        await base44.entities.DistributionRevenueImport.update(report.id, {
          gross_sales: totals.grossSales,
          platform_deductions: totals.platformDeductions,
          refunds: totals.refunds,
          chargebacks: totals.chargebacks,
          net_distribution_revenue: totals.netDistributionRevenue,
          import_status: 'IMPORTED',
          import_error: '',
        });
        await createAudit(base44, user, 'distribution_revenue_import', 'DistributionRevenueImport', report.id, `Imported ${normalized.length} rows from ${platform.name}`, { report_hash: reportHash, classification: normalized[0].classification });
        return json({ status: 'ok', import_id: report.id, row_count: normalized.length, totals, classification: normalized[0].classification }, 201);
      } catch (error) {
        await base44.entities.DistributionRevenueImport.update(report.id, { import_status: 'FAILED', import_error: String(error?.message || 'Import failed').slice(0, 500) }).catch(() => {});
        throw error;
      }
    }

    if (action === 'save_agreement') {
      const payload = body.agreement || {};
      const partnerName = String(payload.partner_name || '').trim();
      if (!partnerName) return json({ error: 'Partner studio name is required' }, 400);
      const setupFee = Number(payload.setup_fee_usd ?? 2490);
      const creatorPct = Number(payload.creator_share_percent ?? 70);
      const fleshlabPct = Number(payload.fleshlab_share_percent ?? 30);
      if (!Number.isFinite(setupFee) || setupFee < 0 || Math.abs(creatorPct + fleshlabPct - 100) > 0.00001 || creatorPct < 0 || fleshlabPct < 0) {
        return json({ error: 'Enter a non-negative setup fee and revenue shares totaling 100%' }, 400);
      }
      const status = payload.status || 'DRAFT';
      if (!['DRAFT', 'SENT', 'SIGNED', 'ACTIVE', 'SUSPENDED', 'TERMINATED'].includes(status)) return json({ error: 'Invalid agreement status' }, 400);
      if (['SIGNED', 'ACTIVE'].includes(status) && (!String(payload.signed_contract_id || '').trim() || !payload.signed_at || payload.operator_confirmed_signed !== true || !validHttpsUrl(payload.signed_evidence_url))) {
        return json({ error: 'Signed or active agreements require operator confirmation, signed-contract reference, signing date and HTTPS evidence' }, 400);
      }
      const agreement = await base44.entities.DistributionPartnerAgreement.create({
        partner_name: partnerName,
        setup_fee_usd: setupFee,
        creator_share_percent: creatorPct,
        fleshlab_share_percent: fleshlabPct,
        revenue_basis: 'NET_AFTER_DEFINED_PLATFORM_DEDUCTIONS',
        status,
        signed_contract_id: String(payload.signed_contract_id || ''),
        signed_at: payload.signed_at || '',
        signed_evidence_url: payload.signed_evidence_url || '',
        setup_fee_status: payload.setup_fee_status || 'NOT_DUE',
        notes: String(payload.notes || '').slice(0, 4000),
        created_by: user.id,
      });
      await createAudit(base44, user, 'distribution_partner_agreement_create', 'DistributionPartnerAgreement', agreement.id, `Created ${status.toLowerCase()} white-label agreement draft for ${partnerName}`);
      return json({ agreement }, 201);
    }

    if (action === 'calculate_agreement_split') {
      const agreement = await base44.entities.DistributionPartnerAgreement.get(body.agreement_id);
      if (!agreement) return json({ error: 'Agreement not found' }, 404);
      if (!['SIGNED', 'ACTIVE'].includes(agreement.status) || !agreement.signed_contract_id || !agreement.signed_at || !agreement.signed_evidence_url) {
        return json({ error: 'A signed agreement is required before calculating a contractual split' }, 409);
      }
      const split = calculateRevenueSplit({
        grossSales: body.gross_sales,
        platformDeductions: body.platform_deductions,
        refunds: body.refunds,
        chargebacks: body.chargebacks,
        creatorSharePercent: agreement.creator_share_percent,
        fleshlabSharePercent: agreement.fleshlab_share_percent,
      });
      return json({ split, setup_fee_usd: agreement.setup_fee_usd, setup_fee_status: agreement.setup_fee_status });
    }

    return json({ error: 'Unsupported action' }, 400);
  } catch (error) {
    console.error('distributionOSService request failed', error?.name || 'Error');
    return json({ error: 'Distribution OS request failed. Review the input and retry; no external platform action was run.' }, 500);
  }
});
