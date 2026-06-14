import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFleshPayBeta } from "@/hooks/useFleshPayBeta";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownLeft, ArrowUpRight, Loader2, Sparkles, Zap, Flame, Crown,
  Clock, CheckCircle2, XCircle, Wallet, Activity, Shield, Lock, Eye,
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
      <div className="w-full max-w-[1280px] space-y-6">
       <Skeleton className="w-full h-[520px] rounded-[2.5rem]" />
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" />
       </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[360px] rounded-[2rem]" />
          <Skeleton className="lg:col-span-2 h-[360px] rounded-[2rem]" />
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
       <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">

         {/* ═══════ HERO — Full-width product statement ═══════ */}
         <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#16080a] via-[#100606] to-[#060202] border border-white/[0.1]">
           {/* Ambient glow — stronger */}
           <div className="absolute -top-32 -right-32 w-[1000px] h-[1000px] bg-primary/[0.08] rounded-full blur-[150px] pointer-events-none" />
           <div className="absolute -bottom-32 left-1/4 w-[800px] h-[800px] bg-rose-600/[0.06] rounded-full blur-[150px] pointer-events-none" />
           <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px] pointer-events-none" />

           <div className="relative p-10 sm:p-16 lg:p-20">
             <div className="text-center space-y-10">

               {/* Logo + wordmark */}
               <div className="flex flex-col items-center gap-6">
                 <img src={FLESHPAY_LOGO} alt="FleshPay" className="w-28 sm:w-32 h-28 sm:h-32 rounded-[2rem] ring-1 ring-white/[0.14] shadow-[0_0_100px_rgba(220,38,38,0.12)]" />
                 <div>
                   <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight">FleshPay</h1>
                   <p className="text-base text-white/50 mt-2.5 font-medium">Your FLESHLAB Wallet</p>
                 </div>
               </div>

               {/* Subheadline */}
               <p className="text-white/55 text-lg font-medium max-w-md mx-auto">
                 Top up once. Unlock videos instantly.
               </p>

               {/* Balance — single unified number */}
               <div>
                 <p className="text-7xl sm:text-8xl md:text-9xl font-black text-white tabular-nums tracking-tight">
                   ${balance.toFixed(2)}
                 </p>
                 <p className="text-sm uppercase tracking-[0.2em] text-white/40 font-semibold mt-4">Available Balance</p>
               </div>

               {/* Status badges */}
               <div className="flex items-center justify-center gap-3">
                 <span className="text-xs uppercase tracking-[0.15em] text-primary bg-primary/[0.12] px-4 py-2 rounded-full font-bold">Beta</span>
                 {wallet?.status === "active" && (
                   <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/[0.08] px-4 py-2 rounded-full font-semibold">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                   </span>
                 )}
               </div>

               {/* Hero buttons */}
               <div className="flex items-center justify-center gap-4 pt-2">
                 <Button
                   onClick={() => document.getElementById("add-funds-section")?.scrollIntoView({ behavior: "smooth" })}
                   className="bg-primary hover:bg-primary/90 text-white font-bold h-14 px-12 rounded-2xl text-base gap-2 shadow-[0_0_50px_rgba(220,38,38,0.2)]"
                 >
                   <Wallet className="w-5 h-5" /> Add Funds
                 </Button>
                 <Button
                   variant="outline"
                   onClick={() => document.getElementById("activity-section")?.scrollIntoView({ behavior: "smooth" })}
                   className="h-14 px-12 rounded-2xl text-base font-medium border-white/[0.14] text-white/70 hover:text-white hover:bg-white/[0.05] gap-2"
                 >
                   <Activity className="w-5 h-5" /> View Activity
                 </Button>
               </div>

             </div>
           </div>
         </div>

          {/* ═══════ BENEFIT CARDS — 3-column row ═══════ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-[#0a0a0a] border border-white/[0.07] p-7 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/[0.12] flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-white/90">Ledger protected</p>
                <p className="text-xs text-white/45 leading-relaxed mt-1">Every transaction is tracked and auditable</p>
              </div>
            </div>
            <div className="rounded-2xl bg-[#0a0a0a] border border-white/[0.07] p-7 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/[0.12] flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-white/90">Instant unlocks</p>
                <p className="text-xs text-white/45 leading-relaxed mt-1">No waiting — access premium videos immediately</p>
              </div>
            </div>
            <div className="rounded-2xl bg-[#0a0a0a] border border-white/[0.07] p-7 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/[0.12] flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-white/90">Beta access</p>
                <p className="text-xs text-white/45 leading-relaxed mt-1">Early access — more features coming soon</p>
              </div>
            </div>
          </div>

          {/* ═══════ 3-CARD CONTENT GRID ═══════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── CARD A: Add Funds (2x2 grid) ── */}
            <div id="add-funds-section" className="lg:col-span-1">
              <div className="rounded-[2rem] bg-[#0a0a0a] border border-white/[0.06] p-6 h-full">
                <div className="flex items-center gap-2.5 mb-5">
                  <Wallet className="w-5 h-5 text-primary" />
                  <h2 className="text-[15px] font-bold text-white/80 uppercase tracking-wider">Add Funds</h2>
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
                        className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-200 cursor-pointer
                          ${opt.highlight
                            ? "bg-primary/[0.08] border border-primary/30 hover:bg-primary/[0.12] hover:border-primary/40"
                            : "bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14]"
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed group
                          ${isActive ? "ring-2 ring-primary/40" : ""}`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${opt.highlight ? "bg-primary/14" : "bg-white/[0.06] group-hover:bg-white/[0.1]"}`}>
                          <Icon className={`w-5 h-5 ${opt.highlight ? "text-primary" : "text-white/45 group-hover:text-white/60"}`} />
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black text-white">${opt.amount}</p>
                          <p className="text-xs text-white/45 font-semibold uppercase tracking-wider mt-1">{opt.label}</p>
                        </div>
                        {opt.highlight && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/[0.16] px-3 py-1 rounded-full">Best Value</span>
                        )}
                        {isActive && (
                          <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.08] space-y-1.5">
                  <p className="text-xs text-white/35 text-center font-medium">Crypto top-up via NOWPayments</p>
                  <p className="text-[11px] text-white/25 text-center">You'll be redirected to complete your top-up.</p>
                  <p className="text-[11px] text-white/20 text-center">More payment methods may be added later.</p>
                </div>
              </div>
            </div>

            {/* ── CARD B: Recent Activity (spans 2 cols) ── */}
            <div id="activity-section" className="lg:col-span-2">
              <div className="rounded-[2rem] bg-[#0a0a0a] border border-white/[0.06] overflow-hidden h-full">
                <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-5 h-5 text-white/45" />
                    <h2 className="text-[15px] font-bold text-white/80 uppercase tracking-wider">Recent Activity</h2>
                  </div>
                  {ledger.length > 0 && <span className="text-xs text-white/30 font-medium">{ledger.length} transactions</span>}
                </div>

                {ledger.length === 0 ? (
                  <div className="px-6 pb-10 pt-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-7 h-7 text-white/10" />
                    </div>
                    <p className="text-white/35 font-medium mb-1">No transactions yet</p>
                    <p className="text-white/20 text-sm">Top up your balance to start unlocking videos.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.05]">
                    {ledger.map((entry, idx) => {
                      const isCredit = entry.entry_type === "credit";
                      const isSimulated = (() => { try { return JSON.parse(entry.metadata_json || "{}")?.test === true; } catch { return false; } })();

                      return (
                        <div key={entry.id} className="flex items-center gap-5 px-6 py-6 hover:bg-white/[0.015] transition-colors">
                          {/* Icon */}
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-500/[0.08]" : "bg-rose-500/[0.08]"}`}>
                            {isCredit ? <ArrowDownLeft className="w-6 h-6 text-emerald-400" /> : <ArrowUpRight className="w-6 h-6 text-rose-400" />}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[15px] font-bold text-white/85 truncate">{entry.description || sourceLabel(entry)}</p>
                              {isSimulated && <span className="text-[9px] text-amber-300 bg-amber-500/[0.08] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">SIM</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-white/40">{fmtShort(entry.created_date)}</span>
                              <span className="text-xs text-white/40">{fmtTime(entry.created_date)}</span>
                              <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${isCredit ? "text-emerald-400 bg-emerald-500/[0.06]" : "text-rose-400 bg-rose-500/[0.06]"}`}>
                                {sourceLabel(entry)}
                              </span>
                            </div>
                          </div>
                          {/* Amount + Status */}
                          <div className="text-right shrink-0">
                            <p className={`text-lg font-black ${isCredit ? "text-emerald-400" : "text-rose-400"}`}>
                              {isCredit ? "+" : "−"}${entry.amount_usd?.toFixed(2)}
                            </p>
                            <div className="mt-1.5"><StatusBadge status={entry.status} /></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ═══════ ABOUT FLESHPAY ═══════ */}
          <div className="rounded-[2rem] bg-[#0a0a0a] border border-white/[0.06] p-8 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/[0.08] flex items-center justify-center shrink-0">
                  <img src={FLESHPAY_LOGO} alt="" className="w-7 h-7 rounded-lg opacity-60" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-white/70 uppercase tracking-wider">About FleshPay</h3>
                  <p className="text-xs text-white/40 mt-1">Your crypto-powered wallet for FLESHLAB</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <div className="text-xs text-emerald-400 font-semibold bg-emerald-500/[0.08] px-4 py-2 rounded-full flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Crypto top-ups
                </div>
                <div className="text-xs text-primary font-semibold bg-primary/[0.08] px-4 py-2 rounded-full flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" /> Instant unlocks
                </div>
                <div className="text-xs text-amber-400 font-semibold bg-amber-500/[0.08] px-4 py-2 rounded-full flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Auditable ledger
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}