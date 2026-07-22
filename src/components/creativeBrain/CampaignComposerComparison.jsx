export default function CampaignComposerComparison({ improvedAssets = [] }) {
  const asset = improvedAssets.find(item => item.format?.key === "youtube_thumbnail" && item.legacyPreviewUrl);
  if (!asset) return null;

  return (
    <div className="mt-5 rounded-xl border border-primary/30 bg-background/50 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Renderer Comparison</p>
          <h4 className="mt-1 text-lg font-black text-foreground">Panel Renderer vs Full-Bleed Key Art</h4>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">16:9 · Same Hero Photography</span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-secondary/30 p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">A · Current panel-based renderer</p>
          <img src={asset.legacyPreviewUrl} alt={`${asset.campaignMetadata?.campaignTitle} legacy panel key art`} className="w-full rounded-md border border-border object-cover" />
        </article>
        <article className="rounded-lg border border-primary/40 bg-primary/10 p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-primary">B · New full-bleed FLESHLAB key art</p>
          <img src={asset.url} alt={`${asset.campaignMetadata?.campaignTitle} full-bleed key art`} className="w-full rounded-md border border-primary/30 object-cover" />
        </article>
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{asset.campaignMetadata?.campaignTitle} · {asset.campaignMetadata?.performerName} · {asset.campaignMetadata?.collection} · {asset.compositionPlan?.layoutFamily}</p>
    </div>
  );
}