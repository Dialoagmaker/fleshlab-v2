import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { blobToCanvasImage, canvasToBlob, getCoverDimensions } from "@/lib/aiMediaStudio/coverRenderer";
import { generatePosterPlan, renderCommercialKeyArtToCanvas, renderPosterVariantToCanvas, selectPosterVariant } from "@/lib/aiMediaStudio/commercialKeyArtEngine";

async function frameToBlob(frame) {
  if (frame?.blob) return frame.blob;
  if (frame?.url) return await (await fetch(frame.url)).blob();
  return null;
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
    if (!frame || !canvasRef.current) return;

    (async () => {
      const frameBlob = await frameToBlob(frame);
      if (!frameBlob) throw new Error("A selected poster frame is required");
      const image = await blobToCanvasImage(frameBlob);
      if (!active) return;
      imageRef.current = image;
      const nextPlan = await generatePosterPlan(image, metadata, settings, dims.width, dims.height);
      if (!active) return;
      setPlan(nextPlan);
      setSelectedConceptId(nextPlan?.variants?.[0]?.candidate_id || null);
    })().catch(err => {
      if (active) setError(err.message || "Cover plan failed");
    });

    return () => {
      active = false;
      if (imageRef.current?.close) imageRef.current.close();
      imageRef.current = null;
    };
  }, [frame?.index, frame?.blob, frame?.url, metadataKey, planSettingsKey]);

  useEffect(() => {
    if (!plan || !imageRef.current || !canvasRef.current) return;
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
  }, [plan, metadata, settings, dims.width, dims.height, selectedConceptId]);

  const download = async (type) => {
    if (!canExport || !canvasRef.current) return;
    const ext = type === "image/png" ? "png" : "jpg";
    const blob = await canvasToBlob(canvasRef.current, type, 0.92);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleshlab_${fileSuffix}_${dims.width}x${dims.height}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
              <span><b className="block text-xs">{option.variant}</b><small className="block opacity-70">{option.diagnostic?.compositionMode || option.diagnostic?.typographyStyle}</small></span>
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

      <div className="grid gap-2 sm:grid-cols-2">
        <Button disabled={!canExport} onClick={() => download("image/png")} className="gap-2"><Download className="h-4 w-4" />Download PNG</Button>
        <Button disabled={!canExport} onClick={() => download("image/jpeg")} variant="outline" className="gap-2"><Download className="h-4 w-4" />Download JPG</Button>
      </div>
    </div>
  );
}