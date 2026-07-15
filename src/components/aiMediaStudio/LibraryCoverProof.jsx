import { useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { sampleVideoFrames, rankHeroFrames } from "@/lib/aiMediaStudio/localAnalyzer";
import { DEFAULT_COVER_SETTINGS, blobToCanvasImage, getCoverDimensions } from "@/lib/aiMediaStudio/coverRenderer";
import { generatePosterPlan, renderPosterVariantToCanvas } from "@/lib/aiMediaStudio/posterRenderer";

const PROOF_SIZE = 100;
const HISTOGRAM_BUCKETS = [
  { label: "0-49", min: 0, max: 49 },
  { label: "50-59", min: 50, max: 59 },
  { label: "60-69", min: 60, max: 69 },
  { label: "70-79", min: 70, max: 79 },
  { label: "80-89", min: 80, max: 89 },
  { label: "90-100", min: 90, max: 100 },
];

function safeName(title) {
  return `${String(title || "library-video").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.mp4`;
}

function loadRemoteVideoMetadata(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      if (!video.duration || !video.videoWidth || !video.videoHeight) {
        reject(new Error("Video metadata could not be read"));
        return;
      }
      resolve({
        previewUrl: url,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: Number((video.videoWidth / video.videoHeight).toFixed(3)),
      });
    };
    video.onerror = () => reject(new Error("Video could not be loaded for browser analysis"));
    video.src = url;
  });
}

async function buildLibraryCandidates() {
  const [videos, sourceAssets] = await Promise.all([
    base44.entities.Video.list("-published_at", 140),
    base44.entities.VideoAsset.filter({ asset_type: "source" }, "-updated_date", 220),
  ]);
  const assetByVideo = new Map(sourceAssets.filter(asset => asset.cdn_url).map(asset => [asset.video_id, asset.cdn_url]));
  return videos
    .map(video => ({
      id: video.id,
      title: video.title || video.slug || "Untitled Video",
      url: video.source_video_url || assetByVideo.get(video.id) || video.trailer_url,
    }))
    .filter(item => item.url)
    .slice(0, PROOF_SIZE);
}

async function canvasDataUrl(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(URL.createObjectURL(blob)) : reject(new Error("Proof image export failed")), "image/jpeg", 0.82);
  });
}

function summarizeVision(analysis) {
  if (!analysis) return "No Vision analysis saved";
  return [
    `Curiosity ${Math.round((analysis.visualCuriosity || 0) * 100)}`,
    `Readability ${Math.round((analysis.sceneReadability || analysis.subjectVisibility || 0) * 100)}`,
    `Interaction ${Math.round((analysis.interactionStrength || 0) * 100)}`,
    `Click ${Math.round((analysis.clickPotential || 0) * 100)}`,
  ].join(" · ");
}

function winningReason(plan) {
  const best = plan?.best;
  if (!best) return "No winning variant was produced.";
  const failures = best.score?.qualityFailures?.length ? ` Rejection: ${best.score.qualityFailures.join(", ")}.` : "";
  return `Won as the highest-ranked ${best.variant} variant: total ${best.score.total}, Story ${best.score.story}, image quality ${best.score.imageQuality}, marketing ${best.score.marketing}.${failures}`;
}

async function renderProofImages(hero, video) {
  const dims = getCoverDimensions(DEFAULT_COVER_SETTINGS);
  const image = await blobToCanvasImage(hero.blob);
  const metadata = { performerName: "", videoTitle: video.title, optionalSubtitle: "" };
  const plan = await generatePosterPlan(image, metadata, DEFAULT_COVER_SETTINGS, dims.width, dims.height);
  const renderedVariants = [];

  for (let index = 0; index < plan.variants.length; index += 1) {
    const variant = plan.variants[index];
    const canvas = document.createElement("canvas");
    await renderPosterVariantToCanvas(canvas, image, plan, variant, DEFAULT_COVER_SETTINGS, dims.width, dims.height);
    renderedVariants.push({
      label: `Variant ${String.fromCharCode(65 + index)}`,
      variant: variant.variant,
      score: variant.score,
      url: await canvasDataUrl(canvas),
    });
  }

  return {
    plan,
    variants: renderedVariants,
    finalPosterUrl: renderedVariants[0]?.url,
    accepted: Boolean(plan.best?.score?.passesQualityGate),
  };
}

