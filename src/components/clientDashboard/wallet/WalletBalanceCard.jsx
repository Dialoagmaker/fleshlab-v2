import { Wallet as WalletIcon } from "lucide-react";

export default function WalletBalanceCard({ configured, balance, status }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#180509] via-[#100507] to-black border border-primary/25 p-6 shadow-[0_0_40px_-12px_rgba(225,29,72,0.25)] flex items-center gap-5">
      <div className="relative w-20 h-20 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <WalletIcon className="w-9 h-9 text-primary" />
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-white">F</span>
        <span className="absolute -bottom-1 -left-2 w-5 h-5 rounded-full bg-primary/70 flex items-center justify-center text-[9px] font-black text-white">F</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">FlashPay Wallet</p>
        <p className="text-xs text-white/40 mt-1">Available Balance</p>
        <p className="text-4xl font-black text-white mt-1 tracking-tight">
          {configured ? `$${Number(balance || 0).toFixed(2)}` : "—"}
        </p>
        {status && (
          <span className="inline-block mt-2 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            {status}
          </span>
        )}
        <p className="text-[11px] text-white/35 mt-2 leading-snug">
          Use your FlashPay balance for eligible FleshLab purchases.
        </p>
      </div>
    </div>
  );
}