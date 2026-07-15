import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { canvasToBlob, getCoverDimensions, renderCoverToCanvas } from "@/lib/aiMediaStudio/coverRenderer";

export default function CoverPreviewEditor({ frame, candidateFrames = [], metadata, settings, fileSuffix = "cover" }) {
  const canvasRef = useRef(null);
  const [rendered, setRendered] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const dims = getCoverDimensions(settings);

  useEffect(() => {
    let active = true;
    setRendered(false);
    setPlan(null);
    setError("");
    const candidates = [frame, ...candidateFrames].filter((candidate, index, all) => candidate?.blob && all.findIndex(item => item?.index === candidate.index) === index);
    if (!candidates.length || !canvasRef.current) return;
    (async () => {
      let lastError = "";
      for (const candidate of candidates) {
        try {
          const nextPlan = await renderCoverToCanvas(canvasRef.current, candidate.blob, metadata, settings);
          if (active) { setPlan(nextPlan || canvasRef.current.__fleshlabPosterPlan || null); setRendered(true); }
          return;
        } catch (err) {
          lastError = err.message;
        }
      }
      if (active) setError(lastError || "No candidate frame passed the semantic poster quality gate");
    })();
    return () => { active = false; };
  }, [frame, candidateFrames, metadata, settings]);

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
      <div className="flex items-center justify-between gap-3"><div><h3 className="font-bold text-foreground">Cinematic poster preview</h3><p className="text-xs text-muted-foreground">{plan?.best ? `${plan.family.label} · ${plan.best.variant} · Quality ${plan.best.score.total}/100` : `Exact output size: ${dims.width} × ${dims.height}px`}</p></div>{rendered ? <Badge variant="outline">V2 scored</Badge> : <Badge variant="secondary">Rendering</Badge>}</div>
      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div className="relative overflow-auto rounded-xl border border-border bg-black p-3">
        <canvas ref={canvasRef} className="mx-auto h-auto max-h-[72vh] max-w-full rounded-lg" />
        {settings.showSafeMargins && rendered && <div className="pointer-events-none absolute inset-[7%] rounded-lg border border-dashed border-white/35" />}
      </div>
      <div className="grid gap-2 sm:grid-cols-2"><Button disabled={!rendered} onClick={() => download("image/png")} className="gap-2"><Download className="h-4 w-4" />Download PNG</Button><Button disabled={!rendered} onClick={() => download("image/jpeg")} variant="outline" className="gap-2"><Download className="h-4 w-4" />Download JPG</Button></div>
    </div>
  );
}