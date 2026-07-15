import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CoverAdjustmentControls from "./CoverAdjustmentControls";
import CoverFramePicker from "./CoverFramePicker";
import CoverMetadataForm from "./CoverMetadataForm";
import CoverPresetControls from "./CoverPresetControls";
import CoverPreviewEditor from "./CoverPreviewEditor";
import OpenRouterCoverMode from "./OpenRouterCoverMode";
import { DEFAULT_COVER_SETTINGS } from "@/lib/aiMediaStudio/coverRenderer";
import { Button } from "@/components/ui/button";
import { rankHeroFrames } from "@/lib/aiMediaStudio/localAnalyzer";

export default function CoverGeneratorPanel({ item }) {
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(null);
  const [metadata, setMetadata] = useState({ performerName: "", videoTitle: item?.fileName?.replace(/\.[^/.]+$/, "") || "", optionalSubtitle: "", contentType: "", campaignName: "" });
  const [settings, setSettings] = useState(DEFAULT_COVER_SETTINGS);
  const [coverMode, setCoverMode] = useState("local");
  const heroCandidates = useMemo(() => rankHeroFrames(item?.frames || [], 12), [item?.frames]);
  const bestIndex = heroCandidates[0]?.index ?? null;
  const actualIndex = selectedFrameIndex ?? bestIndex;
  const frame = heroCandidates.find(candidate => candidate.index === actualIndex);

  if (!item?.analysis) return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Analyze a video first. Covers are generated only from real frames extracted from the selected local file.</div>;

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle className="flex items-center justify-between gap-3 text-sm">Cover generation mode <Badge variant="outline">Video stays local</Badge></CardTitle></CardHeader><CardContent className="space-y-5"><div className="grid gap-2 sm:grid-cols-2"><Button variant={coverMode === "local" ? "default" : "outline"} onClick={() => setCoverMode("local")}>Local Template Cover</Button><Button variant={coverMode === "openrouter" ? "default" : "outline"} onClick={() => setCoverMode("openrouter")}>OpenRouter AI Cover</Button></div><CoverFramePicker frames={item.frames} selectedIndex={actualIndex} onSelect={setSelectedFrameIndex} onBestFrame={setSelectedFrameIndex} /><CoverMetadataForm metadata={metadata} onChange={setMetadata} /><CoverPresetControls settings={settings} onChange={setSettings} /><CoverAdjustmentControls settings={settings} onChange={setSettings} /></CardContent></Card>
      {!frame ? <Card><CardContent className="p-6 text-sm font-semibold text-destructive">No suitable hero frame found</CardContent></Card> : coverMode === "local" ? <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card><CardContent className="p-4"><CoverPreviewEditor frame={frame} metadata={metadata} settings={settings} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Future local generative mode</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>Defined for a future Local Desktop Worker only: background extension, relighting, restoration, controlled stylization, and wider compositions.</p><p>No external generation API is used here, and no frame leaves the computer.</p></CardContent></Card>
      </div> : <OpenRouterCoverMode frame={frame} metadata={metadata} settings={settings} />}
    </div>
  );
}