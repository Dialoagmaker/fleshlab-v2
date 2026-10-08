import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FlashPayHeaderBalance() {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    let cancelled = false;
    base44.functions.invoke("getFlashPayWallet", {})
      .then((res) => {
        if (!cancelled) setBalance(res.data?.wallet?.available_balance ?? 0);
      })
      .catch(() => {
        if (!cancelled) setBalance(null);
      });
    return () => { cancelled = true; };
  }, []);

  if (balance === null) return null;

  return (
    <button
      onClick={() => window.location.href = "/account/wallet"}
      className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-left transition hover:border-[#f0183d]/40 md:flex"
    >
      <Wallet className="h-4 w-4 text-[#f0183d]" />
      <span className="leading-none">
        <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/34">FlashPay</span>
        <span className="block text-xs font-black text-white">${Number(balance || 0).toFixed(2)}</span>
      </span>
    </button>
  );
}