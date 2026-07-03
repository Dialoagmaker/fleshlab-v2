import { Wallet, Loader2 } from "lucide-react";

const TOPUP_AMOUNTS = [10, 25, 50, 100];

export default function WalletTopupGrid({ toppingUp, onTopup }) {
  return (
    <div className="pt-6 border-t border-white/[0.08] space-y-3.5">
      <h3 className="text-[10px] font-bold text-white/45 uppercase tracking-widest">Add Funds to Your Wallet</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TOPUP_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => onTopup(amount)}
            disabled={toppingUp !== null}
            className="group relative flex flex-col items-center justify-center gap-1.5 py-5 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-primary/40 hover:bg-primary/[0.06] hover:shadow-[0_0_24px_-8px_rgba(225,29,72,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Wallet className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <span className="text-xl font-black text-white">${amount}</span>
            <span className="text-[10px] text-white/30">Add ${amount} to your wallet</span>
            {toppingUp === amount && (
              <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
            )}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-white/25 text-center leading-relaxed pt-1">
        FlashPay balance can be used for eligible FleshLab purchases once wallet payments are enabled.
      </p>
    </div>
  );
}