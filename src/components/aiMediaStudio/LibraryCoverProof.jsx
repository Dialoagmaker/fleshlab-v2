import { useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { isSupportedVideoFile, sampleVideoFrames, rankHeroFrames } from "@/lib/aiMediaStudio/localAnalyzer";
import { DEFAULT_COVER_SETTINGS, blobToCanvasImage, getCoverDimensions } from "@/lib/aiMediaStudio/coverRenderer";
import { generatePosterPlan, renderPosterVariantToCanvas } from "@/lib/aiMediaStudio/commercialKeyArtEngine";
import { resolveAnalyzableVideoSource } from "@/lib/videoAssetResolver";
import { aggregatePreflightDiagnostics, preflightAnalyzableVideoSource } from "@/lib/aiMediaStudio/videoPreflight";

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

function sourceKey(source) {
  return source.videoId || source.redactedUrl || source.title;
}

function getExtension(fileName = "") {
  return fileName.split(".").pop()?.toLowerCase() || "unknown";
}

async function canvasObjectUrl(canvas) {
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
      url: await canvasObjectUrl(canvas),
    });
    canvas.width = 0;
    canvas.height = 0;
  }

  return {
    plan,
    variants: renderedVariants,
    finalPosterUrl: renderedVariants[0]?.url,
    accepted: Boolean(plan.best?.score?.passesQualityGate),
  };
}

function calculateStats(results, diagnostics) {
  const scored = results.filter(item => Number.isFinite(item.storyScore));
  const rendered = scored.length;
  const rejected = results.filter(item => item.status === "failed" || item.accepted === false).length;
  const skipped = diagnostics.filter(item => item.classification && item.classification !== "READY").length;
  const average = (key) => scored.length ? Math.round(scored.reduce((sum, item) => sum + (item[key] || 0), 0) / scored.length) : 0;
  const rejectionReasons = results.reduce((map, item) => {
    (item.rejectionReasons || (item.error ? [item.error] : [])).forEach(reason => map.set(reason, (map.get(reason) || 0) + 1));
    return map;
  }, new Map());
  const familyDistribution = scored.reduce((map, item) => {
    if (item.posterFamily) map.set(item.posterFamily, (map.get(item.posterFamily) || 0) + 1);
    return map;
  }, new Map());
  const histogram = HISTOGRAM_BUCKETS.map(bucket => ({
    ...bucket,
    count: scored.filter(item => item.storyScore >= bucket.min && item.storyScore <= bucket.max).length,
  }));
  const uniqueLayouts = new Set(scored.map(item => item.variants?.[0]?.variant).filter(Boolean)).size;
  const distinctVariantCases = scored.filter(item => new Set((item.variants || []).map(variant => variant.variant)).size >= 3).length;

  return {
    rendered,
    rejected,
    skipped,
    averageStoryScore: average("storyScore"),
    averageQuality: average("qualityScore"),
    rejectionReasons: Array.from(rejectionReasons.entries()),
    familyDistribution: Array.from(familyDistribution.entries()),
    histogram,
    uniqueLayouts,
    distinctVariantCases,
  };
}

function revokeResultUrls(results) {
  results.forEach(item => {
    if (item.heroFrameUrl?.startsWith("blob:")) URL.revokeObjectURL(item.heroFrameUrl);
    if (item.finalPosterUrl?.startsWith("blob:")) URL.revokeObjectURL(item.finalPosterUrl);
    (item.variants || []).forEach(variant => {
      if (variant.url?.startsWith("blob:")) URL.revokeObjectURL(variant.url);
    });
  });
}

