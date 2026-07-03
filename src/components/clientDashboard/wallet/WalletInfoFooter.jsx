import { DollarSign, Zap, CreditCard, Headphones } from "lucide-react";

const INFO = [
  { icon: DollarSign, label: "Currency", value: "USD" },
  { icon: Zap, label: "Processing", value: "Instant" },
  { icon: CreditCard, label: "Payment Methods", value: "Stripe & PayPal via FlashPay" },
  { icon: Headphones, label: "Support", value: "24/7" },
];

export default function WalletInfoFooter() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {INFO.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-2xl bg-[#0d0d0d] border border-white/[0.08] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary/70" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-semibold">{label}</p>
            <p className="text-xs font-bold text-white truncate">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}