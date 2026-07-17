import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import FlashPayWalletCard from "@/components/clientDashboard/FlashPayWalletCard";
import WalletEmptyState from "@/components/clientDashboard/wallet/WalletEmptyState";
import WalletActivity from "@/components/clientDashboard/wallet/WalletActivity";
import WalletInfoFooter from "@/components/clientDashboard/wallet/WalletInfoFooter";

const FILTERS = ["all", "deposits", "purchases", "tips", "refunds", "pending", "failed"];

export default function WalletTab() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(null);

  useEffect(() => { loadWallet(filter); }, [filter]);

  const loadWallet = async (currentFilter = filter) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getFlashPayWallet", { filter: currentFilter });
      setWallet(res.data.wallet);
      setTransactions(res.data.transactions || []);
    } catch {
      setWallet(null);
      setTransactions([]);
    }
    setLoading(false);
  };

  const handleTopup = async (amount) => {
    setToppingUp(amount);
    try {
      const res = await base44.functions.invoke("createFlashPayTopup", { amount_usd: amount });
      if (res.data?.checkoutUrl) window.location.href = res.data.checkoutUrl;
    } catch (e) {
      console.error("FlashPay top-up failed:", e);
    }
    setToppingUp(null);
  };

  if (loading && !wallet) return <Skeleton className="w-full h-96 rounded-3xl" />;

  const available = wallet?.available_balance || 0;
  const pending = wallet?.pending_balance || 0;
  const showEmptyState = available === 0 && pending === 0;

  return (
    <div className="space-y-5">
      <FlashPayWalletCard
        configured={true}
        balance={available}
        pendingBalance={pending}
        status={wallet?.status || "active"}
        toppingUp={toppingUp}
        onTopup={handleTopup}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {showEmptyState && <WalletEmptyState onAddFunds={() => handleTopup(10)} />}
        <div className={showEmptyState ? "" : "lg:col-span-2"}>
          <div className="rounded-3xl border border-white/[0.08] bg-[#0d0d0d] p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${filter === item ? "bg-primary text-white" : "bg-white/[0.05] text-white/45 hover:text-white"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <WalletActivity ledger={transactions} showAll />
          </div>
        </div>
      </div>

      <WalletInfoFooter />
    </div>
  );
}