function calculateStats(results) {
  const completed = results.filter(item => item.status !== "processing");
  const scored = completed.filter(item => Number.isFinite(item.storyScore));
  const accepted = completed.filter(item => item.accepted).length;
  const rejected = completed.filter(item => item.status === "failed" || item.accepted === false).length;
  const average = (key) => scored.length ? Math.round(scored.reduce((sum, item) => sum + (item[key] || 0), 0) / scored.length) : 0;
  const rejectionReasons = completed.reduce((map, item) => {
    (item.rejectionReasons || (item.error ? [item.error] : [])).forEach(reason => map.set(reason, (map.get(reason) || 0) + 1));
    return map;
  }, new Map());
  const familyDistribution = completed.reduce((map, item) => {
    if (item.posterFamily) map.set(item.posterFamily, (map.get(item.posterFamily) || 0) + 1);
    return map;
  }, new Map());
  const histogram = HISTOGRAM_BUCKETS.map(bucket => ({
    ...bucket,
    count: scored.filter(item => item.storyScore >= bucket.min && item.storyScore <= bucket.max).length,
  }));

  return {
    processed: completed.length,
    accepted,
    rejected,
    averageStoryScore: average("storyScore"),
    averageQuality: average("qualityScore"),
    rejectionReasons: Array.from(rejectionReasons.entries()),
    familyDistribution: Array.from(familyDistribution.entries()),
    histogram,
  };
}

