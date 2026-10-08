import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_CAMPAIGN_FORMATS } from "@/lib/heroPhotography/campaignComposer";

const FIELD_CONFIG = [
  { key: "campaignTitle", label: "Campaign Title", required: false, max: 90 },
  { key: "performerName", label: "Performer / Creator", required: false, max: 42 },
  { key: "subtitle", label: "Collection", required: false, max: 48 },
  { key: "episode", label: "Episode", required: false, max: 28 },
  { key: "cta", label: "CTA", required: false, max: 24 },
  { key: "campaignLabel", label: "Campaign Label", required: false, max: 36 },
  { key: "releaseName", label: "Release Name", required: false, max: 42 },
];

function updateField(metadata, key, value) {
  return { ...metadata, [key]: value, source: { ...(metadata.source || {}), [key]: "user" } };
}

export default function CampaignDetailsForm({ metadata, aiSuggestion, validation, warnings = [], onChange, onReset, onSave, onGenerate, loading, hasAssets }) {
  return (
    <div className="mt-5 rounded-xl border border-border bg-secondary/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Campaign Details</p>
          <h4 className="mt-1 text-lg font-black text-foreground">Control the branded text layer</h4>
          <p className="mt-1 text-xs text-muted-foreground">These values override saved project metadata, AI suggestions, and safe fallbacks.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onReset}><RotateCcw className="h-4 w-4" />Reset to AI suggestion</Button>
          <Button type="button" variant="outline" size="sm" onClick={onSave}><Save className="h-4 w-4" />Save to project</Button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {FIELD_CONFIG.map(field => {
          const value = metadata?.[field.key] || "";
          const error = validation?.[field.key];
          return (
            <label key={field.key} className="space-y-1 rounded-lg border border-border bg-background/40 p-3">
              <span className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"><span>{field.label}{field.required ? " *" : ""}</span><span>{value.length}/{field.max}</span></span>
              <input value={value} onChange={event => onChange(updateField(metadata, field.key, event.target.value))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" />
              <span className="block text-[10px] text-muted-foreground">AI suggestion: {aiSuggestion?.[field.key] || "—"}</span>
              {error && <span className="block text-xs text-destructive">{error}</span>}
            </label>
          );
        })}
      </div>
      {warnings.length > 0 && <div className="mt-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-100">{warnings.map(item => <p key={item}>{item}</p>)}</div>}
      <div className="mt-4 rounded-lg border border-border bg-background/50 p-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Live Preview</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {HERO_CAMPAIGN_FORMATS.map(format => <div key={format.key} className="rounded-lg bg-secondary/50 p-3"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{format.label}</p>{metadata?.campaignTitle ? <b className="mt-1 block break-words text-sm text-foreground">{metadata.campaignTitle}</b> : <span className="mt-1 block text-xs text-muted-foreground">No campaign title selected</span>}{metadata?.performerName && <span className="block break-words text-xs text-muted-foreground">{metadata.performerName}</span>}{metadata?.subtitle && <span className="block break-words text-[10px] text-primary">{metadata.subtitle}</span>}</div>)}
        </div>
      </div>
      <Button type="button" disabled={loading || Boolean(validation?.campaignTitle)} onClick={onGenerate} className="mt-4 w-full">{loading ? "Updating Campaign Assets" : hasAssets ? "Update Campaign Assets" : "Generate Campaign Assets"}</Button>
    </div>
  );
}