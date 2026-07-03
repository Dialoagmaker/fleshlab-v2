/**
 * PaymentMethodSelector
 *
 * Wraps the existing crypto CheckoutButton (unchanged) and adds FlashPay
 * Wallet as an additional payment method for eligible purchase types:
 * ppv | fanclub | guest_production_deposit.
 *
 * If FlashPay beta is not enabled for this user, only crypto is shown —
 * identical behavior to before this feature existed.
 */
import { useState } from "react";
import { Wallet, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFleshPayBeta } from "@/hooks/useFleshPayBeta";
import CheckoutButton from "@/components/payment/CheckoutButton";
import WalletSpendConfirm from "@/components/payment/WalletSpendConfirm";
import {
  trackWalletSelected, trackWalletSpendStarted, trackWalletPurchaseCompleted,
  trackWalletPurchaseFailed, trackTopupBeforePurchase,
} from "@/lib/analytics";

export default function PaymentMethodSelector({
  paymentType,      // 'ppv' | 'fanclub' | 'guest_production_deposit'
  itemId,           // videoId | planId | applicationId
  itemLabel,        // display name, e.g. video title / plan name
  priceUsd,         // expected price for display only — server resolves the real charge
  planId, videoId, applicationId, priceTier,
  label, returnUrl, cancelUrl, isAuthenticated, onRequireAuth, paymentProvider,
  className, size = "lg",
}) {
  const { enabled: betaEnabled, loading: betaLoading } = useFleshPayBeta(isAuthenticated);
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletChecked, setWalletChecked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [spending, setSpending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const checkWallet = async () => {
    if (walletChecked || walletLoading) return;
    setWalletLoading(true);
    try {
      const res = await base44.functions.invoke("getFleshPayWallet", {});
      setWallet(res.data.wallet);
    } catch { /* best-effort */ }
    setWalletChecked(true);
    setWalletLoading(false);
  };

  // Not eligible for wallet payments — behave exactly as before (crypto only)
  if (!isAuthenticated || betaLoading || !betaEnabled) {
    return (
      <CheckoutButton
        paymentType={paymentType} label={label} planId={planId} videoId={videoId}
        applicationId={applicationId} priceTier={priceTier} returnUrl={returnUrl} cancelUrl={cancelUrl}
        isAuthenticated={isAuthenticated} onRequireAuth={onRequireAuth} paymentProvider={paymentProvider}
        className={className} size={size}
      />
    );
  }

  const balance = wallet?.balance_usd ?? 0;
  const hasEnough = walletChecked && balance >= priceUsd;

  const handleSelectWallet = () => {
    trackWalletSelected(paymentType, itemId);
    if (!hasEnough) {
      trackTopupBeforePurchase(paymentType, itemId, Math.round((priceUsd - balance) * 100) / 100);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSpend = async () => {
    setSpending(true);
    setError(null);
    trackWalletSpendStarted(paymentType, itemId, priceUsd);
    try {
      const res = await base44.functions.invoke("createPlatformSpend", {
        item_type: paymentType,
        item_id: itemId,
        plan_id: planId || undefined,
        price_tier: priceTier || undefined,
        idempotency_key: `${paymentType}_${itemId}_wallet`,
      });
      if (res.data?.success) {
        trackWalletPurchaseCompleted(paymentType, itemId, priceUsd);
        setSuccess(true);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        const reason = res.data?.error || "Payment failed";
        trackWalletPurchaseFailed(paymentType, itemId, reason);
        setError(`Payment failed. No funds have been deducted.`);
      }
    } catch (err) {
      trackWalletPurchaseFailed(paymentType, itemId, err.message);
      setError("Payment failed. No funds have been deducted.");
    }
    setSpending(false);
  };

  if (success) {
    return <p className="text-emerald-400 text-sm text-center py-3">Purchase complete — unlocking...</p>;
  }

  if (showConfirm) {
    return (
      <WalletSpendConfirm
        itemLabel={itemLabel || label} priceUsd={priceUsd} balance={balance}
        loading={spending} error={error} onConfirm={handleConfirmSpend}
        onCancel={() => setShowConfirm(false)}
      />
    );
  }

  return (
    <div className="space-y-2" onMouseEnter={checkWallet} onFocus={checkWallet}>
      <button
        onClick={handleSelectWallet}
        disabled={walletLoading}
        className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors ${
          hasEnough ? "border-primary/40 bg-primary/5 hover:bg-primary/10" : "border-border bg-card hover:border-primary/30"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Wallet className="w-4 h-4 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              FlashPay Wallet {hasEnough && <span className="text-primary text-xs font-medium">(Recommended)</span>}
            </p>
            {walletLoading ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking balance...</p>
            ) : walletChecked && !hasEnough ? (
              <p className="text-xs text-red-400">Insufficient wallet balance.</p>
            ) : walletChecked ? (
              <p className="text-xs text-muted-foreground">Balance: ${balance.toFixed(2)}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Pay instantly from your wallet</p>
            )}
          </div>
        </div>
        {walletChecked && !hasEnough && (
          <a href="/wallet" className="text-xs font-medium text-primary shrink-0" onClick={(e) => e.stopPropagation()}>Add Funds</a>
        )}
      </button>

      <div className="text-center text-[11px] text-muted-foreground">or</div>

      <CheckoutButton
        paymentType={paymentType} label={`${label} with Crypto`} planId={planId} videoId={videoId}
        applicationId={applicationId} priceTier={priceTier} returnUrl={returnUrl} cancelUrl={cancelUrl}
        isAuthenticated={isAuthenticated} onRequireAuth={onRequireAuth} paymentProvider={paymentProvider}
        className={className} size={size}
      />
    </div>
  );
}