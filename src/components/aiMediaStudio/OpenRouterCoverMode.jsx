import { useState } from "react";
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
  if (!sourceBlob) throw new Error("Selected frame has no image payload.");
  const image = await imageElementFromBlob(sourceBlob);
  const maxSide = 1344;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
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
  const [heroImage, setHeroImage] = useState(null);
  const [designCover, setDesignCover] = useState(false);
  const [status, setStatus] = useState("Ready to generate the hero image.");
  const [error, setError] = useState("");

  const generate = async () => {
    if (!frame || !metadata?.videoTitle?.trim()) return;
    setLoading(true);
    setError("");
    setHeroImage(null);
    setDesignCover(false);
    setStatus("Creative Director is preparing the shoot...");

    try {
      const storyDataUrl = await frameToDataUrl(frame);
      const identityDataUrl = identityReferenceFrame ? await frameToDataUrl(identityReferenceFrame) : null;
      let best = null;
      let repairDirective = "";

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        setStatus(attempt === 1 ? "Generating the hero image..." : "Refining the hero image...");
        const response = await base44.functions.invoke("openRouterAICover", {
          action: "generate",
          consent: true,
          story_reference_data_url: storyDataUrl,
          identity_reference_data_url: identityDataUrl,
          aspect_ratio: "16:9",
          metadata: { ...metadata, identityReferenceTime: identityReferenceFrame ? formatTime(identityReferenceFrame.time) : "none", regenerationDirective: repairDirective },
        });
        const data = response.data;
        if (!data?.ok) throw new Error(data?.error || "The hero image could not be generated.");
        const blob = dataUrlToBlob(data.generated_image_data_url);
        const validation = identityReferenceFrame?.blob ? await validateIdentityPreservation(identityReferenceFrame.blob, blob, identityReferenceFrame) : { accepted: true, identityConfidence: 88 };
        const candidate = { blob, url: URL.createObjectURL(blob), score: Number(validation.identityConfidence || validation.checks?.overall || 0), aiReconstructed: true };
        if (!best || candidate.score > best.score) best = candidate;
        if (validation.accepted || attempt === 3) break;
        repairDirective = "Preserve the performer, pose, action, emotion, and location more accurately while keeping the image a new 16:9 advertising photograph.";
      }

      setHeroImage(best);
      setStatus("Hero image ready.");
    } catch (err) {
      setStatus("Ready to generate the hero image.");
      setError(err.response?.data?.error || err.message || "The hero image could not be generated.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/25 bg-primary/10 p-4">
        <div className="flex items-start gap-3"><Camera className="mt-0.5 h-5 w-5 text-primary" /><div className="space-y-1 text-sm"><p className="font-semibold text-foreground">3. Generate Hero Image</p><p className="text-muted-foreground">The selected smartphone frame is used only as reference for a new 16:9 advertising photograph.</p></div></div>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground">Selected story frame · {formatTime(frame.time)}</p>
            <img src={frame.url} alt="Selected story frame" className="h-32 w-56 rounded-lg border border-border bg-black object-contain" />
          </div>
          <div className="flex flex-col gap-2 md:min-w-72">
            <Button disabled={!frame || loading || !metadata?.videoTitle?.trim()} onClick={generate} className="gap-2"><Wand2 className="h-4 w-4" />{loading ? "Generating..." : "Generate Hero Image"}</Button>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        </div>
        {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {heroImage ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3"><Badge variant="outline">Hero image ready</Badge><Button onClick={() => setDesignCover(true)} disabled={designCover}>Design Cover</Button></div>
            <img src={heroImage.url} alt="Generated hero image" className="w-full rounded-xl border border-border bg-black object-contain" />
          </div>
        ) : <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">The generated hero image will appear here.</div>}
      </div>

      {designCover && heroImage && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4"><p className="text-sm font-semibold text-foreground">4. Design Cover</p><p className="text-xs text-muted-foreground">Typography is designed around the generated hero image.</p></div>
          <CoverPreviewEditor frame={heroImage} metadata={{ ...metadata, aiReconstructed: true }} settings={settings} fileSuffix="official-cover" />
        </div>
      )}
    </div>
  );
}