import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CoverPreviewEditor from "./CoverPreviewEditor";
import { getCoverDimensions } from "@/lib/aiMediaStudio/coverRenderer";
import { formatTime } from "@/lib/aiMediaStudio/localAnalyzer";

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function aspectRatioFromSettings(settings) {
  const { width, height } = getCoverDimensions(settings);
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

export default function OpenRouterCoverMode({ frame, metadata, settings }) {
  const [consent, setConsent] = useState(false);
  const [quality, setQuality] = useState("pro");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!frame?.blob || !consent) return;
    setLoading(true);
    setError("");
    setResult(null);
    const frameDataUrl = await blobToDataUrl(frame.blob);
    const response = await base44.functions.invoke("openRouterAICover", {
      action: "generate",
      consent: true,
      frame_data_url: frameDataUrl,
      model_quality: quality,
      aspect_ratio: aspectRatioFromSettings(settings),
    });
    const data = response.data;
    if (!data?.ok) throw new Error(data?.error || "OpenRouter generation failed");
    const blob = dataUrlToBlob(data.generated_image_data_url);
    setResult({ blob, url: URL.createObjectURL(blob), model: data.model_used, cost: data.cost_reported, usage: data.usage });
    setLoading(false);
  };

  const handleGenerate = () => generate().catch(err => { setLoading(false); setError(err.response?.data?.error || err.message); });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/35 bg-primary/10 p-4">
        <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-primary" /><div className="space-y-2 text-sm"><p className="font-semibold text-foreground">This selected still image will be sent to OpenRouter for AI image editing. The original video will not be uploaded.</p><p className="text-muted-foreground">Local analysis: Original video transmitted NO · Frames transmitted NO. OpenRouter mode: selected approved still YES · generated image received YES.</p></div></div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div><h3 className="font-bold text-foreground">Approved still before upload</h3><p className="text-xs text-muted-foreground">Frame {frame ? formatTime(frame.time) : "not selected"}</p></div>
          {frame?.url && <img src={frame.url} alt="Selected approved still" className="aspect-video w-full rounded-lg border border-border object-cover" />}
          <div className="space-y-1"><Label className="text-xs">OpenRouter image model</Label><Select value={quality} onValueChange={setQuality}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pro">black-forest-labs/flux.2-pro</SelectItem><SelectItem value="max">black-forest-labs/flux.2-max quality mode</SelectItem></SelectContent></Select></div>
          <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm text-muted-foreground"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 accent-primary" /><span>I approve sending only this selected still image to OpenRouter. I understand the original video will not be uploaded.</span></label>
          <Button disabled={!frame || !consent || loading} onClick={handleGenerate} className="w-full gap-2"><Wand2 className="h-4 w-4" />{loading ? "Generating with OpenRouter..." : "Generate OpenRouter AI Cover"}</Button>
          {result && <div className="space-y-1 text-xs text-muted-foreground"><Badge variant="outline">Generated</Badge><p>Model: {result.model}</p><p>Cost reported: {result.cost ?? "not reported"}</p></div>}
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          {result ? <CoverPreviewEditor frame={result} metadata={metadata} settings={settings} /> : <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No completed AI cover is shown until OpenRouter returns a real generated image. Final FLESHLAB text and logo will be rendered locally here.</div>}
        </div>
      </div>
    </div>
  );
}