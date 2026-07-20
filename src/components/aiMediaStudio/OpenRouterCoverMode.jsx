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

async function frameToDataUrl(frame) {
  if (frame?.blob) return blobToDataUrl(frame.blob);
  if (frame?.url) {
    const response = await fetch(frame.url);
    return blobToDataUrl(await response.blob());
  }
  throw new Error("Selected frame has no encoded image payload.");
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
  const [debugStages, setDebugStages] = useState({});
  const referenceScore = identityReferenceFrame ? scoreIdentityReferenceFrame(identityReferenceFrame) : null;

  const generate = async () => {
    console.info("Generate button clicked");
    if (!consent) return;
    setLoading(true);
    setError("");
    setResult(null);
    setValidation(null);
    setReviewStatus("idle");
    setDebugStages({ frameExtracted: Boolean(frame) });
    console.info("Frame extraction", Boolean(frame));
    const storyDataUrl = await frameToDataUrl(frame);
    console.info("Image encoding", storyDataUrl?.startsWith("data:image/"));
    setDebugStages(stage => ({ ...stage, imageEncoded: storyDataUrl?.startsWith("data:image/") }));
    const payload = {
      action: "generate",
      consent: true,
      frame_data_url: storyDataUrl,
      model_quality: quality,
      aspect_ratio: "16:9",
      metadata: { ...metadata, identityReferenceTime: identityReferenceFrame ? formatTime(identityReferenceFrame.time) : "none" },
    };
    console.info("Payload creation", true);
    setDebugStages(stage => ({ ...stage, payloadCreated: true, privacyValidation: true }));
    console.info("OpenRouter request");
    setDebugStages(stage => ({ ...stage, requestSent: true }));
    const response = await base44.functions.invoke("openRouterAICover", payload);
    const data = response.data;
    console.info("OpenRouter response", Boolean(data));
    setDebugStages(stage => ({ ...stage, responseReceived: Boolean(data) }));
    if (!data?.ok) throw new Error(data?.error || "OpenRouter generation failed");
    const blob = dataUrlToBlob(data.generated_image_data_url);
    const generated = { blob, url: URL.createObjectURL(blob), model: data.model_used, cost: data.cost_reported, usage: data.usage, fallback: false };
    setResult(generated);
    console.info("Preview rendering", true);
    setDebugStages(stage => ({ ...stage, previewRendered: true }));
    const identityValidation = identityReferenceFrame?.blob
      ? await validateIdentityPreservation(identityReferenceFrame.blob, blob, identityReferenceFrame)
      : { accepted: false, identityConfidence: 0, checks: { face: 0, hair: 0, body: 0, pose: 0, overall: 0 }, reference: null };
    setValidation(identityValidation);
    setReviewStatus("pending");
    setLoading(false);
  };

  const handleGenerate = () => generate().catch(err => {
    setLoading(false);
    const message = err.response?.data?.error || err.message;
    console.error("Key art generation stopped", message);
    const privacyBlocked = String(message || "").includes("Privacy guard blocked");
    setDebugStages(stage => ({
      frameExtracted: Boolean(stage.frameExtracted),
      imageEncoded: Boolean(stage.imageEncoded),
      payloadCreated: Boolean(stage.payloadCreated),
      privacyValidation: !privacyBlocked && Boolean(stage.payloadCreated),
      requestSent: Boolean(stage.requestSent),
      responseReceived: Boolean(stage.responseReceived || err.response?.data),
      previewRendered: Boolean(stage.previewRendered),
    }));
    setError(`${message} The workflow remains review-based; no frame fallback will be used.`);
  });

  const approved = reviewStatus === "approved";
  const rejected = reviewStatus === "rejected";
  const lowIdentity = validation && !validation.accepted;
  const stageItems = [
    ["Frame extracted", debugStages.frameExtracted],
    ["Image encoded", debugStages.imageEncoded],
    ["Payload created", debugStages.payloadCreated],
    ["Privacy validation", debugStages.privacyValidation],
    ["Request sent", debugStages.requestSent],
    ["Response received", debugStages.responseReceived],
    ["Preview rendered", debugStages.previewRendered],
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/35 bg-primary/10 p-4">
        <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-primary" /><div className="space-y-2 text-sm"><p className="font-semibold text-foreground">Identity and story are now separate inputs.</p><p className="text-muted-foreground">The AI automatically selects identity from the full video scan while your selected frame directs the story moment. Generation is never blocked.</p></div></div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div><h3 className="font-bold text-foreground">Story Frame</h3><p className="text-xs text-muted-foreground">Frame {frame ? formatTime(frame.time) : "not selected"}</p></div>
          {frame?.url && <img src={frame.url} alt="Selected story reference still" className="aspect-video w-full rounded-lg border border-border object-cover" />}
          <div className="rounded-lg border border-border bg-secondary/25 p-3">
            <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-bold text-foreground">Identity Frame</h4>{referenceScore?.hasClearFace ? <Badge variant="outline">Auto-selected</Badge> : <Badge variant="destructive">LOW IDENTITY</Badge>}</div>
            {identityReferenceFrame?.url ? <img src={identityReferenceFrame.url} alt="Auto-selected identity reference" className="mt-2 aspect-video w-full rounded border border-border object-cover" /> : <p className="mt-2 text-xs text-muted-foreground">No strong face was found in the full video scan. Generation will continue and be marked LOW IDENTITY.</p>}
            {identityReferenceFrame && <p className="mt-2 text-xs text-muted-foreground">Frame {formatTime(identityReferenceFrame.time)} · Face {referenceScore?.face}% · Eyes {referenceScore?.eyes}% · Hair {referenceScore?.hair}% · Size {referenceScore?.faceSize}%</p>}
          </div>
          <div className="space-y-1"><Label className="text-xs">OpenRouter image model</Label><Select value={quality} onValueChange={setQuality}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pro">black-forest-labs/flux.2-pro</SelectItem><SelectItem value="max">black-forest-labs/flux.2-max quality mode</SelectItem></SelectContent></Select></div>
          <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm text-muted-foreground"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 accent-primary" /><span>I approve sending the story frame and, when found, the auto-selected identity frame to OpenRouter for cinematic key-art reconstruction. The original video is not uploaded and FLESHLAB branding remains local.</span></label>
          <Button disabled={!frame || !consent || loading} onClick={handleGenerate} className="w-full gap-2"><Wand2 className="h-4 w-4" />{loading ? "Producing cinematic key art..." : "Generate Key Art"}</Button>
          <div className="rounded-lg border border-border bg-secondary/25 p-3 text-xs">
            <p className="mb-2 font-semibold text-foreground">Generation status</p>
            <div className="grid gap-1">
              {stageItems.map(([label, ok]) => <div key={label} className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span>{ok ? "✅" : "❌"}</span></div>)}
            </div>
          </div>
          {!identityReferenceFrame && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">No suitable identity frame exists in this video scan. Generation will continue, but the result will be marked LOW IDENTITY for your review.</div>}
          {validation && (
            <div className={`rounded-lg border p-3 ${validation.accepted ? "border-primary/35 bg-primary/10" : "border-destructive/40 bg-destructive/10"}`}>
              <p className="text-xs font-semibold text-foreground">Similarity Breakdown</p>
              <BreakdownRows checks={validation.checks} />
              <p className="mt-2 text-xs text-muted-foreground">{validation.accepted ? "Identity confidence is usable, but final approval is yours." : "LOW IDENTITY — the artwork is still shown for your decision."}</p>
            </div>
          )}
          {result && (
            <div className="space-y-3 rounded-lg border border-border p-3 text-xs text-muted-foreground">
              <Badge variant={lowIdentity ? "destructive" : "outline"}>{approved ? "Manually approved" : rejected ? "Manually rejected" : lowIdentity ? "LOW IDENTITY" : "Awaiting review"}</Badge>
              <p>Model: {result.model}</p>
              <p>Cost reported: {result.cost ?? "not reported"}</p>
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" onClick={() => setReviewStatus("approved")} className="gap-1"><CheckCircle2 className="h-3 w-3" />Approve</Button>
                <Button size="sm" variant="outline" onClick={() => setReviewStatus("rejected")} className="gap-1"><XCircle className="h-3 w-3" />Reject</Button>
                <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading} className="gap-1"><Wand2 className="h-3 w-3" />Regenerate</Button>
              </div>
            </div>
          )}
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          {result ? (
            approved ? <CoverPreviewEditor frame={result} metadata={metadata} settings={settings} /> : <div className="space-y-4"><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-foreground">Generated Key Art</h3>{validation && <Badge variant={lowIdentity ? "destructive" : "outline"}>{lowIdentity ? "LOW IDENTITY" : `Identity ${validation.identityConfidence}%`}</Badge>}</div><img src={result.url} alt="Generated key art awaiting review" className="w-full rounded-xl border border-border object-contain" /><div className={`rounded-lg border p-3 text-sm ${rejected ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-muted-foreground"}`}>{rejected ? "Artwork rejected. It remains visible here for review; generate again when ready." : "Generated Key Art is visible for review. Approve it to add local FLESHLAB typography and branding."}</div></div>
          ) : <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No cinematic key art has been generated yet. The AI will use the story frame plus the strongest identity frame it found, or continue with LOW IDENTITY if none exists.</div>}
        </div>
      </div>
    </div>
  );
}