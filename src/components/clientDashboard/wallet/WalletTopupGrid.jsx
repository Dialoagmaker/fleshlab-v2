import { Wallet, Loader2, ArrowRight } from "lucide-react";

const TOPUP_AMOUNTS = [10, 25, 50, 100];

export default function WalletTopupGrid({ toppingUp, onTopup }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {TOPUP_AMOUNTS.map((amount) => (
        <div
          key={amount}
          className="relative rounded-2xl bg-[#0d0d0d] border border-white/[0.08] p-4 flex flex-col gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">${amount}</p>
            <p className="text-[11px] text-white/35 mt-0.5">Add ${amount} to your wallet</p>
          </div>
          <button
            onClick={() => onTopup(amount)}
            disabled={toppingUp !== null}
            className="mt-1 w-full h-9 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
          {toppingUp === amount && (
            <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}