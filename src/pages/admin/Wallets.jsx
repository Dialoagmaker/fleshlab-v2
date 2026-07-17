import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import SEOMeta from "@/components/SEOMeta";
import { Search, Shield, RefreshCw, Wallet } from "lucide-react";

export default function AdminWalletList() {
  const [wallets, setWallets] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { loadWallets(); }, []);

  const loadWallets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("adminFlashPayWalletService", { action: "list" });
      setWallets(res.data.wallets || []);
    } catch {
      setError("Access denied or load failed. Admin access required.");
    }
    setLoading(false);
  };

  const viewWallet = async (wallet) => {
    setSelected(wallet);
    setDetailLoading(true);
    const res = await base44.functions.invoke("adminFlashPayWalletService", { action: "detail", wallet_id: wallet.id });
    setSelected(res.data.wallet);
    setTransactions(res.data.transactions || []);
    setDetailLoading(false);
  };

  const adjust = async (direction) => {
    const amount = Number(window.prompt(`${direction === "credit" ? "Credit" : "Debit"} amount`));
    if (!amount) return;
    const reason = window.prompt("Reason for this adjustment");
    if (!reason) return;
    await base44.functions.invoke("adminFlashPayWalletService", { action: "adjust", wallet_id: selected.id, amount, direction, reason });
    await viewWallet(selected);
    await loadWallets();
  };

  const refund = async (transaction) => {
    const amount = Number(window.prompt("Refund amount", String(transaction.amount || 0)));
    if (!amount) return;
    const reason = window.prompt("Refund reason");
    if (!reason) return;
    await base44.functions.invoke("adminFlashPayWalletService", { action: "refund", transaction_id: transaction.id, amount, reason });
    await viewWallet(selected);
    await loadWallets();
  };

  const filtered = wallets.filter((wallet) => {
    const q = search.toLowerCase();
    return !q || wallet.user_id?.toLowerCase().includes(q) || wallet.id?.toLowerCase().includes(q);
  });

  if (loading) return <div className="min-h-screen bg-background p-6"><Skeleton className="h-96 w-full rounded-2xl" /></div>;

  return (
    <>
      <SEOMeta title="Admin - FlashPay Wallets" noIndex={true} />
      <div className="min-h-screen bg-background p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15"><Shield className="h-5 w-5 text-primary" /></div>
            <div>
              <h1 className="text-xl font-bold text-foreground">FlashPay Wallets</h1>
              <p className="text-xs text-muted-foreground">Balances, transactions, refunds and approved adjustments.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadWallets} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </div>

        {error && <Card className="mb-5 border-red-500/20"><CardContent className="p-5 text-red-300">{error}</CardContent></Card>}

        <div className="mb-4 max-w-md relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search wallet or user ID" className="pl-9" />
        </div>

        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-white/[0.02] text-xs uppercase text-muted-foreground">
                  <tr><th className="p-3 text-left">User</th><th className="p-3 text-right">Available</th><th className="p-3 text-right">Pending</th><th className="p-3 text-right">Deposited</th><th className="p-3 text-right">Spent</th><th className="p-3 text-center">Status</th><th className="p-3" /></tr>
                </thead>
                <tbody>
                  {filtered.map((wallet) => (
                    <tr key={wallet.id} className="border-b hover:bg-white/[0.02]">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{wallet.user_id}</td>
                      <td className="p-3 text-right font-bold">${Number(wallet.available_balance || 0).toFixed(2)}</td>
                      <td className="p-3 text-right">${Number(wallet.pending_balance || 0).toFixed(2)}</td>
                      <td className="p-3 text-right">${Number(wallet.lifetime_deposited || 0).toFixed(2)}</td>
                      <td className="p-3 text-right">${Number(wallet.lifetime_spent || 0).toFixed(2)}</td>
                      <td className="p-3 text-center"><Badge>{wallet.status}</Badge></td>
                      <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => viewWallet(wallet)}>View</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {selected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3 text-base">
                <span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Wallet Detail</span>
                <span className="flex gap-2"><Button size="sm" onClick={() => adjust("credit")}>Credit Adjustment</Button><Button size="sm" variant="outline" onClick={() => adjust("debit")}>Debit Adjustment</Button></span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detailLoading ? <Skeleton className="h-40 w-full" /> : (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-xl bg-white/[0.03] p-3"><p className="text-xs text-muted-foreground">Available</p><p className="text-xl font-bold">${Number(selected.available_balance || 0).toFixed(2)}</p></div>
                    <div className="rounded-xl bg-white/[0.03] p-3"><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold">${Number(selected.pending_balance || 0).toFixed(2)}</p></div>
                    <div className="rounded-xl bg-white/[0.03] p-3"><p className="text-xs text-muted-foreground">Deposited</p><p className="text-xl font-bold">${Number(selected.lifetime_deposited || 0).toFixed(2)}</p></div>
                    <div className="rounded-xl bg-white/[0.03] p-3"><p className="text-xs text-muted-foreground">Spent</p><p className="text-xl font-bold">${Number(selected.lifetime_spent || 0).toFixed(2)}</p></div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-xs">
                      <thead className="bg-white/[0.02] text-muted-foreground"><tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Status</th><th className="p-2 text-right">Amount</th><th className="p-2 text-right">Before</th><th className="p-2 text-right">After</th><th className="p-2 text-left">Idempotency</th><th className="p-2" /></tr></thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="border-t">
                            <td className="p-2 text-muted-foreground">{new Date(tx.completed_at || tx.created_date).toLocaleString()}</td>
                            <td className="p-2">{tx.transaction_type}</td>
                            <td className="p-2"><Badge variant="outline">{tx.status}</Badge></td>
                            <td className={`p-2 text-right font-bold ${tx.direction === "credit" ? "text-emerald-400" : "text-rose-400"}`}>{tx.direction === "credit" ? "+" : "−"}${Number(tx.amount || 0).toFixed(2)}</td>
                            <td className="p-2 text-right">${Number(tx.balance_before || 0).toFixed(2)}</td>
                            <td className="p-2 text-right">${Number(tx.balance_after || 0).toFixed(2)}</td>
                            <td className="p-2 font-mono text-muted-foreground">{tx.idempotency_key}</td>
                            <td className="p-2 text-right">{tx.direction === "debit" && tx.status === "completed" && <Button size="sm" variant="outline" onClick={() => refund(tx)}>Refund</Button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}