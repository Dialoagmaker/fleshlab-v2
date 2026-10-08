export default function StatusBadgesCard({ badges }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">Customer Status</h3>
      <div className="flex flex-wrap gap-2">
        {badges.length === 0 && <span className="text-sm text-muted-foreground">No badges yet</span>}
        {badges.map(b => (
          <span key={b} className="text-xs font-medium px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}