import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, ExternalLink } from "lucide-react";

export default function WalletTab() {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const res = await base44.functions.invoke("getFleshPayWallet", {});
      setWallet(res.data.wallet);
      setLedger((res.data.ledger || []).slice(0, 5));
    } catch {
      // No wallet yet
    }
    setLoading(false);
  };

  if (loading) {
    return <Skeleton className="w-full h-48 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <Card className="bg-[#0f0f0f] border-white/8">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">FleshPay Balance</p>
              <p className="text-3xl font-black text-white">${wallet?.balance_usd?.toFixed(2) || "0.00"}</p>
              {wallet?.last_transaction_at && (
                <p className="text-white/30 text-xs mt-1">
                  Last activity: {new Date(wallet.last_transaction_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <Link to="/wallet">
              <Button variant="outline" size="sm" className="gap-1 border-white/10 hover:bg-white/5 text-white/70">
                <ExternalLink className="w-3 h-3" /> Full Wallet
              </Button>
            </Link>
          </div>
          <Link to="/wallet">
            <Button className="w-full mt-4 bg-rose-600 hover:bg-rose-500 text-white font-bold gap-2">
              <Plus className="w-4 h-4" /> Add Funds
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {ledger.length > 0 && (
        <Card className="bg-[#0f0f0f] border-white/8">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-white/60 uppercase tracking-wide">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {ledger.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    entry.entry_type === "credit"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {entry.entry_type === "credit" ? (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{entry.description || entry.source_type}</p>
                    <p className="text-xs text-white/30">
                      {new Date(entry.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`text-sm font-bold ${
                    entry.entry_type === "credit" ? "text-green-400" : "text-red-400"
                  }`}>
                    {entry.entry_type === "credit" ? "+" : "-"}${entry.amount_usd?.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}