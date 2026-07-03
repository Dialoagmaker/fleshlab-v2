export default function WalletKpiPanel({ data }) {
  if (!data) return null;
  const split = data.wallet_vs_crypto_split || { wallet_purchases: 0, crypto_purchases: 0 };
  const total = split.wallet_purchases + split.crypto_purchases;
  const walletPct = total ? Math.round((split.wallet_purchases / total) * 100) : 0;

  const cards = [
    { label: "Today's Wallet Topups", value: `$${(data.today_wallet_topups_usd ?? 0).toFixed(2)}` },
    { label: "Today's Wallet Revenue", value: `$${(data.today_wallet_revenue_usd ?? 0).toFixed(2)}` },
    { label: "Today's Wallet Spend Count", value: data.today_wallet_spend_count ?? 0 },
    { label: "Average Wallet Balance", value: `$${(data.average_wallet_balance_usd ?? 0).toFixed(2)}` },
    { label: "Wallet Conversion Rate", value: data.wallet_conversion_rate !== null ? `${data.wallet_conversion_rate}%` : "—" },
    { label: "Wallet vs Crypto Split (30d)", value: `${split.wallet_purchases} / ${split.crypto_purchases} (${walletPct}% wallet)` },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">FlashPay Wallet KPIs</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label}>
            <p className="text-xs text-muted-foreground mb-0.5">{c.label}</p>
            <p className="text-lg font-semibold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}