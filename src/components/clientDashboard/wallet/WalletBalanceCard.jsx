const WALLET_ILLUSTRATION = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a41b36b9a_wallet_hero_large_transparent.png";

export default function WalletBalanceCard({ configured, balance, pendingBalance = 0, status }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#180509] via-[#100507] to-black border border-primary/25 p-6 flex items-center gap-5 shadow-[0_0_40px_-12px_rgba(225,29,72,0.25)]">
      <img src={WALLET_ILLUSTRATION} alt="FlashPay Wallet" className="w-24 h-24 shrink-0 object-contain" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">FlashPay Wallet</p>
        <p className="text-xs text-white/40 mt-1">Available Balance</p>
        <p className="text-4xl font-black text-white mt-1 tracking-tight">{configured ? `$${Number(balance || 0).toFixed(2)}` : "—"}</p>
        {pendingBalance > 0 && <p className="mt-1 text-xs font-bold text-amber-300">Pending: ${Number(pendingBalance).toFixed(2)}</p>}
        {status && <span className="inline-block mt-2 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">{status}</span>}
        <p className="text-[11px] text-white/35 mt-2 leading-snug">Use FlashPay for eligible FLESHLAB purchases.</p>
      </div>
    </div>
  );
}