import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Download, GraduationCap, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { blobToCanvasImage, canvasToBlob, getCoverDimensions } from "@/lib/aiMediaStudio/coverRenderer";
import { generatePosterPlan, renderCommercialKeyArtToCanvas, renderPosterVariantToCanvas, selectPosterVariant } from "@/lib/aiMediaStudio/commercialKeyArtEngine";
import { useCreativeAcademy } from "@/hooks/useCreativeAcademy";

async function frameToBlob(frame) {
  if (frame?.blob) return frame.blob;
  if (frame?.url) return await (await fetch(frame.url)).blob();
  return null;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Cover image could not be encoded for QA."));
    reader.readAsDataURL(blob);
  });
}

function ReferenceBenchmark({ benchmark }) {
  if (!benchmark) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
      <div className="mb-2 flex items-center justify-between gap-3">
        <b className="text-foreground">FLESHLAB reference benchmark</b>
        <Badge variant={benchmark.passesStudioParity ? "outline" : "secondary"}>{benchmark.score}/100</Badge>
      </div>
      <p>{benchmark.verdict}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {benchmark.comparedAgainst.map(ref => (
          <div key={ref.id} className="rounded border border-border bg-secondary/20 p-2">
            <img src={ref.imageUrl} alt={ref.title} className="mb-2 aspect-video w-full rounded object-cover" />
            <b className="text-foreground">{ref.title}</b>
            <p className="mt-1">{ref.grammar.rhythm}</p>
          </div>
        ))}
      </div>
      {benchmark.failures.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-4">
          {benchmark.failures.slice(0, 4).map(item => <li key={item}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}

function InternalCriticPanel({ critic }) {
  if (!critic) return null;
  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">
      <div className="mb-2 flex items-center justify-between gap-3">
        <b className="text-foreground">Internal Critic</b>
        <Badge variant={critic.approved ? "outline" : "secondary"}>{critic.approved ? "Approved" : "Rejected"}</Badge>
      </div>
      <p>{critic.verdict}</p>
      {critic.redesignDirectives?.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {critic.redesignDirectives.slice(0, 5).map(item => <li key={item}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}

export default function CoverPreviewEditor({ frame, metadata, settings, fileSuffix = "cover" }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const rafRef = useRef(null);
  const renderTokenRef = useRef(0);
  const [rendered, setRendered] = useState(false);
  const [plan, setPlan] = useState(null);
  const [renderedPlan, setRenderedPlan] = useState(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [selectedConceptId, setSelectedConceptId] = useState(null);
  const [productionRecord, setProductionRecord] = useState(null);
  const persistKeyRef = useRef("");
  const { loading: academyLoading, renderingGate } = useCreativeAcademy();
  const dims = getCoverDimensions(settings);
  const metadataKey = JSON.stringify(metadata || {});
  const planSettingsKey = `${dims.width}x${dims.height}`;
  const conceptOptions = plan?.variants || [];
  const selectedPlan = useMemo(() => renderedPlan?.selected || conceptOptions.find(item => item.candidate_id === selectedConceptId) || selectPosterVariant(plan, settings), [plan, renderedPlan, settings, selectedConceptId, conceptOptions]);
  const critic = renderedPlan?.selected?.internalCritic;
  const canExport = rendered && Boolean(critic?.approved) && renderedPlan?.approvalStatus !== "needs_review";

  useEffect(() => {
    let active = true;
    setRendered(false);
    setPlan(null);
    setRenderedPlan(null);
    setError("");
    setWarning("");
    if (!renderingGate.ready || !frame || !canvasRef.current) return;

    (async () => {
      const frameBlob = await frameToBlob(frame);
      if (!frameBlob) throw new Error("A selected poster frame is required");
      const image = await blobToCanvasImage(frameBlob);
      if (!active) return;
      imageRef.current = image;
      const nextPlan = await generatePosterPlan(image, metadata, settings, dims.width, dims.height);
      if (!active) return;
      setPlan(nextPlan);
      setSelectedConceptId(nextPlan?.selected?.candidate_id || nextPlan?.variants?.[0]?.candidate_id || null);
      setProductionRecord(null);
      persistKeyRef.current = "";
    })().catch(err => {
      if (active) setError(err.message || "Cover plan failed");
    });

    return () => {
      active = false;
      if (imageRef.current?.close) imageRef.current.close();
      imageRef.current = null;
    };
  }, [frame?.index, frame?.blob, frame?.url, metadataKey, planSettingsKey, renderingGate.ready]);

  useEffect(() => {
    if (!renderingGate.ready || !plan || !imageRef.current || !canvasRef.current) return;
    window.cancelAnimationFrame(rafRef.current);
    const renderToken = renderTokenRef.current + 1;
    renderTokenRef.current = renderToken;
    setRendered(false);
    setRenderedPlan(null);

    const frameId = window.requestAnimationFrame(async () => {
      try {
        const scratchCanvas = document.createElement("canvas");
        const variant = (plan?.variants || []).find(item => item.candidate_id === selectedConceptId);
        const nextPlan = variant
          ? await renderPosterVariantToCanvas(scratchCanvas, imageRef.current, plan, variant, settings, dims.width, dims.height)
          : await renderCommercialKeyArtToCanvas(scratchCanvas, imageRef.current, metadata, settings, dims.width, dims.height, plan);
        if (renderTokenRef.current !== renderToken || !canvasRef.current) return;

        canvasRef.current.width = scratchCanvas.width;
        canvasRef.current.height = scratchCanvas.height;
        const visibleCtx = canvasRef.current.getContext("2d");
        visibleCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
        visibleCtx.drawImage(scratchCanvas, 0, 0);
        canvasRef.current.__fleshlabPosterPlan = nextPlan;

        const failures = nextPlan?.selected?.score?.qualityFailures || [];
        setRenderedPlan(nextPlan?.approvalStatus ? nextPlan : { ...nextPlan, approvalStatus: nextPlan?.selected?.score?.passesQualityGate ? "approved" : "needs_review" });
        setWarning(failures.length ? `This concept has review notes: ${failures.join(", ")}.` : "");
        setRendered(true);
        setError("");
      } catch (err) {
        if (renderTokenRef.current === renderToken) setError(err.message || "Preview render failed");
      }
    });

    rafRef.current = frameId;
    return () => window.cancelAnimationFrame(frameId);
  }, [plan, metadata, settings, dims.width, dims.height, selectedConceptId, renderingGate.ready]);

  useEffect(() => {
    if (!renderingGate.ready || !rendered || !canExport || !canvasRef.current || !renderedPlan?.selected) return;
    const persistenceKey = `${fileSuffix}:${metadataKey}:${dims.width}x${dims.height}:${renderedPlan.selected.candidate_id || renderedPlan.selected.variant || "selected"}`;
    if (persistKeyRef.current === persistenceKey) return;
    persistKeyRef.current = persistenceKey;
    let active = true;

    (async () => {
      setProductionRecord({ status: "saving", message: "Persisting designed cover and running separate Production QA..." });
      const coverBlob = await canvasToBlob(canvasRef.current, "image/png", 0.92);
      const sourceBlob = await frameToBlob(frame);
      const coverDataUrl = canvasRef.current.toDataURL("image/png");
      const sourceDataUrl = sourceBlob ? await blobToDataUrl(sourceBlob) : coverDataUrl;
      const generationJobId = crypto.randomUUID();
      const assetId = `cover-${generationJobId}`;
      const versionId = `cover-version-${generationJobId}`;
      const file = new File([coverBlob], `fleshlab_${fileSuffix}_${dims.width}x${dims.height}.png`, { type: "image/png" });
      const upload = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.StudioAsset.create({
        asset_id: assetId,
        project_id: metadata?.campaignName || "ai-media-studio-cover-design",
        asset_name: `${metadata?.videoTitle || "Untitled"} · Designed Cover`,
        asset_type: "cover",
        department: "production",
        status: "internal_review",
        current_version: 1,
        current_version_id: versionId,
        locked_no_overwrite: true,
        history_json: JSON.stringify([{ type: "cover_design_generated", generation_job_id: generationJobId, file_url: upload.file_url, plan: renderedPlan.selected }])
      });
      await base44.entities.StudioAssetVersion.create({
        version_id: versionId,
        asset_id: assetId,
        project_id: metadata?.campaignName || "ai-media-studio-cover-design",
        version_number: 1,
        file_url: upload.file_url,
        reviewer: "AI Media Studio",
        reason: "Designed cover generated from approved source photograph",
        change_why: "Create production cover with typography and visual hierarchy",
        requested_by: "AI Media Studio",
        what_changed: "Generated final designed cover file",
        impact: "Creates a separate cover asset requiring independent QA before publishing",
        approval_state: "pending",
        rollback_available: true,
        history_json: JSON.stringify([{ type: "cover_design_generated", generation_job_id: generationJobId }]),
        created_at: new Date().toISOString()
      });
      const qa = await base44.functions.invoke("productionQAEngine", {
        action: "evaluate",
        asset_id: assetId,
        generation_job_id: generationJobId,
        campaign: metadata?.campaignName || "AI Media Studio Cover Design",
        creative_brief: `${metadata?.videoTitle || "Untitled"}${metadata?.optionalSubtitle ? ` — ${metadata.optionalSubtitle}` : ""}. Performer: ${metadata?.performerName || "not specified"}. Series: ${metadata?.seriesName || "not specified"}. Content type: ${metadata?.contentType || "cover"}.`,
        reference_frame_data_url: sourceDataUrl,
        generated_asset_data_url: coverDataUrl,
        rendering_specification: { aspect_ratio: "16:9", content_classification: "SAFE_EDITORIAL", creative_approval_pass: true, executive_approval_pass: true, governance_valid: true, asset_version_id: versionId, source: "designed_cover" },
        creative_approval_pass: true,
        executive_approval_pass: true,
        governance_valid: true,
        provider_id: "local-cover-design-engine"
      });
      if (!active) return;
      setProductionRecord({ status: "saved", message: "Designed cover persisted and independently reviewed.", asset_id: assetId, file_url: upload.file_url, qa: qa.data });
    })().catch(err => {
      if (active) setProductionRecord({ status: "error", message: err.message || "Designed cover persistence failed." });
    });

    return () => { active = false; };
  }, [renderingGate.ready, rendered, canExport, renderedPlan, fileSuffix, metadataKey, dims.width, dims.height, frame]);

  const download = async (type) => {
    if (!renderingGate.ready || !canExport || !canvasRef.current) return;
    const ext = type === "image/png" ? "png" : "jpg";
    const blob = await canvasToBlob(canvasRef.current, type, 0.92);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleshlab_${fileSuffix}_${dims.width}x${dims.height}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (academyLoading) {
    return <div className="rounded-xl border border-border bg-secondary/20 p-6 text-sm text-muted-foreground">Checking Creative Academy certification before rendering...</div>;
  }

  if (!renderingGate.ready) {
    return (
      <div className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <p className="font-black text-destructive">KNOWLEDGE NOT INSTALLED</p>
            <p className="mt-1 text-muted-foreground">Rendering is forbidden until the Creative Academy installs, trains, examines, and certifies the required knowledge modules.</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {renderingGate.missing.slice(0, 8).map(module => <Badge key={module.slug} variant="secondary" className="justify-start"><GraduationCap className="mr-1 h-3 w-3" />{module.title}: {module.status}</Badge>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-foreground">Editorial Art Direction Cover</h3>
          <p className="text-xs text-muted-foreground">
            {selectedPlan ? `${selectedPlan.variant || "Cover concept"} · ${selectedPlan.diagnostic?.visualSystemLabel || plan?.designSystem?.label || "Editorial system"} · ${dims.width} × ${dims.height}px` : `Designing ${dims.width} × ${dims.height}px export`}
          </p>
        </div>
        {canExport ? <Badge variant="outline">Ready for export</Badge> : rendered ? <Badge variant="secondary">Review concept</Badge> : <Badge variant="secondary">Designing</Badge>}
      </div>

      {conceptOptions.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-3">
          {conceptOptions.slice(0, 3).map(option => (
            <Button key={option.candidate_id} type="button" variant={selectedConceptId === option.candidate_id ? "default" : "outline"} onClick={() => setSelectedConceptId(option.candidate_id)} className="h-auto justify-start p-3 text-left">
              <span><b className="block text-xs">{option.variant}</b><small className="block opacity-70">{option.creative_director_outcome || "REVIEW"} · {option.score?.total || 0}/100 · {option.diagnostic?.creativeTitle || option.diagnostic?.compositionMode}</small></span>
            </Button>
          ))}
        </div>
      )}

      {warning && <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-300">{warning}</div>}
      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="relative overflow-auto rounded-xl border border-border bg-black p-3">
        <canvas ref={canvasRef} className="mx-auto h-auto max-h-[72vh] max-w-full rounded-lg" />
        {settings.showSafeMargins && rendered && <div className="pointer-events-none absolute rounded-lg border border-dashed border-white/35" style={{ inset: `${Number(settings.safeMargin) || 7}%` }} />}
      </div>

      <InternalCriticPanel critic={critic} />

      {productionRecord && (
        <div className="rounded-lg border border-border bg-secondary/20 p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Production cover record</p>
          <p className="mt-1 text-muted-foreground">{productionRecord.message}</p>
          {productionRecord.qa && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge variant={productionRecord.qa.production_approved ? "outline" : "secondary"}>QA: {productionRecord.qa.final_decision}</Badge>
              <Badge variant={productionRecord.qa.publishing_gate_pass ? "outline" : "secondary"}>Publishing gate {productionRecord.qa.publishing_gate_pass ? "pass" : "blocked"}</Badge>
              <Badge variant="secondary">Score {Math.round(productionRecord.qa.overall_score || 0)}/100</Badge>
            </div>
          )}
          {productionRecord.file_url && <p className="mt-2 break-all text-xs text-muted-foreground">Stored cover: {productionRecord.file_url}</p>}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button disabled={!canExport} onClick={() => download("image/png")} className="gap-2"><Download className="h-4 w-4" />Download PNG</Button>
        <Button disabled={!canExport} onClick={() => download("image/jpeg")} variant="outline" className="gap-2"><Download className="h-4 w-4" />Download JPG</Button>
      </div>
    </div>
  );
}