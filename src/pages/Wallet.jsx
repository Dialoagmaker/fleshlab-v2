import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFleshPayBeta } from "@/hooks/useFleshPayBeta";
import SEOMeta from "@/components/SEOMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownLeft, ArrowUpRight, Loader2,
  Clock, CheckCircle2, XCircle, Sparkles, Zap, Flame, Crown,
} from "lucide-react";

const TOPUP_OPTIONS = [
  { amount: 10,  label: "Starter",    icon: Sparkles, highlight: false },
  { amount: 25,  label: "Popular",    icon: Zap,      highlight: true },
  { amount: 50,  label: "Fan Pack",   icon: Flame,    highlight: false },
  { amount: 100, label: "Power User", icon: Crown,    highlight: false },
];

const FLESHPAY_LOGO = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/ec86d07a5_generated_image.png";

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatShort = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatTime = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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

const sourceTypeIcon = (entry) => {
  const type = entry.source_type || entry.reference_type || "";
  const icons = {
    topup: ArrowDownLeft,
    ppv_unlock: ArrowUpRight,
    manual_adjustment: ArrowUpRight,
    refund: ArrowDownLeft,
  };
  return icons[type] || ArrowUpRight;
};

const StatusBadge = ({ status }) => {
  const config = {
    completed: { icon: CheckCircle2, classes: "text-emerald-400" },
    pending:   { icon: Clock,        classes: "text-amber-400" },
    paid:      { icon: CheckCircle2, classes: "text-emerald-400" },
    failed:    { icon: XCircle,      classes: "text-red-400" },
    expired:   { icon: XCircle,      classes: "text-red-400" },
    reversed:  { icon: XCircle,      classes: "text-red-400" },
  }[status] || { icon: Clock, classes: "text-white/30" };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${config.classes}`}>
      <Icon className="w-3 h-3" />{status}
    </span>
  );
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

  if (!authChecked || isLoadingAuth || loading || betaLoading) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="w-full h-72 rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!betaEnabled) {
    return (
      <>
        <SEOMeta title="FleshPay | FLESHLAB" noIndex={true} />
        <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
          <Card className="bg-[#0a0a0a] border-white/[0.06] max-w-md w-full rounded-3xl">
            <CardContent className="p-10 text-center">
              <img src={FLESHPAY_LOGO} alt="FleshPay" className="w-14 h-14 mx-auto mb-6 rounded-2xl opacity-60" />
              <h2 className="text-xl font-bold text-white mb-2">FleshPay Beta</h2>
              <p className="text-white/30 text-sm leading-relaxed">
                FleshPay is currently in limited beta and not yet available for your account.
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
      <div className="min-h-screen bg-[#060606]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">

          {/* ═══════ HERO CARD ═══════ */}
          <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/[0.06]">
            {/* Background glow effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-primary/[0.03] pointer-events-none" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.06] to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-gradient-to-tr from-primary/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "24px 24px"
            }} />

            <div className="relative p-6 sm:p-8 lg:p-10">
              {/* Top bar: logo + badges */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <img src={FLESHPAY_LOGO} alt="FleshPay" className="w-10 h-10 rounded-xl ring-1 ring-white/[0.08]" />
                  <div>
                    <h1 className="text-lg font-bold text-white tracking-tight">FleshPay</h1>
                    <p className="text-[11px] text-white/25 font-medium">Digital Wallet</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-primary/70 bg-primary/[0.08] px-2.5 py-1 rounded-full font-bold">
                    Beta
                  </span>
                  {wallet?.status === "active" && (
                    <span className="flex items-center gap-1.5 text-[11px] text-emerald-400/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
              </div>

              {/* Balance display */}
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/20 font-semibold mb-3">
                  Available Balance
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-white/30 text-3xl font-light">$</span>
                  <span className="text-6xl sm:text-7xl lg:text-8xl font-black text-white tracking-tighter">
                    {Math.floor(balance)}
                  </span>
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-white/30 tracking-tighter">
                    .{(balance % 1).toFixed(2).slice(2)}
                  </span>
                </div>
              </div>

              {/* Bottom info row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-white/[0.04]">
                <div className="flex items-center gap-6 text-xs text-white/20">
                  {wallet?.lifetime_topups_usd > 0 && (
                    <span>
                      <span className="text-white/40">Lifetime top-ups</span>{" "}
                      <span className="text-white/60 font-semibold">${wallet.lifetime_topups_usd?.toFixed(2)}</span>
                    </span>
                  )}
                  {wallet?.lifetime_spends_usd > 0 && (
                    <span>
                      <span className="text-white/40">Total spent</span>{" "}
                      <span className="text-white/60 font-semibold">${wallet.lifetime_spends_usd?.toFixed(2)}</span>
                    </span>
                  )}
                </div>
                {wallet?.last_transaction_at && (
                  <span className="text-[11px] text-white/15">
                    Last activity {formatDate(wallet.last_transaction_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ═══════ 2-COLUMN CONTENT ═══════ */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

            {/* ── LEFT: Transaction History ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Activity</h2>
                {ledger.length > 0 && (
                  <span className="text-[11px] text-white/15">{ledger.length} transactions</span>
                )}
              </div>

              {ledger.length === 0 ? (
                <div className="rounded-3xl bg-[#0a0a0a] border border-white/[0.04] p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-white/25 mb-1">No transactions yet</p>
                  <p className="text-xs text-white/12">Top up your balance to start unlocking videos.</p>
                </div>
              ) : (
                <div className="rounded-3xl bg-[#0a0a0a] border border-white/[0.04] overflow-hidden">
                  {ledger.map((entry, idx) => {
                    const isCredit = entry.entry_type === "credit";
                    const TypeIcon = sourceTypeIcon(entry);
                    const isSimulated = entry.metadata_json && (() => {
                      try { return JSON.parse(entry.metadata_json)?.test === true; } catch { return false; }
                    })();

                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-white/[0.015] transition-colors ${
                          idx !== ledger.length - 1 ? "border-b border-white/[0.03]" : ""
                        }`}
                      >
                        {/* Icon */}
                        <div className={`
                          w-10 h-10 rounded-2xl flex items-center justify-center shrink-0
                          ${isCredit ? "bg-emerald-500/[0.08]" : "bg-rose-500/[0.06]"}
                        `}>
                          <TypeIcon className={`w-4 h-4 ${isCredit ? "text-emerald-400" : "text-rose-400"}`} />
                        </div>

                        {/* Description */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {entry.description || sourceTypeLabel(entry)}
                            </p>
                            {isSimulated && (
                              <span className="text-[9px] text-amber-400/60 bg-amber-500/[0.08] px-1.5 py-0.5 rounded font-bold shrink-0 uppercase tracking-wider">
                                Sim
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-white/15">{formatShort(entry.created_date)}</span>
                            <span className="text-[11px] text-white/15">{formatTime(entry.created_date)}</span>
                            <span className="w-1 h-1 rounded-full bg-white/[0.06]" />
                            <span className="text-[11px] text-white/12">{sourceTypeLabel(entry)}</span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold tracking-tight ${
                            isCredit ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {isCredit ? "+" : "−"}${entry.amount_usd?.toFixed(2)}
                          </p>
                          <StatusBadge status={entry.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── RIGHT: Add Funds ── */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Add Funds</h2>

              <div className="rounded-3xl bg-[#0a0a0a] border border-white/[0.04] p-5 space-y-3">
                {TOPUP_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = toppingUp === opt.amount;
                  return (
                    <button
                      key={opt.amount}
                      onClick={() => handleTopup(opt.amount)}
                      disabled={toppingUp !== null}
                      className={`
                        w-full group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left
                        ${opt.highlight
                          ? "bg-primary/[0.08] border border-primary/20 hover:bg-primary/[0.12] hover:border-primary/30"
                          : "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]"
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${isActive ? "ring-2 ring-primary/30" : ""}
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-2xl flex items-center justify-center shrink-0
                        ${opt.highlight ? "bg-primary/15" : "bg-white/[0.04]"}
                      `}>
                        <Icon className={`w-4 h-4 ${opt.highlight ? "text-primary" : "text-white/25"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-white">${opt.amount}</p>
                        <p className="text-[10px] text-white/25 font-medium uppercase tracking-wider">{opt.label}</p>
                      </div>
                      {opt.highlight && (
                        <span className="text-[9px] text-primary/60 font-bold uppercase tracking-widest bg-primary/[0.08] px-2 py-1 rounded-lg">
                          Best Value
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        </div>
                      )}
                    </button>
                  );
                })}

                <div className="pt-3 space-y-1.5">
                  <p className="text-[10px] text-white/15 text-center leading-relaxed">
                    Crypto top-up via NOWPayments
                  </p>
                  <p className="text-[10px] text-white/10 text-center">
                    You'll be redirected to complete your top-up.
                  </p>
                </div>
              </div>

              {/* About FleshPay card */}
              <div className="rounded-3xl bg-[#0a0a0a] border border-white/[0.04] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <img src={FLESHPAY_LOGO} alt="" className="w-5 h-5 rounded-lg opacity-60" />
                  <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">About FleshPay</span>
                </div>
                <p className="text-[11px] text-white/15 leading-relaxed">
                  FleshPay is your FLESHLAB digital wallet. Top up with crypto and use your balance to instantly unlock premium videos.
                  No credit cards. Instant access.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}