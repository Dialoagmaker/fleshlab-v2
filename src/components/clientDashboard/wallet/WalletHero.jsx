import { Zap, Lock, CreditCard } from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "Instant Top-up", desc: "Add funds in seconds with secure checkout." },
  { icon: Lock, title: "Secure & Safe", desc: "Your funds are protected and always secure." },
  { icon: CreditCard, title: "Ready to Use", desc: "Use your balance for eligible FleshLab purchases." },
];

export default function WalletHero({ configured, balance, status }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#140508] via-[#0d0d0d] to-black border border-primary/20 p-6 shadow-[0_0_40px_-12px_rgba(225,29,72,0.25)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">FlashPay Wallet</p>
          <p className="text-xs text-white/40 mt-1">Available Balance</p>
          <p className="text-5xl font-black text-white mt-1 tracking-tight">
            {configured ? `$${Number(balance || 0).toFixed(2)}` : "—"}
          </p>
          {status && (
            <span className="inline-block mt-3 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              {status}
            </span>
          )}
          <p className="text-xs text-white/35 mt-4 leading-relaxed max-w-sm">
            Use your FlashPay balance for eligible FLESHLAB purchases.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3.5 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-bold text-white">{title}</p>
              <p className="text-[11px] text-white/35 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}