import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

export default function SmartReviewPanel({ analysis }) {
  if (!analysis) return null;
  const topScene = analysis.scenes[0];

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Smart Review</p>
          <h3 className="mt-1 text-lg font-bold text-foreground">{analysis.marketing.title}</h3>
          <p className="text-sm text-muted-foreground">Confidence score: {analysis.confidence}% · {analysis.scenes.length} scenes · {analysis.frameEstimate} estimated frames</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="gap-2"><CheckCircle2 className="h-4 w-4" /> Approve</Button>
          <Button size="sm" variant="outline" className="gap-2"><XCircle className="h-4 w-4" /> Reject</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {["Top Trailer", "Top Cover", "Top Screenshots", "Top GIF", "Top Shorts"].map(label => (
          <div key={label} className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Scene {topScene.start}s–{topScene.end}s</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(topScene.scores).slice(0, 12).map(([key, value]) => (
          <div key={key} className="rounded-lg bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{key}</span>
              <Badge variant="outline">{value}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}