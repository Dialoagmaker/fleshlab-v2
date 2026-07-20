import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, Wand2, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CoverPreviewEditor from "./CoverPreviewEditor";
import { formatTime } from "@/lib/aiMediaStudio/localAnalyzer";
import { validateIdentityPreservation, scoreIdentityReferenceFrame } from "@/lib/aiMediaStudio/imageIdentityValidation";

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

function BreakdownRows({ checks }) {
  if (!checks) return null;
  return (
    <div className="mt-3 grid gap-1 text-xs">
      {["face", "hair", "body", "pose", "overall"].map(key => (
        <div key={key} className="flex items-center justify-between rounded bg-background/55 px-2 py-1">
          <span className="capitalize text-muted-foreground">{key}</span>
          <b className="text-foreground">{checks[key]}%</b>
        </div>
      ))}
    </div>
  );
}

export default function OpenRouterCoverMode({ frame, identityReferenceFrame, metadata, settings }) {
  const [consent, setConsent] = useState(false);
  const [quality, setQuality] = useState("pro");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [validation, setValidation] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("idle");
  const [error, setError] = useState("");
  const referenceScore = identityReferenceFrame ? scoreIdentityReferenceFrame(identityReferenceFrame) : null;

  const generate = async () => {
    if (!frame?.blob || !consent) return;
    if (!identityReferenceFrame?.blob || !referenceScore?.hasClearFace) {
      setError("No suitable identity frame was found with a clearly visible face. Choose another frame with visible eyes, good light, and a frontal or three-quarter view, then generate again.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setValidation(null);
    setReviewStatus("idle");
    const frameDataUrl = await blobToDataUrl(frame.blob);
    const response = await base44.functions.invoke("openRouterAICover", {
      action: "generate",
      consent: true,
      frame_data_url: frameDataUrl,
      model_quality: quality,
      aspect_ratio: "16:9",
      metadata: { ...metadata, identityReferenceTime: formatTime(identityReferenceFrame.time) },
    });
    const data = response.data;
    if (!data?.ok) throw new Error(data?.error || "OpenRouter generation failed");
    const blob = dataUrlToBlob(data.generated_image_data_url);
    const generated = { blob, url: URL.createObjectURL(blob), model: data.model_used, cost: data.cost_reported, usage: data.usage, fallback: false };
    setResult(generated);
    const identityValidation = await validateIdentityPreservation(identityReferenceFrame.blob, blob, identityReferenceFrame);
    setValidation(identityValidation);
    setReviewStatus("pending");
    setLoading(false);
  };

  const handleGenerate = () => generate().catch(err => {
    setLoading(false);
    setError(`${err.response?.data?.error || err.message} No original-frame cover fallback will be used.`);
  });

  const approved = reviewStatus === "approved";
  const rejected = reviewStatus === "rejected";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/35 bg-primary/10 p-4">
        <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-primary" /><div className="space-y-2 text-sm"><p className="font-semibold text-foreground">OpenRouter recreates the selected story moment as cinematic 16:9 key art.</p><p className="text-muted-foreground">Identity validation now opens a review workflow. Generated artwork is always shown, and you manually approve or reject it.</p></div></div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div><h3 className="font-bold text-foreground">Story reference still</h3><p className="text-xs text-muted-foreground">Frame {frame ? formatTime(frame.time) : "not selected"}</p></div>
          {frame?.url && <img src={frame.url} alt="Selected story reference still" className="aspect-video w-full rounded-lg border border-border object-cover" />}
          <div className="rounded-lg border border-border bg-secondary/25 p-3">
            <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-bold text-foreground">Identity reference</h4>{referenceScore?.hasClearFace ? <Badge variant="outline">Auto-selected</Badge> : <Badge variant="destructive">No clear face</Badge>}</div>
            {identityReferenceFrame?.url ? <img src={identityReferenceFrame.url} alt="Auto-selected identity reference" className="mt-2 aspect-video w-full rounded border border-border object-cover" /> : <p className="mt-2 text-xs text-destructive">No suitable face-visible identity frame found.</p>}
            {identityReferenceFrame && <p className="mt-2 text-xs text-muted-foreground">Frame {formatTime(identityReferenceFrame.time)} · Overall {referenceScore?.overall}% · Face {referenceScore?.face}%</p>}
          </div>
          <div className="space-y-1"><Label className="text-xs">OpenRouter image model</Label><Select value={quality} onValueChange={setQuality}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pro">black-forest-labs/flux.2-pro</SelectItem><SelectItem value="max">black-forest-labs/flux.2-max quality mode</SelectItem></SelectContent></Select></div>
          <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm text-muted-foreground"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 accent-primary" /><span>I approve sending only the selected story still to OpenRouter for cinematic key-art reconstruction. The original video is not uploaded and FLESHLAB branding remains local.</span></label>
          <Button disabled={!frame || !identityReferenceFrame || !referenceScore?.hasClearFace || !consent || loading} onClick={handleGenerate} className="w-full gap-2"><Wand2 className="h-4 w-4" />{loading ? "Producing cinematic key art..." : "Generate Key Art"}</Button>
          {!identityReferenceFrame && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">No suitable identity frame exists in this video scan. Select another story frame with a clearer face or analyze a better source.</div>}
          {validation && (
            <div className={`rounded-lg border p-3 ${validation.accepted ? "border-primary/35 bg-primary/10" : "border-destructive/40 bg-destructive/10"}`}>
              <p className="text-xs font-semibold text-foreground">Identity validation breakdown</p>
              <BreakdownRows checks={validation.checks} />
              <p className="mt-2 text-xs text-muted-foreground">{validation.accepted ? "Automated check considers this usable, but manual approval is still required." : "Automated check is cautious. Review the artwork visually before deciding."}</p>
            </div>
          )}
          {result && (
            <div className="space-y-3 rounded-lg border border-border p-3 text-xs text-muted-foreground">
              <Badge variant="outline">{approved ? "Manually approved" : rejected ? "Manually rejected" : "Awaiting review"}</Badge>
              <p>Model: {result.model}</p>
              <p>Cost reported: {result.cost ?? "not reported"}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" onClick={() => setReviewStatus("approved")} className="gap-1"><CheckCircle2 className="h-3 w-3" />Approve</Button>
                <Button size="sm" variant="outline" onClick={() => setReviewStatus("rejected")} className="gap-1"><XCircle className="h-3 w-3" />Reject</Button>
              </div>
            </div>
          )}
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          {result ? (
            approved ? <CoverPreviewEditor frame={result} metadata={metadata} settings={settings} /> : <div className="space-y-4"><img src={result.url} alt="Generated key art awaiting review" className="w-full rounded-xl border border-border object-contain" /><div className={`rounded-lg border p-3 text-sm ${rejected ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-muted-foreground"}`}>{rejected ? "Artwork rejected. It remains visible here for review; generate again when ready." : "Generated key art is visible. Approve it to add local FLESHLAB typography and branding."}</div></div>
          ) : <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No cinematic key art has been generated yet. The strongest face-visible identity frame will be used for local identity review.</div>}
        </div>
      </div>
    </div>
  );
}