export default function LibraryCoverProof() {
  const [running, setRunning] = useState(false);
  const [preflighting, setPreflighting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Ready. Run pre-flight first; only READY videos enter frame extraction.");
  const [sources, setSources] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const pausedRef = useRef(false);
  const folderInputRef = useRef(null);
  const stats = useMemo(() => calculateStats(results, diagnostics), [results, diagnostics]);
  const preflightCounts = useMemo(() => aggregatePreflightDiagnostics(diagnostics), [diagnostics]);

  const resetRun = () => {
    abortRef.current?.abort();
    revokeResultUrls(results);
    setError("");
    setProgress(0);
    setResults([]);
    setDiagnostics([]);
    setSources([]);
  };

  const buildLibrarySources = async () => {
    const [videos, sourceAssets] = await Promise.all([
      base44.entities.Video.list("-published_at", 160),
      base44.entities.VideoAsset.list("-updated_date", 500),
    ]);
    return videos.slice(0, PROOF_SIZE).map(video => {
      const resolved = resolveAnalyzableVideoSource(video, sourceAssets, { mode: "analysis" });
      return {
        ...resolved,
        videoId: video.id,
        title: video.title || video.slug || "Untitled Video",
        sourceMode: "library",
      };
    });
  };

  const preflightSources = async (nextSources, label) => {
    setPreflighting(true);
    setError("");
    setProgress(0);
    abortRef.current = new AbortController();
    setSources(nextSources);
    const nextDiagnostics = [];

    try {
      for (let index = 0; index < nextSources.length; index += 1) {
        const source = nextSources[index];
        setStatus(`Pre-flight ${label} ${index + 1}/${nextSources.length}: ${source.title}`);
        const diag = await preflightAnalyzableVideoSource(source, { signal: abortRef.current.signal });
        nextDiagnostics.push({ ...diag, sourceKey: sourceKey(source), sourceMode: source.sourceMode });
        setDiagnostics([...nextDiagnostics]);
        setProgress(Math.round(((index + 1) / nextSources.length) * 100));
      }
      const counts = aggregatePreflightDiagnostics(nextDiagnostics);
      setStatus(`Pre-flight complete: ${counts.READY} READY, ${counts.PLAYABLE_ONLY} PLAYABLE_ONLY, ${counts.UNSUPPORTED_CODEC} UNSUPPORTED_CODEC, ${counts.URL_FAILED} URL_FAILED, ${counts.NO_SOURCE} NO_SOURCE, ${counts.TIMEOUT} TIMEOUT.`);
      return nextDiagnostics;
    } catch (err) {
      setError(err.name === "AbortError" ? "Pre-flight cancelled." : err.message);
      setStatus("Pre-flight stopped.");
      return nextDiagnostics;
    } finally {
      setPreflighting(false);
    }
  };

  const runLibraryPreflight = async () => {
    resetRun();
    const nextSources = await buildLibrarySources();
    await preflightSources(nextSources, "library video");
  };

  const collectDirectoryFiles = async (directoryHandle, collected = []) => {
    for await (const entry of directoryHandle.values()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        collected.push(file);
      } else if (entry.kind === "directory") {
        await collectDirectoryFiles(entry, collected);
      }
      if (collected.length >= PROOF_SIZE) break;
    }
    return collected;
  };

  const buildLocalSources = (files) => files
    .filter(isSupportedVideoFile)
    .slice(0, PROOF_SIZE)
    .map(file => ({
      videoId: file.webkitRelativePath || file.name,
      title: file.webkitRelativePath || file.name,
      url: URL.createObjectURL(file),
      redactedUrl: file.webkitRelativePath || file.name,
      selectedSourceField: "local_folder_file",
      sourceField: "local_folder_file",
      sourceType: "local_file",
      extension: getExtension(file.name),
      mimeType: file.type || "video/local",
      accessType: "local",
      browserCanPlay: "local-file",
      sourceMode: "local",
      file,
    }));

  const startLocalFolderProof = async () => {
    resetRun();
    if (window.showDirectoryPicker) {
      try {
        const directory = await window.showDirectoryPicker();
        const files = await collectDirectoryFiles(directory, []);
        const localSources = buildLocalSources(files);
        const nextDiagnostics = await preflightSources(localSources, "local file");
        await runReadyProof(localSources, nextDiagnostics);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      }
      return;
    }
    folderInputRef.current?.click();
  };

  const handleLocalFolderInput = async (event) => {
    resetRun();
    const files = Array.from(event.target.files || []);
    const localSources = buildLocalSources(files);
    const nextDiagnostics = await preflightSources(localSources, "local file");
    await runReadyProof(localSources, nextDiagnostics);
    event.target.value = "";
  };

  const runReadyProof = async (sourceList = sources, diagnosticList = diagnostics) => {
    const readyDiagnostics = diagnosticList.filter(item => item.classification === "READY");
    const completedKeys = new Set(results.filter(item => item.status === "ready").map(item => item.sourceKey));
    const readySources = sourceList.filter(source => readyDiagnostics.some(diag => diag.sourceKey === sourceKey(source)) && !completedKeys.has(sourceKey(source)));

    setRunning(true);
    setError("");
    abortRef.current = new AbortController();
    const nextResults = [...results];

    try {
      for (let index = 0; index < readySources.length; index += 1) {
        const source = readySources[index];
        const diag = readyDiagnostics.find(item => item.sourceKey === sourceKey(source));
        setStatus(`Frame extraction ${index + 1}/${readySources.length}: ${source.title}`);
        try {
          const file = source.file || { name: safeName(source.title) };
          const frames = await sampleVideoFrames({
            file,
            previewUrl: diag.metadata.previewUrl,
            metadata: diag.metadata,
            onProgress: value => setProgress(Math.round(((index + value / 100) / Math.max(readySources.length, 1)) * 100)),
            log: null,
            pausedRef,
            signal: abortRef.current.signal,
          });
          const hero = rankHeroFrames(frames, 1)[0];
          if (!hero) {
            nextResults.push({ sourceKey: sourceKey(source), ...source, status: "failed", accepted: false, error: "No hero frame passed the automatic Story Score detector.", rejectionReasons: ["No hero frame passed the automatic Story Score detector"], diagnostic: diag });
            frames.forEach(frame => URL.revokeObjectURL(frame.url));
            setResults([...nextResults]);
            continue;
          }

          const proof = await renderProofImages(hero, source);
          const bestScore = proof.plan.best?.score || {};
          nextResults.push({
            sourceKey: sourceKey(source),
            ...source,
            status: "ready",
            accepted: proof.accepted,
            heroFrameUrl: hero.url,
            storyScore: bestScore.story,
            qualityScore: bestScore.imageQuality,
            visionAnalysis: proof.plan.analysis,
            visionSummary: summarizeVision(proof.plan.analysis),
            posterFamily: proof.plan.family?.label || proof.plan.family?.id || "Unknown",
            winningReason: winningReason(proof.plan),
            variants: proof.variants,
            finalPosterUrl: proof.finalPosterUrl,
            rejectionReasons: bestScore.qualityFailures || [],
            diagnostic: diag,
          });
          frames.forEach(frame => {
            if (frame.url !== hero.url) URL.revokeObjectURL(frame.url);
          });
        } catch (renderError) {
          nextResults.push({ sourceKey: sourceKey(source), ...source, status: "failed", accepted: false, error: renderError.message, rejectionReasons: [renderError.message], diagnostic: diag });
        } finally {
          if (source.sourceMode === "local" && source.url?.startsWith("blob:")) URL.revokeObjectURL(source.url);
        }
        setResults([...nextResults]);
      }
      setProgress(100);
      setStatus(`Proof run complete for ${readySources.length} READY videos. Skipped videos remain in diagnostics with exact failure stages.`);
    } catch (err) {
      setError(err.name === "AbortError" ? "Proof run cancelled." : err.message);
      setStatus("Proof run stopped. Resume will continue with remaining READY videos.");
    } finally {
      setRunning(false);
    }
  };

  const exportDiagnostics = () => {
    const payload = {
      generated_at: new Date().toISOString(),
      preflight_counts: preflightCounts,
      proof_stats: stats,
      diagnostics: diagnostics.map(({ url, metadata, ...item }) => ({ ...item, metadata: metadata ? { duration: metadata.duration, width: metadata.width, height: metadata.height, aspectRatio: metadata.aspectRatio } : null })),
      results: results.map(item => ({
        videoId: item.videoId,
        title: item.title,
        status: item.status,
        accepted: item.accepted,
        storyScore: item.storyScore,
        qualityScore: item.qualityScore,
        posterFamily: item.posterFamily,
        winningReason: item.winningReason,
        rejectionReasons: item.rejectionReasons,
        sourceField: item.selectedSourceField,
        sourceType: item.sourceType,
        variants: (item.variants || []).map(variant => ({ label: variant.label, variant: variant.variant, score: variant.score })),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fleshlab-proof-gallery-diagnostics-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cancel = () => abortRef.current?.abort();

  return (
    <div className="space-y-4">
      <input ref={folderInputRef} type="file" accept=".mp4,.mov,.webm,.m4v,video/mp4,video/quicktime,video/webm" multiple webkitdirectory="" directory="" className="hidden" onChange={handleLocalFolderInput} />

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>Proof Gallery Source Diagnostics</span>
            <Badge variant="outline">Commercial Key Art Engine</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-card/70 p-3 text-xs text-muted-foreground">
            <p className="font-bold text-foreground">Privacy mode</p>
            <p>Local Folder Proof: file uploaded NO · processing browser local.</p>
            <p>Library Proof: existing FLESHLAB storage URL fetched YES · new upload NO · frames sent to external AI NO · processing browser local after fetch.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={startLocalFolderProof} disabled={running || preflighting}>Mode A: Local Folder Proof</Button>
            <Button variant="outline" onClick={runLibraryPreflight} disabled={running || preflighting}>Mode B: Pre-flight Library URLs</Button>
            <Button variant="secondary" onClick={() => runReadyProof()} disabled={running || preflighting || !diagnostics.some(item => item.classification === "READY")}>Run / Resume READY Proof</Button>
            {!!diagnostics.length && <Button variant="outline" onClick={exportDiagnostics}>Download Diagnostics JSON</Button>}
            {(running || preflighting) && <Button variant="destructive" onClick={cancel}>Cancel</Button>}
          </div>
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">{status}</p>
          </div>
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </CardContent>
      </Card>

      {!!diagnostics.length && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Pre-flight Counts</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {Object.entries(preflightCounts).map(([key, value]) => <Metric key={key} label={key} value={value} />)}
          </CardContent>
        </Card>
      )}

      {!!results.length && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Proof Statistics — Completed Analyses Only</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <Metric label="Rendered" value={stats.rendered} />
              <Metric label="Skipped" value={stats.skipped} />
              <Metric label="Rejected" value={stats.rejected} />
              <Metric label="Avg Story" value={stats.averageStoryScore} />
              <Metric label="Layouts" value={stats.uniqueLayouts} />
              <Metric label="Distinct A/B/C" value={stats.distinctVariantCases} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2"><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Score Distribution</p>{stats.histogram.map(bucket => <div key={bucket.label} className="flex items-center gap-2 text-xs"><span className="w-14">{bucket.label}</span><div className="h-2 flex-1 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, bucket.count)}%` }} /></div><span>{bucket.count}</span></div>)}</div>
              <ListBlock title="Rejection Reasons" items={stats.rejectionReasons} empty="None from completed analyses" />
              <ListBlock title="Poster Families" items={stats.familyDistribution} empty="None yet" />
            </div>
          </CardContent>
        </Card>
      )}

      {!!diagnostics.length && <DiagnosticsTable diagnostics={diagnostics} />}

      {!!results.length && (
        <div className="space-y-4">
          {results.map((item, index) => (
            <Card key={`${item.sourceKey}-${index}`} className="overflow-hidden">
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

function Metric({ label, value }) {
  return <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-black">{value}</p></div>;
}

function ListBlock({ title, items, empty }) {
  return <div className="space-y-2"><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>{items.length ? items.map(([label, count]) => <p key={label} className="text-xs text-muted-foreground">{count}× {label}</p>) : <p className="text-xs text-muted-foreground">{empty}</p>}</div>;
}

function DiagnosticsTable({ diagnostics }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Per-video Source Diagnostics</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[1500px] text-left text-xs">
          <thead className="text-muted-foreground"><tr>{["Class", "Video ID", "Title", "Source Field", "Source Type", "Ext", "MIME", "Access", "Metadata", "Playback", "Seek", "Draw", "Pixels", "Media Error", "CORS", "Codec", "Failure Stage"].map(head => <th key={head} className="border-b border-border p-2">{head}</th>)}</tr></thead>
          <tbody>{diagnostics.map(item => <tr key={`${item.sourceKey}-${item.selectedSourceField}`} className="border-b border-border/60"><td className="p-2 font-bold">{item.classification}</td><td className="p-2">{item.videoId}</td><td className="p-2">{item.title}</td><td className="p-2">{item.selectedSourceField}</td><td className="p-2">{item.sourceType}</td><td className="p-2">{item.extension}</td><td className="p-2">{item.mimeType || "—"}</td><td className="p-2">{item.accessType}</td><td className="p-2">{item.metadataLoaded ? "YES" : "NO"}</td><td className="p-2">{item.playbackStarted ? "YES" : "NO"}</td><td className="p-2">{item.seekingWorked ? "YES" : "NO"}</td><td className="p-2">{item.canvasDrawSucceeded ? "YES" : "NO"}</td><td className="p-2">{item.canvasPixelReadingSucceeded ? "YES" : "NO"}</td><td className="p-2">{item.browserMediaError || item.browserMediaErrorCode || "—"}</td><td className="p-2">{item.corsStatus}</td><td className="p-2">{item.codecInformation}</td><td className="p-2">{item.finalFailureStage}{item.failureMessage ? ` · ${item.failureMessage}` : ""}</td></tr>)}</tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function ProofImage({ label, url, error }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      {url ? <img src={url} alt={label} className="aspect-video w-full rounded-lg border border-border bg-black object-cover" /> : <div className="flex aspect-video items-center justify-center rounded-lg border border-border bg-black p-2 text-center text-[10px] text-destructive">{error || "Not rendered"}</div>}
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