import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFleshPayBeta } from "@/hooks/useFleshPayBeta";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import FlashPayWalletCard from "@/components/clientDashboard/FlashPayWalletCard";

const sourceLabel = (entry) => {
  const t = entry.source_type || entry.reference_type || "";
  const m = { topup: "Top-up", ppv_unlock: "PPV Unlock", fanclub: "Fanclub", guest_production_deposit: "Guest Production", manual_adjustment: "Adjustment", refund: "Refund" };
  return m[t] || t || "Transaction";
};

export default function WalletTab({ setActiveTab }) {
  const { isAuthenticated } = useAuth();
  const { enabled: betaEnabled, loading: betaLoading } = useFleshPayBeta(isAuthenticated);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!betaLoading && betaEnabled) {
      loadWallet();
    } else if (!betaLoading) {
      setLoading(false);
    }
  }, [betaLoading, betaEnabled]);

  const loadWallet = async () => {
    try {
      const res = await base44.functions.invoke("getFleshPayWallet", {});
      setLedger((res.data.ledger || []).slice(0, 5));
    } catch {}
    setLoading(false);
  };

  if (loading) return <Skeleton className="w-full h-48 rounded-3xl" />;

  return (
    <div className="space-y-4">
      {/* FlashPay Wallet (external, Phase 1: balance + top-up only) — always visible to logged-in users */}
      <FlashPayWalletCard />

      {/* Recent Transactions (internal FleshPay beta ledger, if any) */}
      {ledger.length > 0 && (
        <div className="rounded-3xl bg-[#0d0d0d] border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-3.5">
            <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Recent</h3>
          </div>
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
        </div>
      )}
    </div>
  );
}