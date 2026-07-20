import { useMemo, useState } from "react";
import { Maximize2, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatTime, rankEmotionalCommercialFrames } from "@/lib/aiMediaStudio/localAnalyzer";

export default function CoverFramePicker({ frames, selectedIndex, disabled = false, onSelect, onBestFrame }) {
  const [previewFrame, setPreviewFrame] = useState(null);
  const candidates = useMemo(() => {
    const ranked = rankEmotionalCommercialFrames(frames || [], 20, 45);
    return ranked.length ? ranked : (frames || []).slice(0, 20);
  }, [frames]);

  if (!frames?.length) return <p className="text-sm text-muted-foreground">Analyze a video first to choose a story frame.</p>;

  return (
    <div className="space-y-4 opacity-100">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-bold text-foreground">Frame auswählen</h3>
          <p className="text-xs text-muted-foreground">Choose the story moment that should be re-photographed as the hero image.</p>
        </div>
        <Button size="sm" disabled={disabled || !candidates[0]} onClick={() => onBestFrame(candidates[0]?.index)}>Use recommended frame</Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {candidates.map(frame => {
          const selected = selectedIndex === frame.index;
          return (
            <div key={frame.index} className={`group overflow-hidden rounded-xl border bg-secondary/20 ${selected ? "border-primary ring-2 ring-primary/40" : "border-border"}`}>
              <button type="button" disabled={disabled} onClick={() => onSelect(frame.index)} className="relative block w-full bg-black text-left disabled:cursor-not-allowed disabled:opacity-60">
                <img src={frame.url} alt={`Frame at ${formatTime(frame.time)}`} className="aspect-video w-full object-contain" />
                {selected && <Badge className="absolute left-2 top-2 gap-1"><Pin className="h-3 w-3" />Selected</Badge>}
              </button>
              <div className="flex items-center justify-between gap-2 p-3 text-xs">
                <span className="font-mono text-muted-foreground">{formatTime(frame.time)}</span>
                <Button size="sm" variant="outline" disabled={disabled} onClick={() => setPreviewFrame(frame)} title="Preview"><Maximize2 className="h-3 w-3" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!previewFrame} onOpenChange={() => setPreviewFrame(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle>Story frame preview · {previewFrame ? formatTime(previewFrame.time) : ""}</DialogTitle></DialogHeader>
          {previewFrame && <img src={previewFrame.url} alt="Story frame preview" className="max-h-[78vh] w-full rounded-lg bg-black object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}