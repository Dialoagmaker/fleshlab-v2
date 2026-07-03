export default function SessionAnalyticsCard({ session }) {
  const rows = [
    { label: "Total Sessions", value: session.totalSessions },
    { label: "Avg. Session Length", value: session.avgSessionLength },
    { label: "Longest Session", value: session.longestSession },
    { label: "Last Session", value: session.lastSession },
    { label: "Current Session", value: session.currentSession },
    { label: "Time Since Last Visit", value: session.timeSinceLastVisit },
    { label: "Avg. Time Between Visits", value: session.avgTimeBetweenVisits },
  ];
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Session Analytics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rows.map(r => (
          <div key={r.label}>
            <p className="text-xs text-muted-foreground mb-0.5">{r.label}</p>
            <p className="text-sm font-medium text-foreground">{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}