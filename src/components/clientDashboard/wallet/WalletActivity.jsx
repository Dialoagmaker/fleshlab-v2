import { ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";

const sourceLabel = (entry) => {
  const t = entry.source_type || entry.reference_type || "";
  const m = { topup: "Top-up", ppv_unlock: "PPV Unlock", fanclub: "Fanclub", guest_production_deposit: "Guest Production", manual_adjustment: "Adjustment", refund: "Refund" };
  return m[t] || t || "Transaction";
};

export default function WalletActivity({ ledger }) {
  return (
    <div className="rounded-3xl bg-[#0d0d0d] border border-white/[0.08] overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Recent Activity</h3>
        <button className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors">View All</button>
      </div>

      {ledger.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <FileText className="w-5 h-5 text-white/30" />
          </div>
          <p className="text-sm font-semibold text-white/70">No transactions yet</p>
          <p className="text-xs text-white/30 max-w-xs">
            When you top up your wallet your transaction history will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {ledger.map((entry) => {
            const isCredit = entry.entry_type === "credit";
            return (
              <div key={entry.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                  {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{entry.description || sourceLabel(entry)}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">
                    {new Date(entry.created_date).toLocaleDateString()}
                    <span className="mx-1.5 text-white/[0.08]">·</span>
                    {sourceLabel(entry)}
                  </p>
                </div>
                <p className={`text-xs font-bold shrink-0 ${isCredit ? "text-emerald-400" : "text-rose-400"}`}>
                  {isCredit ? "+" : "−"}${entry.amount_usd?.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}