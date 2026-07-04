import { Zap, Lock, CreditCard } from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "Instant Top-up", desc: "Add funds in seconds with secure checkout." },
  { icon: Lock, title: "Secure & Safe", desc: "Your funds are protected and always secure." },
  { icon: CreditCard, title: "Ready to Use", desc: "Use your balance for eligible FleshLab purchases." },
];

export default function WalletHero({ configured, balance, status }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
      <div className="shrink-0">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">FleshPay Wallet</p>
        <p className="text-xs text-white/40 mt-1">Available Balance</p>
        <p className="text-5xl font-black text-white mt-1 tracking-tight">
          {configured ? `$${Number(balance || 0).toFixed(2)}` : "—"}
        </p>
        {status && (
          <span className="inline-block mt-3 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            {status}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col sm:flex-row flex-wrap gap-5 sm:gap-8 md:justify-end">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-2.5 max-w-[220px]">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{title}</p>
              <p className="text-[11px] text-white/35 leading-snug mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}