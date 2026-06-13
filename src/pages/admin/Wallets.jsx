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
      // Server-side admin check — uses adminListWallets function
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
        <Skeleton className="w-full h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <SEOMeta title="Admin - Wallets" noIndex={true} />
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-foreground font-semibold mb-2">{error}</p>
            <Button variant="outline" onClick={loadWallets} className="gap-1">
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
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" /> FleshPay Wallets
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={runReconciliation}
              disabled={reconLoading}
              className="gap-1"
            >
              <AlertTriangle className="w-3 h-3" />
              {reconLoading ? "Running..." : "Reconciliation Check"}
            </Button>
          </div>

          {/* Reconciliation Results */}
          {reconData && (
            <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Reconciliation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Wallets:</span>{" "}
                    <span className="font-bold">{reconData.summary.total_wallets}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Balance Errors:</span>{" "}
                    <span className={`font-bold ${reconData.summary.total_errors > 0 ? "text-red-500" : "text-green-400"}`}>
                      {reconData.summary.total_errors}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Warnings:</span>{" "}
                    <span className={`font-bold ${reconData.summary.total_warnings > 0 ? "text-amber-500" : "text-green-400"}`}>
                      {reconData.summary.total_warnings}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Test Flag Issues:</span>{" "}
                    <span className={`font-bold ${reconData.summary.test_flag_warnings > 0 ? "text-amber-500" : "text-green-400"}`}>
                      {reconData.summary.test_flag_warnings}
                    </span>
                  </div>
                </div>
                {(reconData.global_warnings?.payment_without_earning?.length > 0 ||
                  reconData.global_warnings?.test_earnings_not_flagged?.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {reconData.global_warnings.payment_without_earning.map((w, i) => (
                      <div key={i} className="text-xs text-amber-400 p-2 bg-amber-500/10 rounded">
                        {w.message}
                      </div>
                    ))}
                    {reconData.global_warnings.test_earnings_not_flagged.map((w, i) => (
                      <div key={`t${i}`} className="text-xs text-amber-400 p-2 bg-amber-500/10 rounded">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by user ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={loadWallets} className="gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </div>

          {/* Wallet List */}
          <Card className="mb-6">
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="p-3 text-left text-xs font-medium text-muted-foreground">User ID</th>
                    <th className="p-3 text-right text-xs font-medium text-muted-foreground">Balance</th>
                    <th className="p-3 text-right text-xs font-medium text-muted-foreground">Lifetime Top-ups</th>
                    <th className="p-3 text-right text-xs font-medium text-muted-foreground">Lifetime Spends</th>
                    <th className="p-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                    <th className="p-3 text-right text-xs font-medium text-muted-foreground">Updated</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w) => (
                    <tr key={w.id} className="border-b hover:bg-muted/20">
                      <td className="p-3 text-sm font-mono text-foreground truncate max-w-[200px]">{w.user_id}</td>
                      <td className="p-3 text-sm text-right font-bold">${w.balance_usd?.toFixed(2)}</td>
                      <td className="p-3 text-sm text-right text-muted-foreground">${w.lifetime_topups_usd?.toFixed(2) || "0.00"}</td>
                      <td className="p-3 text-sm text-right text-muted-foreground">${w.lifetime_spends_usd?.toFixed(2) || "0.00"}</td>
                      <td className="p-3 text-center">
                        <Badge variant={w.status === "active" ? "default" : "destructive"} className="text-xs">
                          {w.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground text-right">
                        {new Date(w.updated_date).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => viewWallet(w)}>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Wallet Detail */}
          {selectedWallet && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Wallet className="w-4 h-4 text-primary" />
                  Wallet Details — {selectedWallet.user_id}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detailLoading ? (
                  <Skeleton className="w-full h-32" />
                ) : (
                  <div className="space-y-6">
                    {/* Ledger */}
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Ledger Entries ({selectedLedger.length})</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/30">
                            <tr>
                              <th className="p-2 text-left text-muted-foreground">Date</th>
                              <th className="p-2 text-left text-muted-foreground">Type</th>
                              <th className="p-2 text-right text-muted-foreground">Amount</th>
                              <th className="p-2 text-left text-muted-foreground">Source</th>
                              <th className="p-2 text-left text-muted-foreground">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedLedger.map((e) => (
                              <tr key={e.id} className="border-b border-border/50">
                                <td className="p-2">{new Date(e.created_date).toLocaleDateString()}</td>
                                <td className="p-2">
                                  <Badge variant="outline" className="text-xs">{e.entry_type}</Badge>
                                </td>
                                <td className={`p-2 text-right font-bold ${e.entry_type === "credit" ? "text-green-400" : "text-red-400"}`}>
                                  {e.entry_type === "credit" ? "+" : "-"}${e.amount_usd?.toFixed(2)}
                                </td>
                                <td className="p-2 text-muted-foreground">{e.source_type}</td>
                                <td className="p-2">
                                  <Badge variant="outline" className="text-xs">{e.status}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Purchases */}
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Purchases ({selectedPurchases.length})</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/30">
                            <tr>
                              <th className="p-2 text-left text-muted-foreground">Date</th>
                              <th className="p-2 text-left text-muted-foreground">Type</th>
                              <th className="p-2 text-left text-muted-foreground">Product</th>
                              <th className="p-2 text-right text-muted-foreground">Amount</th>
                              <th className="p-2 text-left text-muted-foreground">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPurchases.map((p) => (
                              <tr key={p.id} className="border-b border-border/50">
                                <td className="p-2">{new Date(p.created_date).toLocaleDateString()}</td>
                                <td className="p-2">
                                  <Badge variant="outline" className="text-xs">{p.purchase_type}</Badge>
                                </td>
                                <td className="p-2 font-mono text-muted-foreground truncate max-w-[200px]">
                                  {p.video_id || p.product_id}
                                </td>
                                <td className="p-2 text-right font-bold">${p.amount_usd?.toFixed(2)}</td>
                                <td className="p-2">
                                  <Badge variant={p.status === "completed" ? "default" : p.status === "pending" ? "outline" : "destructive"} className="text-xs">
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