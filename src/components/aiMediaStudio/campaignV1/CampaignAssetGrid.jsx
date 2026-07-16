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
          {asset.previewUrl && <img src={asset.previewUrl} alt={asset.filename} className="aspect-video w-full bg-black object-cover" />}
          {!asset.previewUrl && <div className="flex aspect-video items-center justify-center bg-secondary/40 text-xs font-bold uppercase tracking-widest text-muted-foreground">{asset.kind}</div>}
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="break-all text-sm font-semibold text-foreground">{asset.filename}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(asset.size)}</p>
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