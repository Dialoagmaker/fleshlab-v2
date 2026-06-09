import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CalendarClock, CheckCircle2, Clock, DollarSign, TrendingUp } from "lucide-react";

const statusColors = {
  pending_review: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  approved: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  paid: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-gray-500/15 text-gray-400 border-gray-500/30"
};

const statusLabels = {
  pending_review: "Pending Review",
  approved: "Approved — Processing",
  paid: "Paid",
  rejected: "Rejected",
  cancelled: "Cancelled"
};

export default function PayoutSummaryCard({ performerId, performerToken }) {
  const { data, isLoading } = useQuery({
    queryKey: ["performer-payout-summary", performerId],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_payout_summary",
        performer_id: performerId,
        performer_token: performerToken
      });
      return res.data;
    },
    enabled: !!performerId && !!performerToken,
    refetchInterval: 300000
  });

  const fmt = (n) => `$${(n || 0).toFixed(2)}`;

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const s = data?.summary || {};
  const history = data?.payout_history || [];
  const available = s.available_balance_usd || 0;
  const isZeroBalance = available <= 0.005;
  const totalEarned = s.total_earned_usd || 0;
  const currentMonthEarned = s.current_month_earned_usd || 0;
  const currentMonthGross = s.current_month_gross_usd || 0;
  const totalPaid = s.total_paid_usd || 0;
  const totalApprovedPending = s.total_approved_pending_usd || 0;

  return (
    <div className="space-y-4">
      {/* 4-metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Earned This Period */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <p className="text-xs text-muted-foreground">Earned This Period</p>
            </div>
            <p className="text-xl font-bold text-green-500">{fmt(currentMonthEarned)}</p>
            <p className="text-xs text-muted-foreground mt-1">Gross: {fmt(currentMonthGross)}</p>
          </CardContent>
        </Card>

        {/* Available Balance */}
        <Card className={`border ${isZeroBalance ? "bg-card border-border" : "bg-green-500/5 border-green-500/20"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={`w-4 h-4 ${isZeroBalance ? "text-muted-foreground" : "text-green-500"}`} />
              <p className="text-xs text-muted-foreground">Available Balance</p>
            </div>
            <p className={`text-xl font-bold ${isZeroBalance ? "text-muted-foreground" : "text-green-500"}`}>
              {fmt(available)}
            </p>
            {isZeroBalance ? (
              <p className="text-xs text-muted-foreground mt-1">
                All paid. Next: {s.next_payout_date}
              </p>
            ) : (
              <p className="text-xs text-green-500/70 mt-1">Available for payout</p>
            )}
          </CardContent>
        </Card>

        {/* Paid This Period */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-muted-foreground">Paid Out</p>
            </div>
            <p className="text-xl font-bold text-blue-400">{fmt(totalPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalApprovedPending > 0 ? `+ ${fmt(totalApprovedPending)} approved` : 'Lifetime total'}
            </p>
          </CardContent>
        </Card>

        {/* Next Payout */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarClock className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Next Payout</p>
            </div>
            <p className="text-xl font-bold text-foreground">{s.next_payout_date}</p>
            <p className="text-xs text-muted-foreground mt-1">5th & 15th each month</p>
          </CardContent>
        </Card>
      </div>

      {/* Info notice */}
      <div className="text-xs text-muted-foreground px-1 space-y-1">
        {totalApprovedPending > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-yellow-400 shrink-0" />
            <span className="text-yellow-400">{fmt(totalApprovedPending)} approved — processing</span>
          </div>
        )}
        <p>{s.payout_schedule}</p>
        <p className="pt-1 border-t mt-1">
          <strong>Calculation:</strong> Available Balance = Approved/Paid Earnings − Paid/Approved Payouts.
          Estimated/pending earnings are shown in breakdown but not included in available balance.
        </p>
      </div>

      {/* Payout History */}
      {history.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Payout History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {history.map((req) => (
                <div key={req.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{fmt(req.amount)} {(req.currency || 'usd').toUpperCase()}</span>
                      <Badge className={`text-xs border ${statusColors[req.status] || "bg-secondary text-secondary-foreground"}`} variant="outline">
                        {statusLabels[req.status] || req.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                      <p>Method: {req.payout_method?.replace(/_/g, ' ').toUpperCase()}{req.payout_snapshot_masked ? ` — ${req.payout_snapshot_masked}` : ''}</p>
                      {req.performer_visible_message && (
                        <p className="text-foreground/70">{req.performer_visible_message}</p>
                      )}
                      {req.paid_at && (
                        <p className="text-green-400">Paid: {new Date(req.paid_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(req.requested_at || req.created_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}