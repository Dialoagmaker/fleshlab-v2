import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function MonthlyCloseoutCard({ performerId }) {
  const [currentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: summary, isLoading } = useQuery({
    queryKey: ["performer-finance-summary", performerId, currentMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerFinanceService", {
        action: "calculate_period_summary",
        performer_id: performerId,
        period_month: currentMonth
      });
      return res.data;
    },
    enabled: !!performerId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Monthly Closeout</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const s = summary?.summary || { gross_total: 0, net_total: 0, pending_total: 0, paid_total: 0, held_total: 0 };

  if (!summary?.earnings || summary.earnings.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Monthly Closeout</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No earnings recorded for {currentMonth} yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Closeout - {currentMonth}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Gross</p>
            <p className="text-lg font-semibold">${s.gross_total?.toFixed(2) || "0.00"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Your Est. Share</p>
            <p className="text-lg font-semibold text-green-400">${s.net_total?.toFixed(2) || "0.00"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-sm">${s.paid_total?.toFixed(2) || "0.00"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">On Hold</p>
            <p className="text-sm text-yellow-400">${s.held_total?.toFixed(2) || "0.00"}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-2 border-t">
          Estimated amounts. Final payout subject to management approval.
        </p>
      </CardContent>
    </Card>
  );
}