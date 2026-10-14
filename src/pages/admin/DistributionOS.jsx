import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ClipboardCopy, Download, ExternalLink, FileText, RefreshCw, ShieldCheck, UploadCloud } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const TABS = ["Overview", "Platforms", "Applications", "Rights", "Queue", "Revenue", "Partners"];
const VARIANTS = ["FREE_MONETIZED", "PROMOTIONAL", "PREMIUM_PAID"];
const PLATFORM_STATUSES = ["NOT_RESEARCHED", "RESEARCHED", "APPLICATION_REQUIRED", "APPLICATION_PREPARED", "APPLICATION_SUBMITTED", "AWAITING_APPROVAL", "APPROVED", "INTEGRATION_IN_PROGRESS", "BLOCKED", "REJECTED"];
const APPLICATION_STATUSES = ["APPLICATION_SUBMITTED", "AWAITING_APPROVAL", "APPROVED", "REJECTED", "BLOCKED"];
const RIGHTS_STATUSES = ["MISSING_DOCUMENTS", "UNDER_REVIEW", "APPROVED", "REJECTED", "EXPIRED", "SUSPENDED", "LEGAL_HOLD"];
const REVIEW_FIELDS = [
  ["distribution_rights_verified", "Commercial distribution rights verified"],
  ["sublicensing_verified", "Sublicensing rights verified"],
  ["identity_review_complete", "Identity and age records reviewed"],
  ["voluntary_consent_review_complete", "Voluntary and informed consent reviewed"],
  ["production_safety_review_complete", "Production safety reviewed"],
  ["no_coercion_review_complete", "Coercion and control risks reviewed"],
  ["no_hidden_recording_review_complete", "Hidden recording risks reviewed"],
  ["no_impairment_review_complete", "Consent impairment risks reviewed"],
  ["release_production_match_review_complete", "Release matched to this production"],
  ["lawfulness_review_complete", "Applicable law and recordkeeping reviewed"],
];
const ERROR_LABELS = {
  VIDEO_NOT_FOUND: "Video not found",
  PLATFORM_NOT_FOUND: "Platform is not registered",
  PLATFORM_NOT_RESEARCHED_OR_BLOCKED: "Platform conditions must be researched first",
  PLATFORM_UNAVAILABLE: "No supported distribution path is available",
  PLATFORM_BLOCKED: "Platform workflow is blocked",
  DISTRIBUTION_VARIANT_INVALID: "Choose a valid distribution profile",
  VIDEO_TITLE_MISSING: "A valid title is required",
  VIDEO_DESCRIPTION_MISSING: "A description of at least 20 characters is required",
  MEDIA_PROCESSING_INCOMPLETE: "Video processing is not complete",
  VIDEO_NOT_DISTRIBUTABLE: "Video status does not allow distribution",
  PAID_CONTENT_CANNOT_BE_FREE_DISTRIBUTION: "Paid or fanclub content cannot be prepared as free monetized distribution",
  READY_SOURCE_ASSET_REQUIRED: "A ready source master is missing",
  SOURCE_FILE_SIZE_UNVERIFIED: "Source file size is not verified",
  SOURCE_DURATION_UNVERIFIED: "Source duration is not verified",
  SOURCE_RESOLUTION_UNVERIFIED: "Source resolution is not verified",
  SOURCE_MIME_TYPE_UNVERIFIED: "Source MIME type is not verified",
  SOURCE_CODEC_UNVERIFIED: "Source codec is not verified",
  SOURCE_AUDIO_STREAM_UNVERIFIED: "An audio stream check is missing",
  SOURCE_SHA256_UNVERIFIED: "A SHA-256 checksum is missing or invalid",
  SOURCE_FILE_VALIDATION_REQUIRED: "Technical file validation has not passed",
  READY_POSTER_REQUIRED: "A ready poster or thumbnail is required",
  READY_PROMOTIONAL_ASSET_REQUIRED: "A ready trailer or preview is required for promotional distribution",
  PERFORMER_ASSIGNMENT_REQUIRED: "At least one performer must be assigned",
  PERFORMER_RECORD_MISSING: "A linked performer record is missing",
  PERFORMER_IDENTITY_NOT_VERIFIED: "Performer identity verification is incomplete",
  APPROVED_GOVERNMENT_ID_REQUIRED: "An approved government ID record is missing",
  APPROVED_ID_SELFIE_REQUIRED: "An approved ID selfie record is missing",
  APPROVED_MODEL_RELEASE_REQUIRED: "An approved release record is missing",
  VERIFIED_SIGNED_CONTRACT_REQUIRED: "A verified, signed performer contract is missing",
  VIDEO_SPECIFIC_RIGHTS_APPROVAL_REQUIRED: "Video-specific distribution approval is missing",
  AGE_AT_PRODUCTION_NOT_VERIFIED: "Age at the production date cannot be verified as 18 or older",
  VARIANT_NOT_AUTHORIZED: "This distribution profile is not authorized for the production",
  DISTRIBUTION_TERRITORIES_REQUIRED: "Authorized territories are not recorded",
  PRODUCTION_RELEASE_LINK_REQUIRED: "An approved release is not linked to this production",
  DISTRIBUTION_RIGHTS_NOT_VERIFIED: "Commercial distribution rights have not been verified",
  SUBLICENSING_RIGHTS_NOT_VERIFIED: "Sublicensing rights have not been verified",
  IDENTITY_REVIEW_REQUIRED: "Identity and age records need human review",
  CONSENT_REVIEW_REQUIRED: "Voluntary and informed consent needs human review",
  PRODUCTION_SAFETY_REVIEW_REQUIRED: "Production safety checks need human review",
  LEGAL_RECORDKEEPING_REVIEW_REQUIRED: "Applicable legal and recordkeeping review is incomplete",
  RIGHTS_GRANT_REVIEWER_REQUIRED: "A named authorized reviewer and review date are required",
  NO_COERCION_REVIEW_REQUIRED: "Coercion and control risks need review",
  NO_HIDDEN_RECORDING_REVIEW_REQUIRED: "Hidden recording risks need review",
  NO_IMPAIRMENT_REVIEW_REQUIRED: "Consent impairment risks need review",
  RELEASE_PRODUCTION_MATCH_REQUIRED: "The release must be matched to this specific production",
  RIGHTS_GRANT_EXPIRED: "The distribution rights approval has expired",
  CREATIVE_APPROVAL_REQUIRED: "Creative approval is missing",
  PRODUCTION_QA_APPROVAL_REQUIRED: "Production QA approval is missing",
  EXECUTIVE_APPROVAL_REQUIRED: "Executive approval is missing",
  GOVERNANCE_VALIDATION_REQUIRED: "Governance validation is missing",
  METADATA_TITLE_REQUIRED: "A valid platform title is required",
  METADATA_TITLE_TOO_LONG: "The title exceeds this platform's configured limit",
  METADATA_DESCRIPTION_REQUIRED: "A platform description is required",
  METADATA_DESCRIPTION_TOO_LONG: "The description exceeds this platform's configured limit",
  METADATA_TAG_LIMIT_EXCEEDED: "The tag count exceeds this platform's configured limit",
};

const inputClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const textareaClass = "min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function callDistribution(action, payload = {}) {
  return base44.functions.invoke("distributionOSService", { action, ...payload }).then((response) => {
    const data = response?.data ?? response;
    if (data?.error) throw new Error(data.error);
    return data;
  });
}

function StatusPill({ value }) {
  const tone = value === "CONNECTED" || value === "PUBLISHED" || value === "APPROVED" || value === "IMPORTED"
    ? "bg-emerald-500/15 text-emerald-700"
    : value === "BLOCKED" || value === "BLOCKED_COMPLIANCE" || value === "REJECTED" || value === "FAILED"
      ? "bg-red-500/15 text-red-700"
      : "bg-amber-500/15 text-amber-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{String(value || "UNKNOWN").replaceAll("_", " ")}</span>;
}

function downloadText(filename, text, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function initialApplicationProfile() {
  return {
    legal_entity_name: "",
    jurisdiction: "Taiwan",
    contact_name: "",
    contact_email: "",
    official_website: "",
    brand_description: "FLESHLAB is an independent adult content studio and distributor focused on authentic productions.",
    content_portfolio: "",
    studio_capabilities: "Original video production, rights documentation, performer onboarding and content metadata preparation.",
    requested_access: "Studio/producer onboarding, approved upload options, reporting access and current commercial terms.",
  };
}

export default function DistributionOS() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Overview");
  const [applicationPlatform, setApplicationPlatform] = useState("");
  const [applicationProfile, setApplicationProfile] = useState(initialApplicationProfile);
  const [preparedApplication, setPreparedApplication] = useState(null);
  const [applicationUpdate, setApplicationUpdate] = useState({ application_id: "", workflow_status: "APPLICATION_SUBMITTED", submitted_at: "", evidence_url: "", evidence_verified_at: "", response_summary: "", follow_up_at: "", operator_confirmed_submitted: false });
  const [rightsDraft, setRightsDraft] = useState({ video_id: "", performer_id: "", production_date: "", platform_keys: [], variants: [], territories: "WORLDWIDE", release_document_ids: [], status: "UNDER_REVIEW", distribution_rights_verified: false, sublicensing_verified: false, identity_review_complete: false, voluntary_consent_review_complete: false, production_safety_review_complete: false, no_coercion_review_complete: false, no_hidden_recording_review_complete: false, no_impairment_review_complete: false, release_production_match_review_complete: false, lawfulness_review_complete: false, expires_at: "", notes: "", operator_confirmed_review: false });
  const [queueDraft, setQueueDraft] = useState({ video_id: "", platform_key: "", variant: "FREE_MONETIZED", title: "", description: "", language: "en" });
  const [lastPreparedJob, setLastPreparedJob] = useState(null);
  const [publicationForm, setPublicationForm] = useState({ job_id: "", external_content_id: "", publication_url: "", operator_confirmed_external_upload: false });
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [platformEdit, setPlatformEdit] = useState(null);
  const [revenuePlatform, setRevenuePlatform] = useState("");
  const [revenueFile, setRevenueFile] = useState(null);
  const [lastRevenueImport, setLastRevenueImport] = useState(null);
  const [agreement, setAgreement] = useState({ partner_name: "", setup_fee_usd: 2490, creator_share_percent: 70, fleshlab_share_percent: 30, status: "DRAFT", notes: "" });
  const [splitForm, setSplitForm] = useState({ agreement_id: "", gross_sales: "", platform_deductions: "", refunds: "0", chargebacks: "0" });
  const [lastSplit, setLastSplit] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["distribution-os"],
    queryFn: () => callDistribution("list"),
    staleTime: 15_000,
  });
  const { data: rightsEvidence, isFetching: isLoadingRightsEvidence } = useQuery({
    queryKey: ["distribution-rights-evidence", rightsDraft.video_id, rightsDraft.production_date],
    queryFn: () => callDistribution("rights_evidence", { video_id: rightsDraft.video_id, production_date: rightsDraft.production_date }),
    enabled: activeTab === "Rights" && Boolean(rightsDraft.video_id),
    staleTime: 10_000,
  });

  const seedMutation = useMutation({
    mutationFn: () => callDistribution("seed_platforms"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["distribution-os"] }); toast.success("Platform register initialized"); },
    onError: (mutationError) => toast.error(mutationError.message || "Request failed"),
  });
  const applicationMutation = useMutation({
    mutationFn: () => callDistribution("prepare_application", { platform_key: applicationPlatform, profile: applicationProfile }),
    onSuccess: (result) => { setPreparedApplication(result); queryClient.invalidateQueries({ queryKey: ["distribution-os"] }); toast.success("Non-binding application draft prepared"); },
    onError: (mutationError) => toast.error(mutationError.message || "Draft could not be prepared"),
  });
  const applicationStatusMutation = useMutation({
    mutationFn: () => callDistribution("record_application_status", applicationUpdate),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["distribution-os"] }); toast.success("Application status recorded"); setApplicationUpdate((current) => ({ ...current, application_id: "", response_summary: "" })); },
    onError: (mutationError) => toast.error(mutationError.message || "Status update failed"),
  });
  const rightsGrantMutation = useMutation({
    mutationFn: () => callDistribution("save_rights_grant", {
      ...rightsDraft,
      territories: rightsDraft.territories.split(",").map((territory) => territory.trim()).filter(Boolean),
      expires_at: rightsDraft.expires_at ? `${rightsDraft.expires_at}T00:00:00.000Z` : "",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distribution-os"] });
      queryClient.invalidateQueries({ queryKey: ["distribution-rights-evidence", rightsDraft.video_id] });
      setRightsDraft((current) => ({ ...current, operator_confirmed_review: false }));
      toast.success("Video-specific rights review saved");
    },
    onError: (mutationError) => toast.error(mutationError.message || "Rights review could not be saved"),
  });
  const platformMutation = useMutation({
    mutationFn: () => callDistribution("update_platform", { platform_key: platformEdit.platform_key, patch: {
      workflow_status: platformEdit.workflow_status,
      studio_eligibility: platformEdit.studio_eligibility,
      approval_status: platformEdit.approval_status,
      integration_mode: platformEdit.integration_mode,
      authentication_status: platformEdit.authentication_status,
      evidence_url: platformEdit.evidence_url,
      evidence_verified_at: platformEdit.evidence_verified_at,
      application_submitted_at: platformEdit.application_submitted_at,
      next_action: platformEdit.next_action,
      revenue_share_terms: platformEdit.revenue_share_terms,
      upload_capabilities: platformEdit.upload_capabilities,
      reporting_capabilities: platformEdit.reporting_capabilities,
    } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["distribution-os"] }); setPlatformEdit(null); toast.success("Platform record updated"); },
    onError: (mutationError) => toast.error(mutationError.message || "Platform update failed"),
  });
  const prepareJobMutation = useMutation({
    mutationFn: () => callDistribution("prepare_publication", {
      video_id: queueDraft.video_id,
      platform_key: queueDraft.platform_key,
      variant: queueDraft.variant,
      title: queueDraft.title,
      description: queueDraft.description,
      language: queueDraft.language,
    }),
    onSuccess: (result) => {
      setLastPreparedJob(result);
      queryClient.invalidateQueries({ queryKey: ["distribution-os"] });
      if (result.readiness?.can_prepare) toast.success(result.duplicate ? "Existing package loaded" : "Metadata package prepared");
      else toast.error("Package blocked by readiness or compliance checks");
    },
    onError: (mutationError) => toast.error(mutationError.message || "Package could not be prepared"),
  });
  const publicationMutation = useMutation({
    mutationFn: () => callDistribution("record_publication", publicationForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["distribution-os"] }); setPublicationForm({ job_id: "", external_content_id: "", publication_url: "", operator_confirmed_external_upload: false }); toast.success("Operator-confirmed publication recorded"); },
    onError: (mutationError) => toast.error(mutationError.message || "Publication could not be recorded"),
  });
  const revenueMutation = useMutation({
    mutationFn: async () => {
      if (!revenueFile || !revenuePlatform) throw new Error("Select a platform and CSV report first");
      const csvText = await revenueFile.text();
      return callDistribution("import_revenue", { platform_key: revenuePlatform, file_name: revenueFile.name, csv_text: csvText });
    },
    onSuccess: (result) => { setLastRevenueImport(result); queryClient.invalidateQueries({ queryKey: ["distribution-os"] }); toast.success(result.duplicate ? "This report was already imported" : "Platform report imported"); },
    onError: (mutationError) => toast.error(mutationError.message || "Report import failed"),
  });
  const agreementMutation = useMutation({
    mutationFn: () => callDistribution("save_agreement", { agreement }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["distribution-os"] }); setAgreement({ partner_name: "", setup_fee_usd: 2490, creator_share_percent: 70, fleshlab_share_percent: 30, status: "DRAFT", notes: "" }); toast.success("Agreement draft saved"); },
    onError: (mutationError) => toast.error(mutationError.message || "Agreement could not be saved"),
  });
  const splitMutation = useMutation({
    mutationFn: () => callDistribution("calculate_agreement_split", {
      agreement_id: splitForm.agreement_id,
      gross_sales: Number(splitForm.gross_sales),
      platform_deductions: Number(splitForm.platform_deductions),
      refunds: Number(splitForm.refunds || 0),
      chargebacks: Number(splitForm.chargebacks || 0),
    }),
    onSuccess: setLastSplit,
    onError: (mutationError) => toast.error(mutationError.message || "Split could not be calculated"),
  });

  const platforms = data?.platforms || [];
  const applications = data?.applications || [];
  const jobs = data?.jobs || [];
  const imports = data?.revenueImports || [];
  const agreements = data?.agreements || [];
  const videos = data?.videos || [];
  const selectedJob = jobs.find((job) => job.id === publicationForm.job_id);
  const selectedRightsPerformer = rightsEvidence?.participants?.find((participant) => participant.performer_id === rightsDraft.performer_id) || null;
  const platformName = (key) => platforms.find((platform) => platform.platform_key === key)?.name || key;
  const revenueSummary = useMemo(() => imports.reduce((summary, report) => {
    const key = report.classification === "ESTIMATE" ? "estimated" : "platformReported";
    summary[key] += Number(report.net_distribution_revenue || 0);
    return summary;
  }, { estimated: 0, platformReported: 0 }), [imports]);
  const readyCount = jobs.filter((job) => job.status === "READY").length;
  const publishedCount = jobs.filter((job) => job.status === "PUBLISHED").length;
  const blockedCount = jobs.filter((job) => job.status === "BLOCKED_COMPLIANCE" || job.status === "DRAFT").length;

  const updateProfile = (field, value) => setApplicationProfile((current) => ({ ...current, [field]: value }));
  const updatePlatformEdit = (field, value) => setPlatformEdit((current) => ({ ...current, [field]: value }));

  const handleDownloadPackage = () => {
    if (!lastPreparedJob?.job) return;
    const packageData = {
      package_type: "FLESHLAB_METADATA_ONLY_OPERATOR_PACKAGE",
      warning: "This file does not contain or upload the video master. Retrieve media through the approved secure operator workflow.",
      platform: platformName(lastPreparedJob.job.platform_key),
      job_status: lastPreparedJob.job.status,
      metadata: (() => { try { return JSON.parse(lastPreparedJob.job.metadata_snapshot_json || "{}"); } catch { return {}; } })(),
      validation_errors: lastPreparedJob.readiness?.errors || [],
      source_asset_id: lastPreparedJob.job.source_asset_id || null,
      source_sha256: lastPreparedJob.job.source_sha256 || null,
    };
    downloadText(`fleshlab-${lastPreparedJob.job.platform_key}-${lastPreparedJob.job.video_id}-metadata.json`, JSON.stringify(packageData, null, 2));
  };

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading Distribution OS…</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">FLESHLAB HQ</p>
          <h1 className="mt-1 text-3xl font-bold">Distribution OS</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Platform research, applications, compliance-gated operator packages and revenue imports. This workspace does not perform external uploads.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>

      <Alert className="border-amber-500/40 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm">External API access, platform approval, media-file retrieval and production deployment are not configured here. A “Ready” job is a metadata package for operator review, not an upload or publication.</AlertDescription>
      </Alert>

      {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error.message}</AlertDescription></Alert>}

      <div className="flex flex-wrap gap-2 border-b pb-3">
        {TABS.map((tab) => <Button key={tab} variant={activeTab === tab ? "default" : "ghost"} size="sm" onClick={() => setActiveTab(tab)}>{tab}</Button>)}
      </div>

      {activeTab === "Overview" && (
        <div className="space-y-6">
          {platforms.length === 0 && <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 p-5"><div><h2 className="font-semibold">Platform register is empty</h2><p className="text-sm text-muted-foreground">Seed the verified platform list and research backlog. This creates admin registry records only.</p></div><Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>Initialize register</Button></CardContent></Card>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric title="Platforms" value={platforms.length} detail={`${platforms.filter((item) => item.workflow_status === "CONNECTED").length} verified connected`} />
            <Metric title="Operator packages ready" value={readyCount} detail="No external upload executed" />
            <Metric title="Published records" value={publishedCount} detail="Operator-confirmed only" />
            <Metric title="Blocked packages" value={blockedCount} detail="Requires evidence or review" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <MetricCard title="Platform-reported net" value={revenueSummary.platformReported} detail="Platform reports; payout may still be unconfirmed" />
            <MetricCard title="Estimated net" value={revenueSummary.estimated} detail="Forecast only; not confirmed receipts" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardHeader><CardTitle className="text-base">Priority snapshot</CardTitle></CardHeader><CardContent className="space-y-3">{["P0", "P1", "P2"].map((priority) => <div key={priority} className="flex items-center justify-between border-b pb-2 last:border-0"><span className="font-medium">{priority}</span><span className="text-sm text-muted-foreground">{platforms.filter((item) => item.priority === priority).length} platforms · {platforms.filter((item) => item.priority === priority && item.workflow_status === "CONNECTED").length} connected</span></div>)}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Current blockers</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>1. No production deployment credentials or Base44 publish session are available in this workspace.</p><p>2. No platform API credentials or approved partner upload scope has been verified.</p><p>3. New source SHA-256 and technical validation fields are not yet populated by the existing media pipeline.</p><p>4. Video-specific rights grants are intentionally empty until a human reviews source records.</p></CardContent></Card>
          </div>
        </div>
      )}

      {activeTab === "Platforms" && (
        <div className="space-y-4">
          {platforms.length === 0 ? <EmptyRegister onInitialize={() => seedMutation.mutate()} loading={seedMutation.isPending} /> : <>
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="p-3">Platform</th><th className="p-3">Priority</th><th className="p-3">Workflow</th><th className="p-3">Eligibility</th><th className="p-3">Mode</th><th className="p-3">Approval/Auth</th><th className="p-3">Next action</th><th className="p-3"></th></tr></thead>
                <tbody>{platforms.map((platform) => <tr key={platform.id} className="border-t align-top"><td className="p-3"><div className="font-semibold">{platform.name}</div><a className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline" href={platform.official_url} target="_blank" rel="noreferrer">Official site <ExternalLink className="h-3 w-3" /></a></td><td className="p-3">{platform.priority}</td><td className="p-3"><StatusPill value={platform.workflow_status} /></td><td className="p-3 text-xs">{platform.studio_eligibility || "UNKNOWN"}</td><td className="p-3 text-xs">{platform.integration_mode}</td><td className="p-3 text-xs">{platform.approval_status}<br />{platform.authentication_status}</td><td className="max-w-xs p-3 text-xs text-muted-foreground">{platform.next_action || "No action recorded"}</td><td className="p-3"><Button size="sm" variant="outline" onClick={() => { setSelectedPlatform(platform); setPlatformEdit({ ...platform, evidence_verified_at: platform.evidence_verified_at || "", application_submitted_at: platform.application_submitted_at || "" }); }}>Edit</Button></td></tr>)}</tbody>
              </table>
            </div>
            {selectedPlatform && platformEdit && <Card><CardHeader><CardTitle className="text-base">Update {selectedPlatform.name}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Field label="Workflow status"><select className={inputClass} value={platformEdit.workflow_status} onChange={(event) => updatePlatformEdit("workflow_status", event.target.value)}>{PLATFORM_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></Field>
              <Field label="Studio eligibility"><select className={inputClass} value={platformEdit.studio_eligibility || "UNKNOWN"} onChange={(event) => updatePlatformEdit("studio_eligibility", event.target.value)}>{["UNKNOWN", "INDIVIDUAL_CREATOR", "STUDIO_OR_PRODUCER", "APPLICATION_REQUIRED", "INELIGIBLE", "REQUIRES_REVIEW"].map((status) => <option key={status}>{status}</option>)}</select></Field>
              <Field label="Approval status"><select className={inputClass} value={platformEdit.approval_status || "NOT_REQUESTED"} onChange={(event) => updatePlatformEdit("approval_status", event.target.value)}>{["NOT_REQUESTED", "AWAITING_APPROVAL", "APPROVED", "REJECTED", "EXPIRED"].map((status) => <option key={status}>{status}</option>)}</select></Field>
              <Field label="Integration mode"><select className={inputClass} value={platformEdit.integration_mode} onChange={(event) => updatePlatformEdit("integration_mode", event.target.value)}>{["OFFICIAL_API", "AUTHORIZED_PARTNER_FEED", "OFFICIAL_BULK_UPLOAD", "OPERATOR_ASSISTED", "UNAVAILABLE"].map((status) => <option key={status}>{status}</option>)}</select></Field>
              <Field label="Authentication status"><select className={inputClass} value={platformEdit.authentication_status || "UNCONNECTED"} onChange={(event) => updatePlatformEdit("authentication_status", event.target.value)}>{["UNCONNECTED", "PENDING", "VALIDATED", "REVOKED", "NOT_APPLICABLE"].map((status) => <option key={status}>{status}</option>)}</select></Field>
              <Field label="Application submitted at"><input className={inputClass} type="date" value={String(platformEdit.application_submitted_at || "").slice(0, 10)} onChange={(event) => updatePlatformEdit("application_submitted_at", event.target.value ? `${event.target.value}T00:00:00.000Z` : "")} /></Field>
              <Field label="Evidence URL"><input className={inputClass} value={platformEdit.evidence_url || ""} onChange={(event) => updatePlatformEdit("evidence_url", event.target.value)} placeholder="https://official-platform/..." /></Field>
              <Field label="Evidence verified at"><input className={inputClass} type="date" value={String(platformEdit.evidence_verified_at || "").slice(0, 10)} onChange={(event) => updatePlatformEdit("evidence_verified_at", event.target.value ? `${event.target.value}T00:00:00.000Z` : "")} /></Field>
              <Field label="Next action"><input className={inputClass} value={platformEdit.next_action || ""} onChange={(event) => updatePlatformEdit("next_action", event.target.value)} /></Field>
              <Field label="Revenue terms"><textarea className={textareaClass} value={platformEdit.revenue_share_terms || ""} onChange={(event) => updatePlatformEdit("revenue_share_terms", event.target.value)} /></Field>
              <Field label="Upload capabilities"><textarea className={textareaClass} value={platformEdit.upload_capabilities || ""} onChange={(event) => updatePlatformEdit("upload_capabilities", event.target.value)} /></Field>
              <Field label="Reporting capabilities"><textarea className={textareaClass} value={platformEdit.reporting_capabilities || ""} onChange={(event) => updatePlatformEdit("reporting_capabilities", event.target.value)} /></Field>
              <div className="flex items-end gap-2"><Button onClick={() => platformMutation.mutate()} disabled={platformMutation.isPending}>Save evidence</Button><Button variant="ghost" onClick={() => { setSelectedPlatform(null); setPlatformEdit(null); }}>Cancel</Button></div>
            </CardContent></Card>}
          </>}
        </div>
      )}

      {activeTab === "Applications" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <Card><CardHeader><CardTitle className="text-base">Prepare application draft</CardTitle></CardHeader><CardContent className="space-y-4">
            <Alert><FileText className="h-4 w-4" /><AlertDescription className="text-sm">This creates a non-binding English draft with placeholders for facts not provided. Submission and legal declarations stay with an authorized operator on the official platform.</AlertDescription></Alert>
            <Field label="Platform"><select className={inputClass} value={applicationPlatform} onChange={(event) => setApplicationPlatform(event.target.value)}><option value="">Select platform</option>{platforms.filter((platform) => !["BLOCKED", "REJECTED"].includes(platform.workflow_status)).map((platform) => <option value={platform.platform_key} key={platform.id}>{platform.name}</option>)}</select></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Legal entity name"><input className={inputClass} value={applicationProfile.legal_entity_name} onChange={(event) => updateProfile("legal_entity_name", event.target.value)} /></Field>
              <Field label="Jurisdiction"><input className={inputClass} value={applicationProfile.jurisdiction} onChange={(event) => updateProfile("jurisdiction", event.target.value)} /></Field>
              <Field label="Authorized contact"><input className={inputClass} value={applicationProfile.contact_name} onChange={(event) => updateProfile("contact_name", event.target.value)} /></Field>
              <Field label="Contact email"><input className={inputClass} type="email" value={applicationProfile.contact_email} onChange={(event) => updateProfile("contact_email", event.target.value)} /></Field>
              <Field label="Official website"><input className={inputClass} type="url" value={applicationProfile.official_website} onChange={(event) => updateProfile("official_website", event.target.value)} placeholder="https://…" /></Field>
              <Field label="Studio capabilities"><textarea className={textareaClass} value={applicationProfile.studio_capabilities} onChange={(event) => updateProfile("studio_capabilities", event.target.value)} /></Field>
            </div>
            <Field label="Brand description"><textarea className={textareaClass} value={applicationProfile.brand_description} onChange={(event) => updateProfile("brand_description", event.target.value)} /></Field>
            <Field label="Content portfolio"><textarea className={textareaClass} value={applicationProfile.content_portfolio} onChange={(event) => updateProfile("content_portfolio", event.target.value)} placeholder="Describe the existing portfolio without names, ages or unverified claims." /></Field>
            <Field label="Requested access"><textarea className={textareaClass} value={applicationProfile.requested_access} onChange={(event) => updateProfile("requested_access", event.target.value)} /></Field>
            <Button onClick={() => applicationMutation.mutate()} disabled={!applicationPlatform || applicationMutation.isPending}>Prepare draft</Button>
            {preparedApplication && <div className="space-y-3 rounded-lg border p-4"><div className="flex items-center justify-between gap-2"><div><p className="font-semibold">Draft ready · {platformName(preparedApplication.application.platform_key)}</p><p className="text-xs text-muted-foreground">Missing fields: {preparedApplication.missing_fields?.length ? preparedApplication.missing_fields.join(", ") : "none"}</p></div><Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(preparedApplication.application.draft_text).then(() => toast.success("Draft copied"))}><ClipboardCopy className="mr-2 h-4 w-4" />Copy</Button></div><pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-xs">{preparedApplication.application.draft_text}</pre></div>}
          </CardContent></Card>
          <div className="space-y-5">
            <Card><CardHeader><CardTitle className="text-base">Record operator-submitted application</CardTitle></CardHeader><CardContent className="space-y-3">
              <Field label="Draft"><select className={inputClass} value={applicationUpdate.application_id} onChange={(event) => setApplicationUpdate((current) => ({ ...current, application_id: event.target.value }))}><option value="">Select application</option>{applications.map((app) => <option key={app.id} value={app.id}>{platformName(app.platform_key)} · {app.workflow_status}</option>)}</select></Field>
              <Field label="Status"><select className={inputClass} value={applicationUpdate.workflow_status} onChange={(event) => setApplicationUpdate((current) => ({ ...current, workflow_status: event.target.value }))}>{APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></Field>
              {applicationUpdate.workflow_status === "APPLICATION_SUBMITTED" && <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={applicationUpdate.operator_confirmed_submitted} onChange={(event) => setApplicationUpdate((current) => ({ ...current, operator_confirmed_submitted: event.target.checked }))} /><span>I personally submitted this application through the platform’s official channel.</span></label>}
              <Field label="Submission / approval evidence URL"><input className={inputClass} type="url" value={applicationUpdate.evidence_url} onChange={(event) => setApplicationUpdate((current) => ({ ...current, evidence_url: event.target.value }))} /></Field>
              <Field label="Submitted at"><input className={inputClass} type="date" value={applicationUpdate.submitted_at.slice(0, 10)} onChange={(event) => setApplicationUpdate((current) => ({ ...current, submitted_at: event.target.value ? `${event.target.value}T00:00:00.000Z` : "" }))} /></Field>
              {applicationUpdate.workflow_status === "APPROVED" && <Field label="Approval evidence verified at"><input className={inputClass} type="date" value={applicationUpdate.evidence_verified_at?.slice(0, 10) || ""} onChange={(event) => setApplicationUpdate((current) => ({ ...current, evidence_verified_at: event.target.value ? `${event.target.value}T00:00:00.000Z` : "" }))} /></Field>}
              <Field label="Response summary"><textarea className={textareaClass} value={applicationUpdate.response_summary} onChange={(event) => setApplicationUpdate((current) => ({ ...current, response_summary: event.target.value }))} /></Field>
              <Field label="Next follow-up"><input className={inputClass} type="date" value={applicationUpdate.follow_up_at.slice(0, 10)} onChange={(event) => setApplicationUpdate((current) => ({ ...current, follow_up_at: event.target.value ? `${event.target.value}T00:00:00.000Z` : "" }))} /></Field>
              <Button onClick={() => applicationStatusMutation.mutate()} disabled={!applicationUpdate.application_id || applicationStatusMutation.isPending}>Save status</Button>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Application history</CardTitle></CardHeader><CardContent className="space-y-3">{applications.length ? applications.map((app) => <div key={app.id} className="border-b pb-3 last:border-0"><div className="flex justify-between gap-2"><span className="font-medium">{platformName(app.platform_key)}</span><StatusPill value={app.workflow_status} /></div><p className="mt-1 text-xs text-muted-foreground">{app.legal_entity_name || "Legal entity not entered"} · {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : "Not submitted"}</p></div>) : <p className="text-sm text-muted-foreground">No applications prepared.</p>}</CardContent></Card>
          </div>
        </div>
      )}

      {activeTab === "Rights" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
          <Card><CardHeader><CardTitle className="text-base">Video-specific rights and compliance review</CardTitle></CardHeader><CardContent className="space-y-4">
            <Alert><ShieldCheck className="h-4 w-4" /><AlertDescription className="text-sm">This form records a human review. It does not collect, display or upload IDs, selfies or contracts. Open original files only in the restricted compliance workflow. Do not approve from a performer declaration alone.</AlertDescription></Alert>
            <Field label="Catalog video"><select className={inputClass} value={rightsDraft.video_id} onChange={(event) => setRightsDraft((current) => ({ ...current, video_id: event.target.value, performer_id: "", release_document_ids: [] }))}><option value="">Select video</option>{videos.map((video) => <option key={video.id} value={video.id}>{video.title || "Untitled"} · {video.access_tier || "tier unknown"}</option>)}</select></Field>
            <Field label="Production date"><input className={inputClass} type="date" value={rightsDraft.production_date} onChange={(event) => setRightsDraft((current) => ({ ...current, production_date: event.target.value }))} /></Field>
            <Field label="Assigned performer"><select className={inputClass} value={rightsDraft.performer_id} onChange={(event) => {
              const performerId = event.target.value;
              const currentGrant = rightsEvidence?.participants?.find((participant) => participant.performer_id === performerId)?.existing_grant;
              setRightsDraft((current) => ({
                ...current,
                performer_id: performerId,
                ...(currentGrant ? {
                  production_date: currentGrant.production_date || current.production_date,
                  platform_keys: currentGrant.platform_keys || [],
                  variants: currentGrant.variants || [],
                  territories: (currentGrant.territories || []).join(", "),
                  release_document_ids: currentGrant.release_document_ids || [],
                  status: currentGrant.status || "UNDER_REVIEW",
                  ...Object.fromEntries(REVIEW_FIELDS.map(([field]) => [field, currentGrant[field] === true])),
                  expires_at: currentGrant.expires_at?.slice(0, 10) || "",
                } : { release_document_ids: [], status: "UNDER_REVIEW", ...Object.fromEntries(REVIEW_FIELDS.map(([field]) => [field, false])) }),
              }));
            }}><option value="">Select assigned performer</option>{(rightsEvidence?.participants || []).map((participant) => <option key={participant.performer_id} value={participant.performer_id}>{participant.display_name}</option>)}</select></Field>
            {isLoadingRightsEvidence && <p className="text-xs text-muted-foreground">Loading restricted compliance status…</p>}
            {selectedRightsPerformer && <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <p className="text-sm font-semibold">Evidence status · {selectedRightsPerformer.display_name}</p>
              <div className="grid gap-1 text-xs sm:grid-cols-2">
                <EvidenceStatus label="Identity and KYC" ok={selectedRightsPerformer.identity_verified} />
                <EvidenceStatus label="Government ID record" ok={selectedRightsPerformer.id_document_approved} />
                <EvidenceStatus label="ID selfie record" ok={selectedRightsPerformer.selfie_approved} />
                <EvidenceStatus label="Age at production" ok={selectedRightsPerformer.age_at_production_eligible} />
                <EvidenceStatus label="Compliance lock" ok={!selectedRightsPerformer.compliance_locked} />
                <EvidenceStatus label="Verified signed contract" ok={selectedRightsPerformer.contracts?.some((contract) => contract.status === "signed" && contract.verified && contract.signed && contract.performer_signature_consent_checked)} />
              </div>
              <p className="border-t pt-2 text-[11px] text-muted-foreground">Secure-file contents and file URLs are not shown in Distribution OS.</p>
            </div>}

            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-semibold">Approved release for this production</p>
              {(selectedRightsPerformer?.documents || []).filter((document) => ["model_release", "release_agreement", "consent_form", "performer_contract"].includes(document.document_type)).length ? (selectedRightsPerformer.documents.filter((document) => ["model_release", "release_agreement", "consent_form", "performer_contract"].includes(document.document_type)).map((document) => <label key={document.id || `${document.document_type}-${document.title}`} className="flex items-center gap-2 text-xs"><input type="checkbox" disabled={document.status !== "approved" || !document.id} checked={Boolean(document.id && rightsDraft.release_document_ids.includes(document.id))} onChange={(event) => setRightsDraft((current) => ({ ...current, release_document_ids: event.target.checked ? [...current.release_document_ids, document.id] : current.release_document_ids.filter((id) => id !== document.id) }))} /><span>{document.title || document.document_type} · {document.status}</span></label>)) : <p className="text-xs text-muted-foreground">No release record is available for review.</p>}
            </div>

            <Field label="Rights review status"><select className={inputClass} value={rightsDraft.status} onChange={(event) => setRightsDraft((current) => ({ ...current, status: event.target.value, operator_confirmed_review: false }))}>{RIGHTS_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></Field>
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-semibold">Authorized platforms</p>
              <div className="grid gap-2 sm:grid-cols-2">{platforms.map((platform) => <label key={platform.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={rightsDraft.platform_keys.includes(platform.platform_key)} onChange={(event) => setRightsDraft((current) => ({ ...current, platform_keys: event.target.checked ? [...current.platform_keys, platform.platform_key] : current.platform_keys.filter((key) => key !== platform.platform_key) }))} /><span>{platform.name} <span className="text-muted-foreground">({platform.workflow_status})</span></span></label>)}</div>
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-semibold">Authorized distribution profiles</p>
              <div className="flex flex-wrap gap-3">{VARIANTS.map((variant) => <label key={variant} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={rightsDraft.variants.includes(variant)} onChange={(event) => setRightsDraft((current) => ({ ...current, variants: event.target.checked ? [...current.variants, variant] : current.variants.filter((item) => item !== variant) }))} />{variant}</label>)}</div>
            </div>
            <Field label="Authorized territories (comma-separated codes or WORLDWIDE)"><input className={inputClass} value={rightsDraft.territories} onChange={(event) => setRightsDraft((current) => ({ ...current, territories: event.target.value }))} placeholder="TW, US or WORLDWIDE" /></Field>
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-semibold">Required human reviews</p>
              {REVIEW_FIELDS.map(([field, label]) => <label key={field} className="flex items-start gap-2 text-xs"><input type="checkbox" checked={rightsDraft[field]} onChange={(event) => setRightsDraft((current) => ({ ...current, [field]: event.target.checked }))} /><span>{label}</span></label>)}
              <p className="pt-1 text-[11px] text-muted-foreground">For US distribution and other regulated territories, complete any required qualified legal review before approving.</p>
            </div>
            <Field label="Rights approval expiry (optional)"><input className={inputClass} type="date" value={rightsDraft.expires_at} onChange={(event) => setRightsDraft((current) => ({ ...current, expires_at: event.target.value }))} /></Field>
            <Field label="Internal review note"><textarea className={textareaClass} value={rightsDraft.notes} onChange={(event) => setRightsDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Do not include ID numbers or sensitive document contents." /></Field>
            {rightsDraft.status === "APPROVED" && <label className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs"><input type="checkbox" checked={rightsDraft.operator_confirmed_review} onChange={(event) => setRightsDraft((current) => ({ ...current, operator_confirmed_review: event.target.checked }))} /><span>I personally reviewed the original records and confirm the checks above are supported by evidence for this exact video and performer.</span></label>}
            <Button onClick={() => rightsGrantMutation.mutate()} disabled={!rightsDraft.video_id || !rightsDraft.performer_id || rightsGrantMutation.isPending}>{rightsDraft.status === "APPROVED" ? "Approve reviewed rights" : "Save review status"}</Button>
          </CardContent></Card>
          <div className="space-y-5">
            <Card><CardHeader><CardTitle className="text-base">Existing rights records</CardTitle></CardHeader><CardContent className="space-y-3">{(rightsEvidence?.participants || []).length ? rightsEvidence.participants.map((participant) => <div key={participant.performer_id} className="rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{participant.display_name}</p><StatusPill value={participant.existing_grant?.status || "MISSING_DOCUMENTS"} /></div><p className="mt-1 text-xs text-muted-foreground">{participant.existing_grant ? `${participant.existing_grant.platform_keys.length} platforms · ${participant.existing_grant.variants.length} profiles · ${participant.existing_grant.territories.join(", ")}` : "No video-specific rights grant recorded"}</p></div>) : <p className="text-sm text-muted-foreground">Choose a video to view its assigned participants and document status.</p>}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Approval behavior</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>Each participant requires an approved government ID, ID selfie, verified signed contract and an approved release linked to this video.</p><p>The stored production date is compared with the verified date of birth to confirm age 18+ at filming.</p><p>Approval also requires platform- and variant-specific commercial and sublicensing rights, territories, and separate consent, coercion, hidden recording, impairment and recordkeeping reviews.</p><p>Distribution files and sensitive verification documents are not copied into this registry.</p></CardContent></Card>
          </div>
        </div>
      )}

      {activeTab === "Queue" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
          <Card><CardHeader><CardTitle className="text-base">Prepare operator metadata package</CardTitle></CardHeader><CardContent className="space-y-4">
            <Alert><ShieldCheck className="h-4 w-4" /><AlertDescription className="text-sm">The server checks age-at-production, IDs, selfie, signed contract, video-specific releases/rights, production QA and media validation. Missing evidence blocks package readiness.</AlertDescription></Alert>
            <Field label="Video"><select className={inputClass} value={queueDraft.video_id} onChange={(event) => setQueueDraft((current) => ({ ...current, video_id: event.target.value }))}><option value="">Select catalog video</option>{videos.map((video) => <option key={video.id} value={video.id}>{video.title || "Untitled"} · {video.access_tier || "tier unknown"} · {video.processing_status || "not processed"}</option>)}</select></Field>
            <Field label="Platform"><select className={inputClass} value={queueDraft.platform_key} onChange={(event) => setQueueDraft((current) => ({ ...current, platform_key: event.target.value }))}><option value="">Select researched platform</option>{platforms.filter((platform) => platform.workflow_status !== "NOT_RESEARCHED" && platform.workflow_status !== "BLOCKED" && platform.workflow_status !== "REJECTED").map((platform) => <option key={platform.id} value={platform.platform_key}>{platform.name} · {platform.integration_mode}</option>)}</select></Field>
            <Field label="Distribution profile"><select className={inputClass} value={queueDraft.variant} onChange={(event) => setQueueDraft((current) => ({ ...current, variant: event.target.value }))}>{VARIANTS.map((variant) => <option key={variant}>{variant}</option>)}</select></Field>
            <Field label="Title override (optional)"><input className={inputClass} value={queueDraft.title} onChange={(event) => setQueueDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Uses the catalog title by default" /></Field>
            <Field label="Description override (optional)"><textarea className={textareaClass} value={queueDraft.description} onChange={(event) => setQueueDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Uses the catalog description by default" /></Field>
            <Field label="Language"><select className={inputClass} value={queueDraft.language} onChange={(event) => setQueueDraft((current) => ({ ...current, language: event.target.value }))}>{[["en", "English"], ["zh-TW", "Traditional Chinese"], ["th", "Thai"], ["tl", "Tagalog"], ["vi", "Vietnamese"]].map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></Field>
            <Button onClick={() => prepareJobMutation.mutate()} disabled={!queueDraft.video_id || !queueDraft.platform_key || prepareJobMutation.isPending}>Validate and prepare</Button>
            {lastPreparedJob && <div className="space-y-3 rounded-lg border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{platformName(lastPreparedJob.job?.platform_key)} package</p><StatusPill value={lastPreparedJob.job?.status} /></div><Button size="sm" variant="outline" onClick={handleDownloadPackage}><Download className="mr-2 h-4 w-4" />Download metadata</Button></div><p className="text-xs text-muted-foreground">Metadata only. Media master transfer is not included. Idempotency key: <code>{lastPreparedJob.job?.idempotency_key}</code></p>{lastPreparedJob.readiness?.errors?.length > 0 && <ul className="space-y-1 text-sm text-destructive">{lastPreparedJob.readiness.errors.map((code) => <li key={code}>• {ERROR_LABELS[code] || code}</li>)}</ul>}</div>}
          </CardContent></Card>
          <div className="space-y-5">
            <Card><CardHeader><CardTitle className="text-base">Job queue</CardTitle></CardHeader><CardContent className="space-y-2">{jobs.length ? jobs.slice(0, 30).map((job) => { const video = videos.find((item) => item.id === job.video_id); return <div key={job.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><div><p className="font-medium">{video?.title || job.video_id}</p><p className="text-xs text-muted-foreground">{platformName(job.platform_key)} · {job.distribution_variant} · {new Date(job.created_date || Date.now()).toLocaleDateString()}</p></div><div className="flex items-center gap-2"><StatusPill value={job.status} /><Button size="sm" variant="ghost" onClick={() => setPublicationForm((current) => ({ ...current, job_id: job.id }))}>Record</Button></div></div>; }) : <p className="text-sm text-muted-foreground">No distribution packages prepared yet.</p>}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Record a publication made by an operator</CardTitle></CardHeader><CardContent className="space-y-3">
              <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription className="text-sm">Only use after the platform upload actually completed. The platform must have verified approval; no external action is triggered here.</AlertDescription></Alert>
              <Field label="Ready job"><select className={inputClass} value={publicationForm.job_id} onChange={(event) => setPublicationForm((current) => ({ ...current, job_id: event.target.value }))}><option value="">Select a ready job</option>{jobs.filter((job) => ["READY", "AWAITING_REVIEW"].includes(job.status)).map((job) => <option key={job.id} value={job.id}>{platformName(job.platform_key)} · {job.video_id}</option>)}</select></Field>
              <Field label="External content ID"><input className={inputClass} value={publicationForm.external_content_id} onChange={(event) => setPublicationForm((current) => ({ ...current, external_content_id: event.target.value }))} /></Field>
              <Field label="Publication URL"><input className={inputClass} type="url" value={publicationForm.publication_url} onChange={(event) => setPublicationForm((current) => ({ ...current, publication_url: event.target.value }))} /></Field>
              <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={publicationForm.operator_confirmed_external_upload} onChange={(event) => setPublicationForm((current) => ({ ...current, operator_confirmed_external_upload: event.target.checked }))} /><span>I confirm the video was uploaded and published on the official platform.</span></label>
              {selectedJob && <p className="text-xs text-muted-foreground">Selected: {platformName(selectedJob.platform_key)} · {selectedJob.status}</p>}
              <Button onClick={() => publicationMutation.mutate()} disabled={!publicationForm.job_id || publicationMutation.isPending}>Record confirmed publication</Button>
            </CardContent></Card>
          </div>
        </div>
      )}

      {activeTab === "Revenue" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
          <Card><CardHeader><CardTitle className="text-base">Import canonical CSV</CardTitle></CardHeader><CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">The report file is preserved with its SHA-256 source hash. Imports are deduplicated by the exact original CSV. Map platform exports to these column names first.</p>
            <div className="rounded-lg bg-muted/30 p-3"><p className="mb-2 text-xs font-semibold">Required CSV columns</p><code className="break-all text-[11px]">period_start,period_end,currency,revenue_type,gross_sales,platform_deductions,refunds,chargebacks,classification</code><p className="mt-2 text-xs text-muted-foreground">Optional: video_id, external_content_id, views, qualified_monetized_views. One period, currency and classification per file. Max 250 KB.</p></div>
            <Field label="Platform"><select className={inputClass} value={revenuePlatform} onChange={(event) => setRevenuePlatform(event.target.value)}><option value="">Select platform</option>{platforms.map((platform) => <option key={platform.id} value={platform.platform_key}>{platform.name}</option>)}</select></Field>
            <Field label="CSV report"><input className={inputClass} type="file" accept=".csv,text/csv" onChange={(event) => setRevenueFile(event.target.files?.[0] || null)} /></Field>
            <Button onClick={() => revenueMutation.mutate()} disabled={!revenueFile || !revenuePlatform || revenueMutation.isPending}><UploadCloud className="mr-2 h-4 w-4" />Import report</Button>
            {lastRevenueImport && <div className="rounded-lg border p-3 text-sm"><p className="font-semibold">{lastRevenueImport.duplicate ? "Duplicate report" : "Import result"}</p><p>{lastRevenueImport.row_count || 0} rows · {lastRevenueImport.classification || "existing report"}</p>{lastRevenueImport.totals && <p className="text-muted-foreground">Net: {money(lastRevenueImport.totals.netDistributionRevenue, lastRevenueImport.totals.currency || "USD")} · payout unconfirmed</p>}</div>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Revenue reports</CardTitle></CardHeader><CardContent className="space-y-3">{imports.length ? imports.map((report) => <div key={report.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1.2fr_1fr_1fr_auto]"><div><p className="font-medium">{platformName(report.platform_key)}</p><p className="text-xs text-muted-foreground">{report.period_start} – {report.period_end} · {report.currency}</p></div><div><p className="text-xs text-muted-foreground">Net reported</p><p className="font-semibold">{money(report.net_distribution_revenue, report.currency)}</p></div><div><StatusPill value={report.classification} /><p className="mt-1 text-xs text-muted-foreground">Payout: {report.payout_status}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">{report.row_count} rows</p><StatusPill value={report.import_status || "IMPORTED"} /></div></div>) : <p className="text-sm text-muted-foreground">No reports imported.</p>}</CardContent></Card>
        </div>
      )}

      {activeTab === "Partners" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
          <Card><CardHeader><CardTitle className="text-base">White-label agreement draft</CardTitle></CardHeader><CardContent className="space-y-3">
            <Alert><FileText className="h-4 w-4" /><AlertDescription className="text-sm">Defaults are a draft only: USD 2,490 setup fee and 70/30 split of net distribution revenue. The setup fee is separate. Only signed terms become eligible for calculation; payment alone never activates an agreement.</AlertDescription></Alert>
            <Field label="Partner studio"><input className={inputClass} value={agreement.partner_name} onChange={(event) => setAgreement((current) => ({ ...current, partner_name: event.target.value }))} /></Field>
            <div className="grid gap-3 sm:grid-cols-3"><Field label="Setup fee USD"><input className={inputClass} type="number" min="0" value={agreement.setup_fee_usd} onChange={(event) => setAgreement((current) => ({ ...current, setup_fee_usd: Number(event.target.value) }))} /></Field><Field label="Creator share %"><input className={inputClass} type="number" min="0" max="100" value={agreement.creator_share_percent} onChange={(event) => setAgreement((current) => ({ ...current, creator_share_percent: Number(event.target.value) }))} /></Field><Field label="FLESHLAB share %"><input className={inputClass} type="number" min="0" max="100" value={agreement.fleshlab_share_percent} onChange={(event) => setAgreement((current) => ({ ...current, fleshlab_share_percent: Number(event.target.value) }))} /></Field></div>
            <Field label="Status"><select className={inputClass} value={agreement.status} onChange={(event) => setAgreement((current) => ({ ...current, status: event.target.value }))}>{["DRAFT", "SENT"].map((status) => <option key={status}>{status}</option>)}</select></Field>
            <Field label="Notes"><textarea className={textareaClass} value={agreement.notes} onChange={(event) => setAgreement((current) => ({ ...current, notes: event.target.value }))} /></Field>
            <Button onClick={() => agreementMutation.mutate()} disabled={!agreement.partner_name || agreementMutation.isPending}>Save draft</Button>
          </CardContent></Card>
          <div className="space-y-5">
            <Card><CardHeader><CardTitle className="text-base">Agreements</CardTitle></CardHeader><CardContent className="space-y-2">{agreements.length ? agreements.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{item.partner_name}</p><p className="text-xs text-muted-foreground">USD {Number(item.setup_fee_usd).toFixed(2)} setup · {item.creator_share_percent}/{item.fleshlab_share_percent} split · setup fee {item.setup_fee_status}</p></div><StatusPill value={item.status} /></div>) : <p className="text-sm text-muted-foreground">No partner agreement drafts.</p>}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Calculate signed agreement split</CardTitle></CardHeader><CardContent className="space-y-3">
              <Field label="Signed agreement"><select className={inputClass} value={splitForm.agreement_id} onChange={(event) => setSplitForm((current) => ({ ...current, agreement_id: event.target.value }))}><option value="">Select signed agreement</option>{agreements.filter((item) => ["SIGNED", "ACTIVE"].includes(item.status)).map((item) => <option key={item.id} value={item.id}>{item.partner_name} · {item.creator_share_percent}/{item.fleshlab_share_percent}</option>)}</select></Field>
              <div className="grid gap-3 sm:grid-cols-2">{[["gross_sales", "Gross sales"], ["platform_deductions", "Platform deductions"], ["refunds", "Refunds"], ["chargebacks", "Chargebacks"]].map(([field, label]) => <Field key={field} label={label}><input className={inputClass} type="number" min="0" step="0.01" value={splitForm[field]} onChange={(event) => setSplitForm((current) => ({ ...current, [field]: event.target.value }))} /></Field>)}</div>
              <Button onClick={() => splitMutation.mutate()} disabled={!splitForm.agreement_id || splitMutation.isPending}>Calculate from net</Button>
              {lastSplit?.split && <div className="rounded-lg border p-3 text-sm"><p>Net distribution revenue: <strong>{money(lastSplit.split.netDistributionRevenue, "USD")}</strong></p><p>Creator: <strong>{money(lastSplit.split.creatorShare, "USD")}</strong></p><p>FLESHLAB: <strong>{money(lastSplit.split.fleshlabShare, "USD")}</strong></p><p className="mt-2 text-xs text-muted-foreground">Setup fee ({money(lastSplit.setup_fee_usd, "USD")}) remains separate.</p></div>}
            </CardContent></Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block space-y-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}

function Metric({ title, value, detail }) {
  return <Card><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function MetricCard({ title, value, detail }) {
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-bold">{money(value, "USD")}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function EmptyRegister({ onInitialize, loading }) {
  return <Card><CardContent className="space-y-3 p-8 text-center"><p className="font-semibold">No platforms registered yet</p><p className="text-sm text-muted-foreground">Initialize the platform research and application register.</p><Button onClick={onInitialize} disabled={loading}>Initialize register</Button></CardContent></Card>;
}

function EvidenceStatus({ label, ok }) {
  return <span className={ok ? "text-emerald-700" : "text-amber-700"}>{ok ? "✓" : "•"} {label}: {ok ? "present" : "missing / review"}</span>;
}

function money(value, currency = "USD") {
  const amount = Number(value || 0);
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount); }
  catch { return `${currency} ${amount.toFixed(2)}`; }
}
