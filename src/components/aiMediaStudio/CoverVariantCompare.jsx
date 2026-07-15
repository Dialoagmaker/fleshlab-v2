import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CoverPreviewEditor from "./CoverPreviewEditor";

const VARIANTS = [
  {
    id: "ci-poster",
    label: "Version 1",
    description: "Classic left-title FLESHLAB poster",
    settings: {
      presetId: "cinematic",
      zoom: 1.08,
      x: 0,
      y: 0,
      brightness: 98,
      contrast: 116,
      saturation: 104,
      titleSize: 126,
      subtitleSize: 58,
      titleY: 43,
      gradientStrength: 84,
      borderTexture: 88,
      sellingPoints: "RAW & AUTHENTIC\nCINEMATIC CUT\nAMATEUR WINS"
    }
  },
  {
    id: "ci-grunge",
    label: "Version 2",
    description: "Harder red-grunge studio campaign",
    settings: {
      presetId: "raw",
      zoom: 1.16,
      x: -8,
      y: 0,
      brightness: 94,
      contrast: 124,
      saturation: 112,
      titleSize: 112,
      subtitleSize: 54,
      titleY: 49,
      gradientStrength: 92,
      borderTexture: 100,
      sellingPoints: "REAL PERFORMER\nUNCUT ENERGY\nFLESHLAB ORIGINAL"
    }
  }
];

export default function CoverVariantCompare({ frame, metadata, settings, itemFileName }) {
  const fileTitle = itemFileName?.replace(/\.[^/.]+$/, "") || "";
  const effectiveMetadata = {
    ...metadata,
    videoTitle: metadata.videoTitle && metadata.videoTitle !== fileTitle ? metadata.videoTitle : "The Bareback Hotel"
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {VARIANTS.map(variant => (
        <Card key={variant.id}>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm">{variant.label}</CardTitle>
              <Badge variant="outline">Logo locked</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{variant.description}</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <CoverPreviewEditor
              frame={frame}
              metadata={effectiveMetadata}
              settings={{ ...settings, ...variant.settings, variantId: variant.id }}
              fileSuffix={variant.id}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}