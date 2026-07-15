import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CoverPreviewEditor from "./CoverPreviewEditor";

const MASTER_SETTINGS = {
  presetId: "cinematic",
  zoom: 1.22,
  x: 0,
  y: 0,
  brightness: 102,
  contrast: 114,
  saturation: 106,
  titleSize: 190,
  subtitleSize: 130,
  titleY: 52,
  gradientStrength: 90,
  borderTexture: 42,
  showSafeMargins: false,
  sellingPoints: "REAL MOMENTS\nRAW & AUTHENTIC\nEXCLUSIVE CONTENT",
};

export default function CoverVariantCompare({ frame, metadata, settings, itemFileName }) {
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
          <Badge variant="outline">One locked identity</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Fixed studio layout: real performer hero, cinematic left panel, official logo, title, subtitle, footer.
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <CoverPreviewEditor
          frame={frame}
          metadata={effectiveMetadata}
          settings={{ ...settings, ...MASTER_SETTINGS, variantId: "fleshlab-master" }}
          fileSuffix="fleshlab-master"
        />
      </CardContent>
    </Card>
  );
}