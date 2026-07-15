import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CoverAdjustmentControls from "./CoverAdjustmentControls";
import CoverFramePicker from "./CoverFramePicker";
import CoverMetadataForm from "./CoverMetadataForm";
import CoverPresetControls from "./CoverPresetControls";
import CoverVariantCompare from "./CoverVariantCompare";
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

  if (!item?.analysis) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-sm">
              CI cover preview
              <Badge variant="outline">Demo frame</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Preview only — analyze a video to replace this placeholder with a real extracted frame.</p>
          </CardContent>
        </Card>
        <CoverVariantCompare frame={{ demo: true }} metadata={{ ...metadata, videoTitle: "The Bareback Hotel", contentType: "FLESHLAB ORIGINAL" }} settings={settings} itemFileName="the-bareback-hotel.mp4" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle className="flex items-center justify-between gap-3 text-sm">Cover generation mode <Badge variant="outline">Video stays local</Badge></CardTitle></CardHeader><CardContent className="space-y-5"><div className="grid gap-2 sm:grid-cols-2"><Button variant={coverMode === "local" ? "default" : "outline"} onClick={() => setCoverMode("local")}>Local Template Cover</Button><Button variant={coverMode === "openrouter" ? "default" : "outline"} onClick={() => setCoverMode("openrouter")}>OpenRouter Frame Enhancement</Button></div><CoverFramePicker frames={item.frames} selectedIndex={actualIndex} onSelect={setSelectedFrameIndex} onBestFrame={setSelectedFrameIndex} /><CoverMetadataForm metadata={metadata} onChange={setMetadata} /><CoverPresetControls settings={settings} onChange={setSettings} /><CoverAdjustmentControls settings={settings} onChange={setSettings} /></CardContent></Card>
      {!frame ? <Card><CardContent className="p-6 text-sm font-semibold text-destructive">No suitable hero frame found</CardContent></Card> : coverMode === "local" ? <CoverVariantCompare frame={frame} metadata={metadata} settings={settings} itemFileName={item?.fileName} /> : <OpenRouterCoverMode frame={frame} metadata={metadata} settings={settings} />}
    </div>
  );
}