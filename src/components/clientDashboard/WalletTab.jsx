import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFleshPayBeta } from "@/hooks/useFleshPayBeta";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownLeft, ArrowUpRight, Plus, ExternalLink,
} from "lucide-react";

const FLESHPAY_LOGO = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/ec86d07a5_generated_image.png";

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

  if (betaLoading) return <Skeleton className="w-full h-48 rounded-3xl" />;
  if (!betaEnabled) return null;
  if (loading) return <Skeleton className="w-full h-48 rounded-3xl" />;

  const balance = wallet?.balance_usd || 0;

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/[0.06]">
        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <img src={FLESHPAY_LOGO} alt="" className="w-7 h-7 rounded-lg opacity-70" />
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">FleshPay</p>
                <p className="text-2xl font-black text-white mt-0.5">${balance.toFixed(2)}</p>
              </div>
            </div>
            <span className="text-[9px] text-primary/50 bg-primary/[0.06] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
              Beta
            </span>
          </div>

          {wallet?.last_transaction_at && (
            <p className="text-[10px] text-white/15 mb-4">
              Last activity {new Date(wallet.last_transaction_at).toLocaleDateString()}
            </p>
          )}

          <div className="flex gap-2">
            <Link to="/wallet" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-10 rounded-xl text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Funds
              </Button>
            </Link>
            <Link to="/wallet">
              <Button variant="outline" size="sm" className="h-10 gap-1 border-white/[0.06] hover:bg-white/[0.03] text-white/30 rounded-xl text-xs">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {ledger.length > 0 && (
        <div className="rounded-3xl bg-[#0a0a0a] border border-white/[0.04] overflow-hidden">
          <div className="px-5 py-3.5">
            <h3 className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Recent</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {ledger.map((entry) => {
              const isCredit = entry.entry_type === "credit";
              return (
                <div key={entry.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.015] transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isCredit ? "bg-emerald-500/[0.08]" : "bg-rose-500/[0.06]"
                  }`}>
                    {isCredit ? (
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/70 truncate">
                      {entry.description || sourceTypeLabel(entry)}
                    </p>
                    <p className="text-[10px] text-white/15 mt-0.5">
                      {new Date(entry.created_date).toLocaleDateString()}
                      <span className="mx-1.5 text-white/[0.06]">·</span>
                      {sourceTypeLabel(entry)}
                    </p>
                  </div>
                  <p className={`text-xs font-bold shrink-0 ${
                    isCredit ? "text-emerald-400" : "text-rose-400"
                  }`}>
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