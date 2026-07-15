import { Badge } from "@/components/ui/badge";
import { formatBytes, formatTime } from "@/lib/aiMediaStudio/localAnalyzer";

export default function AnalysisQueue({ items, selectedId, onSelect }) {
  if (!items.length) {
    return <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Not analyzed yet. Select a local MP4, MOV, WebM or M4V to begin.</div>;
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <button key={item.id} onClick={() => onSelect(item.id)} className={`w-full rounded-xl border p-4 text-left transition-colors ${selectedId === item.id ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/40"}`}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-foreground">{item.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(item.fileSize)}
                {item.metadata ? ` · ${formatTime(item.metadata.duration)} · ${item.metadata.width}×${item.metadata.height} · AR ${item.metadata.aspectRatio}` : " · Not analyzed yet"}
              </p>
            </div>
            <Badge variant={item.status === "analyzed" ? "default" : item.status === "failed" ? "destructive" : "secondary"}>{item.statusLabel}</Badge>
          </div>
        </button>
      ))}
    </div>
  );
}