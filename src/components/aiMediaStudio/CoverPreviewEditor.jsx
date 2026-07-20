import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { blobToCanvasImage, canvasToBlob, getCoverDimensions } from "@/lib/aiMediaStudio/coverRenderer";
import { generatePosterPlan, renderPosterVariantToCanvas, selectPosterVariant } from "@/lib/aiMediaStudio/commercialKeyArtEngine";

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

export default function CoverPreviewEditor({ frame, metadata, settings, fileSuffix = "cover" }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const rafRef = useRef(null);
  const renderTokenRef = useRef(0);
  const [rendered, setRendered] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const dims = getCoverDimensions(settings);
  const metadataKey = JSON.stringify(metadata || {});
  const planSettingsKey = `${dims.width}x${dims.height}`;
  const selectedPlan = useMemo(() => selectPosterVariant(plan, settings), [plan, settings]);
  const benchmark = selectedPlan?.diagnostic?.studioBenchmark;

  useEffect(() => {
    let active = true;
    setRendered(false);
    setPlan(null);
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

    const frameId = window.requestAnimationFrame(async () => {
      try {
        const chosen = selectPosterVariant(plan, settings);
        const scratchCanvas = document.createElement("canvas");
        const nextPlan = await renderPosterVariantToCanvas(scratchCanvas, imageRef.current, plan, chosen, settings, dims.width, dims.height);
        if (renderTokenRef.current !== renderToken || !canvasRef.current) return;

        canvasRef.current.width = scratchCanvas.width;
        canvasRef.current.height = scratchCanvas.height;
        const visibleCtx = canvasRef.current.getContext("2d");
        visibleCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
        visibleCtx.drawImage(scratchCanvas, 0, 0);
        canvasRef.current.__fleshlabPosterPlan = nextPlan;

        const failures = chosen?.score?.qualityFailures || [];
        setWarning(failures.length ? `Manual preview allowed. ${failures.join(", ")}.` : "");
        setRendered(true);
        setError("");
      } catch (err) {
        if (renderTokenRef.current === renderToken) setError(err.message || "Preview render failed");
      }
    });

    rafRef.current = frameId;
    return () => window.cancelAnimationFrame(frameId);
  }, [plan, settings, dims.width, dims.height]);

  const download = async (type) => {
    if (!rendered || !canvasRef.current) return;
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
          <h3 className="font-bold text-foreground">FLESHLAB Visual Language Engine</h3>
          <p className="text-xs text-muted-foreground">
            {selectedPlan ? `${plan.family.label} · ${selectedPlan.variant} · Quality ${selectedPlan.score.total}/100` : `Exact output size: ${dims.width} × ${dims.height}px`}
          </p>
        </div>
        {rendered ? <Badge variant="outline">Live preview</Badge> : <Badge variant="secondary">Painting artwork</Badge>}
      </div>

      {selectedPlan?.diagnostic?.compositionBrief && (
        <div className="whitespace-pre-line rounded-lg border border-border bg-secondary/25 p-3 text-xs leading-relaxed text-muted-foreground">
          <b className="mb-1 block text-foreground">Art Director composition brief</b>
          {selectedPlan.diagnostic.compositionBrief}
        </div>
      )}

      <ReferenceBenchmark benchmark={benchmark} />

      {warning && <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-300">{warning}</div>}
      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="relative overflow-auto rounded-xl border border-border bg-black p-3">
        <canvas ref={canvasRef} className="mx-auto h-auto max-h-[72vh] max-w-full rounded-lg" />
        {settings.showSafeMargins && rendered && <div className="pointer-events-none absolute rounded-lg border border-dashed border-white/35" style={{ inset: `${Number(settings.safeMargin) || 7}%` }} />}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button disabled={!rendered} onClick={() => download("image/png")} className="gap-2"><Download className="h-4 w-4" />Download PNG</Button>
        <Button disabled={!rendered} onClick={() => download("image/jpeg")} variant="outline" className="gap-2"><Download className="h-4 w-4" />Download JPG</Button>
      </div>
    </div>
  );
}