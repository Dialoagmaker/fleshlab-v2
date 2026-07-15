import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CoverPreviewEditor from "./CoverPreviewEditor";

export default function CoverVariantCompare({ frame, candidateFrames = [], metadata, settings, itemFileName }) {
  const fileTitle = itemFileName?.replace(/\.[^/.]+$/, "") || "";
  const effectiveMetadata = {
    ...metadata,
    videoTitle: metadata.videoTitle || fileTitle || "KRAKEN INTO THE WILD",
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">FLESHLAB Master Cover</CardTitle>
          <Badge variant="outline">Poster Engine v2</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Image-aware composition: poster-frame analysis, adaptive crop, dynamic text area, ranked variants and quality-gated export.
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <CoverPreviewEditor
          frame={frame}
          candidateFrames={candidateFrames}
          metadata={effectiveMetadata}
          settings={settings}
          fileSuffix="fleshlab-master"
        />
      </CardContent>
    </Card>
  );
}