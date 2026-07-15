import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/aiMediaStudio/localAnalyzer";

export default function AnalysisQueue({ items, selectedId, onSelect }) {
  if (!items.length) {
    return <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Select one MP4 or a folder of videos to build a local analysis queue.</div>;
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`w-full rounded-xl border p-4 text-left transition-colors ${selectedId === item.id ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/40"}`}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-foreground">{item.fileName}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(item.fileSize)} · {item.analysis?.duration || "Pending"}s · {item.analysis?.resolution || "Local decode pending"}</p>
            </div>
            <Badge variant={item.analysis ? "default" : "secondary"}>{item.analysis ? "Local metadata ready" : "Queued"}</Badge>
          </div>
        </button>
      ))}
    </div>
  );
}