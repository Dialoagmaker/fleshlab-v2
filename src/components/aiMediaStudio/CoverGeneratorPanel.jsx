import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CoverAdjustmentControls from "./CoverAdjustmentControls";
import CoverFramePicker from "./CoverFramePicker";
import CoverMetadataForm from "./CoverMetadataForm";
import CoverPresetControls from "./CoverPresetControls";
import OpenRouterCoverMode from "./OpenRouterCoverMode";
import { DEFAULT_COVER_SETTINGS } from "@/lib/aiMediaStudio/coverRenderer";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { selectAdvertisingHeroFrames } from "@/lib/aiMediaStudio/advertisingPhotographer";
import { selectStrongestIdentityReferenceFrame } from "@/lib/aiMediaStudio/imageIdentityValidation";

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
  const [lockedHeroFrame, setLockedHeroFrame] = useState(true);
  const [lockUserText, setLockUserText] = useState(true);
  const [rejectedFrameIndexes, setRejectedFrameIndexes] = useState([]);
  const [favoriteFrameIndexes, setFavoriteFrameIndexes] = useState([]);
  const [compareFrameIndexes, setCompareFrameIndexes] = useState([]);
  const [metadata, setMetadata] = useState({ performerName: "", videoTitle: "", optionalSubtitle: "", contentType: "", campaignName: "" });
  const [settings, setSettings] = useState({ ...DEFAULT_COVER_SETTINGS, manualOverrides: {} });
  const updateSettings = (patch) => setSettings(current => markManual(current, patch));
  const resetSettings = () => setSettings({ ...DEFAULT_COVER_SETTINGS, manualOverrides: {} });
  const [generationStarted, setGenerationStarted] = useState(false);
  const heroCandidates = useMemo(() => selectAdvertisingHeroFrames(item?.frames || [], 20).filter(frame => !rejectedFrameIndexes.includes(frame.index)), [item?.frames, rejectedFrameIndexes]);
  const identityReference = useMemo(() => selectStrongestIdentityReferenceFrame(item?.frames || []), [item?.frames]);
  const identityReferenceFrame = identityReference?.frame || null;
  const bestIndex = heroCandidates[0]?.index ?? (item?.frames || []).find(frame => !rejectedFrameIndexes.includes(frame.index))?.index ?? null;
  const actualIndex = selectedFrameIndex !== null && !rejectedFrameIndexes.includes(selectedFrameIndex) ? selectedFrameIndex : bestIndex;
  const frame = (item?.frames || []).find(candidate => candidate.index === actualIndex);
  const compareFrames = compareFrameIndexes.map(index => (item?.frames || []).find(candidate => candidate.index === index)).filter(Boolean).slice(0, 4);

  const lockAndGenerateFromFrame = (index) => {
    setSelectedFrameIndex(index);
    setLockedHeroFrame(true);
    setGenerationStarted(false);
  };

  const rejectFrame = (index) => {
    setRejectedFrameIndexes(current => current.includes(index) ? current : [...current, index]);
    setFavoriteFrameIndexes(current => current.filter(itemIndex => itemIndex !== index));
    setCompareFrameIndexes(current => current.filter(itemIndex => itemIndex !== index));
    if (selectedFrameIndex === index) setSelectedFrameIndex(null);
  };

  const toggleFavorite = (index) => setFavoriteFrameIndexes(current => current.includes(index) ? current.filter(itemIndex => itemIndex !== index) : [...current, index]);
  const toggleCompare = (index) => setCompareFrameIndexes(current => current.includes(index) ? current.filter(itemIndex => itemIndex !== index) : current.length >= 4 ? current : [...current, index]);
  const rendererMetadata = { ...metadata, lockUserText };

  const startAiPhotographer = () => {
    lockAndGenerateFromFrame(bestIndex);
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
      <Card><CardHeader><CardTitle className="flex items-center justify-between gap-3 text-sm">FLESHLAB AI Photographer workflow <Badge variant="outline">Photo first</Badge></CardTitle></CardHeader><CardContent className="space-y-5"><Button onClick={startAiPhotographer} disabled={bestIndex === null} className="h-12 w-full gap-2 text-sm font-black md:w-auto"><Sparkles className="h-4 w-4" />Start AI Photographer</Button><div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">The selected frame now serves only as moment reference. FLESHLAB generates a professional hero photograph first, then applies typography and branding after approval.</div><CoverFramePicker frames={item.frames} selectedIndex={actualIndex} identityReferenceIndex={identityReferenceFrame?.index} rejectedIndexes={rejectedFrameIndexes} favoriteIndexes={favoriteFrameIndexes} compareIndexes={compareFrameIndexes} lockedHero={lockedHeroFrame} onSelect={lockAndGenerateFromFrame} onBestFrame={lockAndGenerateFromFrame} onReject={rejectFrame} onToggleFavorite={toggleFavorite} onToggleCompare={toggleCompare} onToggleLock={setLockedHeroFrame} /><CoverMetadataForm metadata={metadata} onChange={setMetadata} lockUserText={lockUserText} onLockUserTextChange={setLockUserText} /><CoverPresetControls settings={settings} onChange={updateSettings} /><CoverAdjustmentControls settings={settings} onChange={updateSettings} onReset={resetSettings} /></CardContent></Card>
      {!frame ? <Card><CardContent className="p-6 text-sm font-semibold text-destructive">No available moment is selected. Choose a ranked frame for the AI Photographer.</CardContent></Card> : generationStarted ? <OpenRouterCoverMode frame={frame} identityReferenceFrame={identityReferenceFrame} metadata={rendererMetadata} settings={settings} /> : <Card><CardContent className="p-6 text-sm text-muted-foreground">Select a moment and start the AI Photographer. Smartphone-frame decoration is no longer a production export path.</CardContent></Card>}
    </div>
  );
}