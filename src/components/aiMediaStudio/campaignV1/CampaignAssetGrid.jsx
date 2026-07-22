import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { formatBytes } from "@/lib/aiMediaStudio/localAnalyzer";

export default function CampaignAssetGrid({ assets = [] }) {
  if (!assets.length) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {assets.map(asset => (
        <div key={asset.filename} className="overflow-hidden rounded-xl border border-border bg-card">
          {asset.kind === "visual" && <img src={asset.previewUrl || asset.url} alt={asset.filename} className="w-full bg-black object-cover" style={{ aspectRatio: asset.width && asset.height ? `${asset.width} / ${asset.height}` : "16 / 9" }} />}
          {asset.kind !== "visual" && <div className="flex aspect-video items-center justify-center bg-secondary/40 text-xs font-bold uppercase tracking-widest text-muted-foreground">{asset.kind}</div>}
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="break-all text-sm font-semibold text-foreground">{asset.filename}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(asset.size)}{asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}</p>
                {asset.brandPlan && <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary">{asset.brandPlan.family} · {asset.brandPlan.artDirectionPlan?.strategy || "art-directed"}</p>}
                {asset.campaignMetadata && <p className="mt-1 text-[10px] text-muted-foreground">{[asset.campaignMetadata.campaignTitle, asset.campaignMetadata.performerName].filter(Boolean).join(" · ")}</p>}
                {asset.typographyWarnings?.length > 0 && <p className="mt-1 text-[10px] text-yellow-200">Text warning: {asset.typographyWarnings[0]}</p>}
              </div>
              <Badge variant="outline">{asset.status}</Badge>
            </div>
            <Button asChild size="sm" className="w-full gap-2">
              <a href={asset.url} download={asset.filename}><Download className="h-4 w-4" />Download</a>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}