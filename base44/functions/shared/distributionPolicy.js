export const DISTRIBUTION_VARIANTS = Object.freeze([
  "FREE_MONETIZED",
  "PROMOTIONAL",
  "PREMIUM_PAID",
]);

const APPROVED_WORKFLOW_STATUSES = new Set([
  "RESEARCHED",
  "APPLICATION_REQUIRED",
  "APPLICATION_PREPARED",
  "APPLICATION_SUBMITTED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "INTEGRATION_IN_PROGRESS",
  "CONNECTED",
]);

const RELEASE_TYPES = new Set([
  "model_release",
  "release_agreement",
  "consent_form",
  "performer_contract",
]);

function isValidDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function calculateAgeAt(dateOfBirth, productionDate) {
  if (!isValidDateOnly(dateOfBirth) || !isValidDateOnly(productionDate)) return null;
  const [birthYear, birthMonth, birthDay] = dateOfBirth.split("-").map(Number);
  const [productionYear, productionMonth, productionDay] = productionDate.split("-").map(Number);
  let age = productionYear - birthYear;
  if (productionMonth < birthMonth || (productionMonth === birthMonth && productionDay < birthDay)) age -= 1;
  return age;
}

export function buildDistributionIdempotencyKey(videoId, platformKey, variant) {
  if (![videoId, platformKey, variant].every((value) => typeof value === "string" && value.trim())) {
    throw new TypeError("videoId, platformKey and variant are required");
  }
  return [videoId, platformKey.toLowerCase(), variant].map(encodeURIComponent).join(":");
}

export function matchesOfficialPlatformDomain(value, officialUrl) {
  try {
    const publication = new URL(value);
    const official = new URL(officialUrl);
    if (publication.protocol !== "https:" || official.protocol !== "https:" || publication.username || publication.password) return false;
    const rootDomain = (hostname) => hostname.toLowerCase().replace(/^www\./, "");
    const target = rootDomain(publication.hostname);
    const registered = rootDomain(official.hostname);
    return target === registered || target.endsWith(`.${registered}`);
  } catch {
    return false;
  }
}

export function validatePlatformMetadata({ title, description, tags = [], limits = {} }) {
  const errors = [];
  const maxTitleLength = Number.isInteger(limits.max_title_length) ? limits.max_title_length : 150;
  const maxDescriptionLength = Number.isInteger(limits.max_description_length) ? limits.max_description_length : 5000;
  const maxTagCount = Number.isInteger(limits.max_tag_count) ? limits.max_tag_count : 50;
  if (typeof title !== "string" || title.trim().length < 3) errors.push("METADATA_TITLE_REQUIRED");
  else if (title.trim().length > maxTitleLength) errors.push("METADATA_TITLE_TOO_LONG");
  if (typeof description !== "string" || description.trim().length < 20) errors.push("METADATA_DESCRIPTION_REQUIRED");
  else if (description.length > maxDescriptionLength) errors.push("METADATA_DESCRIPTION_TOO_LONG");
  if (!Array.isArray(tags) || tags.length > maxTagCount) errors.push("METADATA_TAG_LIMIT_EXCEEDED");
  return errors;
}

