import { useMemo, useState } from "react";
import { Maximize2, Palette, Pin, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatTime, rankEmotionalCommercialFrames } from "@/lib/aiMediaStudio/localAnalyzer";

function score(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return Math.round(Number(value || 0) * (Number(value || 0) <= 1 ? 100 : 1));
}

function frameInfo(frame) {
  const hero = frame.hero || {};
  const signals = hero.authenticCommercialSignals || {};
  return [
    ["Commercial", hero.emotionalCommercialPotential || hero.score],
    ["Emotional", signals.emotionalTension || hero.emotionalPresence],
    ["Story", hero.storyScore || hero.storyContinuation],
    ["Poster", hero.posterScore || hero.thumbnailImpact],
    ["Lighting", frame.metrics?.technicalScore],
    ["Composition", hero.compositionScore],
    ["Face", hero.faceVisible],
    ["Body", signals.bodyLanguage || hero.bodyLanguage],
  ];
}

function MiniPosterPreview({ frame }) {
  return (
    <div className="pointer-events-none absolute inset-x-2 top-2 z-20 hidden overflow-hidden rounded-md border border-primary/40 bg-black shadow-2xl group-hover:block">
      <div className="relative aspect-video">
        <img src={frame.url} alt="Poster preview" className="h-full w-full object-cover" />
        <div className="absolute inset-y-0 left-0 w-[56%] bg-gradient-to-r from-black via-black/90 to-black/20" />
        <div className="absolute left-3 top-3 text-[10px] font-black tracking-[0.25em] text-white">FLESH<span className="text-primary">LAB</span></div>
        <div className="absolute left-3 top-[38%] text-2xl font-black leading-none text-white drop-shadow">KRAKEN</div>
        <div className="absolute left-3 top-[58%] text-xl font-black leading-none text-primary drop-shadow">KEY ART</div>
        <div className="absolute bottom-2 left-3 h-1 w-24 bg-primary" />
      </div>
    </div>
  );
}

export default function CoverFramePicker({ frames, selectedIndex, identityReferenceIndex, rejectedIndexes = [], favoriteIndexes = [], compareIndexes = [], lockedHero, onSelect, onBestFrame, onReject, onToggleFavorite, onToggleCompare, onToggleLock }) {
  const [previewFrame, setPreviewFrame] = useState(null);
  const rejected = useMemo(() => new Set(rejectedIndexes), [rejectedIndexes]);
  const candidates = useMemo(() => rankEmotionalCommercialFrames(frames || [], 20, 45).filter(frame => !rejected.has(frame.index)), [frames, rejected]);
  const favoriteFrames = candidates.filter(frame => favoriteIndexes.includes(frame.index));

  if (!frames?.length) return <p className="text-sm text-muted-foreground">Analyze a video first to create covers from real frames.</p>;
  if (!candidates.length) return <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-4 text-sm font-semibold text-destructive">No available hero frames remain. Reset rejects or analyze another scene.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-bold text-foreground">Creative Director Hero Frame Gallery</h3>
          <p className="text-xs text-muted-foreground">Top 20 from the completed frame search. Click any frame to lock it and regenerate the cover candidates from that exact photograph only.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold text-foreground">
            <input type="checkbox" checked={lockedHero} onChange={event => onToggleLock(event.target.checked)} /> Lock Hero Frame
          </label>
          <Button size="sm" onClick={() => onBestFrame(candidates[0]?.index)}>Use Best Ranked Frame</Button>
        </div>
      </div>

      {!!favoriteFrames.length && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-primary">Favorite Hero Frames</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {favoriteFrames.map(frame => <button key={frame.index} onClick={() => onSelect(frame.index)} className="overflow-hidden rounded-lg border border-primary/40"><img src={frame.url} alt="Favorite hero frame" className="aspect-video w-full object-cover" /></button>)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {candidates.map(frame => {
          const selected = selectedIndex === frame.index;
          const favorite = favoriteIndexes.includes(frame.index);
          const compared = compareIndexes.includes(frame.index);
          const identityReference = identityReferenceIndex === frame.index;
          return (
            <div key={frame.index} className={`group relative overflow-hidden rounded-xl border bg-secondary/20 ${selected ? "border-primary ring-2 ring-primary/40" : "border-border"}`}>
              <MiniPosterPreview frame={frame} />
              <button type="button" onClick={() => onSelect(frame.index)} className="block w-full text-left">
                <img src={frame.url} alt={`Frame at ${formatTime(frame.time)}`} className="aspect-video w-full object-cover" />
                {selected && <Badge className="absolute left-2 top-2 gap-1"><Pin className="h-3 w-3" />Story Ref</Badge>}
                {identityReference && <Badge variant="outline" className="absolute right-2 top-2 bg-background/80">Identity Ref</Badge>}
              </button>
              <div className="space-y-3 p-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-muted-foreground">{formatTime(frame.time)}</span>
                  <Badge variant="outline">Commercial {score(frame.hero?.emotionalCommercialPotential || frame.hero?.score)}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                  {frameInfo(frame).map(([label, value]) => <div key={label} className="flex justify-between gap-2 rounded bg-background/50 px-2 py-1"><span>{label}</span><b className="text-foreground">{score(value)}</b></div>)}
                </div>
                <div className="grid grid-cols-5 gap-1">
                  <Button size="sm" variant={favorite ? "default" : "outline"} onClick={() => onToggleFavorite(frame.index)} title="Favorite"><Star className="h-3 w-3" /></Button>
                  <Button size="sm" variant={compared ? "default" : "outline"} onClick={() => onToggleCompare(frame.index)} title="Compare">{compareIndexes.indexOf(frame.index) + 1 || "+"}</Button>
                  <Button size="sm" variant="outline" onClick={() => setPreviewFrame(frame)} title="Fullscreen"><Maximize2 className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => onSelect(frame.index)} title="Generate Covers"><Palette className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => onReject(frame.index)} title="Reject"><X className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!previewFrame} onOpenChange={() => setPreviewFrame(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle>Hero Frame Preview · {previewFrame ? formatTime(previewFrame.time) : ""}</DialogTitle></DialogHeader>
          {previewFrame && <img src={previewFrame.url} alt="Fullscreen hero frame preview" className="max-h-[78vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}