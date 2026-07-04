import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import FlashPayWalletCard from "@/components/clientDashboard/FlashPayWalletCard";
import WalletEmptyState from "@/components/clientDashboard/wallet/WalletEmptyState";
import WalletActivity from "@/components/clientDashboard/wallet/WalletActivity";
import WalletInfoFooter from "@/components/clientDashboard/wallet/WalletInfoFooter";

export default function WalletTab({ setActiveTab }) {
  const [balance, setBalance] = useState(0);
  const [status, setStatus] = useState(null);
  const [configured, setConfigured] = useState(true);
  const [walletExists, setWalletExists] = useState(true);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(null);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const [balanceRes, walletRes] = await Promise.all([
        base44.functions.invoke("getFlashPayWalletBalance", {}),
        base44.functions.invoke("getFleshPayWallet", {}),
      ]);
      setConfigured(balanceRes.data?.configured !== false);
      setBalance(balanceRes.data?.balance_usd ?? 0);
      setStatus(balanceRes.data?.status || null);
      setWalletExists(balanceRes.data?.wallet_exists !== false);
      setLedger((walletRes.data.ledger || []).slice(0, 5));
    } catch {}
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

  if (loading) return <Skeleton className="w-full h-96 rounded-3xl" />;

  const showEmptyState = configured && (!walletExists || balance === 0);

  return (
    <div className="space-y-4">
      <FlashPayWalletCard
        configured={configured}
        balance={balance}
        status={status}
        toppingUp={toppingUp}
        onTopup={handleTopup}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {showEmptyState && <WalletEmptyState onAddFunds={() => handleTopup(10)} />}
        <div className={showEmptyState ? "" : "lg:col-span-2"}>
          <WalletActivity ledger={ledger} />
        </div>
      </div>

      <WalletInfoFooter />
    </div>
  );
}