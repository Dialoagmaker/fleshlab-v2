import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFleshPayBeta } from "@/hooks/useFleshPayBeta";
import SEOMeta from "@/components/SEOMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Plus, Loader2,
  Clock, CheckCircle2, XCircle, ExternalLink
} from "lucide-react";

const TOPUP_AMOUNTS = [10, 25, 50, 100];

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const StatusBadge = ({ status }) => {
  const config = {
    completed: { icon: CheckCircle2, color: "bg-green-500/10 text-green-400 border-green-500/20" },
    pending:   { icon: Clock,         color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    paid:      { icon: CheckCircle2,  color: "bg-green-500/10 text-green-400 border-green-500/20" },
    failed:    { icon: XCircle,       color: "bg-red-500/10 text-red-400 border-red-500/20" },
    expired:   { icon: XCircle,       color: "bg-red-500/10 text-red-400 border-red-500/20" },
    reversed:  { icon: XCircle,       color: "bg-red-500/10 text-red-400 border-red-500/20" },
  }[status] || { icon: Clock, color: "bg-muted text-muted-foreground border-border" };
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.color} gap-1 text-xs`}>
      <Icon className="w-3 h-3" />{status}
    </Badge>
  );
};

export default function WalletPage() {
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  const { enabled: betaEnabled, loading: betaLoading } = useFleshPayBeta(isAuthenticated);
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(null);

  useEffect(() => {
    if (!authChecked || isLoadingAuth) return;
    if (!isAuthenticated) {
      window.location.href = "/login?next=" + encodeURIComponent("/wallet");
      return;
    }
    loadWallet();
  }, [authChecked, isLoadingAuth, isAuthenticated]);

  const loadWallet = async () => {
    try {
      const res = await base44.functions.invoke("getFleshPayWallet", {});
      setWallet(res.data.wallet);
      setLedger(res.data.ledger || []);
    } catch (err) {
      console.error("Failed to load wallet:", err);
    }
    setLoading(false);
  };

  const handleTopup = async (amount) => {
    setToppingUp(amount);
    try {
      const res = await base44.functions.invoke("createFleshPayTopup", { amount_usd: amount });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (err) {
      console.error("Top-up failed:", err);
    }
    setToppingUp(null);
  };

  if (!authChecked || isLoadingAuth || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="w-96 h-64 rounded-xl" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (betaLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="w-96 h-64 rounded-xl" />
      </div>
    );
  }

  if (!betaEnabled) {
    return (
      <>
        <SEOMeta title="FleshPay | FLESHLAB" noIndex={true} />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="bg-card border-border max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">FleshPay Beta</h2>
              <p className="text-muted-foreground text-sm">
                FleshPay is currently in limited beta and not yet available for your account.
                Please check back soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const balance = wallet?.balance_usd || 0;

  return (
    <>
      <SEOMeta title="My Wallet | FLESHLAB" noIndex={true} />
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" />
              Your FleshPay Balance
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Top up your FleshPay Balance to unlock videos. Payment methods depend on the available provider.
            </p>
          </div>

          {/* Balance Card */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <p className="text-muted-foreground text-sm mb-1">Available balance</p>
              <p className="text-4xl font-bold text-foreground">${balance.toFixed(2)}</p>
              {wallet?.last_transaction_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last transaction: {formatDate(wallet.last_transaction_at)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Add Funds */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Add Funds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TOPUP_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    className="h-14 text-lg font-bold border-border hover:border-primary/50 hover:bg-primary/5"
                    onClick={() => handleTopup(amt)}
                    disabled={toppingUp !== null}
                  >
                    {toppingUp === amt ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `$${amt}`
                    )}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Crypto top-up via NOWPayments
              </p>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ledger.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                  No transactions yet. Add funds to get started.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {ledger.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 px-6 py-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        entry.entry_type === "credit"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {entry.entry_type === "credit" ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {entry.description || entry.source_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.created_date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${
                          entry.entry_type === "credit" ? "text-green-400" : "text-red-400"
                        }`}>
                          {entry.entry_type === "credit" ? "+" : "-"}${entry.amount_usd?.toFixed(2)}
                        </p>
                        <StatusBadge status={entry.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}