export function validatePublicationReadiness({
  video,
  platform,
  variant,
  videoPerformers = [],
  performers = [],
  documents = [],
  contracts = [],
  rightsGrants = [],
  assets = [],
  latestQa = null,
  now = new Date(),
}) {
  const errors = [];
  const add = (code) => { if (!errors.includes(code)) errors.push(code); };

  if (!video?.id) add("VIDEO_NOT_FOUND");
  if (!platform?.platform_key) add("PLATFORM_NOT_FOUND");
  if (!DISTRIBUTION_VARIANTS.includes(variant)) add("DISTRIBUTION_VARIANT_INVALID");
  if (platform && !APPROVED_WORKFLOW_STATUSES.has(platform.workflow_status)) add("PLATFORM_NOT_RESEARCHED_OR_BLOCKED");
  if (platform?.integration_mode === "UNAVAILABLE") add("PLATFORM_UNAVAILABLE");
  if (platform?.workflow_status === "BLOCKED" || platform?.workflow_status === "REJECTED") add("PLATFORM_BLOCKED");

  if (video) {
    if (!video.title || video.title.trim().length < 3) add("VIDEO_TITLE_MISSING");
    if (!video.description || video.description.trim().length < 20) add("VIDEO_DESCRIPTION_MISSING");
    if (video.processing_status !== "draft_ready") add("MEDIA_PROCESSING_INCOMPLETE");
    if (video.status === "archived" || video.status === "unlisted") add("VIDEO_NOT_DISTRIBUTABLE");
    if (variant === "FREE_MONETIZED" && video.access_tier !== "free") add("PAID_CONTENT_CANNOT_BE_FREE_DISTRIBUTION");
  }

  const sourceAsset = assets.find((asset) => asset.asset_type === "source" && asset.status === "ready");
  if (!sourceAsset) {
    add("READY_SOURCE_ASSET_REQUIRED");
  } else {
    if (!(Number(sourceAsset.file_size_bytes) > 0)) add("SOURCE_FILE_SIZE_UNVERIFIED");
    if (!(Number(sourceAsset.duration_seconds || sourceAsset.duration) > 0)) add("SOURCE_DURATION_UNVERIFIED");
    if (!(Number(sourceAsset.width) > 0 && Number(sourceAsset.height) > 0)) add("SOURCE_RESOLUTION_UNVERIFIED");
    if (!sourceAsset.mime_type || !String(sourceAsset.mime_type).startsWith("video/")) add("SOURCE_MIME_TYPE_UNVERIFIED");
    if (!sourceAsset.codec) add("SOURCE_CODEC_UNVERIFIED");
    if (!sourceAsset.has_audio_stream) add("SOURCE_AUDIO_STREAM_UNVERIFIED");
    if (!/^[a-f0-9]{64}$/i.test(sourceAsset.sha256 || "")) add("SOURCE_SHA256_UNVERIFIED");
    if (sourceAsset.validation_status !== "passed") add("SOURCE_FILE_VALIDATION_REQUIRED");
  }
  const hasReadyPoster = assets.some((asset) => ["thumbnail", "poster", "cover"].includes(asset.asset_type) && asset.status === "ready");
  if (!hasReadyPoster) add("READY_POSTER_REQUIRED");
  const hasReadyTrailer = assets.some((asset) => ["trailer", "preview"].includes(asset.asset_type) && asset.status === "ready");
  if (variant === "PROMOTIONAL" && !hasReadyTrailer) add("READY_PROMOTIONAL_ASSET_REQUIRED");

  if (!videoPerformers.length) add("PERFORMER_ASSIGNMENT_REQUIRED");
  const performerById = new Map(performers.map((performer) => [performer.id, performer]));
  for (const assignment of videoPerformers) {
    const performerId = assignment.performer_id;
    const performer = performerById.get(performerId);
    if (!performer) {
      add("PERFORMER_RECORD_MISSING");
      continue;
    }
    if (performer.verified !== true || performer.kyc_status !== "approved") add("PERFORMER_IDENTITY_NOT_VERIFIED");
    const performerDocs = documents.filter((doc) => doc.performer_id === performerId && doc.status === "approved" && doc.file_uri);
    if (!performerDocs.some((doc) => doc.document_type === "id_front" || doc.document_type === "age_verification")) add("APPROVED_GOVERNMENT_ID_REQUIRED");
    if (!performerDocs.some((doc) => doc.document_type === "selfie_with_id")) add("APPROVED_ID_SELFIE_REQUIRED");
    const approvedReleases = performerDocs.filter((doc) => RELEASE_TYPES.has(doc.document_type));
    if (!approvedReleases.length) add("APPROVED_MODEL_RELEASE_REQUIRED");
    const signedRelease = contracts.some((contract) =>
      contract.performer_id === performerId && contract.status === "signed" && contract.verified === true && contract.signed_at
    );
    if (!signedRelease) add("VERIFIED_SIGNED_CONTRACT_REQUIRED");

    const matchingGrant = rightsGrants.find((grant) =>
      grant.video_id === video?.id && grant.performer_id === performerId && grant.platform_keys?.includes(platform?.platform_key)
    );
    if (!matchingGrant || matchingGrant.status !== "APPROVED") {
      add("VIDEO_SPECIFIC_RIGHTS_APPROVAL_REQUIRED");
      continue;
    }
    const ageAtProduction = calculateAgeAt(performer.date_of_birth, matchingGrant.production_date);
    if (ageAtProduction === null || ageAtProduction < 18) add("AGE_AT_PRODUCTION_NOT_VERIFIED");
    if (!matchingGrant.variants?.includes(variant)) add("VARIANT_NOT_AUTHORIZED");
    if (!Array.isArray(matchingGrant.territories) || matchingGrant.territories.length === 0) add("DISTRIBUTION_TERRITORIES_REQUIRED");
    if (!matchingGrant.release_document_ids?.some((id) => approvedReleases.some((doc) => doc.id === id))) add("PRODUCTION_RELEASE_LINK_REQUIRED");
    if (!matchingGrant.reviewed_by || !matchingGrant.reviewed_at) add("RIGHTS_GRANT_REVIEWER_REQUIRED");
    if (matchingGrant.distribution_rights_verified !== true) add("DISTRIBUTION_RIGHTS_NOT_VERIFIED");
    if (matchingGrant.sublicensing_verified !== true) add("SUBLICENSING_RIGHTS_NOT_VERIFIED");
    if (matchingGrant.identity_review_complete !== true) add("IDENTITY_REVIEW_REQUIRED");
    if (matchingGrant.voluntary_consent_review_complete !== true) add("CONSENT_REVIEW_REQUIRED");
    if (matchingGrant.production_safety_review_complete !== true) add("PRODUCTION_SAFETY_REVIEW_REQUIRED");
    if (matchingGrant.no_coercion_review_complete !== true) add("NO_COERCION_REVIEW_REQUIRED");
    if (matchingGrant.no_hidden_recording_review_complete !== true) add("NO_HIDDEN_RECORDING_REVIEW_REQUIRED");
    if (matchingGrant.no_impairment_review_complete !== true) add("NO_IMPAIRMENT_REVIEW_REQUIRED");
    if (matchingGrant.release_production_match_review_complete !== true) add("RELEASE_PRODUCTION_MATCH_REQUIRED");
    if (matchingGrant.lawfulness_review_complete !== true) add("LEGAL_RECORDKEEPING_REVIEW_REQUIRED");
    if (matchingGrant.expires_at && new Date(matchingGrant.expires_at).getTime() <= now.getTime()) add("RIGHTS_GRANT_EXPIRED");
  }

  const creativeApproved = video?.creative_approval_status === "approved" || latestQa?.creative_approval_pass === true;
  const productionQaApproved = latestQa?.production_approved === true && latestQa?.final_decision === "APPROVED";
  const executiveApproved = video?.executive_approval_status === "approved" || latestQa?.executive_approval_pass === true;
  const governanceValid = video?.governance_status === "valid" || latestQa?.governance_valid === true;
  if (!creativeApproved) add("CREATIVE_APPROVAL_REQUIRED");
  if (!productionQaApproved) add("PRODUCTION_QA_APPROVAL_REQUIRED");
  if (!executiveApproved) add("EXECUTIVE_APPROVAL_REQUIRED");
  if (!governanceValid) add("GOVERNANCE_VALIDATION_REQUIRED");

  return { can_prepare: errors.length === 0, errors, source_asset_id: sourceAsset?.id || null, source_sha256: sourceAsset?.sha256 || null };
}

