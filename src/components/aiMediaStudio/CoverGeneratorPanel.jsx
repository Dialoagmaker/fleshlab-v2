import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CoverAdjustmentControls from "./CoverAdjustmentControls";
import CoverFramePicker from "./CoverFramePicker";
import CoverMetadataForm from "./CoverMetadataForm";
import CoverPresetControls from "./CoverPresetControls";
import CoverVariantCompare from "./CoverVariantCompare";
import CoverV3Mode from "./CoverV3Mode";
import OpenRouterCoverMode from "./OpenRouterCoverMode";
import { DEFAULT_COVER_SETTINGS } from "@/lib/aiMediaStudio/coverRenderer";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { selectAdvertisingHeroFrames } from "@/lib/aiMediaStudio/advertisingPhotographer";

function markManual(settings, patch) {
  return {
    ...settings,
    ...patch,
    manualOverrides: {
      ...(settings.manualOverrides || {}),
      ...Object.keys(patch).reduce((map, key) => ({ ...map, [key]: true }), {}),
    },
  };
}

export default function CoverGeneratorPanel({ item }) {
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(null);
  const [metadata, setMetadata] = useState({ performerName: "", videoTitle: "", optionalSubtitle: "", contentType: "", campaignName: "" });
  const [settings, setSettings] = useState({ ...DEFAULT_COVER_SETTINGS, manualOverrides: {} });
  const updateSettings = (patch) => setSettings(current => markManual(current, patch));
  const resetSettings = () => setSettings({ ...DEFAULT_COVER_SETTINGS, manualOverrides: {} });
  const [coverMode, setCoverMode] = useState("v3");
  const [generationStarted, setGenerationStarted] = useState(false);
  const heroCandidates = useMemo(() => selectAdvertisingHeroFrames(item?.frames || [], 12), [item?.frames]);
  const bestIndex = heroCandidates[0]?.index ?? null;
  const actualIndex = selectedFrameIndex ?? bestIndex;
  const frame = heroCandidates.find(candidate => candidate.index === actualIndex);

  const generateAutomaticCover = () => {
    const savedCampaign = JSON.parse(localStorage.getItem("fleshlab_hotel_sessions_latest_campaign") || "null");
    const consensus = savedCampaign?.consensus;
    setMetadata(current => ({
      ...current,
      videoTitle: current.videoTitle || "",
      optionalSubtitle: current.optionalSubtitle || "",
      contentType: current.contentType || "",
      campaignName: current.campaignName || "",
      campaignConsensus: consensus || current.campaignConsensus,
    }));
    setSelectedFrameIndex(bestIndex);
    setCoverMode("v3");
    setGenerationStarted(true);
  };

  if (!item?.analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 text-sm">
            Emotional Commercial Potential Engine
            <Badge variant="outline">Needs real frame</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Analyze a video first. The Advertising Photographer searches for a frame with campaign-photography potential before any design or typography starts.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle className="flex items-center justify-between gap-3 text-sm">Production cover workflow <Badge variant="outline">Advertising Photographer v4</Badge></CardTitle></CardHeader><CardContent className="space-y-5"><Button onClick={generateAutomaticCover} disabled={!frame} className="h-12 w-full gap-2 text-sm font-black md:w-auto"><Sparkles className="h-4 w-4" />Generate Automatic Cover</Button><div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">v4 first rejects screenshot-looking frames, then reconstructs the selected hero image before Creative Director, Art Director, typography, and final commercial validation run.</div><div className="grid gap-2 lg:grid-cols-3"><Button variant={coverMode === "v3" ? "default" : "outline"} onClick={() => { setCoverMode("v3"); setGenerationStarted(true); }}>Automatic Key Art v3</Button><Button variant={coverMode === "local" ? "default" : "outline"} onClick={() => { setCoverMode("local"); setGenerationStarted(true); }}>Cinematic Poster Engine v2</Button><Button variant={coverMode === "openrouter" ? "default" : "outline"} onClick={() => { setCoverMode("openrouter"); setGenerationStarted(true); }}>OpenRouter Still Enhancement</Button></div><CoverFramePicker frames={item.frames} selectedIndex={actualIndex} onSelect={setSelectedFrameIndex} onBestFrame={setSelectedFrameIndex} /><CoverMetadataForm metadata={metadata} onChange={setMetadata} /><CoverPresetControls settings={settings} onChange={updateSettings} /><CoverAdjustmentControls settings={settings} onChange={updateSettings} onReset={resetSettings} /></CardContent></Card>
      {!frame ? <Card><CardContent className="p-6 text-sm font-semibold text-destructive">No frame passed Advertising Photographer validation. The video still reads as screenshot material; try a stronger scene before rendering.</CardContent></Card> : !generationStarted ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Click Generate Automatic Cover to create production key art from this analyzed video.</CardContent></Card> : coverMode === "v3" ? <CoverV3Mode frame={frame} metadata={metadata} settings={settings} itemFileName={item?.fileName} onUseFallback={() => setCoverMode("local")} /> : coverMode === "local" ? <CoverVariantCompare frame={frame} candidateFrames={heroCandidates} metadata={metadata} settings={settings} itemFileName={item?.fileName} /> : <OpenRouterCoverMode frame={frame} metadata={metadata} settings={settings} />}
    </div>
  );
}