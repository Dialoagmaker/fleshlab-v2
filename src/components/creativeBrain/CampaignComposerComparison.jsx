export default function CampaignComposerComparison({ improvedAssets = [] }) {
  const heroAssets = improvedAssets.filter(asset => asset.format?.key === "youtube_thumbnail").slice(0, 3);
  if (heroAssets.length < 3) return null;

  return (
    <div className="mt-5 rounded-xl border border-primary/30 bg-background/50 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Browser Verification</p>
          <h4 className="mt-1 text-lg font-black text-foreground">Three Campaign Identities From One Hero Photography</h4>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">Same Hero Photography</span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {heroAssets.map((asset, index) => (
          <article key={asset.filename} className="rounded-lg border border-primary/40 bg-primary/10 p-3">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-primary">Campaign {String.fromCharCode(65 + index)} · {asset.campaignMetadata?.campaignTitle}</p>
            <img src={asset.url} alt={`${asset.campaignMetadata?.campaignTitle} premium key art`} className="w-full rounded-md border border-primary/30 object-cover" />
            <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{asset.campaignMetadata?.collection} · {asset.campaignMetadata?.episode}</p>
          </article>
        ))}
      </div>
    </div>
  );
}