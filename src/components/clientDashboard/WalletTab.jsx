import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFleshPayBeta } from "@/hooks/useFleshPayBeta";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight, Plus, ExternalLink, Lock } from "lucide-react";

const FLESHPAY_LOGO = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/ec86d07a5_generated_image.png";

const sourceLabel = (entry) => {
  const t = entry.source_type || entry.reference_type || "";
  const m = { topup: "Top-up", ppv_unlock: "PPV Unlock", fanclub: "Fanclub", guest_production_deposit: "Guest Production", manual_adjustment: "Adjustment", refund: "Refund" };
  return m[t] || t || "Transaction";
};

export default function WalletTab({ setActiveTab }) {
  const { isAuthenticated } = useAuth();
  const { enabled: betaEnabled, loading: betaLoading } = useFleshPayBeta(isAuthenticated);
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadWallet(); }, []);

  const loadWallet = async () => {
    try {
      const res = await base44.functions.invoke("getFleshPayWallet", {});
      setWallet(res.data.wallet);
      setLedger((res.data.ledger || []).slice(0, 5));
    } catch {}
    setLoading(false);
  };

  if (betaLoading) return <Skeleton className="w-full h-48 rounded-3xl" />;

  if (!betaEnabled) {
    return (
      <div className="rounded-3xl bg-[#0d0d0d] border border-white/[0.08] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">FleshPay Wallet is currently in private beta.</h3>
        <p className="text-white/45 text-sm mb-1">Your account is not enabled yet.</p>
        <p className="text-white/45 text-sm mb-6">You can continue using regular crypto checkout.</p>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            className="border-white/[0.12] text-white/70 hover:bg-white/[0.06]"
            onClick={() => setActiveTab?.("payments")}
          >
            Back to Payments
          </Button>
          <Link to="/fanclub">
            <Button className="bg-primary hover:bg-primary/90 text-white font-bold">Browse Fanclub</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <Skeleton className="w-full h-48 rounded-3xl" />;

  const balance = wallet?.balance_usd || 0;

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0d0d0d] border border-white/[0.08]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/[0.05] to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <img src={FLESHPAY_LOGO} alt="" className="w-9 h-9 rounded-lg opacity-75" />
              <div>
                <p className="text-[10px] text-white/45 uppercase tracking-widest font-semibold">FleshPay</p>
                <p className="text-2xl font-black text-white mt-0.5">${balance.toFixed(2)}</p>
              </div>
            </div>
            <span className="text-[9px] text-primary/70 bg-primary/[0.08] px-2 py-1 rounded-full font-bold uppercase tracking-wider">Beta</span>
          </div>

          {wallet?.last_transaction_at && (
            <p className="text-[10px] text-white/30 mb-4">Last activity {new Date(wallet.last_transaction_at).toLocaleDateString()}</p>
          )}

          <div className="flex gap-2">
            <Link to="/wallet" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-10 rounded-xl text-xs gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Funds</Button>
            </Link>
            <Link to="/wallet">
              <Button variant="outline" size="sm" className="h-10 gap-1 border-white/[0.08] hover:bg-white/[0.04] text-white/45 rounded-xl text-xs"><ExternalLink className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
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