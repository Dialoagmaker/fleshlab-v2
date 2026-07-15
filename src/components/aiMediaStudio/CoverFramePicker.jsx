import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTime, rankHeroFrames } from "@/lib/aiMediaStudio/localAnalyzer";

export default function CoverFramePicker({ frames, selectedIndex, onSelect, onBestFrame }) {
  const candidates = rankHeroFrames(frames || [], 12);
  if (!frames?.length) return <p className="text-sm text-muted-foreground">Analyze a video first to create covers from real frames.</p>;
  if (!candidates.length) return <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-4 text-sm font-semibold text-destructive">No suitable hero frame found</div>;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="font-bold text-foreground">Poster frame</h3><p className="text-xs text-muted-foreground">Ranked for storytelling potential: subject dominance, negative space, composition, lighting, readability and thumbnail impact.</p></div>
        <Button size="sm" onClick={() => onBestFrame(candidates[0]?.index)}>Best Hero Frame Automatically</Button>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
        {candidates.map(frame => (
          <button key={frame.index} onClick={() => onSelect(frame.index)} className={`overflow-hidden rounded-lg border text-left ${selectedIndex === frame.index ? "border-primary ring-2 ring-primary/40" : "border-border"}`}>
            <img src={frame.url} alt={`Frame at ${formatTime(frame.time)}`} className="aspect-video w-full object-cover" />
            <div className="flex items-center justify-between gap-2 p-2 text-xs">
              <span className="text-muted-foreground">{formatTime(frame.time)}</span>
              <Badge variant="outline">Story {Math.round(frame.hero?.storyScore || frame.hero?.posterScore || frame.hero?.score || 0)}</Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}