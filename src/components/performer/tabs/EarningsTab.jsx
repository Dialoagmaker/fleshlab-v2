export default function EarningsTab({ performer }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Earnings</h2>
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Revenue Split</p>
            <p className="text-sm text-foreground">{performer.revenue_split_pct ? `${performer.revenue_split_pct}%` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Outstanding Balance</p>
            <p className="text-sm text-foreground">${performer.outstanding_balance_usd?.toFixed(2) || "0.00"}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">Earnings calculations — Phase 3 (deferred)</p>
      </div>
    </div>
  );
}