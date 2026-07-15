import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CoverAdjustmentControls from "./CoverAdjustmentControls";
import CoverFramePicker from "./CoverFramePicker";
import CoverMetadataForm from "./CoverMetadataForm";
import CoverPresetControls from "./CoverPresetControls";
import CoverPreviewEditor from "./CoverPreviewEditor";
import { DEFAULT_COVER_SETTINGS } from "@/lib/aiMediaStudio/coverRenderer";
import { rankScreenshots } from "@/lib/aiMediaStudio/localAnalyzer";

export default function CoverGeneratorPanel({ item }) {
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(null);
  const [metadata, setMetadata] = useState({ performerName: "", videoTitle: item?.fileName?.replace(/\.[^/.]+$/, "") || "", optionalSubtitle: "", contentType: "", campaignName: "" });
  const [settings, setSettings] = useState(DEFAULT_COVER_SETTINGS);
  const bestIndex = useMemo(() => rankScreenshots(item?.frames || [], 1)[0]?.index ?? null, [item?.frames]);
  const actualIndex = selectedFrameIndex ?? bestIndex;
  const frame = (item?.frames || []).find(candidate => candidate.index === actualIndex);

  if (!item?.analysis) return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Analyze a video first. Covers are generated only from real frames extracted from the selected local file.</div>;

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle className="flex items-center justify-between gap-3 text-sm">Local cover generator <Badge variant="outline">No upload · No external image API</Badge></CardTitle></CardHeader><CardContent className="space-y-5"><CoverFramePicker frames={item.frames} selectedIndex={actualIndex} onSelect={setSelectedFrameIndex} onBestFrame={setSelectedFrameIndex} /><CoverMetadataForm metadata={metadata} onChange={setMetadata} /><CoverPresetControls settings={settings} onChange={setSettings} /><CoverAdjustmentControls settings={settings} onChange={setSettings} /></CardContent></Card>
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card><CardContent className="p-4"><CoverPreviewEditor frame={frame} metadata={metadata} settings={settings} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Future local generative mode</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>Defined for a future Local Desktop Worker only: background extension, relighting, restoration, controlled stylization, and wider compositions.</p><p>No external generation API is used here, and no frame leaves the computer.</p></CardContent></Card>
      </div>
    </div>
  );
}