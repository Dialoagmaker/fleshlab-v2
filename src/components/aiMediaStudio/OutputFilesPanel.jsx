import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { formatBytes } from "@/lib/aiMediaStudio/localAnalyzer";

export default function OutputFilesPanel({ outputs, teaser }) {
  const files = teaser ? [teaser, ...outputs] : outputs;
  if (!files.length) {
    return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Not analyzed yet. Output files appear only after real local files are generated.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {files.map(file => (
        <div key={file.filename} className="overflow-hidden rounded-xl border border-border bg-card">
          {file.previewUrl && file.blob?.type?.startsWith("video/") && <video src={file.previewUrl} controls className="aspect-video w-full bg-black object-contain" />}
          {file.previewUrl && file.blob?.type?.startsWith("image/") && <img src={file.previewUrl} alt={file.filename} className="aspect-video w-full object-cover" />}
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="break-all text-sm font-semibold text-foreground">{file.filename}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <Badge variant="outline">{file.status}</Badge>
            </div>
            <Button asChild size="sm" className="w-full gap-2">
              <a href={file.url} download={file.filename}><Download className="h-4 w-4" /> Download</a>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}