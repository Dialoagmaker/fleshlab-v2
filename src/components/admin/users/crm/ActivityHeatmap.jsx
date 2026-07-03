function Bar({ label, count, max }) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-muted-foreground">{count}</span>
    </div>
  );
}

export default function ActivityHeatmap({ heatmap }) {
  const maxDay = Math.max(1, ...heatmap.byDay.map(d => d.count));
  const maxHour = Math.max(1, ...heatmap.byHour.map(h => h.count));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Activity Heatmap</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground mb-2">By Day of Week</p>
          {heatmap.byDay.map(d => <Bar key={d.label} label={d.label} count={d.count} max={maxDay} />)}
        </div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">By Hour of Day</p>
          {heatmap.byHour.filter(h => h.count > 0).map(h => <Bar key={h.label} label={h.label} count={h.count} max={maxHour} />)}
          {heatmap.byHour.every(h => h.count === 0) && <p className="text-xs text-muted-foreground">No hourly data yet.</p>}
        </div>
      </div>
    </div>
  );
}