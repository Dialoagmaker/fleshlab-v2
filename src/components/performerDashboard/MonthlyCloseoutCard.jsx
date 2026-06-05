import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function MonthlyCloseoutCard({ performerId, performerToken }) {
  const [currentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data, isLoading } = useQuery({
    queryKey: ["performer-earnings-summary", performerId, currentMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_earnings",
        performer_id: performerId,
        performer_token: performerToken,
        period_month: currentMonth
      });
      return res.data;
    },
    enabled: !!performerId && !!performerToken
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

  const summary = data?.summary || {};
  const earnings = data?.earnings || [];
  const hasEarnings = earnings.length > 0 || summary.gross_total > 0;

  if (!hasEarnings) {
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
            <p className="text-xs text-muted-foreground">Gross Revenue</p>
            <p className="text-lg font-semibold">${summary.gross_total?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Your Share</p>
            <p className="text-lg font-semibold text-green-400">${summary.performer_total?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-sm">${summary.paid_total?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-sm text-yellow-400">${summary.pending_total?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        
        {/* Breakdown by source type */}
        {summary.by_source_type && Object.keys(summary.by_source_type).length > 0 && (
          <div className="pt-3 border-t space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Income Sources:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(summary.by_source_type).map(([type, typeData]) => (
                <div key={type} className="text-xs flex justify-between items-center">
                  <span className="text-muted-foreground capitalize">{type.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{typeData.count}</Badge>
                    <span className="font-medium text-green-400">${typeData.performer.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status breakdown */}
        {summary.by_status && (
          <div className="pt-2 border-t flex gap-2">
            {Object.entries(summary.by_status).map(([status, statusData]) => (
              <Badge 
                key={status} 
                variant={status === 'paid' ? 'default' : status === 'approved' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {status}: {statusData.count}
              </Badge>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground pt-2 border-t">
          Includes video platform revenue, livecam, fanclub, bonuses, and adjustments.
          Final payout subject to management approval.
        </p>
      </CardContent>
    </Card>
  );
}