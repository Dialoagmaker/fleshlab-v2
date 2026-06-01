export default function ProductionTab({ performer }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Production</h2>
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground">Production management — Phase 1 shell</p>
        <p className="text-xs text-muted-foreground mt-2">Future: Content calendar, shoot scheduling, asset management</p>
      </div>
    </div>
  );
}