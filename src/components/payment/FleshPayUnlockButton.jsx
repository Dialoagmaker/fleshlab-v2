import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FleshPayUnlockButton({
  videoId,
  videoTitle,
  isAuthenticated,
  onRequireAuth,
}) {
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletChecked, setWalletChecked] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Lazy-load wallet state only when user hovers or focuses on the FleshPay section
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
        // Reload page to show unlocked video
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(res.data?.error || "Purchase failed");
      }
    } catch (err) {
      setError("Purchase failed. Please try again.");
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        className="w-full border-primary/30 text-primary hover:bg-primary/10 text-sm gap-2"
        onClick={onRequireAuth}
      >
        <Wallet className="w-4 h-4" />
        Use FleshPay Balance
      </Button>
    );
  }

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
        <p className="text-green-400 font-semibold text-sm">Video unlocked! Refreshing...</p>
      </div>
    );
  }

  const balance = wallet?.balance_usd || 0;
  // Price is estimated from standard tier — actual price resolved server-side
  const estimatedPrice = 20.99;
  const hasEnough = balance >= estimatedPrice;

  return (
    <div
      className="bg-primary/5 rounded-xl p-4 border border-primary/20 space-y-3"
      onMouseEnter={checkWallet}
      onFocus={checkWallet}
    >
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">FleshPay Balance</span>
      </div>

      {loading && !walletChecked ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-3 h-3 animate-spin" /> Checking balance...
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Your FleshPay Balance: <span className="text-foreground font-bold">${balance.toFixed(2)}</span>
          </p>

          {hasEnough ? (
            <>
              <Button
                onClick={handleSpend}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-sm gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Unlock with FleshPay Balance — ${estimatedPrice.toFixed(2)}
              </Button>
              {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                You need ${(estimatedPrice - balance).toFixed(2)} more.
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-sm"
                  onClick={() => window.location.href = "/wallet"}
                >
                  <Wallet className="w-4 h-4 mr-1" /> Add funds by Card, PayPal or Crypto
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Pay directly instead
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}