import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFleshPayBeta } from "@/hooks/useFleshPayBeta";
import SEOMeta from "@/components/SEOMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Plus, Loader2,
  Clock, CheckCircle2, XCircle, Sparkles, Zap, Flame, Crown,
  CircleDollarSign, History
} from "lucide-react";

const TOPUP_OPTIONS = [
  { amount: 10,  label: "Starter",     icon: Sparkles,  gradient: "from-indigo-500/20 to-purple-500/20",  border: "border-indigo-500/30",  glow: "shadow-indigo-500/10" },
  { amount: 25,  label: "Popular",     icon: Zap,        gradient: "from-primary/20 to-rose-500/20",        border: "border-primary/30",     glow: "shadow-primary/20" },
  { amount: 50,  label: "Fan Pack",    icon: Flame,      gradient: "from-orange-500/20 to-red-500/20",      border: "border-orange-500/30",   glow: "shadow-orange-500/10" },
  { amount: 100, label: "Power User", icon: Crown,      gradient: "from-amber-500/20 to-yellow-500/20",    border: "border-amber-500/30",    glow: "shadow-amber-500/10" },
];

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatShortDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const StatusBadge = ({ status }) => {
  const config = {
    completed: { icon: CheckCircle2, classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    pending:   { icon: Clock,        classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    paid:      { icon: CheckCircle2, classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    failed:    { icon: XCircle,      classes: "bg-red-500/10 text-red-400 border-red-500/20" },
    expired:   { icon: XCircle,      classes: "bg-red-500/10 text-red-400 border-red-500/20" },
    reversed:  { icon: XCircle,      classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  }[status] || { icon: Clock, classes: "bg-muted text-muted-foreground border-border" };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${config.classes}`}>
      <Icon className="w-3 h-3" />{status}
    </span>
  );
};

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

export default function WalletPage() {
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  const { enabled: betaEnabled, loading: betaLoading } = useFleshPayBeta(isAuthenticated);
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(null);

  useEffect(() => {
    if (!authChecked || isLoadingAuth) return;
    if (!isAuthenticated) {
      window.location.href = "/login?next=" + encodeURIComponent("/wallet");
      return;
    }
    loadWallet();
  }, [authChecked, isLoadingAuth, isAuthenticated]);

  const loadWallet = async () => {
    try {
      const res = await base44.functions.invoke("getFleshPayWallet", {});
      setWallet(res.data.wallet);
      setLedger(res.data.ledger || []);
    } catch (err) {
      console.error("Failed to load wallet:", err);
    }
    setLoading(false);
  };

  const handleTopup = async (amount) => {
    setToppingUp(amount);
    try {
      const res = await base44.functions.invoke("createFleshPayTopup", { amount_usd: amount });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (err) {
      console.error("Top-up failed:", err);
    }
    setToppingUp(null);
  };

  if (!authChecked || isLoadingAuth || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="w-full h-48 rounded-2xl" />
          <Skeleton className="w-full h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (betaLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="w-full h-48 rounded-2xl" />
          <Skeleton className="w-full h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!betaEnabled) {
    return (
      <>
        <SEOMeta title="FleshPay | FLESHLAB" noIndex={true} />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="bg-card/80 backdrop-blur-xl border-white/5 max-w-md w-full">
            <CardContent className="p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">FleshPay Beta</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                FleshPay is currently in limited beta and not yet available for your account.
                Please check back soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const balance = wallet?.balance_usd || 0;

  return (
    <>
      <SEOMeta title="FleshPay Wallet | FLESHLAB" noIndex={true} />
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

          {/* ── Hero Balance Card ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0a0f] via-[#12080c] to-[#0a0a0a] border border-primary/20 shadow-2xl shadow-primary/5">
            {/* Glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-6 sm:p-8">
              {/* Header row */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground">FleshPay Balance</h1>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] uppercase tracking-wider px-2 py-0.5">
                    Beta
                  </Badge>
                  {wallet?.status && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {wallet.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Balance */}
              <p className="text-white/40 text-xs font-medium mb-1 uppercase tracking-widest">Available Balance</p>
              <p className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                ${balance.toFixed(2)}
              </p>

              {/* Subtitle and last transaction */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-white/40 text-xs leading-relaxed max-w-xs">
                  Top up your balance and use it instantly to unlock FLESHLAB videos.
                </p>
                {wallet?.last_transaction_at && (
                  <p className="text-white/25 text-[11px] shrink-0">
                    Last transaction: {formatDate(wallet.last_transaction_at)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Add Funds ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CircleDollarSign className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Add Funds</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TOPUP_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = toppingUp === opt.amount;
                return (
                  <button
                    key={opt.amount}
                    onClick={() => handleTopup(opt.amount)}
                    disabled={toppingUp !== null}
                    className={`
                      relative group overflow-hidden rounded-xl border p-4 text-left transition-all duration-300
                      bg-gradient-to-br ${opt.gradient} ${opt.border}
                      hover:shadow-lg hover:${opt.glow} hover:-translate-y-0.5
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                      ${isActive ? "ring-2 ring-primary/50 scale-[0.98]" : ""}
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
                        {opt.label}
                      </span>
                      <Icon className="w-4 h-4 text-white/30" />
                    </div>
                    <p className="text-2xl font-black text-white">
                      ${opt.amount}
                    </p>
                    {isActive && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 space-y-1">
              <p className="text-[11px] text-white/30 text-center">
                Crypto top-up via NOWPayments. More payment methods may be added later.
              </p>
              <p className="text-[11px] text-white/20 text-center">
                You will be redirected to NOWPayments to complete your top-up.
              </p>
            </div>
          </div>

          {/* ── Transaction History ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-white/50" />
              <h2 className="text-sm font-semibold text-foreground">Transaction History</h2>
              {ledger.length > 0 && (
                <span className="text-[11px] text-white/20 ml-auto">{ledger.length} entries</span>
              )}
            </div>

            {ledger.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-xl border-white/5">
                <CardContent className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <History className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-sm font-medium text-white/40 mb-1">No transactions yet</p>
                  <p className="text-xs text-white/25">
                    Top up your balance to start unlocking videos.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/50 backdrop-blur-xl border-white/5 overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y divide-white/[0.04]">
                    {ledger.map((entry) => {
                      const isCredit = entry.entry_type === "credit";
                      const isSimulated = entry.metadata_json && (() => {
                        try { return JSON.parse(entry.metadata_json)?.test === true; } catch { return false; }
                      })();

                      return (
                        <div key={entry.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                          {/* Icon */}
                          <div className={`
                            w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                            ${isCredit ? "bg-emerald-500/10" : "bg-rose-500/10"}
                          `}>
                            {isCredit ? (
                              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-rose-400" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white truncate">
                                {entry.description || sourceTypeLabel(entry)}
                              </p>
                              {isSimulated && (
                                <span className="text-[10px] text-amber-400/70 bg-amber-500/10 px-1.5 py-0.5 rounded font-medium shrink-0">
                                  SIMULATED
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-white/25">
                                {formatShortDate(entry.created_date)}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-white/10" />
                              <span className="text-[11px] text-white/20">
                                {sourceTypeLabel(entry)}
                              </span>
                            </div>
                          </div>

                          {/* Amount + Status */}
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-bold ${
                              isCredit ? "text-emerald-400" : "text-rose-400"
                            }`}>
                              {isCredit ? "+" : "-"}${entry.amount_usd?.toFixed(2)}
                            </p>
                            <StatusBadge status={entry.status} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </div>
    </>
  );
}