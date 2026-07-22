import { Badge } from "@/components/ui/badge";

const REQUIRED_FORMATS = ["youtube_thumbnail", "instagram_feed", "instagram_story", "x_banner", "website_hero", "ppv_cover"];

export default function DirectionAssetColumn({ direction }) {
  if (!direction?.campaign) return null;
  const assets = direction.campaign.assets.filter(asset => REQUIRED_FORMATS.includes(asset.format?.key));
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-primary">{direction.label}</p>
          <p className="text-sm text-muted-foreground">{direction.description}</p>
        </div>
        <Badge variant="outline">{assets.length} assets</Badge>
      </div>
      <div className="grid gap-3">
        {assets.map(asset => (
          <div key={asset.filename} className="overflow-hidden rounded-lg border border-border bg-black">
            <img src={asset.url} alt={asset.filename} className="w-full object-cover" style={{ aspectRatio: asset.width && asset.height ? `${asset.width} / ${asset.height}` : "16 / 9" }} />
            <div className="p-2 text-[10px] text-muted-foreground">{asset.format.label} · {asset.brandPlan?.artDirectionPlan?.strategy}</div>
          </div>
        ))}
      </div>
    </div>
  );
}