function FieldList({ title, items = [] }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-primary">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map(item => <span key={item} className="rounded-full border border-border bg-secondary/40 px-2 py-1 text-[10px] text-muted-foreground">{item}</span>)}
      </div>
    </div>
  );
}

export default function CampaignKeyArtWorkflow({ assets = [] }) {
  const campaigns = assets.filter(asset => asset.kind === "visual" && asset.keyArtBrief && asset.layoutSketch).reduce((map, asset) => {
    if (!map.has(asset.campaignConceptId)) map.set(asset.campaignConceptId, asset);
    return map;
  }, new Map());

  if (!campaigns.size) return null;

  return (
    <div className="mt-5 space-y-5">
      {[...campaigns.values()].map(asset => (
        <article key={asset.campaignConceptId} className="rounded-xl border border-primary/30 bg-background/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Key Art Workflow</p>
              <h4 className="mt-1 text-lg font-black text-foreground">{asset.campaignMetadata?.campaignTitle}</h4>
            </div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">Designed Key Art</span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <section className="rounded-lg border border-border bg-card/70 p-3">
              <h5 className="text-sm font-black text-foreground">Creative Brief</h5>
              <div className="mt-3 space-y-3">
                <FieldList title="Mood" items={asset.keyArtBrief.mood} />
                <FieldList title="Photography" items={asset.keyArtBrief.photography} />
                <FieldList title="Graphic Language" items={asset.keyArtBrief.graphicLanguage} />
                <p className="text-xs text-muted-foreground">{asset.keyArtBrief.intent}</p>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card/70 p-3">
              <h5 className="text-sm font-black text-foreground">Layout Sketch</h5>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary">{asset.layoutSketch.blueprint}</p>
              <div className="mt-3 space-y-2">
                {asset.layoutSketch.elements.map(item => (
                  <div key={item.element} className="rounded-md bg-secondary/30 p-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{item.element} · {item.position}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{item.reason}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-primary/40 bg-primary/10 p-3">
              <h5 className="text-sm font-black text-foreground">Final Key Art</h5>
              <img src={asset.url} alt={`${asset.campaignMetadata?.campaignTitle} final key art`} className="mt-3 w-full rounded-md border border-primary/30 object-cover" />
              <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{asset.layoutSketch.typographyRule}</p>
            </section>
          </div>
        </article>
      ))}
    </div>
  );
}