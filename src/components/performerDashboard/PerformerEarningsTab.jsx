import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, PieChart } from "lucide-react";

export default function PerformerEarningsTab({ performerId, performerToken }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: earningsData, isLoading } = useQuery({
    queryKey: ['performer-earnings', performerId, selectedMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke('performerEarningLineItemService', {
        action: 'aggregate_period_summary',
        performer_id: performerId,
        period_month: selectedMonth
      });
      return res.data;
    },
    enabled: !!performerId && !!performerToken
  });

  const { data: lineItemsData } = useQuery({
    queryKey: ['performer-line-items', performerId, selectedMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke('performerEarningLineItemService', {
        action: 'list_line_items',
        performer_id: performerId,
        period_month: selectedMonth
      });
      return res.data;
    },
    enabled: !!performerId && !!performerToken
  });

  const summary = earningsData?.summary;
  const lineItems = lineItemsData?.line_items || [];

  if (!performerId || !performerToken) {
    return (
      <div className="bg-muted rounded-lg p-6">
        <p className="text-sm text-muted-foreground">Authentication required</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-muted rounded-lg p-6">
        <p className="text-sm text-muted-foreground">Loading earnings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary?.gross_total?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Total revenue before split
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${summary?.performer_total?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Your share of revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Studio Share</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary?.studio_total?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Studio revenue share
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your income for {selectedMonth}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
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
            {summary && (
              <div className="ml-auto flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Line Items:</span>{' '}
                  <span className="font-medium">{summary.line_item_count}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Legacy Records:</span>{' '}
                  <span className="font-medium">{summary.legacy_earning_count}</span>
                </div>
              </div>
            )}
          </div>

          {/* By Source Type */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">By Source Type</h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {summary?.by_source_type && Object.entries(summary.by_source_type).map(([type, data]) => (
                <Card key={type}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{type.replace('_', ' ')}</Badge>
                      <span className="text-xs text-muted-foreground">{data.count} items</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gross:</span>
                        <span className="font-medium">${data.gross.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-500">
                        <span className="text-muted-foreground">Your Share:</span>
                        <span className="font-medium">${data.performer.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* By Source Platform */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">By Platform</h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {summary?.by_source_platform && Object.entries(summary.by_source_platform).map(([platform, data]) => (
                <Card key={platform}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{platform}</Badge>
                      <span className="text-xs text-muted-foreground">{data.count}</span>
                    </div>
                    <div className="text-sm">
                      <div className="text-green-500 font-medium">
                        ${data.performer.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Your earnings
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* By Status */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">By Status</h3>
            <div className="grid gap-2 md:grid-cols-4">
              {summary?.by_status && Object.entries(summary.by_status).map(([status, data]) => (
                <Card key={status}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant={
                          status === 'approved' ? 'default' :
                          status === 'paid' ? 'secondary' :
                          status === 'pending' ? 'outline' : 'outline'
                        }
                      >
                        {status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{data.count}</span>
                    </div>
                    <div className="text-sm">
                      <div className="text-green-500 font-medium">
                        ${data.performer.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Your earnings
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Detailed Line Items</h3>
            {lineItems.length === 0 ? (
              <div className="bg-muted rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">No line items for {selectedMonth}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Source Type</th>
                      <th className="text-left p-2">Platform</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-right p-2">Gross</th>
                      <th className="text-right p-2">Your %</th>
                      <th className="text-right p-2">Your Earnings</th>
                      <th className="text-center p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">{item.source_type}</Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant="secondary" className="text-xs">{item.source_platform}</Badge>
                        </td>
                        <td className="p-2 max-w-[200px] truncate">{item.description}</td>
                        <td className="text-right p-2 font-medium">${item.gross_amount_usd?.toFixed(2)}</td>
                        <td className="text-right p-2">{item.performer_share_percent}%</td>
                        <td className="text-right p-2 font-medium text-green-500">${item.performer_amount_usd?.toFixed(2)}</td>
                        <td className="text-center p-2">
                          <Badge 
                            variant={
                              item.status === 'approved' ? 'default' :
                              item.status === 'paid' ? 'secondary' :
                              item.status === 'pending' ? 'outline' : 'outline'
                            }
                            className="text-xs"
                          >
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              This shows all your income sources including video platform revenue, livecam, fanclub subscriptions, custom content, bonuses, and adjustments.
              Video revenue is automatically generated from VideoStatSnapshot records during monthly closeout.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}