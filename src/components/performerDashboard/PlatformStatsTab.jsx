import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function PlatformStatsTab({ performerId }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['performer-platform-stats', selectedMonth, performerId],
    queryFn: async () => {
      const res = await base44.functions.invoke('performerDashboardService', {
        action: 'get_video_stats',
        performer_id: performerId,
        period_month: selectedMonth
      });
      return res.data;
    },
    enabled: !!performerId
  });

  const stats = statsData?.stats || [];
  const grossRevenue = statsData?.gross_revenue_total || 0;
  const performerEarnings = statsData?.performer_earnings_total || 0;
  const revenueSharePct = statsData?.revenue_share_pct || 40;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Stats</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your video performance across external platforms. Revenue shown is gross platform revenue.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">Period</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const monthStr = date.toISOString().slice(0, 7);
                    return <option key={monthStr} value={monthStr}>{monthStr}</option>;
                  })}
                </SelectContent>
              </Select>
            </div>
            {stats.length > 0 && (
              <div className="ml-auto flex gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Gross Revenue</p>
                  <p className="text-lg font-bold">${grossRevenue.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Your Share ({revenueSharePct}%)</p>
                  <p className="text-lg font-bold text-green-500">${performerEarnings.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading stats...</p>
          ) : !stats || stats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No platform stats found for {selectedMonth}.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Likes</TableHead>
                  <TableHead>Favourites</TableHead>
                  <TableHead>Gross Revenue</TableHead>
                  <TableHead>Your Share</TableHead>
                  <TableHead>Promo Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => {
                  const statPerformerShare = (stat.revenue_usd || 0) * (revenueSharePct / 100);
                  return (
                    <TableRow key={stat.id}>
                      <TableCell className="max-w-[250px] truncate font-medium">
                        {stat.video_title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stat.platform}</Badge>
                      </TableCell>
                      <TableCell>{stat.views?.toLocaleString()}</TableCell>
                      <TableCell>{stat.likes?.toLocaleString()}</TableCell>
                      <TableCell>{stat.favourites?.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">${stat.revenue_usd?.toFixed(2)}</TableCell>
                      <TableCell className="font-medium text-green-500">
                        ${statPerformerShare.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {stat.promotion_status && (
                          <Badge 
                            variant={
                              stat.promotion_status === 'active' ? 'default' :
                              stat.promotion_status === 'planned' ? 'secondary' :
                              stat.promotion_status === 'ended' ? 'destructive' : 'outline'
                            }
                            className="text-xs"
                          >
                            {stat.promotion_status}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Gross revenue is the total platform revenue. Your share ({revenueSharePct}%) is calculated based on your revenue model.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}