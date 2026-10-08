import { ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";

const typeLabel = (entry) => {
  const t = entry.transaction_type || entry.source_type || entry.reference_type || "";
  const labels = {
    deposit: "Deposit",
    video_purchase: "Video purchase",
    subscription_purchase: "Subscription",
    fanclub_purchase: "Fanclub",
    tip: "Tip",
    refund: "Refund",
    reversal: "Reversal",
    bonus: "Bonus",
    adjustment: "Adjustment",
    topup: "Top-up",
    ppv_unlock: "Video purchase",
  };
  return labels[t] || t || "Transaction";
};

export default function WalletActivity({ ledger = [], showAll = false }) {
  const rows = showAll ? ledger : ledger.slice(0, 5);

  return (
    <div className="overflow-hidden rounded-3xl bg-[#0d0d0d]">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Transaction History</h3>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-white/70">No transactions yet</p>
          <p className="text-xs text-white/30 max-w-xs">Deposits, purchases, refunds and adjustments will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {rows.map((entry) => {
            const isCredit = (entry.direction || entry.entry_type) === "credit";
            const amount = entry.amount ?? entry.amount_usd ?? 0;
            return (
              <div key={entry.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                  {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{entry.description || typeLabel(entry)}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">
                    {new Date(entry.completed_at || entry.created_date).toLocaleDateString()}
                    <span className="mx-1.5 text-white/[0.08]">·</span>
                    {typeLabel(entry)}
                    <span className="mx-1.5 text-white/[0.08]">·</span>
                    {entry.status}
                  </p>
                </div>
                <p className={`text-xs font-bold shrink-0 ${isCredit ? "text-emerald-400" : "text-rose-400"}`}>
                  {isCredit ? "+" : "−"}${Number(amount || 0).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}