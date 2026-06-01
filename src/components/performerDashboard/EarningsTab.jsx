import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EarningsTab({ performerId }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: earnings, isLoading, refetch } = useQuery({
    queryKey: ["performer-earnings", performerId, selectedMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_earnings",
        performer_id: performerId,
        period_month: selectedMonth
      });
      return res.data.earnings || [];
    },
    enabled: !!performerId
  });

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-500",
    approved: "bg-blue-500/20 text-blue-500",
    paid: "bg-green-500/20 text-green-500",
    held: "bg-red-500/20 text-red-500",
    disputed: "bg-orange-500/20 text-orange-500"
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Earnings</CardTitle>
          <p className="text-sm text-muted-foreground">
            View your earnings by month. Status: Pending = recorded but not approved, 
            Approved = ready for payout, Paid = completed, Held = temporarily held, 
            Disputed = under review.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm text-muted-foreground">Period:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-sm border border-input bg-transparent px-3 py-1 rounded-md"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthStr = date.toISOString().slice(0, 7);
                return <option key={monthStr} value={monthStr}>{monthStr}</option>;
              })}
            </select>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !earnings || earnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No earnings recorded for {selectedMonth} yet.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-4 text-xs text-muted-foreground pb-2 border-b">
                <div>Type</div>
                <div>Video</div>
                <div className="text-right">Net Amount</div>
                <div className="text-right">Status</div>
              </div>
              {earnings.map(earning => (
                <div key={earning.id} className="grid grid-cols-4 text-sm py-2 border-b last:border-0">
                  <div className="capitalize">{earning.earning_type.replace(/_/g, " ")}</div>
                  <div className="truncate" title={earning.video_title || "N/A"}>
                    {earning.video_title || "—"}
                  </div>
                  <div className="text-right font-medium">
                    ${earning.net_amount_usd?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-right">
                    <Badge className={statusColors[earning.status] || "bg-secondary"}>
                      {earning.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}