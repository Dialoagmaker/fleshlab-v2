import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { sampleVideoFrames, rankHeroFrames } from "@/lib/aiMediaStudio/localAnalyzer";
import { DEFAULT_COVER_SETTINGS, renderCoverToCanvas } from "@/lib/aiMediaStudio/coverRenderer";

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
    base44.entities.Video.list("-published_at", 80),
    base44.entities.VideoAsset.filter({ asset_type: "source" }, "-updated_date", 120),
  ]);
  const assetByVideo = new Map(sourceAssets.filter(asset => asset.cdn_url).map(asset => [asset.video_id, asset.cdn_url]));
  return videos
    .map(video => ({
      id: video.id,
      title: video.title || video.slug || "Untitled Video",
      url: video.source_video_url || assetByVideo.get(video.id) || video.trailer_url,
    }))
    .filter(item => item.url)
    .slice(0, 10);
}

export default function LibraryCoverProof() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Ready to run automatic 10-cover proof from the existing library.");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const pausedRef = useRef(false);

  const runProof = async () => {
    setRunning(true);
    setError("");
    setResults([]);
    setProgress(0);
    abortRef.current = new AbortController();

    try {
      setStatus("Loading existing library videos…");
      const candidates = await buildLibraryCandidates();
      if (candidates.length < 10) throw new Error(`Only ${candidates.length} usable library videos were found with playable source URLs.`);

      const nextResults = [];
      for (let index = 0; index < candidates.length; index += 1) {
        const video = candidates[index];
        setStatus(`Analyzing ${index + 1}/10: ${video.title}`);
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
          nextResults.push({ ...video, status: "failed", error: "No premium hero frame passed the automatic detector." });
          setResults([...nextResults]);
          continue;
        }

        try {
          const canvas = document.createElement("canvas");
          await renderCoverToCanvas(canvas, hero.blob, { performerName: "", videoTitle: video.title, optionalSubtitle: "" }, DEFAULT_COVER_SETTINGS);
          const coverUrl = canvas.toDataURL("image/jpeg", 0.9);
          nextResults.push({ ...video, status: "ready", coverUrl, hero });
        } catch (renderError) {
          nextResults.push({ ...video, status: "failed", error: renderError.message, hero });
        }
        setResults([...nextResults]);
      }
      setProgress(100);
      setStatus("10-video automatic cover proof complete.");
    } catch (err) {
      setError(err.name === "AbortError" ? "Proof run cancelled." : err.message);
      setStatus("Proof run stopped.");
    } finally {
      setRunning(false);
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  const failedCount = results.filter(item => item.status === "failed").length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>Automatic Library Cover Proof</span>
            <Badge variant="outline">No manual frame selection</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Runs the v2 poster-frame detector against 10 existing library videos, then renders each cover through the image-aware cinematic poster engine.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={runProof} disabled={running}>{running ? "Running proof…" : "Generate 10 Library Covers"}</Button>
            {running && <Button variant="outline" onClick={cancel}>Cancel</Button>}
          </div>
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">{status}</p>
          </div>
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          {!!results.length && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{results.length}/10 processed · {failedCount} failed detector checks</p>}
        </CardContent>
      </Card>

      {!!results.length && (
        <div className="grid gap-4 lg:grid-cols-2">
          {results.map((item, index) => (
            <Card key={`${item.id}-${index}`} className="overflow-hidden">
              {item.coverUrl ? <img src={item.coverUrl} alt={`${item.title} generated FLESHLAB cover`} className="w-full bg-black" /> : <div className="flex aspect-video items-center justify-center bg-black p-6 text-center text-sm text-destructive">{item.error}</div>}
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-foreground">{index + 1}. {item.title}</h3>
                  <Badge variant={item.status === "ready" ? "outline" : "destructive"}>{item.status === "ready" ? "Passed" : "Failed"}</Badge>
                </div>
                {item.hero && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                    <span>Score {item.hero.hero?.posterScore || item.hero.hero?.score}</span>
                    <span>Subject {Math.round((item.hero.hero?.subjectDominance || 0) * 100)}%</span>
                    <span>Space {Math.round((item.hero.hero?.negativeSpaceScore || 0) * 100)}%</span>
                    <span>X {item.hero.hero?.centroidX} / Y {item.hero.hero?.centroidY}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}