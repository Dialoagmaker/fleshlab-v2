import { Brain, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BrainUploadPanel({ file, loading, error, onFileChange, onAnalyze }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Brain className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Creative Brain</h1>
          <p className="mt-1 text-sm text-muted-foreground">Upload one image. The output is one Creative Production Blueprint JSON.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Source image</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} className="mt-2 block w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground" />
        </label>
        <Button onClick={onAnalyze} disabled={!file || loading} className="gap-2">
          <Upload className="h-4 w-4" />{loading ? "Thinking" : "Create Blueprint"}
        </Button>
      </div>

      {file && <p className="mt-3 text-xs text-muted-foreground">Selected: {file.name}</p>}
      {error && <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    </div>
  );
}