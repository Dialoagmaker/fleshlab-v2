import WalletHero from "@/components/clientDashboard/wallet/WalletHero";
import WalletTopupGrid from "@/components/clientDashboard/wallet/WalletTopupGrid";

export default function FlashPayWalletCard({ configured, balance, status, toppingUp, onTopup }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#140508] via-[#0d0d0d] to-black border border-primary/20 p-6 shadow-[0_0_40px_-12px_rgba(225,29,72,0.25)]">
      <WalletHero configured={configured} balance={balance} status={status} />

      {configured ? (
        <WalletTopupGrid toppingUp={toppingUp} onTopup={onTopup} />
      ) : (
        <p className="text-xs text-white/40 px-1 pt-6 border-t border-white/[0.08] mt-6">FlashPay is not fully configured yet.</p>
      )}
    </div>
  );
}