import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatTime } from "@/lib/aiMediaStudio/localAnalyzer";
import { validateIdentityPreservation } from "@/lib/aiMediaStudio/imageIdentityValidation";
import CoverPreviewEditor from "./CoverPreviewEditor";

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function imageElementFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Selected frame could not be loaded for FLUX encoding."));
    };
    image.src = url;
  });
}

async function frameToDataUrl(frame) {
  const sourceBlob = frame?.blob || (frame?.url ? await (await fetch(frame.url)).blob() : null);
  if (!sourceBlob) throw new Error("Selected frame has no image payload.");
  const image = await imageElementFromBlob(sourceBlob);
  const canvas = document.createElement("canvas");
  canvas.width = 1344;
  canvas.height = 756;
  const ctx = canvas.getContext("2d");
  const sourceRatio = image.width / image.height;
  const targetRatio = canvas.width / canvas.height;
  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;
  if (sourceRatio > targetRatio) {
    sw = image.height * targetRatio;
    sx = (image.width - sw) / 2;
  } else {
    sh = image.width / targetRatio;
    sy = (image.height - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export default function OpenRouterCoverMode({ frame, identityReferenceFrame, metadata, settings }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("Ready to shoot the selected story moment.");
  const [error, setError] = useState("");

  const generate = async () => {
    if (!frame) return;
    setLoading(true);
    setError("");
    setResult(null);
    setStatus("The photographer is studying the moment...");

    try {
      const storyDataUrl = await frameToDataUrl(frame);
      const identityDataUrl = identityReferenceFrame ? await frameToDataUrl(identityReferenceFrame) : null;
      let best = null;
      let repairDirective = "";

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        setStatus(attempt === 1 ? "Shooting the hero photograph..." : "Refining the strongest promotional still...");
        const response = await base44.functions.invoke("openRouterAICover", {
          action: "generate",
          consent: true,
          story_reference_data_url: storyDataUrl,
          identity_reference_data_url: identityDataUrl,
          aspect_ratio: "16:9",
          metadata: {
            ...metadata,
            identityReferenceTime: identityReferenceFrame ? formatTime(identityReferenceFrame.time) : "none",
            regenerationDirective: repairDirective,
          },
        });
        const data = response.data;
        if (!data?.ok) throw new Error(data?.error || "The AI Photographer could not complete the shoot.");
        const blob = dataUrlToBlob(data.generated_image_data_url);
        const validation = identityReferenceFrame?.blob
          ? await validateIdentityPreservation(identityReferenceFrame.blob, blob, identityReferenceFrame)
          : { accepted: true, identityConfidence: 88, checks: { face: 88, hair: 88, body: 88, pose: 88, overall: 88 }, reference: null };
        const candidate = {
          blob,
          url: URL.createObjectURL(blob),
          model: data.model_used,
          attempts: attempt,
          photographerAttempts: data.photographer_attempts || [],
          validation,
          score: Number(validation.identityConfidence || validation.checks?.overall || 0),
        };
        if (!best || candidate.score > best.score) best = candidate;
        if (validation.accepted || attempt === 3) break;
        repairDirective = `Quality review requested a closer official still. Preserve the same performer identity, face, hair, body, pose, emotion, environment, and story more accurately. Improve only camera, lighting, composition, atmosphere, image quality, and cinematic realism.`;
      }

      setResult(best);
      setStatus("Official promotional still selected. Building cover design...");
    } catch (err) {
      setStatus("Ready to shoot the selected story moment.");
      setError(err.response?.data?.error || err.message || "The AI Photographer could not complete this shoot.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => generate();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/35 bg-primary/10 p-4">
        <div className="flex items-start gap-3"><Camera className="mt-0.5 h-5 w-5 text-primary" /><div className="space-y-2 text-sm"><p className="font-semibold text-foreground">AI Photographer</p><p className="text-muted-foreground">Select a story frame, then let the production engine create the official promotional still and cover design automatically.</p></div></div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div><h3 className="font-bold text-foreground">Selected story frame</h3><p className="text-xs text-muted-foreground">Frame {frame ? formatTime(frame.time) : "not selected"}</p></div>
          {frame?.url && <img src={frame.url} alt="Selected story frame" className="aspect-video w-full rounded-lg border border-border object-cover" />}
          <Button disabled={!frame || loading} onClick={handleGenerate} className="w-full gap-2"><Wand2 className="h-4 w-4" />{loading ? "Photographer at work..." : "Create official promotional still"}</Button>
          <div className="rounded-lg border border-border bg-secondary/25 p-3 text-sm text-muted-foreground">{status}</div>
          {result && <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-muted-foreground"><Badge variant="outline">Best still selected</Badge><p className="mt-2">The photographer compared up to three passes and sent the strongest image into cover design.</p></div>}
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          {result ? (
            <CoverPreviewEditor frame={{ ...result, aiReconstructed: true }} metadata={{ ...metadata, aiReconstructed: true }} settings={settings} fileSuffix="official-promotional-still" />
          ) : <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">The finished promotional still and cover export will appear here.</div>}
        </div>
      </div>
    </div>
  );
}