export default function CampaignComposerComparison({ currentAssets = [], improvedAssets = [] }) {
  const current = currentAssets.find(asset => asset.format?.key === "youtube_thumbnail") || currentAssets[0];
  const improved = improvedAssets.find(asset => asset.format?.key === "youtube_thumbnail") || improvedAssets[0];
  if (!current || !improved) return null;

  return (
    <div className="mt-5 rounded-xl border border-primary/30 bg-background/50 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Browser Verification</p>
          <h4 className="mt-1 text-lg font-black text-foreground">Current Composer → Improved Composer</h4>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">Same Hero Photography</span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-secondary/30 p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">Current Composer</p>
          <img src={current.url} alt="Current campaign composer output" className="w-full rounded-md border border-border object-cover" />
        </article>
        <article className="rounded-lg border border-primary/40 bg-primary/10 p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-primary">Improved Composer</p>
          <img src={improved.url} alt="Improved premium campaign composer output" className="w-full rounded-md border border-primary/30 object-cover" />
        </article>
      </div>
    </div>
  );
}