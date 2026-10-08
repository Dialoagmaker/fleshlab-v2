import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WalletSpendConfirm({ itemLabel, priceUsd, balance, loading, error, onConfirm, onCancel }) {
  const balanceAfter = Math.round((balance - priceUsd) * 100) / 100;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Wallet className="w-4 h-4 text-primary" /> Confirm Purchase
      </div>
      <div className="text-sm space-y-1.5">
        <div className="flex justify-between"><span className="text-muted-foreground">Purchase</span><span className="text-foreground font-medium">{itemLabel}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="text-foreground font-medium">${priceUsd.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Wallet Balance</span><span className="text-foreground font-medium">${balance.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Balance After Purchase</span><span className="text-foreground font-medium">${balanceAfter.toFixed(2)}</span></div>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button size="sm" className="flex-1" onClick={onConfirm} disabled={loading}>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
          Confirm Purchase
        </Button>
      </div>
    </div>
  );
}