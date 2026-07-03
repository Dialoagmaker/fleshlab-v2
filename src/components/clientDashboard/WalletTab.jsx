import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFleshPayBeta } from "@/hooks/useFleshPayBeta";
import { Skeleton } from "@/components/ui/skeleton";
import FlashPayWalletCard from "@/components/clientDashboard/FlashPayWalletCard";
import WalletActivity from "@/components/clientDashboard/wallet/WalletActivity";
import WalletInfoFooter from "@/components/clientDashboard/wallet/WalletInfoFooter";

export default function WalletTab({ setActiveTab }) {
  const { isAuthenticated } = useAuth();
  const { enabled: betaEnabled, loading: betaLoading } = useFleshPayBeta(isAuthenticated);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!betaLoading && betaEnabled) {
      loadWallet();
    } else if (!betaLoading) {
      setLoading(false);
    }
  }, [betaLoading, betaEnabled]);

  const loadWallet = async () => {
    try {
      const res = await base44.functions.invoke("getFleshPayWallet", {});
      setLedger((res.data.ledger || []).slice(0, 5));
    } catch {}
    setLoading(false);
  };

  if (loading) return <Skeleton className="w-full h-48 rounded-3xl" />;

  return (
    <div className="space-y-4">
      {/* FlashPay Wallet (external, Phase 1: balance + top-up only) — always visible to logged-in users */}
      <FlashPayWalletCard />

      <WalletActivity ledger={ledger} />

      <WalletInfoFooter />
    </div>
  );
}