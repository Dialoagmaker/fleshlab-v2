export default function CustomerSummaryCard({ user, summary, stats }) {
  const rows = [
    { label: "Registration Date", value: user?.created_date ? new Date(user.created_date).toLocaleDateString() : "—" },
    { label: "Country", value: user?.country || "—" },
    { label: "Language", value: user?.language || "—" },
    { label: "Current Session", value: stats.currentSessionMinutes != null ? `${stats.currentSessionMinutes}m` : "—" },
    { label: "Last Activity", value: user?.last_activity ? new Date(user.last_activity).toLocaleString() : (user?.last_login ? new Date(user.last_login).toLocaleString() : "—") },
    { label: "Lifetime Value", value: `$${(summary?.lifetime_spend_usd ?? 0).toFixed(2)}` },
    { label: "Wallet Balance", value: summary?.wallet_balance_usd != null ? `$${summary.wallet_balance_usd.toFixed(2)}` : "—" },
    { label: "Fanclub Status", value: (summary?.active_subscription_count ?? 0) > 0 ? "Active" : "None" },
    { label: "PPV Purchases", value: summary?.ppv_purchase_count ?? 0 },
    { label: "Videos Viewed", value: stats.videosViewed },
    { label: "Performers Viewed", value: stats.performersViewed },
    { label: "Guest Productions", value: summary?.guest_production_count ?? 0 },
    { label: "Messages", value: stats.messagesSent },
    { label: "Conversion Score", value: `${stats.conversionScore}%` },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Customer Summary</h3>
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