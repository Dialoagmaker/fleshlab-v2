import { Wallet } from "lucide-react";

export default function FlashPaySummaryCard({ financials }) {
  const fp = financials?.flashpay || {};
  const rows = [
    { label: "Wallet Status", value: fp.wallet_exists ? (fp.status || "active") : "No Wallet" },
    { label: "Current Balance", value: `$${(fp.balance_usd ?? 0).toFixed(2)}` },
    { label: "Available Balance", value: `$${(fp.balance_usd ?? 0).toFixed(2)}` },
    { label: "Total Topups", value: `$${(fp.total_topups_usd ?? 0).toFixed(2)}` },
    { label: "Total Spending", value: `$${(fp.total_spend_usd ?? 0).toFixed(2)}` },
    { label: "Topup Count", value: fp.topup_count ?? 0 },
    { label: "Spend Count", value: fp.spend_count ?? 0 },
    { label: "Last Topup", value: fp.last_topup_at ? new Date(fp.last_topup_at).toLocaleDateString() : "—" },
    { label: "Last Spend", value: fp.last_spend_at ? new Date(fp.last_spend_at).toLocaleDateString() : "—" },
    { label: "Wallet Created", value: fp.wallet_created_at ? new Date(fp.wallet_created_at).toLocaleDateString() : "—" },
    { label: "Daily Limit", value: "—" },
    { label: "Monthly Limit", value: "—" },
    { label: "Maximum Balance", value: "—" },
  ];
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-primary" /> FlashPay Summary
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rows.map(r => (
          <div key={r.label}>
            <p className="text-xs text-muted-foreground mb-0.5">{r.label}</p>
            <p className="text-sm font-medium text-foreground">{r.value}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">Display only — wallet cannot be edited from here.</p>
    </div>
  );
}