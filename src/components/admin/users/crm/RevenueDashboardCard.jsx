export default function RevenueDashboardCard({ summary, financials }) {
  const r = financials?.revenue || {};
  const fp = financials?.flashpay || {};
  const rows = [
    { label: "Lifetime Value", value: `$${(summary?.lifetime_spend_usd ?? 0).toFixed(2)}` },
    { label: "Total Revenue", value: `$${(r.total_revenue ?? 0).toFixed(2)}` },
    { label: "Wallet Topups", value: `$${(fp.total_topups_usd ?? 0).toFixed(2)}` },
    { label: "Wallet Balance", value: `$${(fp.balance_usd ?? 0).toFixed(2)}` },
    { label: "Wallet Spending", value: `$${(fp.total_spend_usd ?? 0).toFixed(2)}` },
    { label: "PPV Revenue", value: `$${(r.ppv_revenue ?? 0).toFixed(2)}` },
    { label: "Fanclub Revenue", value: `$${(r.fanclub_revenue ?? 0).toFixed(2)}` },
    { label: "Refunds", value: `$${(r.refunds ?? 0).toFixed(2)}` },
    { label: "Average Order Value", value: `$${(r.average_order_value ?? 0).toFixed(2)}` },
    { label: "Largest Purchase", value: `$${(r.largest_purchase ?? 0).toFixed(2)}` },
    { label: "Total Purchases", value: r.total_purchases ?? 0 },
  ];
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Dashboard</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rows.map(x => (
          <div key={x.label}>
            <p className="text-xs text-muted-foreground mb-0.5">{x.label}</p>
            <p className="text-sm font-medium text-foreground">{x.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}