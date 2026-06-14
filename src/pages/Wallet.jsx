import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFleshPayBeta } from "@/hooks/useFleshPayBeta";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownLeft, ArrowUpRight, Loader2, Sparkles, Zap, Flame, Crown,
  Clock, CheckCircle2, XCircle, TrendingUp, Wallet, Activity,
} from "lucide-react";

const TOPUP_OPTIONS = [
  { amount: 10,  label: "Starter",    icon: Sparkles, highlight: false },
  { amount: 25,  label: "Popular",    icon: Zap,      highlight: true },
  { amount: 50,  label: "Fan Pack",   icon: Flame,    highlight: false },
  { amount: 100, label: "Power User", icon: Crown,    highlight: false },
];

const FLESHPAY_LOGO = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/ec86d07a5_generated_image.png";

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const fmtShort = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const fmtTime = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const sourceLabel = (entry) => {
  const t = entry.source_type || entry.reference_type || "";
  const m = { topup: "Top-up", ppv_unlock: "PPV Unlock", fanclub: "Fanclub", guest_production_deposit: "Guest Production", manual_adjustment: "Adjustment", refund: "Refund" };
  return m[t] || t || "Transaction";
};

const StatusBadge = ({ status }) => {
  const c = {
    completed: { icon: CheckCircle2, cls: "text-emerald-400 bg-emerald-500/10" },
    pending:   { icon: Clock,        cls: "text-amber-400 bg-amber-500/10" },
    paid:      { icon: CheckCircle2, cls: "text-emerald-400 bg-emerald-500/10" },
    failed:    { icon: XCircle,      cls: "text-red-400 bg-red-500/10" },
    expired:   { icon: XCircle,      cls: "text-red-400 bg-red-500/10" },
    reversed:  { icon: XCircle,      cls: "text-red-400 bg-red-500/10" },
  }[status] || { icon: Clock, cls: "text-white/40 bg-white/5" };
  const Icon = c.icon;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${c.cls}`}><Icon className="w-3 h-3" />{status}</span>;
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
    if (!isAuthenticated) { window.location.href = "/login?next=" + encodeURIComponent("/wallet"); return; }
    loadWallet();
  }, [authChecked, isLoadingAuth, isAuthenticated]);

  const loadWallet = async () => {
    try {
      const res = await base44.functions.invoke("getFleshPayWallet", {});
      setWallet(res.data.wallet);
      setLedger(res.data.ledger || []);
    } catch (e) { console.error("Failed to load wallet:", e); }
    setLoading(false);
  };

  const handleTopup = async (amount) => {
    setToppingUp(amount);
    try {
      const res = await base44.functions.invoke("createFleshPayTopup", { amount_usd: amount });
      if (res.data?.checkoutUrl) window.location.href = res.data.checkoutUrl;
    } catch (e) { console.error("Top-up failed:", e); }
    setToppingUp(null);
  };

  if (!authChecked || isLoadingAuth || loading || betaLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="w-full max-w-[1200px] space-y-6">
          <Skeleton className="w-full h-80 rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            <Skeleton className="h-96 rounded-3xl" />
            <div className="space-y-6"><Skeleton className="h-72 rounded-3xl" /><Skeleton className="h-48 rounded-3xl" /></div>
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
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
          <div className="bg-[#0d0d0d] border border-white/[0.08] max-w-md w-full rounded-3xl p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">FleshPay Beta</h2>
            <p className="text-white/40 text-sm">FleshPay is in limited beta and not yet available for your account.</p>
          </div>
        </div>
      </>
    );
  }

  const balance = wallet?.balance_usd || 0;

  return (
    <>
      <SEOMeta title="FleshPay Wallet | FLESHLAB" noIndex={true} />
      <div className="min-h-screen bg-[#050505]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* ═══════ HERO ═══════ */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f0a0a] via-[#0c0808] to-[#080808] border border-white/[0.08]">
            {/* Glow effects */}
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
            {/* Subtle grid */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

            <div className="relative p-8 sm:p-10 lg:p-12">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

                {/* Left: balance info */}
                <div className="flex-1">
                  {/* Brand row */}
                  <div className="flex items-center gap-3 mb-6">
                    <img src={FLESHPAY_LOGO} alt="FleshPay" className="w-12 h-12 rounded-2xl ring-1 ring-white/[0.1]" />
                    <div>
                      <h1 className="text-xl font-bold text-white tracking-tight">FleshPay</h1>
                      <p className="text-xs text-white/40">Your FLESHLAB digital wallet</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-[0.15em] text-primary/80 bg-primary/[0.08] px-2.5 py-1 rounded-full font-bold">Beta</span>
                      {wallet?.status === "active" && (
                        <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Balance */}
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-semibold mb-2">Available Balance</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter">${Math.floor(balance)}</span>
                      <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-white/25 tracking-tighter">.{(balance % 1).toFixed(2).slice(2)}</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-white/[0.06]">
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Lifetime Top-ups</p>
                      <p className="text-sm font-bold text-white">${wallet?.lifetime_topups_usd?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Total Spent</p>
                      <p className="text-sm font-bold text-white">${wallet?.lifetime_spends_usd?.toFixed(2) || "0.00"}</p>
                    </div>
                    {wallet?.last_transaction_at && (
                      <>
                        <div className="w-px h-8 bg-white/[0.06]" />
                        <div>
                          <p className="text-[10px] text-white/30 uppercase tracking-wider">Last Activity</p>
                          <p className="text-sm font-bold text-white/60">{fmtDate(wallet.last_transaction_at)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: visual card */}
                <div className="lg:w-72 shrink-0">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative space-y-4">
                      <div className="flex items-center justify-between">
                        <img src={FLESHPAY_LOGO} alt="" className="w-8 h-8 rounded-lg opacity-80" />
                        <span className="text-[9px] font-bold text-primary/60 uppercase tracking-widest bg-black/30 px-2 py-1 rounded-lg">BETA</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Wallet Balance</p>
                        <p className="text-2xl font-black text-white">${balance.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <p className="text-[10px] text-emerald-400/80 font-medium">Top up once. Unlock instantly.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ═══════ 2-COLUMN CONTENT ═══════ */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

            {/* ── LEFT COLUMN: Activity ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-white/50" />
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Recent Activity</h2>
                </div>
                {ledger.length > 0 && <span className="text-xs text-white/25">{ledger.length} transactions</span>}
              </div>

              {ledger.length === 0 ? (
                <div className="rounded-3xl bg-[#0d0d0d] border border-white/[0.06] p-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-7 h-7 text-white/10" />
                  </div>
                  <p className="text-white/40 font-medium mb-1">No transactions yet</p>
                  <p className="text-white/20 text-sm">Top up your balance to start unlocking videos.</p>
                </div>
              ) : (
                <div className="rounded-3xl bg-[#0d0d0d] border border-white/[0.06] overflow-hidden">
                  {ledger.map((entry, idx) => {
                    const isCredit = entry.entry_type === "credit";
                    const isSimulated = (() => { try { return JSON.parse(entry.metadata_json || "{}")?.test === true; } catch { return false; } })();

                    return (
                      <div key={entry.id} className={`flex items-center gap-4 px-5 sm:px-6 py-4.5 hover:bg-white/[0.02] transition-colors ${idx !== ledger.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                          {isCredit ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> : <ArrowUpRight className="w-4 h-4 text-rose-400" />}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white/80 truncate">{entry.description || sourceLabel(entry)}</p>
                            {isSimulated && <span className="text-[9px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">SIM</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-white/30">{fmtShort(entry.created_date)}</span>
                            <span className="text-[11px] text-white/30">{fmtTime(entry.created_date)}</span>
                            <span className="w-1 h-1 rounded-full bg-white/[0.1]" />
                            <span className="text-[11px] text-white/25">{sourceLabel(entry)}</span>
                          </div>
                        </div>
                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold ${isCredit ? "text-emerald-400" : "text-rose-400"}`}>
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

            {/* ── RIGHT COLUMN: Add Funds + Info ── */}
            <div className="space-y-6">
              {/* Add Funds */}
              <div className="rounded-3xl bg-[#0d0d0d] border border-white/[0.08] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Add Funds</h2>
                </div>

                <div className="space-y-2.5">
                  {TOPUP_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = toppingUp === opt.amount;
                    return (
                      <button
                        key={opt.amount}
                        onClick={() => handleTopup(opt.amount)}
                        disabled={toppingUp !== null}
                        className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 text-left
                          ${opt.highlight
                            ? "bg-primary/[0.06] border border-primary/25 hover:bg-primary/[0.1] hover:border-primary/35"
                            : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]"
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${isActive ? "ring-2 ring-primary/40" : ""}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${opt.highlight ? "bg-primary/15" : "bg-white/[0.04]"}`}>
                          <Icon className={`w-4 h-4 ${opt.highlight ? "text-primary" : "text-white/30"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-white">${opt.amount}</p>
                          <p className="text-[10px] text-white/35 font-medium uppercase tracking-wider">{opt.label}</p>
                        </div>
                        {opt.highlight && (
                          <span className="text-[9px] text-primary font-bold uppercase tracking-widest bg-primary/[0.1] px-2 py-1 rounded-lg">Best</span>
                        )}
                        {isActive && (
                          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-1.5">
                  <p className="text-[11px] text-white/25 text-center">Crypto top-up via NOWPayments</p>
                  <p className="text-[10px] text-white/15 text-center">You'll be redirected to complete your top-up.</p>
                  <p className="text-[10px] text-white/10 text-center">More payment methods may be added later.</p>
                </div>
              </div>

              {/* About */}
              <div className="rounded-3xl bg-[#0d0d0d] border border-white/[0.06] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <img src={FLESHPAY_LOGO} alt="" className="w-6 h-6 rounded-lg opacity-60" />
                  <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">About FleshPay</span>
                </div>
                <p className="text-[11px] text-white/25 leading-relaxed">
                  FleshPay is your FLESHLAB digital wallet. Top up with crypto and use your balance to instantly unlock premium videos. No credit cards. Instant access.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}