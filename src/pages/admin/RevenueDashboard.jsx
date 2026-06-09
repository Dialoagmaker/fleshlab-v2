import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, DollarSign, TrendingUp, Users, Video } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";

export default function AdminRevenueDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('adminRevenueDashboard', {
        from_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        to_date: new Date().toISOString(),
        include_test_mode: true,
      });
      setData(response.data);
    } catch (err) {
      console.error("Failed to load revenue data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-5 h-5" />
              <p>Failed to load revenue data: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title="Admin - Revenue Dashboard"
        description="View revenue analytics and performer shares"
        canonical="/admin/revenue"
        noIndex={true}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-[1400px] mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-foreground">Revenue Dashboard</h1>
            <p className="text-muted-foreground mt-1">Revenue analytics, performer shares, and studio revenue</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Gross Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data?.gross_revenue?.total?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.gross_revenue?.ppv || 0} PPV / {data?.gross_revenue?.fanclub || 0} Fanclub
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performer Share</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data?.studio_share?.total_performer_amount?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.studio_share?.performer_percentage || 0}% of attributed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Studio Share</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data?.studio_share?.total_studio_amount?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.studio_share?.studio_percentage || 0}% of attributed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unattributed</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">${data?.studio_share?.unattributed_gross?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  Gross revenue without attribution
                </p>
              </CardContent>
            </Card>
          </div>

          {/* PPV vs Fanclub */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  <CardTitle>PPV Revenue</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Gross</span>
                    <span className="font-medium">${data?.ppv_revenue?.total_gross?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Performer Share</span>
                    <span className="font-medium">${data?.ppv_revenue?.performer_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Studio Share</span>
                    <span className="font-medium">${data?.ppv_revenue?.studio_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Payment Count</span>
                    <span className="font-medium">{data?.ppv_revenue?.payment_count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <CardTitle>Fanclub Revenue</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Gross</span>
                    <span className="font-medium">${data?.fanclub_revenue?.total_gross?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Performer-Specific</span>
                    <span className="font-medium">${data?.fanclub_revenue?.performer_specific_gross?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Global/Unattributed</span>
                    <span className="font-medium">${data?.fanclub_revenue?.global_unattributed_gross?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subscription Count</span>
                    <span className="font-medium">{data?.fanclub_revenue?.subscription_count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performer Shares Table */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Performer Revenue Shares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Performer</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Gross</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Performer Amount</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Studio Amount</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">By Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.performer_shares?.map((performer) => (
                      <tr key={performer.performer_id} className="border-b">
                        <td className="p-3 text-sm font-medium">{performer.performer_name}</td>
                        <td className="p-3 text-sm">${performer.gross.toFixed(2)}</td>
                        <td className="p-3 text-sm">${performer.performer_amount.toFixed(2)}</td>
                        <td className="p-3 text-sm">${performer.studio_amount.toFixed(2)}</td>
                        <td className="p-3 text-xs">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(performer.by_source_type).map(([source, amount]) => (
                              <Badge key={source} variant="outline" className="text-xs">
                                {source.replace('_', ' ')}: ${amount.toFixed(2)}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Diagnostics */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-2">
                  {data?.diagnostics?.ppv_missing_video_id === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">PPV Missing Video ID</p>
                    <p className="text-xs text-muted-foreground">{data?.diagnostics?.ppv_missing_video_id || 0} payments</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {data?.diagnostics?.videos_without_performers === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Videos Without Performers</p>
                    <p className="text-xs text-muted-foreground">{data?.diagnostics?.videos_without_performers || 0} videos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {data?.diagnostics?.ppv_without_attribution === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">PPV Without Attribution</p>
                    <p className="text-xs text-muted-foreground">{data?.diagnostics?.ppv_without_attribution || 0} payments</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Test Records Excluded</p>
                    <p className="text-xs text-muted-foreground">{data?.diagnostics?.test_records_excluded || 0} records</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Test Payments</p>
                    <p className="text-xs text-muted-foreground">{data?.test_data_summary?.test_payments_count || 0} (${data?.test_data_summary?.test_payments_gross?.toFixed(2) || '0.00'})</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Test Line Items</p>
                    <p className="text-xs text-muted-foreground">{data?.test_data_summary?.test_line_items_count || 0} (${data?.test_data_summary?.test_line_items_performer_amount?.toFixed(2) || '0.00'})</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}