export default function VideosTab({ performer }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Videos</h2>
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground">Video management — Phase 1 shell</p>
        <p className="text-xs text-muted-foreground mt-2">Future: List all videos for this performer with stats</p>
      </div>
    </div>
  );
}