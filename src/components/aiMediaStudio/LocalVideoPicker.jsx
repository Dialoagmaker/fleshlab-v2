import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { FolderOpen, Pause, Play, Square, RotateCcw } from "lucide-react";

export default function LocalVideoPicker({ processing, paused, progress, onPickFiles, onPauseResume, onCancel }) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        <Button onClick={() => fileInputRef.current?.click()} className="h-14 gap-2 text-sm font-bold" disabled={processing}>
          <Play className="h-4 w-4" /> Analyze Video
        </Button>
        <Button variant="outline" onClick={() => folderInputRef.current?.click()} className="h-14 gap-2 text-sm font-bold" disabled={processing}>
          <FolderOpen className="h-4 w-4" /> Analyze Folder
        </Button>
        <Button variant="secondary" onClick={onPauseResume} className="h-14 gap-2 text-sm font-bold" disabled={!processing}>
          {paused ? <RotateCcw className="h-4 w-4" /> : <Pause className="h-4 w-4" />} {paused ? "Resume" : "Pause"}
        </Button>
        <Button variant="destructive" onClick={onCancel} className="h-14 gap-2 text-sm font-bold" disabled={!processing}>
          <Square className="h-4 w-4" /> Cancel
        </Button>
      </div>

      {processing && (
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".mp4,.mov,.webm,.m4v,video/mp4,video/quicktime,video/webm" className="hidden" onChange={(event) => onPickFiles(Array.from(event.target.files || []))} />
      <input ref={folderInputRef} type="file" accept=".mp4,.mov,.webm,.m4v,video/mp4,video/quicktime,video/webm" multiple webkitdirectory="" directory="" className="hidden" onChange={(event) => onPickFiles(Array.from(event.target.files || []))} />
    </div>
  );
}