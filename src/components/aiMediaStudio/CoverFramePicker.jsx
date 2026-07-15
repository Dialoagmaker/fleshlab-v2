import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTime, rankAdvertisingFrames } from "@/lib/aiMediaStudio/localAnalyzer";

export default function CoverFramePicker({ frames, selectedIndex, onSelect, onBestFrame }) {
  const candidates = rankAdvertisingFrames(frames || [], 10, 85);
  if (!frames?.length) return <p className="text-sm text-muted-foreground">Analyze a video first to create covers from real frames.</p>;
  if (!candidates.length) return <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-4 text-sm font-semibold text-destructive">No advertising moment reached 85 Hero Potential. Search again before rendering.</div>;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="font-bold text-foreground">Advertising moments</h3><p className="text-xs text-muted-foreground">Top 10 from the 1000+ frame search: eye contact, silhouette, separation, lighting, gesture, tension, emotion, movement freeze and thumbnail impact.</p></div>
        <Button size="sm" onClick={() => onBestFrame(candidates[0]?.index)}>Use Best Advertising Moment</Button>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
        {candidates.map(frame => (
          <button key={frame.index} onClick={() => onSelect(frame.index)} className={`overflow-hidden rounded-lg border text-left ${selectedIndex === frame.index ? "border-primary ring-2 ring-primary/40" : "border-border"}`}>
            <img src={frame.url} alt={`Frame at ${formatTime(frame.time)}`} className="aspect-video w-full object-cover" />
            <div className="flex items-center justify-between gap-2 p-2 text-xs">
              <span className="text-muted-foreground">{formatTime(frame.time)}</span>
              <Badge variant="outline">Hero {Math.round(frame.hero?.heroPotential || frame.hero?.score || 0)}</Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}