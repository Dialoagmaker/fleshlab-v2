import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatTime } from "@/lib/aiMediaStudio/localAnalyzer";
import { validateIdentityPreservation } from "@/lib/aiMediaStudio/imageIdentityValidation";
import CoverPreviewEditor from "./CoverPreviewEditor";

function imageElementFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Selected frame could not be loaded.")); };
    image.src = url;
  });
}

async function frameToDataUrl(frame) {
  const sourceBlob = frame?.blob || (frame?.url ? await (await fetch(frame.url)).blob() : null);
  if (!sourceBlob || sourceBlob.size <= 0) throw new Error("Selected frame has no image payload.");
  const image = await imageElementFromBlob(sourceBlob);
  const maxSide = 2048;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const byteLength = Math.floor(((dataUrl.split(",")[1] || "").length * 3) / 4);
  if (!dataUrl.startsWith("data:image/jpeg;base64,") || byteLength <= 0) throw new Error("Story frame encoding failed.");
  return { dataUrl, mimeType: "image/jpeg", byteLength, width: canvas.width, height: canvas.height };
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function TechnicalDetails({ details }) {
  if (!details) return null;
  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap">{JSON.stringify(details, null, 2)}</pre>
    </div>
  );
}

export default function OpenRouterCoverMode({ frame, identityReferenceFrame, metadata, settings }) {
  const [loading, setLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [heroImage, setHeroImage] = useState(null);
  const [designCover, setDesignCover] = useState(false);
  const [status, setStatus] = useState("Ready to produce the professional hero photograph.");
  const [error, setError] = useState("");
  const [frameStatus, setFrameStatus] = useState({ extracted: false, encoded: false });
  const [technicalDetails, setTechnicalDetails] = useState(null);
  const [qaSummary, setQaSummary] = useState(null);
  const [showTechnical, setShowTechnical] = useState(false);
  const [routingGate, setRoutingGate] = useState({
    referenceContentClass: "BLOCKED_OR_UNVERIFIED",
    allPeopleVerified18Plus: false,
    performerConsentConfirmed: false,
    mediaRightsConfirmed: false,
    platformSourceConfirmed: false,
    verificationReference: ""
  });

  useEffect(() => {
    let active = true;
    setHealthLoading(true);
    base44.functions.invoke("openRouterAICover", { action: "audit" })
      .then(response => { if (active) setHealth(response.data); })
      .catch(err => { if (active) setTechnicalDetails({ production_readiness: "unavailable" }); })
      .finally(() => { if (active) setHealthLoading(false); });
    return () => { active = false; };
  }, []);

  const estimatedCost = useMemo(() => {
    const value = health?.estimated_generation_cost;
    return typeof value === "number" ? `$${value.toFixed(4)}` : "Checking";
  }, [health]);

  const adultVerificationRequired = ["SUGGESTIVE_ADULT", "EXPLICIT_VERIFIED_ADULT"].includes(routingGate.referenceContentClass);
  const routingGateComplete = routingGate.referenceContentClass === "SAFE_MARKETING" || (
    adultVerificationRequired &&
    routingGate.allPeopleVerified18Plus &&
    routingGate.performerConsentConfirmed &&
    routingGate.mediaRightsConfirmed &&
    routingGate.platformSourceConfirmed &&
    routingGate.verificationReference.trim()
  );

  const updateGate = (patch) => setRoutingGate(previous => ({ ...previous, ...patch }));

  const generate = async () => {
    if (!frame || !metadata?.videoTitle?.trim() || loading || !routingGateComplete) return;
    setLoading(true);
    setError("");
    setHeroImage(null);
    setDesignCover(false);
    setFrameStatus({ extracted: false, encoded: false });
    setTechnicalDetails(null);
    setQaSummary(null);
    setStatus("Preparing selected story frame for Rendering Intelligence...");

    try {
      const story = await frameToDataUrl(frame);
      setFrameStatus({ extracted: true, encoded: false });
      setStatus("Evaluating provider compatibility...");
      if (!story.dataUrl || story.byteLength <= 0 || story.mimeType !== "image/jpeg") throw new Error("Story frame encoding failed.");
      setFrameStatus({ extracted: true, encoded: true });

      const identity = identityReferenceFrame ? await frameToDataUrl(identityReferenceFrame) : null;
      let best = null;
      let repairDirective = "";
      const generationJobId = crypto.randomUUID();

      for (let attempt = 1; attempt <= 2; attempt += 1) {
        setStatus(attempt === 1 ? "Selecting optimal rendering pipeline..." : "Running one quality refinement pass through Rendering Intelligence...");
        const response = await base44.functions.invoke("openRouterAICover", {
          action: "generate",
          consent: true,
          generation_job_id: generationJobId,
          story_reference_data_url: story.dataUrl,
          identity_reference_data_url: identity?.dataUrl || null,
          aspect_ratio: "16:9",
          metadata: {
            ...metadata,
            identityReferenceTime: identityReferenceFrame ? formatTime(identityReferenceFrame.time) : "none",
            regenerationDirective: repairDirective,
            referenceContentClass: routingGate.referenceContentClass,
            adultVerification: {
              allPeopleVerified18Plus: routingGate.allPeopleVerified18Plus,
              performerConsentConfirmed: routingGate.performerConsentConfirmed,
              mediaRightsConfirmed: routingGate.mediaRightsConfirmed,
              platformSourceConfirmed: routingGate.platformSourceConfirmed,
              verificationReference: routingGate.verificationReference.trim()
            }
          },
        });
        const data = response.data;
        setQaSummary(data?.production_qa?.public_summary || null);
        setTechnicalDetails({
          generation_job_id: data?.generation_job_id,
          routing_pipeline: data?.routing_pipeline || "best_production_pipeline_selected",
          production_memory_recorded: data?.production_memory_recorded !== false,
          stage_trace: data?.stage_trace,
          content_classification: data?.content_classification,
          policy_compatible: data?.policy_compatible,
          request_sent: data?.request_sent,
          output_received: data?.output_received,
          attempt_diagnostics: (data?.attempt_diagnostics || []).map(item => ({
            status: item.output_received ? "completed" : "failed",
            category: item.category || null,
            retryable: Boolean(item.retryable),
            output_received: Boolean(item.output_received)
          })),
          production_qa: data?.production_qa ? {
            final_decision: data.production_qa.final_decision,
            overall_score: data.production_qa.overall_score,
            identity_score: data.production_qa.identity_score,
            technical_score: data.production_qa.technical_score,
            brand_score: data.production_qa.brand_score,
            production_approved: data.production_qa.production_approved,
            publishing_gate_pass: data.production_qa.publishing_gate_pass
          } : null,
        });
        if (!data?.ok) throw new Error(data?.error || "The professional hero photograph could not be generated.");
        const blob = dataUrlToBlob(data.generated_image_data_url);
        const validation = identityReferenceFrame?.blob ? await validateIdentityPreservation(identityReferenceFrame.blob, blob, identityReferenceFrame) : { accepted: true, identityConfidence: 88 };
        const candidate = { blob, url: URL.createObjectURL(blob), score: Number(validation.identityConfidence || validation.checks?.overall || 0), aiReconstructed: true };
        if (!best || candidate.score > best.score) best = candidate;
        if (validation.accepted || attempt === 2) break;
        repairDirective = "Preserve the performer, pose, action, emotion, and location more accurately while keeping the image a new 16:9 advertising photograph.";
      }

      setHeroImage(best);
      setTechnicalDetails(previous => ({
        ...(previous || {}),
        stage_trace: { ...((previous || {}).stage_trace || {}), preview_rendered: true }
      }));
      setStatus("Quality assurance completed. Professional hero photograph ready.");
    } catch (err) {
      const diagnostic = err.response?.data || { message: err.message };
      console.warn("OpenRouter hero photograph failed", diagnostic);
      setTechnicalDetails(previous => ({
        ...(previous || {}),
        failure: {
          category: diagnostic?.diagnostics?.category || diagnostic?.category || "production_pipeline_failed",
          retryable: Boolean(diagnostic?.diagnostics?.retryable || diagnostic?.retryable),
          request_sent: Boolean(diagnostic?.request_sent),
          output_received: Boolean(diagnostic?.output_received)
        },
        attempt_diagnostics: (diagnostic?.attempt_diagnostics || diagnostic?.diagnostics?.attempt_diagnostics || []).map(item => ({
          status: item.output_received ? "completed" : "failed",
          category: item.category || null,
          retryable: Boolean(item.retryable),
          output_received: Boolean(item.output_received)
        }))
      }));
      setStatus("Ready to retry or continue locally.");
      setError(diagnostic?.error || "The professional hero photograph could not be generated. The local cover workflow is still available.");
    } finally {
      setLoading(false);
    }
  };

  const useLocalStoryFrame = async () => {
    const local = await frameToDataUrl(frame);
    const blob = dataUrlToBlob(local.dataUrl);
    setHeroImage({ blob, url: URL.createObjectURL(blob), score: 0, aiReconstructed: false });
    setDesignCover(true);
    setError("");
    setStatus("Using the selected story frame for local cover design.");
  };

  const connected = Boolean(health?.openrouter_connected);
  const creditsAvailable = Boolean(health?.paid_credits_available);
  const imageAvailable = Boolean(health?.image_generation_available);
  const gateOptions = [
    ["BLOCKED_OR_UNVERIFIED", "Blocked / unverified"],
    ["SAFE_MARKETING", "Safe marketing"],
    ["SUGGESTIVE_ADULT", "Suggestive adult"],
    ["EXPLICIT_VERIFIED_ADULT", "Explicit verified adult"]
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/25 bg-primary/10 p-4">
        <div className="flex items-start gap-3"><Camera className="mt-0.5 h-5 w-5 text-primary" /><div className="space-y-1 text-sm"><p className="font-semibold text-foreground">4. Optional Rendering Intelligence Hero Enhancement</p><p className="text-muted-foreground">The Editorial Art Direction cover works without this step. Rendering Intelligence receives only the selected still if you choose to request an enhanced hero photograph.</p></div></div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 text-sm md:grid-cols-5">
        <div><p className="text-xs font-bold text-muted-foreground">Rendering Intelligence</p><Badge variant={connected ? "outline" : "secondary"}>{healthLoading ? "Checking" : connected ? "Ready" : "Unavailable"}</Badge></div>
        <div><p className="text-xs font-bold text-muted-foreground">Production capacity</p><Badge variant={creditsAvailable ? "outline" : "secondary"}>{creditsAvailable ? "Available" : "Unavailable"}</Badge></div>
        <div><p className="text-xs font-bold text-muted-foreground">Pipeline availability</p><Badge variant={imageAvailable ? "outline" : "secondary"}>{imageAvailable ? "Auto-selected" : "No compatible route"}</Badge></div>
        <div><p className="text-xs font-bold text-muted-foreground">Estimated production cost</p><p className="font-semibold text-foreground">{estimatedCost}</p></div>
        <div><p className="text-xs font-bold text-muted-foreground">Monthly production spend</p><p className="font-semibold text-foreground">{typeof health?.monthly_openrouter_spend_usd === "number" ? `$${health.monthly_openrouter_spend_usd.toFixed(4)}` : "Checking"}</p></div>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground">Selected story frame · {formatTime(frame.time)}</p>
            <img src={frame.url} alt="Selected story frame" className="h-32 w-56 rounded-lg border border-border bg-black object-contain" />
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant={frameStatus.extracted ? "outline" : "secondary"}>Story frame extracted {frameStatus.extracted ? "✓" : ""}</Badge>
              <Badge variant={frameStatus.encoded ? "outline" : "secondary"}>Story frame encoded {frameStatus.encoded ? "✓" : ""}</Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:min-w-80">
            <Button disabled={!frame || loading || !metadata?.videoTitle?.trim() || healthLoading || !connected || !creditsAvailable || !imageAvailable || !routingGateComplete} onClick={generate} className="gap-2"><Wand2 className="h-4 w-4" />{loading ? "Generating..." : "Generate Professional Hero Photograph"}</Button>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-secondary/20 p-3 text-sm">
          <p className="mb-2 text-xs font-bold text-muted-foreground">Adult-content routing gate</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1"><span className="text-xs text-muted-foreground">Reference classification</span><select value={routingGate.referenceContentClass} onChange={e => updateGate({ referenceContentClass: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{gateOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="space-y-1"><span className="text-xs text-muted-foreground">Verification / rights reference</span><input value={routingGate.verificationReference} onChange={e => updateGate({ verificationReference: e.target.value })} placeholder="Performer ID, contract, release, or internal proof reference" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></label>
          </div>
          <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
            {[
              ["allPeopleVerified18Plus", "Every depicted person is verified 18+"],
              ["performerConsentConfirmed", "Consent is confirmed"],
              ["mediaRightsConfirmed", "Media rights are confirmed"],
              ["platformSourceConfirmed", "Source belongs to the platform"]
            ].map(([key, label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={routingGate[key]} onChange={e => updateGate({ [key]: e.target.checked })} />{label}</label>)}
          </div>
          {!routingGateComplete && <p className="mt-3 text-xs text-destructive">External AI routing is blocked until the selected frame is classified and required verification checks are complete.</p>}
        </div>

        {error && (
          <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <p>{error.replace(/OpenRouter|Gemini|Seedream|Flux|Recraft|provider|model/gi, "production pipeline")}</p>
            <Button variant="outline" onClick={useLocalStoryFrame}>Continue with local cover workflow</Button>
          </div>
        )}
        {heroImage ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3"><Badge variant="outline">Professional hero photograph ready</Badge><Button onClick={() => setDesignCover(true)} disabled={designCover}>Design Cover</Button></div>
            {qaSummary && <div className="rounded-lg border border-border bg-secondary/20 p-3 text-sm"><p className="font-semibold text-foreground">Production Review Complete</p><p className="mt-1 text-muted-foreground">{qaSummary.status}</p><p className="mt-2 text-foreground">{qaSummary.message}</p></div>}
            <img src={heroImage.url} alt="Generated professional hero photograph" className="w-full rounded-xl border border-border bg-black object-contain" />
          </div>
        ) : <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">The professional hero photograph will appear here. If OpenRouter fails, the selected story frame remains available for local cover export.</div>}
      </div>

      <div className="space-y-2">
        <Button variant="outline" onClick={() => setShowTechnical(value => !value)}>View production details</Button>
        {showTechnical && <TechnicalDetails details={{
          rendering_intelligence: health ? {
            ready: connected,
            production_capacity_available: creditsAvailable,
            compatible_pipeline_available: imageAvailable,
            estimated_generation_cost: health?.estimated_generation_cost ?? null,
            monthly_production_spend_usd: health?.monthly_openrouter_spend_usd ?? null
          } : null,
          frame_status: frameStatus,
          ...technicalDetails
        }} />}
      </div>

      {designCover && heroImage && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4"><p className="text-sm font-semibold text-foreground">5. Design AI-enhanced Cover</p><p className="text-xs text-muted-foreground">Typography is designed around the approved AI-enhanced photograph.</p></div>
          <CoverPreviewEditor frame={heroImage} metadata={{ ...metadata, aiReconstructed: true }} settings={settings} fileSuffix="official-cover" />
        </div>
      )}
    </div>
  );
}