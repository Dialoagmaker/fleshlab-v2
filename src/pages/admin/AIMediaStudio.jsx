import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocalOnlyNotice from "@/components/aiMediaStudio/LocalOnlyNotice";
import LocalVideoPicker from "@/components/aiMediaStudio/LocalVideoPicker";
import AnalysisQueue from "@/components/aiMediaStudio/AnalysisQueue";
import SmartReviewPanel from "@/components/aiMediaStudio/SmartReviewPanel";
import OutputFilesPanel from "@/components/aiMediaStudio/OutputFilesPanel";
import ProcessingLog from "@/components/aiMediaStudio/ProcessingLog";
import PrivacyVerification from "@/components/aiMediaStudio/PrivacyVerification";
import CoverGeneratorPanel from "@/components/aiMediaStudio/CoverGeneratorPanel";
import LibraryCoverProof from "@/components/aiMediaStudio/LibraryCoverProof";
import HotelSessionsCampaignV1 from "@/components/aiMediaStudio/campaignV1/HotelSessionsCampaignV1";
import { createOutputs, createTeaserFromFrames, detectScenes, isSupportedVideoFile, loadVideoMetadata, sampleVideoFrames } from "@/lib/aiMediaStudio/localAnalyzer";
import { installLocalMediaPrivacyGuard } from "@/lib/aiMediaStudio/privacyGuard";
import { base44 } from "@/api/base44Client";

export default function AIMediaStudio() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const pausedRef = useRef(false);
  const abortRef = useRef(null);

  const log = (message) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${message}`]);
  const selected = items.find(item => item.id === selectedId);

  useEffect(() => {
    installLocalMediaPrivacyGuard(log, base44);
    if (!window.VideoDecoder) log("WebCodecs unavailable; using HTMLVideoElement and Canvas fallback");
    return () => abortRef.current?.abort();
  }, []);

  const updateItem = (id, patch) => setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));

  const analyzeFile = async (file) => {
    if (!isSupportedVideoFile(file)) throw new Error("Unsupported format. Use MP4, MOV, WebM or M4V.");
    const id = `${file.name}-${file.size}-${file.lastModified}`;
    setItems([{ id, fileName: file.name, fileSize: file.size, status: "selected", statusLabel: "Not analyzed yet" }]);
    setSelectedId(id);
    log(`file selected: ${file.name}`);
    const metadata = await loadVideoMetadata(file, log);
    updateItem(id, { metadata, previewUrl: metadata.previewUrl, status: "metadata", statusLabel: "Metadata loaded" });
    const frames = await sampleVideoFrames({ file, previewUrl: metadata.previewUrl, metadata, onProgress: setProgress, log, pausedRef, signal: abortRef.current.signal });
    const scenes = detectScenes(frames, metadata.duration, log);
    const outputs = await createOutputs({ file, frames, scenes, log });
    updateItem(id, { status: "outputs_ready", statusLabel: "Outputs ready", analysis: true, frames, scenes, outputs });
    try {
      const teasers = await createTeaserFromFrames({ file, frames, scenes, log, onProgress: setProgress });
      updateItem(id, { status: "analyzed", statusLabel: "Analyzed", teasers, teaser: teasers[0], teaserError: "" });
    } catch (teaserError) {
      log(`teaser unavailable: ${teaserError.message}`);
      updateItem(id, { status: "analyzed", statusLabel: "Analyzed, teaser unavailable", teaserError: teaserError.message });
    }
    setProgress(100);
  };

  const handlePickFiles = async (files) => {
    const file = files[0];
    if (!file) return;
    const currentId = `${file.name}-${file.size}-${file.lastModified}`;
    setError("");
    setLogs([]);
    setProgress(0);
    setProcessing(true);
    setPaused(false);
    pausedRef.current = false;
    abortRef.current = new AbortController();
    try {
      await analyzeFile(file);
    } catch (err) {
      const message = err.name === "AbortError" ? "processing cancelled" : err.message;
      setError(message);
      log(`failed or cancelled: ${message}`);
      setItems(prev => prev.map(item => item.id === currentId ? { ...item, status: "failed", statusLabel: "Failed" } : item));
    } finally {
      setProcessing(false);
      setPaused(false);
      pausedRef.current = false;
    }
  };

  const handlePauseResume = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    log(next ? "processing paused" : "processing resumed");
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    log("processing cancelled");
  };

  const outputCount = (selected?.outputs?.length || 0) + (selected?.teasers?.length || (selected?.teaser ? 1 : 0));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">FLESHLAB AI Media Studio</p>
        <h1 className="mt-2 text-3xl font-black text-foreground">Local browser media analysis</h1>
        <p className="mt-2 max-w-4xl text-muted-foreground">This page analyzes selected local video files in the browser only. No completed analysis is restored after refresh.</p>
      </div>

      <LocalOnlyNotice />
      <LocalVideoPicker processing={processing} paused={paused} progress={progress} onPickFiles={handlePickFiles} onPauseResume={handlePauseResume} onCancel={handleCancel} />
      {error && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <PrivacyVerification outputCount={outputCount} />

      <Tabs defaultValue="review" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 md:w-[980px] md:grid-cols-6"><TabsTrigger value="review">Review</TabsTrigger><TabsTrigger value="campaign">Campaign V1</TabsTrigger><TabsTrigger value="outputs">Outputs</TabsTrigger><TabsTrigger value="covers">Covers</TabsTrigger><TabsTrigger value="proof">Proof Gallery</TabsTrigger><TabsTrigger value="log">Log</TabsTrigger></TabsList>
        <TabsContent value="review" className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card><CardHeader><CardTitle className="text-sm">Local Queue</CardTitle></CardHeader><CardContent><AnalysisQueue items={items} selectedId={selectedId} onSelect={setSelectedId} /></CardContent></Card>
          <SmartReviewPanel item={selected} />
        </TabsContent>
        <TabsContent value="campaign"><HotelSessionsCampaignV1 item={selected} /></TabsContent>
        <TabsContent value="outputs"><OutputFilesPanel outputs={selected?.outputs || []} teasers={selected?.teasers || (selected?.teaser ? [selected.teaser] : [])} /></TabsContent>
        <TabsContent value="covers"><CoverGeneratorPanel item={selected} /></TabsContent>
        <TabsContent value="proof"><LibraryCoverProof /></TabsContent>
        <TabsContent value="log"><ProcessingLog entries={logs} /></TabsContent>
      </Tabs>
    </div>
  );
}