function toCents(value, field) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount < 0) throw new TypeError(`${field} must be a non-negative number`);
  return Math.round(amount * 100);
}

export function calculateRevenueSplit({
  grossSales,
  platformDeductions,
  refunds = 0,
  chargebacks = 0,
  creatorSharePercent = 70,
  fleshlabSharePercent = 30,
}) {
  const creatorPct = Number(creatorSharePercent);
  const studioPct = Number(fleshlabSharePercent);
  if (!Number.isFinite(creatorPct) || !Number.isFinite(studioPct) || Math.abs(creatorPct + studioPct - 100) > 0.00001) {
    throw new TypeError("Creator and FLESHLAB shares must total 100 percent");
  }
  const grossCents = toCents(grossSales, "grossSales");
  const feeCents = toCents(platformDeductions, "platformDeductions");
  const refundCents = toCents(refunds, "refunds");
  const chargebackCents = toCents(chargebacks, "chargebacks");
  const netCents = grossCents - feeCents - refundCents - chargebackCents;
  const creatorCents = Math.round(netCents * creatorPct / 100);
  return {
    grossSales: grossCents / 100,
    platformDeductions: feeCents / 100,
    refunds: refundCents / 100,
    chargebacks: chargebackCents / 100,
    netDistributionRevenue: netCents / 100,
    creatorShare: creatorCents / 100,
    fleshlabShare: (netCents - creatorCents) / 100,
  };
}

export function parseCanonicalCsv(csvText) {
  if (typeof csvText !== "string" || !csvText.trim()) throw new TypeError("CSV content is required");
  if (csvText.length > 250_000) throw new TypeError("CSV exceeds the 250 KB import limit");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const input = csvText.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell.length === 0) quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(cell); cell = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  if (quoted) throw new TypeError("CSV contains an unterminated quoted field");
  if (cell.length || row.length) { row.push(cell); if (row.some((value) => value.trim() !== "")) rows.push(row); }
  if (rows.length < 2) throw new TypeError("CSV must contain headers and at least one data row");
  const headers = rows.shift().map((header) => header.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
  if (new Set(headers).size !== headers.length) throw new TypeError("CSV has duplicate column names after normalization");
  const required = ["period_start", "period_end", "currency", "revenue_type", "gross_sales", "platform_deductions", "refunds", "chargebacks", "classification"];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) throw new TypeError(`CSV is missing required columns: ${missing.join(", ")}`);
  return rows.map((values, index) => {
    if (values.length !== headers.length) throw new TypeError(`CSV row ${index + 2} has ${values.length} values; expected ${headers.length}`);
    return Object.fromEntries(headers.map((header, column) => [header, values[column].trim()]));
  });
}
