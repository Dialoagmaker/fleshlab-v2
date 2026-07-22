import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Palette } from "lucide-react";
import CampaignAssetGrid from "@/components/aiMediaStudio/campaignV1/CampaignAssetGrid";
import { composeCampaignFromHero } from "@/lib/heroPhotography/campaignComposer";

export default function CampaignComposerPreview({ output, pipeline, campaignFamily }) {
  const [composer, setComposer] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (output?.status !== "succeeded" || !output?.heroImage) return;
    let active = true;
    const objectUrls = [];
    setLoading(true);
    setError("");
    composeCampaignFromHero(output, pipeline, campaignFamily)
      .then(result => {
        if (!active) return;
        objectUrls.push(...result.visualAssets.map(asset => asset.url));
        setComposer(result);
      })
      .catch(err => active && setError(err?.message || "Campaign Composer failed."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [output, pipeline, campaignFamily]);

  if (output?.status !== "succeeded") return null;

  return (
    <section className="mt-5 rounded-xl border border-primary/30 bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Campaign Composer</p>
          <h3 className="mt-2 text-xl font-black text-foreground">Branded Campaign Assets</h3>
          <p className="mt-1 text-sm text-muted-foreground">Hero Photography is now routed through Art Direction, Brand Identity, Typography, and Campaign Composer.</p>
        </div>
        <Palette className="h-6 w-6 text-primary" />
      </div>
      {loading && <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Composing platform assets</div>}
      {error && <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {composer?.downstreamReady && <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200"><CheckCircle2 className="h-4 w-4" />Campaign output is available to downstream Campaign Assets.</div>}
      {composer?.visualAssets?.length > 0 && <div className="mt-5"><CampaignAssetGrid assets={composer.visualAssets} /></div>}
    </section>
  );
}