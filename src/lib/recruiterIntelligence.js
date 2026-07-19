const REVIEW_STATUSES = ["pending", "media_pending", "reviewing", "more_info_requested"];
const APPROVED_STATUSES = ["approved", "contract_pending", "contract_sent", "contract_signed", "performer_created", "user_linked", "active"];

export function daysSince(dateValue) {
  if (!dateValue) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 86400000));
}

export function parseEventMeta(event) {
  try { return JSON.parse(event.metadata_json || "{}"); } catch { return {}; }
}

function hasUploads(app) {
  return Boolean((app.profile_photo_r2_keys || []).length || app.intro_video_r2_key || app.hardcore_video_r2_key);
}

function hasCompliance(app) {
  return Boolean(app.id_document_r2_key || app.selfie_with_id_r2_key || app.compliance_upload_status === "uploaded" || app.compliance_upload_status === "verified");
}

function timelineEvent(label, date, detail, tone = "neutral") {
  return date ? { label, date, detail, tone } : null;
}

export function buildApplicantTimeline(app) {
  return [
    timelineEvent("Submitted", app.submitted_at || app.created_date, app.source_page || "Recruitment flow", "info"),
    timelineEvent("Review started", app.review_started_at, app.assigned_admin ? `Assigned to ${app.assigned_admin}` : "Team review opened", "info"),
    timelineEvent("Media reviewed", app.media_reviewed_at, app.media_reviewed_by ? `Reviewed by ${app.media_reviewed_by}` : "Review media checked", "info"),
    timelineEvent("More info requested", app.more_info_requested_at, app.more_info_request_message || "Waiting for applicant response", "warning"),
    timelineEvent("Approved", app.approved_at, app.approved_by ? `Approved by ${app.approved_by}` : "Ready for contract or next step", "success"),
    timelineEvent("Rejected", app.rejected_at, app.rejection_reason || "Application did not move forward", "danger"),
    timelineEvent("Contract generated", app.contract_generated_at, app.contract_id || "Contract prepared", "info"),
    timelineEvent("Contract sent", app.contract_sent_at, "Awaiting signature", "warning"),
    timelineEvent("Contract signed", app.contract_signed_at, "Ready for activation or production planning", "success"),
    timelineEvent("Performer created", app.performer_created_at, app.performer_id || "Performer profile created", "success"),
    timelineEvent("Activated", app.activated_at, "Creator is active", "success"),
  ].filter(Boolean).sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function scoreApplicant(app) {
  let score = 35;
  if (app.email) score += 8;
  if (app.phone) score += 8;
  if (app.nationality || app.source_country) score += 6;
  if (app.package_interest && app.package_interest !== "not_sure") score += 8;
  if (hasUploads(app)) score += 12;
  if (hasCompliance(app)) score += 12;
  if (APPROVED_STATUSES.includes(app.status)) score += 14;
  if (app.status === "rejected") score -= 35;
  if (daysSince(app.updated_date || app.created_date) > 7 && REVIEW_STATUSES.includes(app.status)) score -= 10;
  return Math.max(0, Math.min(100, score));
}

export function buildRecruiterProfile(app) {
  const ageDays = daysSince(app.created_date);
  const staleDays = daysSince(app.updated_date || app.created_date);
  const score = scoreApplicant(app);
  const uploadsReady = hasUploads(app);
  const complianceReady = hasCompliance(app);
  const approved = APPROVED_STATUSES.includes(app.status);
  const rejected = app.status === "rejected";
  const cold = staleDays >= 5 && REVIEW_STATUSES.includes(app.status);
  const readyForVerification = uploadsReady && !complianceReady && !approved && !rejected;
  const readyForProduction = ["approved", "contract_signed", "performer_created", "user_linked", "active"].includes(app.status);

  let bucket = "Review queue";
  let nextAction = "Open profile and decide whether to continue review.";
  let tone = "Direct, professional, low-pressure";
  let followUp = "Today";
  const concerns = [];
  const missing = [];

  if (!uploadsReady) missing.push("review media");
  if (!complianceReady) missing.push("ID / selfie verification");
  if (!app.phone) missing.push("direct contact channel");
  if (cold) concerns.push("Applicant is becoming cold");
  if (ageDays > 2 && app.status === "pending") concerns.push("Waiting longer than target review window");

  if (rejected) {
    bucket = "Reject / archive";
    nextAction = "Confirm rejection reason is documented and close the loop.";
    tone = "Clear and respectful";
    followUp = "No follow-up unless requested";
  } else if (readyForProduction) {
    bucket = "Ready for production";
    nextAction = "Move to production planning or contract completion.";
    tone = "Confident and practical";
    followUp = "Today";
  } else if (readyForVerification) {
    bucket = "Ready for verification";
    nextAction = "Ask for ID/selfie verification and explain privacy handling.";
    tone = "Reassuring and specific";
    followUp = "Today";
  } else if (cold) {
    bucket = "Becoming cold";
    nextAction = "Send a short reassurance follow-up with one clear next step.";
    tone = "Warm, calm, no pressure";
    followUp = "Within 24 hours";
  } else if (score >= 70) {
    bucket = "High potential";
    nextAction = "Prioritize review and invite them to the next milestone.";
    tone = "Encouraging and concrete";
    followUp = "Today";
  }

  return {
    id: app.id,
    app,
    name: app.applicant_name || app.legal_name || "Unnamed applicant",
    country: app.nationality || app.source_country || "Unknown",
    path: app.package_interest || app.preferred_revenue_model || "not specified",
    source: app.utm_source || app.source_page || "direct",
    status: app.status || "pending",
    score,
    ageDays,
    staleDays,
    bucket,
    nextAction,
    tone,
    followUp,
    concerns,
    missing,
    approvalLikelihood: Math.min(95, Math.max(10, score + (complianceReady ? 8 : -8))),
    productionLikelihood: Math.min(90, Math.max(5, score + (readyForProduction ? 20 : uploadsReady ? 5 : -15))),
    timeline: buildApplicantTimeline(app),
  };
}

export function buildRecruitmentWorkspace(applications = [], events = [], performers = []) {
  const profiles = applications.map(buildRecruiterProfile).sort((a, b) => b.score - a.score || b.staleDays - a.staleDays);
  const today = new Date().toISOString().slice(0, 10);
  const applicationsToday = applications.filter(a => String(a.created_date || "").startsWith(today)).length;
  const approved = applications.filter(a => APPROVED_STATUSES.includes(a.status)).length;
  const rejected = applications.filter(a => a.status === "rejected").length;
  const waitingTooLong = profiles.filter(p => p.staleDays >= 5 && REVIEW_STATUSES.includes(p.status));
  const readyForVerification = profiles.filter(p => p.bucket === "Ready for verification");
  const readyForProduction = profiles.filter(p => p.bucket === "Ready for production");
  const highPotential = profiles.filter(p => p.score >= 70 && !["Ready for production", "Reject / archive"].includes(p.bucket));
  const attention = [...readyForProduction, ...readyForVerification, ...waitingTooLong, ...highPotential].filter((item, index, arr) => arr.findIndex(x => x.id === item.id) === index).slice(0, 12);
  const byCountry = groupCount(profiles, p => p.country);
  const byPath = groupCount(profiles, p => p.path);
  const bySource = groupCount(profiles, p => p.source);
  return {
    profiles,
    attention,
    metrics: {
      applicationsToday,
      qualified: profiles.filter(p => p.score >= 70).length,
      approvalRate: applications.length ? Math.round((approved / applications.length) * 100) : 0,
      rejectionRate: applications.length ? Math.round((rejected / applications.length) * 100) : 0,
      waitingTooLong: waitingTooLong.length,
      readyForVerification: readyForVerification.length,
      readyForProduction: readyForProduction.length,
      activeCreators: performers.filter(p => p.status === "active").length,
      avgReviewAge: profiles.length ? Math.round(profiles.reduce((sum, p) => sum + p.ageDays, 0) / profiles.length) : 0,
      eventSignals: events.length,
    },
    breakdowns: { byCountry, byPath, bySource },
    bottlenecks: buildBottlenecks(waitingTooLong, readyForVerification, readyForProduction),
  };
}

function groupCount(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function buildBottlenecks(waitingTooLong, readyForVerification, readyForProduction) {
  const list = [];
  if (waitingTooLong.length) list.push({ title: "Review backlog", detail: `${waitingTooLong.length} applicants have waited 5+ days since last update.`, action: "Clear oldest high-score profiles first." });
  if (readyForVerification.length) list.push({ title: "Verification backlog", detail: `${readyForVerification.length} applicants have media but still need verification.`, action: "Send privacy-first verification follow-up." });
  if (readyForProduction.length) list.push({ title: "Production scheduling", detail: `${readyForProduction.length} applicants are ready for production next steps.`, action: "Move approved applicants into planning." });
  if (!list.length) list.push({ title: "Pipeline stable", detail: "No critical recruitment bottleneck detected in the selected range.", action: "Review high-potential profiles and run the next experiment." });
  return list;
}