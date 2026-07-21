import { useEffect, useState } from "react";
import { Brain, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TARGET_PLATFORMS, CAMPAIGN_FAMILIES } from "@/lib/creativeBrain/brandRules";

export default function BrainUploadPanel({ file, loading, error, targetPlatform, campaignFamily, userTitle, onTitleChange, onTargetChange, onFamilyChange, onFileChange, onAnalyze }) {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><Brain className="h-5 w-5" /></div><div><h1 className="text-2xl font-black text-foreground">Hybrid Creative Brain</h1><p className="mt-1 text-sm text-muted-foreground">Local technical vision + semantic vision + deterministic reasoning. No renderer. No image generation.</p></div></div>
      <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">Privacy: technical facts are processed locally in your browser. Semantic facts use private upload plus a temporary signed URL sent to Base44 vision integration. Provider/model: provider not exposed by Base44.</div>
      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px_220px_auto] lg:items-end">
        <label><span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Source image</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} className="mt-2 block w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground" /></label>
        <label><span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target platform</span><select value={targetPlatform} onChange={e => onTargetChange(e.target.value)} className="mt-2 h-12 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground">{TARGET_PLATFORMS.map(item => <option key={item}>{item}</option>)}</select></label>
        <label><span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Campaign family</span><select value={campaignFamily} onChange={e => onFamilyChange(e.target.value)} className="mt-2 h-12 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground">{CAMPAIGN_FAMILIES.map(item => <option key={item}>{item}</option>)}</select></label>
        <Button onClick={onAnalyze} disabled={!file || loading} className="h-12 gap-2"><Upload className="h-4 w-4" />{loading ? "Analyzing" : "Run Brain"}</Button>
      </div>
      <label className="mt-3 block"><span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">User title / creative authority input</span><input value={userTitle || ""} onChange={e => onTitleChange(e.target.value)} placeholder="Optional — if blank, Creative Brain selects its generated title" className="mt-2 block w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground" /></label>
      {preview && <img src={preview} alt="Uploaded source" className="mt-4 max-h-80 rounded-xl border border-border bg-black object-contain" />}
      {error && <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    </div>
  );
}