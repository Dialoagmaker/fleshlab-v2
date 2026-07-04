import { ShieldCheck, ArrowRight } from "lucide-react";

export default function WalletEmptyState({ onAddFunds }) {
  return (
    <div className="rounded-3xl bg-[#0d0d0d] border border-white/[0.08] p-6 flex flex-col sm:flex-row items-center gap-6">
      <div className="w-24 h-24 shrink-0 flex items-center justify-center">
        <img
          src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/74377da25_generated_image.png"
          alt="FlashPay Wallet"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <h3 className="text-base font-bold text-white">No FlashPay wallet yet</h3>
        <p className="text-xs text-white/40 mt-1.5 leading-relaxed max-w-sm">
          Add funds to create your FlashPay wallet. Once created, you can use your balance for eligible purchases across FleshLab.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onAddFunds}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            Add Funds Now
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <p className="flex items-center gap-1.5 text-[10px] text-white/30">
            <ShieldCheck className="w-3.5 h-3.5 text-primary/60" />
            Secure payment powered by FlashPay
          </p>
        </div>
      </div>
    </div>
  );
}