import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocalOnlyNotice from "@/components/aiMediaStudio/LocalOnlyNotice";
import LocalVideoPicker from "@/components/aiMediaStudio/LocalVideoPicker";
import PipelineOverview from "@/components/aiMediaStudio/PipelineOverview";
import AnalysisQueue from "@/components/aiMediaStudio/AnalysisQueue";
import SmartReviewPanel from "@/components/aiMediaStudio/SmartReviewPanel";
import { createLocalAnalysis } from "@/lib/aiMediaStudio/localAnalyzer";

async function readVideoMetadata(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const metadata = { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
      URL.revokeObjectURL(url);
      resolve(metadata);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    video.src = url;
  });
}

export default function AIMediaStudio() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [processing, setProcessing] = useState(false);

  const selected = useMemo(() => items.find(item => item.id === selectedId), [items, selectedId]);

  const handlePickFiles = async (files) => {
    const videos = files.filter(file => file.type.startsWith("video/") || file.name.toLowerCase().endsWith(".mp4"));
    if (!videos.length) return;
    setProcessing(true);
    const analyzed = [];
    for (const file of videos) {
      const metadata = await readVideoMetadata(file);
      analyzed.push({ id: `${file.name}-${file.size}-${file.lastModified}`, fileName: file.name, fileSize: file.size, analysis: createLocalAnalysis(file, metadata) });
    }
    setItems(analyzed);
    setSelectedId(analyzed[0]?.id || null);
    localStorage.setItem("fleshlab_ai_media_studio_last_project", JSON.stringify(analyzed.map(({ id, fileName, fileSize, analysis }) => ({ id, fileName, fileSize, analysis }))));
    setProcessing(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">FLESHLAB AI Media Studio</p>
        <h1 className="mt-2 text-3xl font-black text-foreground">Offline AI media workflow</h1>
        <p className="mt-2 max-w-4xl text-muted-foreground">
          A desktop-first local pipeline for analyzing MP4 files and preparing trailers, covers, screenshots, GIFs, shorts and marketing metadata without cloud processing.
        </p>
      </div>

      <LocalOnlyNotice />
      <LocalVideoPicker processing={processing} onPickFiles={handlePickFiles} onPause={() => setProcessing(false)} />

      <Tabs defaultValue="review" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 md:w-[520px]">
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="outputs">Outputs</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader><CardTitle className="text-sm">Local Batch Queue</CardTitle></CardHeader>
            <CardContent><AnalysisQueue items={items} selectedId={selectedId} onSelect={setSelectedId} /></CardContent>
          </Card>
          <SmartReviewPanel analysis={selected?.analysis} />
        </TabsContent>

        <TabsContent value="pipeline"><PipelineOverview /></TabsContent>

        <TabsContent value="outputs">
          <Card>
            <CardHeader><CardTitle>Automatic Output Plan</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(selected?.analysis?.outputs || ["10/15/30/60/90 second trailers", "Top screenshots", "Thumbnail candidates", "GIF previews", "Vertical shorts", "Cover layouts"]).map(output => (
                <div key={output} className="rounded-xl border border-border bg-muted/30 p-4 text-sm font-semibold text-foreground">{output}</div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}