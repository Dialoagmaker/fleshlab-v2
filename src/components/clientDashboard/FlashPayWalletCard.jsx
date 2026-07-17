import WalletBalanceCard from "@/components/clientDashboard/wallet/WalletBalanceCard";
import WalletFeaturesCard from "@/components/clientDashboard/wallet/WalletFeaturesCard";
import WalletTopupGrid from "@/components/clientDashboard/wallet/WalletTopupGrid";

export default function FlashPayWalletCard({ configured, balance, pendingBalance = 0, status, toppingUp, onTopup }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WalletBalanceCard configured={configured} balance={balance} pendingBalance={pendingBalance} status={status} />
        <WalletFeaturesCard />
      </div>

      {configured ? (
        <WalletTopupGrid toppingUp={toppingUp} onTopup={onTopup} />
      ) : (
        <p className="text-xs text-white/40 px-1">FlashPay is not fully configured yet.</p>
      )}
    </div>
  );
}