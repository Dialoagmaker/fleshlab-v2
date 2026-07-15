import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTime, rankScreenshots } from "@/lib/aiMediaStudio/localAnalyzer";

export default function CoverFramePicker({ frames, selectedIndex, onSelect, onBestFrame }) {
  const candidates = rankScreenshots(frames || [], 12);
  if (!candidates.length) return <p className="text-sm text-muted-foreground">Analyze a video first to create covers from real frames.</p>;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="font-bold text-foreground">Real video frame</h3><p className="text-xs text-muted-foreground">Only frames extracted locally from this video are available.</p></div>
        <Button size="sm" onClick={() => onBestFrame(candidates[0]?.index)}>Best Frame Automatically</Button>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
        {candidates.map(frame => (
          <button key={frame.index} onClick={() => onSelect(frame.index)} className={`overflow-hidden rounded-lg border text-left ${selectedIndex === frame.index ? "border-primary ring-2 ring-primary/40" : "border-border"}`}>
            <img src={frame.url} alt={`Frame at ${formatTime(frame.time)}`} className="aspect-video w-full object-cover" />
            <div className="flex items-center justify-between gap-2 p-2 text-xs">
              <span className="text-muted-foreground">{formatTime(frame.time)}</span>
              <Badge variant="outline">{Math.round(frame.metrics.technicalScore)}</Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}