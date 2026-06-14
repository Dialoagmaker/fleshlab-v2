import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFleshPayBeta } from "@/hooks/useFleshPayBeta";

export default function FleshPayUnlockButton({
  videoId,
  videoTitle,
  isAuthenticated,
  onRequireAuth,
}) {
  const { enabled: betaEnabled, loading: betaLoading } = useFleshPayBeta(isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletChecked, setWalletChecked] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const checkWallet = async () => {
    if (walletChecked || loading) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getFleshPayWallet", {});
      setWallet(res.data.wallet);
    } catch {
      // Wallet not available
    }
    setWalletChecked(true);
    setLoading(false);
  };

  const handleSpend = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("spendFleshPayBalance", { videoId });
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(res.data?.error || "Purchase failed");
      }
    } catch (err) {
      setError("Purchase failed. Please try again.");
    }
    setLoading(false);
  };

  if (!betaEnabled || betaLoading) return null;

  if (!isAuthenticated) {
    return (
      <button
        onClick={onRequireAuth}
        className="w-full group relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-4 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Unlock with FleshPay</p>
            <p className="text-xs text-white/40 mt-0.5">Use your wallet balance — instant access</p>
          </div>
          <ArrowRight className="w-4 h-4 text-primary/50 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-5 text-center">
        <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
        <p className="text-emerald-400 font-semibold text-sm">Video unlocked!</p>
        <p className="text-emerald-400/50 text-xs mt-1">Refreshing page...</p>
      </div>
    );
  }

  const balance = wallet?.balance_usd || 0;
  const hasEnough = balance > 0;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-[#1a0a0f] via-[#12080c] to-[#0a0a0a] shadow-xl shadow-primary/5"
      onMouseEnter={checkWallet}
      onFocus={checkWallet}
    >
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Unlock with FleshPay</p>
            {loading && !walletChecked ? (
              <div className="flex items-center gap-1.5 text-white/30 text-xs mt-0.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking balance...
              </div>
            ) : (
              <p className="text-xs text-white/30 mt-0.5">
                Balance: <span className="text-white/70 font-semibold">${balance.toFixed(2)}</span>
              </p>
            )}
          </div>
        </div>

        {loading && !walletChecked ? null : (
          <>
            {hasEnough ? (
              <div className="space-y-3">
                <Button
                  onClick={handleSpend}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 rounded-xl text-sm gap-2 shadow-lg shadow-primary/20"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  Unlock with FleshPay Balance
                </Button>
                {error && (
                  <p className="text-red-400 text-xs text-center">{error}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                  <p className="text-xs text-white/40">
                    Your balance: <span className="text-white/70 font-bold">${balance.toFixed(2)}</span>
                  </p>
                  <p className="text-xs text-white/25 mt-1">
                    Add funds to unlock this video.
                  </p>
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 rounded-xl text-sm gap-2 shadow-lg shadow-primary/20"
                  onClick={() => window.location.href = "/wallet"}
                >
                  <Wallet className="w-4 h-4" />
                  Top up FleshPay Balance
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}