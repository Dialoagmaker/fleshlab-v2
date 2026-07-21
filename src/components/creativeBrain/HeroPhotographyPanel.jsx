import { useState } from "react";
import { Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { executeHeroPhotographyRender } from "@/lib/heroPhotography/heroPhotographyEngine";
import { listHeroPhotographyProviders } from "@/lib/heroPhotography/providerRegistry";

const providers = listHeroPhotographyProviders();

export default function HeroPhotographyPanel({ sourceFrameFile, pipeline, targetPlatform, campaignFamily }) {
  const [providerId, setProviderId] = useState(providers[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);

  const render = async () => {
    if (loading) return;
    setLoading(true);
    setOutput(null);
    const result = await executeHeroPhotographyRender({
      sourceFrameFile,
      productionBlueprint: pipeline?.productionBlueprint,
      platformRules: { targetPlatform },
      campaignFamily,
      providerId
    });
    setOutput(result);
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">FLESHLAB Hero Photography Engine</p>
          <h2 className="mt-2 text-xl font-black text-foreground">Execute the Production Blueprint</h2>
          <p className="mt-1 text-sm text-muted-foreground">This layer executes the Blueprint with a provider adapter. It does not create new creative direction.</p>
        </div>
        <Camera className="h-6 w-6 text-primary" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <label className="space-y-1"><span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Provider</span><select value={providerId} onChange={e => setProviderId(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground">{providers.map(provider => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
        <Button disabled={!sourceFrameFile || !pipeline?.productionBlueprint || loading} onClick={render} className="h-11">{loading ? "Rendering" : "Render Hero Photograph"}</Button>
      </div>
      {output?.status === "failed" && <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"><div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4" /><div><b>{output.message}</b><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(output.details, null, 2)}</pre></div></div></div>}
      {output?.status === "succeeded" && <div className="mt-4 space-y-4"><img src={output.heroImage} alt="Rendered hero photograph" className="w-full rounded-xl border border-border bg-black object-contain" /><div className="grid gap-2 text-xs md:grid-cols-4"><span className="rounded bg-secondary p-2">Provider: {output.provider.name}</span><span className="rounded bg-secondary p-2">Model: {output.model}</span><span className="rounded bg-secondary p-2">Time: {output.renderTimeMs}ms</span><span className="rounded bg-secondary p-2">Critic: {output.creativeCritic.status}</span></div><details className="rounded-lg border border-border"><summary className="cursor-pointer p-3 text-xs font-bold uppercase tracking-widest text-primary">Output Package</summary><pre className="max-h-96 overflow-auto bg-black p-4 text-xs text-green-100">{JSON.stringify({ ...output, heroImage: "[image data omitted]" }, null, 2)}</pre></details></div>}
    </div>
  );
}