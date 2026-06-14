import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFleshPayBeta } from "@/hooks/useFleshPayBeta";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Plus, ExternalLink,
  CircleDollarSign, History
} from "lucide-react";

const sourceTypeLabel = (entry) => {
  const type = entry.source_type || entry.reference_type || "";
  const map = {
    topup: "Top-up",
    ppv_unlock: "PPV Unlock",
    fanclub: "Fanclub",
    guest_production_deposit: "Guest Production",
    manual_adjustment: "Adjustment",
    refund: "Refund",
  };
  return map[type] || type || "Transaction";
};

export default function WalletTab() {
  const { isAuthenticated } = useAuth();
  const { enabled: betaEnabled, loading: betaLoading } = useFleshPayBeta(isAuthenticated);
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const res = await base44.functions.invoke("getFleshPayWallet", {});
      setWallet(res.data.wallet);
      setLedger((res.data.ledger || []).slice(0, 5));
    } catch {
      // No wallet yet
    }
    setLoading(false);
  };

  if (betaLoading) {
    return <Skeleton className="w-full h-48 rounded-2xl" />;
  }

  if (!betaEnabled) return null;

  if (loading) {
    return <Skeleton className="w-full h-48 rounded-2xl" />;
  }

  const balance = wallet?.balance_usd || 0;

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0a0f] via-[#12080c] to-[#0a0a0a] border border-primary/20 shadow-xl shadow-primary/5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-medium">FleshPay Balance</p>
              </div>
              <p className="text-3xl font-black text-white mt-1">${balance.toFixed(2)}</p>
              {wallet?.last_transaction_at && (
                <p className="text-white/20 text-[11px] mt-2">
                  Last activity: {new Date(wallet.last_transaction_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Link to="/wallet" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-10 rounded-xl text-xs gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-3.5 h-3.5" /> Add Funds
              </Button>
            </Link>
            <Link to="/wallet">
              <Button variant="outline" size="sm" className="h-10 gap-1 border-white/[0.08] hover:bg-white/5 text-white/50 rounded-xl">
                <ExternalLink className="w-3.5 h-3.5" /> Wallet
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {ledger.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-white/30" />
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Recent Transactions</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {ledger.map((entry) => {
              const isCredit = entry.entry_type === "credit";
              return (
                <div key={entry.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className={`
                    w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                    ${isCredit ? "bg-emerald-500/10" : "bg-rose-500/10"}
                  `}>
                    {isCredit ? (
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {entry.description || sourceTypeLabel(entry)}
                    </p>
                    <p className="text-[10px] text-white/20 mt-0.5">
                      {new Date(entry.created_date).toLocaleDateString()}
                      <span className="mx-1.5 text-white/10">·</span>
                      {sourceTypeLabel(entry)}
                    </p>
                  </div>
                  <p className={`text-xs font-bold shrink-0 ${
                    isCredit ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {isCredit ? "+" : "-"}${entry.amount_usd?.toFixed(2)}
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