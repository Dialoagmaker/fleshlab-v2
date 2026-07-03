import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Loader2 } from "lucide-react";

const TOPUP_AMOUNTS = [10, 25, 50, 100];

export default function FlashPayWalletCard() {
  const [balance, setBalance] = useState(null);
  const [status, setStatus] = useState(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(null);

  useEffect(() => { loadBalance(); }, []);

  const loadBalance = async () => {
    try {
      const res = await base44.functions.invoke("getFlashPayWalletBalance", {});
      setConfigured(res.data?.configured !== false);
      setBalance(res.data?.balance_usd ?? 0);
      setStatus(res.data?.status || null);
    } catch {
      setConfigured(false);
    }
    setLoading(false);
  };

  const handleTopup = async (amount) => {
    setToppingUp(amount);
    try {
      const res = await base44.functions.invoke("createFlashPayTopupSession", { amount_usd: amount });
      if (res.data?.checkoutUrl) window.location.href = res.data.checkoutUrl;
    } catch (e) {
      console.error("FlashPay top-up failed:", e);
    }
    setToppingUp(null);
  };

  if (loading) return <Skeleton className="w-full h-48 rounded-3xl" />;

  return (
    <div className="rounded-3xl bg-[#0d0d0d] border border-white/[0.08] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-white/45 uppercase tracking-widest font-semibold">FlashPay Wallet</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {configured ? `$${Number(balance || 0).toFixed(2)}` : "—"}
            </p>
          </div>
        </div>
        {status && (
          <span className="text-[9px] text-emerald-400 bg-emerald-500/[0.1] px-2 py-1 rounded-full font-bold uppercase tracking-wider">{status}</span>
        )}
      </div>

      {!configured ? (
        <p className="text-xs text-white/40">FlashPay is not fully configured yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {TOPUP_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleTopup(amount)}
                disabled={toppingUp !== null}
                className="relative flex flex-col items-center justify-center py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] hover:bg-white/[0.07] hover:border-white/[0.16] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="text-sm font-black text-white">${amount}</span>
                {toppingUp === amount && (
                  <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-white/30 text-center leading-relaxed">
            FlashPay balance can be used for eligible FleshLab purchases once wallet payments are enabled.
          </p>
        </>
      )}
    </div>
  );
}