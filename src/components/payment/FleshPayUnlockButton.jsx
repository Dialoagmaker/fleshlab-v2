import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFleshPayBeta } from "@/hooks/useFleshPayBeta";

const FLESHPAY_LOGO = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/ec86d07a5_generated_image.png";

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
        className="w-full group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-4 text-left transition-all hover:border-primary/20 hover:bg-[#0d0d0d]"
      >
        <div className="flex items-center gap-3">
          <img src={FLESHPAY_LOGO} alt="FleshPay" className="w-9 h-9 rounded-xl opacity-70 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Unlock with FleshPay</p>
            <p className="text-[11px] text-white/25 mt-0.5">Use your wallet balance — instant access</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/15 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all" />
        </div>
      </button>
    );
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/[0.12] p-5 text-center">
        <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
        <p className="text-emerald-400 font-semibold text-sm">Video unlocked!</p>
        <p className="text-emerald-400/40 text-xs mt-1">Refreshing page...</p>
      </div>
    );
  }

  const balance = wallet?.balance_usd || 0;
  const hasEnough = balance > 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a]"
      onMouseEnter={checkWallet}
      onFocus={checkWallet}
    >
      {/* Subtle top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="relative p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <img src={FLESHPAY_LOGO} alt="FleshPay" className="w-9 h-9 rounded-xl opacity-80 shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">Unlock with FleshPay</p>
            {loading && !walletChecked ? (
              <div className="flex items-center gap-1.5 text-white/20 text-[11px] mt-0.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking balance...
              </div>
            ) : (
              <p className="text-[11px] text-white/25 mt-0.5">
                Balance: <span className="text-white/60 font-semibold">${balance.toFixed(2)}</span>
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
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl text-sm gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  Unlock with FleshPay Balance
                </Button>
                {error && (
                  <p className="text-red-400 text-[11px] text-center">{error}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5 text-center">
                  <p className="text-[11px] text-white/30">
                    Balance: <span className="text-white/60 font-bold">${balance.toFixed(2)}</span>
                  </p>
                  <p className="text-[10px] text-white/15 mt-1">Add funds to unlock this video.</p>
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl text-sm gap-2"
                  onClick={() => window.location.href = "/wallet"}
                >
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