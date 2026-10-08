export default function TimelineAnalytics({ stats }) {
  const items = [
    { label: "Today's Sessions", value: stats.todaySessions },
    { label: "Videos Viewed", value: stats.videosViewed },
    { label: "Total Watch Time", value: stats.totalWatchTime },
    { label: "Avg. Watch %", value: stats.avgWatchPct },
    { label: "Most Viewed Performer", value: stats.mostViewedPerformer },
    { label: "Most Viewed Category", value: stats.mostViewedCategory },
    { label: "Avg. Session Length", value: stats.avgSessionLength },
    { label: "Number of Visits", value: stats.numberOfVisits },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Quick Analytics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(it => (
          <div key={it.label}>
            <p className="text-xs text-muted-foreground mb-0.5">{it.label}</p>
            <p className="text-sm font-medium text-foreground">{it.value ?? "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}