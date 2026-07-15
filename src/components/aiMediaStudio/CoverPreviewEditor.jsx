import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { blobToCanvasImage, canvasToBlob, getCoverDimensions } from "@/lib/aiMediaStudio/coverRenderer";
import { generatePosterPlan, renderPosterVariantToCanvas, selectPosterVariant } from "@/lib/aiMediaStudio/posterRenderer";

export default function CoverPreviewEditor({ frame, metadata, settings, fileSuffix = "cover" }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const rafRef = useRef(null);
  const [rendered, setRendered] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const dims = getCoverDimensions(settings);
  const metadataKey = JSON.stringify(metadata || {});
  const planSettingsKey = `${dims.width}x${dims.height}`;
  const selectedPlan = useMemo(() => selectPosterVariant(plan, settings), [plan, settings]);

  useEffect(() => {
    let active = true;
    setRendered(false);
    setPlan(null);
    setError("");
    setWarning("");
    if (!frame?.blob || !canvasRef.current) return;

    (async () => {
      try {
        const image = await blobToCanvasImage(frame.blob);
        if (!active) return;
        imageRef.current = image;
        const nextPlan = await generatePosterPlan(image, metadata, settings, dims.width, dims.height);
        if (!active) return;
        setPlan(nextPlan);
      } catch (err) {
        if (active) setError(err.message || "Cover plan failed");
      }
    })();

    return () => {
      active = false;
      if (imageRef.current?.close) imageRef.current.close();
      imageRef.current = null;
    };
  }, [frame?.index, frame?.blob, metadataKey, planSettingsKey]);

  useEffect(() => {
    if (!plan || !imageRef.current || !canvasRef.current) return;
    window.cancelAnimationFrame(rafRef.current);
    setRendered(false);
    rafRef.current = window.requestAnimationFrame(async () => {
      try {
        const chosen = selectPosterVariant(plan, settings);
        const nextPlan = await renderPosterVariantToCanvas(canvasRef.current, imageRef.current, plan, chosen, settings, dims.width, dims.height);
        const failures = chosen?.score?.qualityFailures || [];
        setWarning(failures.length ? `Manual preview allowed. ${failures.join(", ")}.` : "");
        setRendered(true);
        setError("");
      } catch (err) {
        setError(err.message || "Preview render failed");
      }
    });
    return () => window.cancelAnimationFrame(rafRef.current);
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
      <div className="flex items-center justify-between gap-3"><div><h3 className="font-bold text-foreground">Cinematic poster preview</h3><p className="text-xs text-muted-foreground">{selectedPlan ? `${plan.family.label} · ${selectedPlan.variant} · Quality ${selectedPlan.score.total}/100` : `Exact output size: ${dims.width} × ${dims.height}px`}</p></div>{rendered ? <Badge variant="outline">Live preview</Badge> : <Badge variant="secondary">Rendering</Badge>}</div>
      {warning && <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-300">{warning}</div>}
      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div className="relative overflow-auto rounded-xl border border-border bg-black p-3">
        <canvas ref={canvasRef} className="mx-auto h-auto max-h-[72vh] max-w-full rounded-lg" />
        {settings.showSafeMargins && rendered && <div className="pointer-events-none absolute rounded-lg border border-dashed border-white/35" style={{ inset: `${Number(settings.safeMargin) || 7}%` }} />}
      </div>
      <div className="grid gap-2 sm:grid-cols-2"><Button disabled={!rendered} onClick={() => download("image/png")} className="gap-2"><Download className="h-4 w-4" />Download PNG</Button><Button disabled={!rendered} onClick={() => download("image/jpeg")} variant="outline" className="gap-2"><Download className="h-4 w-4" />Download JPG</Button></div>
    </div>
  );
}