import { Zap, Lock, CreditCard } from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "Instant Top-Up", desc: "Top up your wallet in seconds." },
  { icon: Lock, title: "Secure Payments", desc: "Protected by FlashPay." },
  { icon: CreditCard, title: "Ready for Purchases", desc: "Spend your balance across eligible FleshLab content." },
];

export default function WalletFeaturesCard() {
  return (
    <div className="rounded-3xl bg-[#0d0d0d] border border-white/[0.08] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-around gap-5">
      {FEATURES.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex flex-col items-center text-center gap-2 max-w-[150px]">
          <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs font-bold text-white">{title}</p>
          <p className="text-[11px] text-white/35 leading-snug">{desc}</p>
        </div>
      ))}
    </div>
  );
}