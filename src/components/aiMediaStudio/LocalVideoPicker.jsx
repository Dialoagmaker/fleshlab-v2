import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { FolderOpen, Play, Pause } from "lucide-react";

export default function LocalVideoPicker({ processing, onPickFiles, onPause }) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Button onClick={() => fileInputRef.current?.click()} className="h-14 gap-2 text-sm font-bold">
        <Play className="h-4 w-4" /> Analyze Video
      </Button>
      <Button variant="outline" onClick={() => folderInputRef.current?.click()} className="h-14 gap-2 text-sm font-bold">
        <FolderOpen className="h-4 w-4" /> Drop Folder / Batch
      </Button>
      <Button variant="secondary" onClick={onPause} className="h-14 gap-2 text-sm font-bold" disabled={!processing}>
        <Pause className="h-4 w-4" /> Pause / Resume
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/*"
        multiple
        className="hidden"
        onChange={(event) => onPickFiles(Array.from(event.target.files || []))}
      />
      <input
        ref={folderInputRef}
        type="file"
        accept="video/mp4,video/*"
        multiple
        webkitdirectory=""
        directory=""
        className="hidden"
        onChange={(event) => onPickFiles(Array.from(event.target.files || []))}
      />
    </div>
  );
}