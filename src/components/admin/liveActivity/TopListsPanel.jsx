function TopList({ title, items }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data yet today.</p>
      ) : (
        <div className="space-y-1.5">
          {items.map(([name, count]) => (
            <div key={name} className="flex items-center justify-between text-sm">
              <span className="text-foreground truncate">{name}</span>
              <span className="text-muted-foreground font-medium">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopListsPanel({ topPerformers, topVideos, topFanclubClicks }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">Top Performers Panel</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <TopList title="Most Viewed Performers" items={topPerformers} />
        <TopList title="Most Viewed Videos" items={topVideos} />
        <TopList title="Most Clicked Fanclubs" items={topFanclubClicks} />
      </div>
    </div>
  );
}