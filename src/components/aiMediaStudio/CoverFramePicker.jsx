import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTime, rankEmotionalCommercialFrames } from "@/lib/aiMediaStudio/localAnalyzer";

export default function CoverFramePicker({ frames, selectedIndex, onSelect, onBestFrame }) {
  const candidates = rankEmotionalCommercialFrames(frames || [], 10, 45);
  if (!frames?.length) return <p className="text-sm text-muted-foreground">Analyze a video first to create covers from real frames.</p>;
  if (!candidates.length) return <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-4 text-sm font-semibold text-destructive">No readable emotional commercial moment found. Try a different scene before rendering.</div>;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="font-bold text-foreground">Emotional commercial moments</h3><p className="text-xs text-muted-foreground">Top 10 from the 1000+ frame search: intimacy, authenticity, body language, chemistry, curiosity, emotional tension, realism, human interaction, silhouette and readability.</p></div>
        <Button size="sm" onClick={() => onBestFrame(candidates[0]?.index)}>Use Best Emotional Moment</Button>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
        {candidates.map(frame => (
          <button key={frame.index} onClick={() => onSelect(frame.index)} className={`overflow-hidden rounded-lg border text-left ${selectedIndex === frame.index ? "border-primary ring-2 ring-primary/40" : "border-border"}`}>
            <img src={frame.url} alt={`Frame at ${formatTime(frame.time)}`} className="aspect-video w-full object-cover" />
            <div className="flex items-center justify-between gap-2 p-2 text-xs">
              <span className="text-muted-foreground">{formatTime(frame.time)}</span>
              <Badge variant="outline">ECP {Math.round(frame.hero?.emotionalCommercialPotential || frame.hero?.score || 0)}</Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}