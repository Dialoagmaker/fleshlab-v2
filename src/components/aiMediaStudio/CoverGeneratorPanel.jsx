import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CoverFramePicker from "./CoverFramePicker";
import CoverMetadataForm from "./CoverMetadataForm";
import OpenRouterCoverMode from "./OpenRouterCoverMode";
import CoverPreviewEditor from "./CoverPreviewEditor";
import CreativeAcademyPanel from "./CreativeAcademyPanel";
import { DEFAULT_COVER_SETTINGS } from "@/lib/aiMediaStudio/coverRenderer";
import { selectAdvertisingHeroFrames } from "@/lib/aiMediaStudio/advertisingPhotographer";
import { selectStrongestIdentityReferenceFrame } from "@/lib/aiMediaStudio/imageIdentityValidation";

export default function CoverGeneratorPanel({ item }) {
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(null);
  const [metadata, setMetadata] = useState({
    videoTitle: item?.name || item?.title || "",
    optionalSubtitle: "",
    performerName: "",
    seriesName: "",
    contentType: "Promotional cover",
    campaignName: "",
  });
  const [settings] = useState({ ...DEFAULT_COVER_SETTINGS, manualOverrides: {} });
  const heroCandidates = useMemo(() => selectAdvertisingHeroFrames(item?.frames || [], 20), [item?.frames]);
  const identityReference = useMemo(() => selectStrongestIdentityReferenceFrame(item?.frames || []), [item?.frames]);
  const titleReady = Boolean(metadata.videoTitle?.trim());
  const bestIndex = heroCandidates[0]?.index ?? (item?.frames || [])[0]?.index ?? null;
  const actualIndex = selectedFrameIndex ?? bestIndex;
  const frame = (item?.frames || []).find(candidate => candidate.index === actualIndex);
  const creativeReady = titleReady && Boolean(frame);

  if (!item?.analysis) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center justify-between gap-3 text-sm">Creative Studio <Badge variant="outline">Needs analyzed video</Badge></CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Analyze a video first, then enter editorial information before creating the hero image.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <CreativeAcademyPanel />

      <Card>
        <CardHeader><CardTitle className="text-sm">1. Videoinformationen eingeben</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <CoverMetadataForm metadata={metadata} onChange={setMetadata} />
          {!titleReady && <p className="text-xs font-semibold text-destructive">Video Title is required before the Creative Director can begin.</p>}
        </CardContent>
      </Card>

      <Card className={!titleReady ? "opacity-60" : ""}>
        <CardHeader><CardTitle className="text-sm">2. Frame auswählen</CardTitle></CardHeader>
        <CardContent><CoverFramePicker frames={item.frames} selectedIndex={actualIndex} disabled={!titleReady} onSelect={setSelectedFrameIndex} onBestFrame={setSelectedFrameIndex} /></CardContent>
      </Card>

      {creativeReady ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3 text-sm">
                3. Editorial Art Direction Engine
                <Badge variant="outline">AI not required</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CoverPreviewEditor frame={frame} metadata={{ ...metadata, lockUserText: true, aiReconstructed: false }} settings={settings} fileSuffix="editorial-cover" />
            </CardContent>
          </Card>
          <OpenRouterCoverMode frame={frame} identityReferenceFrame={identityReference?.frame || null} metadata={{ ...metadata, lockUserText: true }} settings={settings} />
        </>
      ) : (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Enter the video title and choose a story frame to create the editorial cover.</CardContent></Card>
      )}
    </div>
  );
}