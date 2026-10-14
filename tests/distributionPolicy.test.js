import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDistributionIdempotencyKey,
  calculateAgeAt,
  calculateRevenueSplit,
  matchesOfficialPlatformDomain,
  parseCanonicalCsv,
  validatePlatformMetadata,
  validatePublicationReadiness,
} from "../base44/functions/shared/distributionPolicy.js";

test("age at production uses the production date and rejects invalid dates", () => {
  assert.equal(calculateAgeAt("2000-10-15", "2018-10-14"), 17);
  assert.equal(calculateAgeAt("2000-10-14", "2018-10-14"), 18);
  assert.equal(calculateAgeAt("not-a-date", "2018-10-14"), null);
});

test("distribution job idempotency key is stable and platform normalized", () => {
  assert.equal(buildDistributionIdempotencyKey("v 1", "FapHouse", "PREMIUM_PAID"), "v%201:faphouse:PREMIUM_PAID");
  assert.throws(() => buildDistributionIdempotencyKey("", "xhamster", "FREE_MONETIZED"), /required/);
});

test("publication URLs must use HTTPS on the registered platform domain", () => {
  assert.equal(matchesOfficialPlatformDomain("https://pornhub.com/view/123", "https://www.pornhub.com/"), true);
  assert.equal(matchesOfficialPlatformDomain("https://www.pornhub.com/view/123", "https://pornhub.com/"), true);
  assert.equal(matchesOfficialPlatformDomain("https://upload.pornhub.com/123", "https://pornhub.com/"), true);
  assert.equal(matchesOfficialPlatformDomain("https://pornhub.com.attacker.test/view/123", "https://pornhub.com/"), false);
  assert.equal(matchesOfficialPlatformDomain("http://pornhub.com/view/123", "https://pornhub.com/"), false);
  assert.equal(matchesOfficialPlatformDomain("https://user@pornhub.com/view/123", "https://pornhub.com/"), false);
});

test("metadata validation applies explicit limits", () => {
  assert.deepEqual(validatePlatformMetadata({ title: "long title", description: "valid description for test", tags: ["one", "two"], limits: { max_title_length: 5, max_tag_count: 1 } }), ["METADATA_TITLE_TOO_LONG", "METADATA_TAG_LIMIT_EXCEEDED"]);
});

test("free monetized publishing blocks paid tier videos", () => {
  const result = validatePublicationReadiness({
    video: { id: "video-1", title: "Title", description: "Long enough description", access_tier: "ppv", processing_status: "draft_ready" },
    platform: { platform_key: "xhamster", workflow_status: "RESEARCHED", integration_mode: "OPERATOR_ASSISTED" },
    variant: "FREE_MONETIZED",
  });
  assert.ok(result.errors.includes("PAID_CONTENT_CANNOT_BE_FREE_DISTRIBUTION"));
  assert.equal(result.can_prepare, false);
});

test("missing performer records and rights evidence fail closed", () => {
  const result = validatePublicationReadiness({
    video: { id: "video-2", title: "Title", description: "Long enough description", access_tier: "free", processing_status: "draft_ready" },
    platform: { platform_key: "clips4sale", workflow_status: "RESEARCHED", integration_mode: "OFFICIAL_BULK_UPLOAD" },
    variant: "PREMIUM_PAID",
    videoPerformers: [{ performer_id: "performer-1" }],
    performers: [{ id: "performer-1", date_of_birth: "2001-01-01", kyc_status: "pending", verified: false }],
  });
  assert.ok(result.errors.includes("READY_SOURCE_ASSET_REQUIRED"));
  assert.ok(result.errors.includes("APPROVED_GOVERNMENT_ID_REQUIRED"));
  assert.ok(result.errors.includes("APPROVED_ID_SELFIE_REQUIRED"));
  assert.ok(result.errors.includes("APPROVED_MODEL_RELEASE_REQUIRED"));
  assert.ok(result.errors.includes("VIDEO_SPECIFIC_RIGHTS_APPROVAL_REQUIRED"));
  assert.equal(result.can_prepare, false);
});

