import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import WalletHero from "@/components/clientDashboard/wallet/WalletHero";
import WalletTopupGrid from "@/components/clientDashboard/wallet/WalletTopupGrid";
import WalletEmptyState from "@/components/clientDashboard/wallet/WalletEmptyState";

export default function FlashPayWalletCard() {
  const [balance, setBalance] = useState(null);
  const [status, setStatus] = useState(null);
  const [walletExists, setWalletExists] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(null);

  useEffect(() => { loadBalance(); }, []);

  const loadBalance = async () => {
    try {
      const res = await base44.functions.invoke("getFlashPayWalletBalance", {});
      setConfigured(res.data?.configured !== false);
      setBalance(res.data?.balance_usd ?? 0);
      setStatus(res.data?.status || null);
      setWalletExists(res.data?.wallet_exists !== false);
    } catch {
      setConfigured(false);
    }
    setLoading(false);
  };

  const handleTopup = async (amount) => {
    setToppingUp(amount);
    try {
      const res = await base44.functions.invoke("createFlashPayTopupSession", { amount_usd: amount });
      if (res.data?.checkoutUrl) window.location.href = res.data.checkoutUrl;
    } catch (e) {
      console.error("FlashPay top-up failed:", e);
    }
    setToppingUp(null);
  };

  if (loading) return <Skeleton className="w-full h-48 rounded-3xl" />;

  return (
    <div className="space-y-4">
      <WalletHero configured={configured} balance={balance} status={status} />

      {!configured ? (
        <p className="text-xs text-white/40 px-1">FlashPay is not fully configured yet.</p>
      ) : (
        <WalletTopupGrid toppingUp={toppingUp} onTopup={handleTopup} />
      )}

      {configured && !walletExists && (
        <WalletEmptyState onAddFunds={() => handleTopup(10)} />
      )}
    </div>
  );
}