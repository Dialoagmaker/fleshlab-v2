import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/aiMediaStudio/localAnalyzer";

export default function SmartReviewPanel({ item }) {
  if (!item?.analysis) {
    return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Not analyzed yet. No scores, scenes or outputs are displayed until real local analysis finishes.</div>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Real local analysis</p>
        <h3 className="mt-1 text-lg font-bold text-foreground">{item.fileName}</h3>
        <p className="text-sm text-muted-foreground">{item.frames.length} sampled frames · {item.scenes.length} detected scene candidate(s)</p>
      </div>

      {item.previewUrl && <video src={item.previewUrl} controls className="aspect-video w-full rounded-xl border border-border bg-black object-contain" />}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {item.scenes.map(scene => (
          <div key={scene.id} className="overflow-hidden rounded-xl border border-border bg-background">
            <img src={scene.representativeThumbnailUrl} alt={`${scene.id} representative frame`} className="aspect-video w-full object-cover" />
            <div className="space-y-3 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{formatTime(scene.start)} – {formatTime(scene.end)}</p>
                <Badge variant="outline">{scene.duration.toFixed(1)}s</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>Brightness {scene.scores.brightness}</span>
                <span>Contrast {scene.scores.contrast}</span>
                <span>Sharpness {scene.scores.sharpness}</span>
                <span>Diff {scene.scores.visualDifference}%</span>
                <span>Over {scene.scores.overexposure}%</span>
                <span>Under {scene.scores.underexposure}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}