export default function LibraryCoverProof() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(`Ready to run semantic Vision proof across ${PROOF_SIZE} library videos.`);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const pausedRef = useRef(false);
  const stats = useMemo(() => calculateStats(results), [results]);

  const runProof = async () => {
    setRunning(true);
    setError("");
    setResults([]);
    setProgress(0);
    abortRef.current = new AbortController();

    try {
      setStatus("Loading existing library videos…");
      const candidates = await buildLibraryCandidates();
      if (candidates.length < PROOF_SIZE) throw new Error(`Only ${candidates.length} usable library videos were found with playable source URLs; ${PROOF_SIZE} are required for this proof run.`);

      const nextResults = [];
      for (let index = 0; index < candidates.length; index += 1) {
        const video = candidates[index];
        setStatus(`Analyzing ${index + 1}/${PROOF_SIZE}: ${video.title}`);
        const metadata = await loadRemoteVideoMetadata(video.url);
        const file = { name: safeName(video.title) };
        const frames = await sampleVideoFrames({
          file,
          previewUrl: video.url,
          metadata,
          onProgress: value => setProgress(Math.round(((index + value / 100) / candidates.length) * 100)),
          log: null,
          pausedRef,
          signal: abortRef.current.signal,
        });
        const hero = rankHeroFrames(frames, 1)[0];
        if (!hero) {
          nextResults.push({ ...video, status: "failed", accepted: false, error: "No hero frame passed the automatic Story Score detector.", rejectionReasons: ["No hero frame passed the automatic Story Score detector"] });
          setResults([...nextResults]);
          continue;
        }

        try {
          const proof = await renderProofImages(hero, video);
          const bestScore = proof.plan.best?.score || {};
          nextResults.push({
            ...video,
            status: "ready",
            accepted: proof.accepted,
            hero,
            heroFrameUrl: hero.url,
            storyScore: bestScore.story,
            qualityScore: bestScore.imageQuality,
            visionAnalysis: proof.plan.analysis,
            visionSummary: summarizeVision(proof.plan.analysis),
            posterFamily: proof.plan.family?.label || "Unknown",
            winningReason: winningReason(proof.plan),
            variants: proof.variants,
            finalPosterUrl: proof.finalPosterUrl,
            rejectionReasons: bestScore.qualityFailures || [],
          });
        } catch (renderError) {
          nextResults.push({ ...video, status: "failed", accepted: false, error: renderError.message, hero, heroFrameUrl: hero.url, rejectionReasons: [renderError.message] });
        }
        setResults([...nextResults]);
      }
      setProgress(100);
      setStatus(`${PROOF_SIZE}-video semantic Vision proof gallery complete.`);
    } catch (err) {
      setError(err.name === "AbortError" ? "Proof run cancelled." : err.message);
      setStatus("Proof run stopped.");
    } finally {
      setRunning(false);
    }
  };

  const cancel = () => abortRef.current?.abort();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>Semantic Vision Proof Gallery</span>
            <Badge variant="outline">100 library videos · scoring unchanged</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Runs the current Vision Layer and poster engine against 100 existing library videos, saving the selected hero frame, all internal variants, final poster, Story Score, Vision analysis, poster family, and winning reason for review.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={runProof} disabled={running}>{running ? "Running proof…" : "Generate 100-Video Proof Gallery"}</Button>
            {running && <Button variant="outline" onClick={cancel}>Cancel</Button>}
          </div>
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">{status}</p>
          </div>
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </CardContent>
      </Card>

      {!!results.length && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Proof Statistics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Processed</p><p className="text-2xl font-black">{stats.processed}</p></div>
              <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Accepted</p><p className="text-2xl font-black">{stats.accepted}</p></div>
              <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Rejected</p><p className="text-2xl font-black">{stats.rejected}</p></div>
              <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Avg Story</p><p className="text-2xl font-black">{stats.averageStoryScore}</p></div>
              <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Avg Quality</p><p className="text-2xl font-black">{stats.averageQuality}</p></div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2"><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Distribution Histogram</p>{stats.histogram.map(bucket => <div key={bucket.label} className="flex items-center gap-2 text-xs"><span className="w-14">{bucket.label}</span><div className="h-2 flex-1 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, bucket.count)}%` }} /></div><span>{bucket.count}</span></div>)}</div>
              <div className="space-y-2"><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Rejection Reasons</p>{stats.rejectionReasons.length ? stats.rejectionReasons.map(([reason, count]) => <p key={reason} className="text-xs text-muted-foreground">{count}× {reason}</p>) : <p className="text-xs text-muted-foreground">None yet</p>}</div>
              <div className="space-y-2"><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Poster Families</p>{stats.familyDistribution.map(([family, count]) => <p key={family} className="text-xs text-muted-foreground">{count}× {family}</p>)}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {!!results.length && (
        <div className="space-y-4">
          {results.map((item, index) => (
            <Card key={`${item.id}-${index}`} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex flex-col gap-2 text-sm sm:flex-row sm:items-start sm:justify-between">
                  <span>{index + 1}. {item.title}</span>
                  <Badge variant={item.accepted ? "outline" : "destructive"}>{item.accepted ? "Accepted" : "Rejected"}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 xl:grid-cols-8">
                  <ProofImage label="Original hero frame" url={item.heroFrameUrl} error={item.error} />
                  <ProofText label="Story Score" value={item.storyScore ?? "—"} />
                  <ProofText label="Vision summary" value={item.visionSummary || item.error || "—"} />
                  <ProofText label="Poster Family" value={item.posterFamily || "—"} />
                  <ProofImage label={item.variants?.[0]?.label || "Variant A"} url={item.variants?.[0]?.url} />
                  <ProofImage label={item.variants?.[1]?.label || "Variant B"} url={item.variants?.[1]?.url} />
                  <ProofImage label={item.variants?.[2]?.label || "Variant C"} url={item.variants?.[2]?.url} />
                  <ProofImage label="Final selected poster" url={item.finalPosterUrl} />
                </div>
                <div className="rounded-lg border border-border bg-card/60 p-3 text-xs text-muted-foreground"><span className="font-bold text-foreground">Why this frame won:</span> {item.winningReason || item.error || "Pending"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ProofImage({ label, url, error }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      {url ? <img src={url} alt={label} className="aspect-video w-full rounded-lg border border-border bg-black object-cover" /> : <div className="flex aspect-video items-center justify-center rounded-lg border border-border bg-black p-2 text-center text-[10px] text-destructive">{error || "Pending"}</div>}
    </div>
  );
}

function ProofText({ label, value }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card/60 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}