test("complete video-specific rights, technical validation and QA allow an operator package", () => {
  const result = validatePublicationReadiness({
    video: {
      id: "video-ready", title: "Approved production", description: "A sufficiently detailed description for a platform listing.",
      access_tier: "free", processing_status: "draft_ready", status: "draft",
      creative_approval_status: "approved", executive_approval_status: "approved", governance_status: "valid",
    },
    platform: { platform_key: "xhamster", workflow_status: "RESEARCHED", integration_mode: "OPERATOR_ASSISTED" },
    variant: "FREE_MONETIZED",
    videoPerformers: [{ video_id: "video-ready", performer_id: "performer-ready" }],
    performers: [{ id: "performer-ready", date_of_birth: "1998-01-01", verified: true, kyc_status: "approved" }],
    documents: [
      { id: "doc-id", performer_id: "performer-ready", document_type: "id_front", status: "approved", file_uri: "private://id" },
      { id: "doc-selfie", performer_id: "performer-ready", document_type: "selfie_with_id", status: "approved", file_uri: "private://selfie" },
      { id: "doc-release", performer_id: "performer-ready", document_type: "model_release", status: "approved", file_uri: "private://release" },
    ],
    contracts: [{ performer_id: "performer-ready", status: "signed", verified: true, signed_at: "2025-01-01T00:00:00Z", performer_signature_consent_checked: true }],
    rightsGrants: [{
      video_id: "video-ready", performer_id: "performer-ready", status: "APPROVED", production_date: "2020-06-01",
      platform_keys: ["xhamster"], variants: ["FREE_MONETIZED"], territories: ["WORLDWIDE"], release_document_ids: ["doc-release"],
      reviewed_by: "admin-1", reviewed_at: "2026-10-14T00:00:00Z", distribution_rights_verified: true,
      sublicensing_verified: true, identity_review_complete: true, voluntary_consent_review_complete: true,
      production_safety_review_complete: true, no_coercion_review_complete: true,
      no_hidden_recording_review_complete: true, no_impairment_review_complete: true,
      release_production_match_review_complete: true, lawfulness_review_complete: true,
    }],
    assets: [
      { id: "source-1", asset_type: "source", status: "ready", file_size_bytes: 500000, duration_seconds: 1200, width: 1920, height: 1080, mime_type: "video/mp4", codec: "h264", has_audio_stream: true, sha256: "a".repeat(64), validation_status: "passed" },
      { id: "thumb-1", asset_type: "thumbnail", status: "ready" },
    ],
    latestQa: { production_approved: true, final_decision: "APPROVED", creative_approval_pass: true, executive_approval_pass: true, governance_valid: true },
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.can_prepare, true);
  assert.equal(result.source_asset_id, "source-1");
});

test("revenue allocation includes fees, refunds and chargebacks in net", () => {
  assert.deepEqual(calculateRevenueSplit({ grossSales: 1000, platformDeductions: 400, refunds: 50, chargebacks: 25 }), {
    grossSales: 1000,
    platformDeductions: 400,
    refunds: 50,
    chargebacks: 25,
    netDistributionRevenue: 525,
    creatorShare: 367.5,
    fleshlabShare: 157.5,
  });
  assert.throws(() => calculateRevenueSplit({ grossSales: 100, platformDeductions: 10, creatorSharePercent: 65, fleshlabSharePercent: 30 }), /total 100/);
});

test("canonical CSV parser handles quoted commas and validates required columns", () => {
  const rows = parseCanonicalCsv('period_start,period_end,currency,revenue_type,gross_sales,platform_deductions,refunds,chargebacks,classification,video_id\n2026-10-01,2026-10-31,USD,PPV,"1,200.50",300,0,0,PLATFORM_REPORTED,vid-1');
  assert.equal(rows[0].gross_sales, "1,200.50");
  assert.throws(() => parseCanonicalCsv("period_start,period_end\n2026-10-01,2026-10-31"), /missing required columns/);
});
