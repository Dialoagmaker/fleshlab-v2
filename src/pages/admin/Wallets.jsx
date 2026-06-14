import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import SEOMeta from "@/components/SEOMeta";
import {
  Wallet, Search, ExternalLink, Shield, RefreshCw, AlertTriangle,
} from "lucide-react";

export default function AdminWalletList() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedLedger, setSelectedLedger] = useState([]);
  const [selectedPurchases, setSelectedPurchases] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reconData, setReconData] = useState(null);
  const [reconLoading, setReconLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await base44.functions.invoke("adminListWallets", {});
      setWallets(response.data.wallets || []);
    } catch (err) {
      console.error("Failed to load wallets:", err);
      setError("Access denied or load failed. Admin access required.");
    }
    setLoading(false);
  };

  const viewWallet = async (wallet) => {
    setSelectedWallet(wallet);
    setDetailLoading(true);
    try {
      const response = await base44.functions.invoke("adminListWallets", {
        walletId: wallet.id,
        includeLedger: true,
        includePurchases: true,
      });
      setSelectedLedger(response.data.ledger || []);
      setSelectedPurchases(response.data.purchases || []);
    } catch (err) {
      console.error("Failed to load wallet details:", err);
    }
    setDetailLoading(false);
  };

  const runReconciliation = async () => {
    setReconLoading(true);
    try {
      const response = await base44.functions.invoke("adminWalletReconciliation", {});
      setReconData(response.data);
    } catch (err) {
      console.error("Reconciliation failed:", err);
    }
    setReconLoading(false);
  };

  const filtered = wallets.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return w.user_id?.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="w-64 h-8 mb-4" />
        <Skeleton className="w-full h-96 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <SEOMeta title="Admin - Wallets" noIndex={true} />
        <Card className="border-white/[0.06] bg-card/50 backdrop-blur-xl">
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-foreground font-semibold mb-2">{error}</p>
            <Button variant="outline" onClick={loadWallets} className="gap-1 rounded-xl">
              <RefreshCw className="w-3 h-3" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOMeta title="Admin - Wallets" noIndex={true} />
      <div className="min-h-screen bg-background">
        <div className="max-w-[1600px] mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">FleshPay Wallets</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runReconciliation}
              disabled={reconLoading}
              className="gap-1 rounded-xl"
            >
              <AlertTriangle className="w-3 h-3" />
              {reconLoading ? "Running..." : "Reconciliation Check"}
            </Button>
          </div>

          {/* Reconciliation Results */}
          {reconData && (
            <Card className="mb-6 border-amber-500/20 bg-amber-500/[0.03] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Reconciliation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-4 text-sm">
                  <div className="bg-white/[0.02] rounded-xl p-3">
                    <span className="text-white/40 text-xs">Wallets</span>
                    <p className="font-bold text-white mt-1">{reconData.summary.total_wallets}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-3">
                    <span className="text-white/40 text-xs">Balance Errors</span>
                    <p className={`font-bold mt-1 ${reconData.summary.total_errors > 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {reconData.summary.total_errors}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-3">
                    <span className="text-white/40 text-xs">Warnings</span>
                    <p className={`font-bold mt-1 ${reconData.summary.total_warnings > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {reconData.summary.total_warnings}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-3">
                    <span className="text-white/40 text-xs">Test Flag Issues</span>
                    <p className={`font-bold mt-1 ${reconData.summary.test_flag_warnings > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {reconData.summary.test_flag_warnings}
                    </p>
                  </div>
                </div>
                {(reconData.global_warnings?.payment_without_earning?.length > 0 ||
                  reconData.global_warnings?.test_earnings_not_flagged?.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {reconData.global_warnings.payment_without_earning.map((w, i) => (
                      <div key={i} className="text-xs text-amber-300/80 p-3 bg-amber-500/10 rounded-xl">
                        {w.message}
                      </div>
                    ))}
                    {reconData.global_warnings.test_earnings_not_flagged.map((w, i) => (
                      <div key={`t${i}`} className="text-xs text-amber-300/80 p-3 bg-amber-500/10 rounded-xl">
                        {w.message}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <Input
                placeholder="Search by user ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white/[0.03] border-white/[0.08] rounded-xl"
              />
            </div>
            <Button variant="outline" size="sm" onClick={loadWallets} className="gap-1 rounded-xl">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </div>

          {/* Wallet List */}
          <Card className="mb-6 border-white/[0.06] bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                      <th className="p-3 text-left text-[11px] font-medium text-white/30 uppercase tracking-wider">User ID</th>
                      <th className="p-3 text-right text-[11px] font-medium text-white/30 uppercase tracking-wider">Balance</th>
                      <th className="p-3 text-right text-[11px] font-medium text-white/30 uppercase tracking-wider">Lifetime Top-ups</th>
                      <th className="p-3 text-right text-[11px] font-medium text-white/30 uppercase tracking-wider">Lifetime Spends</th>
                      <th className="p-3 text-center text-[11px] font-medium text-white/30 uppercase tracking-wider">Status</th>
                      <th className="p-3 text-right text-[11px] font-medium text-white/30 uppercase tracking-wider">Updated</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((w) => (
                      <tr key={w.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 text-sm font-mono text-white/70 truncate max-w-[200px]">{w.user_id}</td>
                        <td className="p-3 text-sm text-right font-bold text-white">${w.balance_usd?.toFixed(2)}</td>
                        <td className="p-3 text-sm text-right text-white/40">${w.lifetime_topups_usd?.toFixed(2) || "0.00"}</td>
                        <td className="p-3 text-sm text-right text-white/40">${w.lifetime_spends_usd?.toFixed(2) || "0.00"}</td>
                        <td className="p-3 text-center">
                          <Badge variant={w.status === "active" ? "default" : "destructive"} className="text-[10px] rounded-lg">
                            {w.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-white/25 text-right">
                          {new Date(w.updated_date).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="ghost" onClick={() => viewWallet(w)} className="rounded-lg">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Detail */}
          {selectedWallet && (
            <Card className="border-white/[0.06] bg-card/50 backdrop-blur-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Wallet className="w-4 h-4 text-primary" />
                  Wallet Details — <span className="font-mono text-white/60">{selectedWallet.user_id}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detailLoading ? (
                  <Skeleton className="w-full h-32 rounded-xl" />
                ) : (
                  <div className="space-y-6">
                    {/* Ledger */}
                    <div>
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Ledger Entries ({selectedLedger.length})</h3>
                      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                        <table className="w-full text-xs">
                          <thead className="bg-white/[0.02]">
                            <tr>
                              <th className="p-2.5 text-left text-white/25 font-medium">Date</th>
                              <th className="p-2.5 text-left text-white/25 font-medium">Type</th>
                              <th className="p-2.5 text-right text-white/25 font-medium">Amount</th>
                              <th className="p-2.5 text-left text-white/25 font-medium">Source</th>
                              <th className="p-2.5 text-left text-white/25 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedLedger.map((e) => (
                              <tr key={e.id} className="border-b border-white/[0.03]">
                                <td className="p-2.5 text-white/50">{new Date(e.created_date).toLocaleDateString()}</td>
                                <td className="p-2.5">
                                  <Badge variant="outline" className="text-[10px] rounded-lg">{e.entry_type}</Badge>
                                </td>
                                <td className={`p-2.5 text-right font-bold ${e.entry_type === "credit" ? "text-emerald-400" : "text-rose-400"}`}>
                                  {e.entry_type === "credit" ? "+" : "-"}${e.amount_usd?.toFixed(2)}
                                </td>
                                <td className="p-2.5 text-white/40">{e.source_type}</td>
                                <td className="p-2.5">
                                  <Badge variant="outline" className="text-[10px] rounded-lg">{e.status}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Purchases */}
                    <div>
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Purchases ({selectedPurchases.length})</h3>
                      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                        <table className="w-full text-xs">
                          <thead className="bg-white/[0.02]">
                            <tr>
                              <th className="p-2.5 text-left text-white/25 font-medium">Date</th>
                              <th className="p-2.5 text-left text-white/25 font-medium">Type</th>
                              <th className="p-2.5 text-left text-white/25 font-medium">Product</th>
                              <th className="p-2.5 text-right text-white/25 font-medium">Amount</th>
                              <th className="p-2.5 text-left text-white/25 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPurchases.map((p) => (
                              <tr key={p.id} className="border-b border-white/[0.03]">
                                <td className="p-2.5 text-white/50">{new Date(p.created_date).toLocaleDateString()}</td>
                                <td className="p-2.5">
                                  <Badge variant="outline" className="text-[10px] rounded-lg">{p.purchase_type}</Badge>
                                </td>
                                <td className="p-2.5 font-mono text-white/40 truncate max-w-[200px]">
                                  {p.video_id || p.product_id}
                                </td>
                                <td className="p-2.5 text-right font-bold">${p.amount_usd?.toFixed(2)}</td>
                                <td className="p-2.5">
                                  <Badge variant={p.status === "completed" ? "default" : p.status === "pending" ? "outline" : "destructive"} className="text-[10px] rounded-lg">
                                    {p.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}