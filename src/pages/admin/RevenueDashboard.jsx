import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, DollarSign, TrendingUp, Users, Video, ExternalLink, Building2, AlertTriangle } from "lucide-react";
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
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
        include_test_mode: false,
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
        description="View revenue analytics with internal/external separation"
        canonical="/admin/revenue"
        noIndex={true}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-[1600px] mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-foreground">Revenue Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Revenue analytics with internal payment and external platform separation
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1600px] mx-auto px-4 py-8">
          {/* Primary Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Internal Payment Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data?.revenue_summary?.internal_payment_gross?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  From FLESHLAB payments only
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">External Platform Revenue</CardTitle>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">${data?.revenue_summary?.external_platform_gross?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  Livecam, imported platforms
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Business Revenue</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${data?.revenue_summary?.total_business_revenue?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  Internal + External combined
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Internal Unattributed</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  (data?.revenue_summary?.internal_unattributed_gross || 0) > 0 
                    ? 'text-orange-600' 
                    : 'text-green-600'
                }`}>
                  ${(data?.revenue_summary?.internal_unattributed_gross || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Payments without attribution
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performer Share (Total)</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data?.revenue_summary?.performer_share_total?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.studio_share?.performer_percentage || 0}% of total attributed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Studio Share (Total)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data?.revenue_summary?.studio_share_total?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.studio_share?.studio_percentage || 0}% of total attributed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Test Records Excluded</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{data?.diagnostics?.test_records_excluded || 0}</div>
                <p className="text-xs text-muted-foreground">
                  ${data?.test_data_summary?.test_payments_gross?.toFixed(2) || '0.00'} test payments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Internal vs External Breakdown */}
          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            {/* Internal Revenue Breakdown */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <CardTitle>Internal Payment Revenue</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Gross Revenue</span>
                    <span className="font-bold text-lg">${data?.internal_breakdown?.gross?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">PPV</span>
                      <span className="font-medium">${data?.internal_breakdown?.by_type?.ppv?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fanclub Subscriptions</span>
                      <span className="font-medium">${data?.internal_breakdown?.by_type?.fanclub_subscription?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Guest Production Deposits</span>
                      <span className="font-medium">${data?.internal_breakdown?.by_type?.guest_production_deposit?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Other</span>
                      <span className="font-medium">${data?.internal_breakdown?.by_type?.other?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b bg-muted/30 px-2 rounded">
                    <span className="text-sm font-medium">Attributed Gross</span>
                    <span className="font-bold">${data?.internal_breakdown?.attributed_gross?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Performer Share</span>
                    <span className="font-medium">${data?.internal_breakdown?.performer_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Studio Share</span>
                    <span className="font-medium">${data?.internal_breakdown?.studio_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className={`flex justify-between items-center py-3 px-3 rounded-lg ${
                    (data?.internal_breakdown?.unattributed_gross || 0) > 0 
                      ? 'bg-orange-500/10 border border-orange-500/30' 
                      : 'bg-green-500/10 border border-green-500/30'
                  }`}>
                    <span className="text-sm font-medium">Unattributed Gross</span>
                    <span className={`font-bold ${(data?.internal_breakdown?.unattributed_gross || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      ${(data?.internal_breakdown?.unattributed_gross || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* External Revenue Breakdown */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-blue-500" />
                  <CardTitle>External Platform Revenue</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Total External Gross</span>
                    <span className="font-bold text-lg text-blue-600">${data?.external_breakdown?.gross?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Livecam</span>
                      <span className="font-medium">${data?.external_breakdown?.by_source?.livecam?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Imported Platforms</span>
                      <span className="font-medium">${data?.external_breakdown?.by_source?.imported_platform?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Other External</span>
                      <span className="font-medium">${data?.external_breakdown?.by_source?.other?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-t pt-3">
                    <span className="text-sm text-muted-foreground">Performer Share</span>
                    <span className="font-medium">${data?.external_breakdown?.performer_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Studio Share</span>
                    <span className="font-medium">${data?.external_breakdown?.studio_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-3">
                    <p className="text-xs text-blue-600">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      External revenue has no internal payment records - this is expected for livecam and imported platform earnings.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PPV & Fanclub Details */}
          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  <CardTitle>PPV Revenue (Internal)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Gross Revenue</span>
                    <span className="font-medium">${data?.ppv_revenue?.gross?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Attributed</span>
                    <span className="font-medium">${data?.ppv_revenue?.attributed?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Unattributed</span>
                    <span className={`font-medium ${(data?.ppv_revenue?.unattributed || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      ${data?.ppv_revenue?.unattributed?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Payment Count</span>
                    <span className="font-medium">{data?.ppv_revenue?.count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <CardTitle>Fanclub Revenue (Internal)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Gross Revenue</span>
                    <span className="font-medium">${data?.fanclub_revenue?.gross?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Attributed</span>
                    <span className="font-medium">${data?.fanclub_revenue?.attributed?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Unattributed</span>
                    <span className={`font-medium ${(data?.fanclub_revenue?.unattributed || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      ${data?.fanclub_revenue?.unattributed?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Subscriptions</span>
                    <span className="font-medium">{data?.fanclub_revenue?.active_subscriptions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">New This Period</span>
                    <span className="font-medium">{data?.fanclub_revenue?.new_subscriptions || 0}</span>
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
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Total Gross</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Internal Gross</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">External Gross</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Performer Amount</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Studio Amount</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">By Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.performer_shares?.map((performer) => (
                      <tr key={performer.performer_id} className="border-b hover:bg-muted/30">
                        <td className="p-3 text-sm font-medium">{performer.performer_name}</td>
                        <td className="p-3 text-sm font-bold">${performer.gross.toFixed(2)}</td>
                        <td className={`p-3 text-sm ${performer.internal_gross > 0 ? 'font-medium' : 'text-muted-foreground'}`}>
                          ${performer.internal_gross.toFixed(2)}
                        </td>
                        <td className={`p-3 text-sm ${performer.external_gross > 0 ? 'font-medium text-blue-600' : 'text-muted-foreground'}`}>
                          ${performer.external_gross.toFixed(2)}
                        </td>
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

          {/* Sanity Warnings */}
          {data?.sanity_warnings && data.sanity_warnings.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Data Quality Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.sanity_warnings.map((warning, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        warning.severity === 'error'
                          ? 'bg-red-500/10 border-red-500/30 text-red-600'
                          : warning.severity === 'warning'
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-600'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-600'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs mt-0.5">
                          {warning.code}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{warning.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attribution Coverage Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Internal Payment Attribution Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Internal Payments</p>
                  <p className="text-2xl font-bold">{data?.revenue_summary?.internal_payments_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unattributed Payments</p>
                  <p className={`text-2xl font-bold ${(data?.diagnostics?.internal_unattributed_payments_count || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {data?.diagnostics?.internal_unattributed_payments_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unattributed Amount</p>
                  <p className={`text-2xl font-bold ${(data?.diagnostics?.internal_unattributed_amount || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    ${(data?.diagnostics?.internal_unattributed_amount || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attribution Coverage</p>
                  <p className={`text-2xl font-bold ${(data?.revenue_summary?.internal_attribution_coverage_percent || 0) >= 90 ? 'text-green-600' : (data?.revenue_summary?.internal_attribution_coverage_percent || 0) >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                    {data?.revenue_summary?.internal_attribution_coverage_percent || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unattributed Payments by Reason */}
          {data?.diagnostics?.unattributed_by_reason && Object.keys(data.diagnostics.unattributed_by_reason).length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Unattributed Payments by Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(data.diagnostics.unattributed_by_reason).map(([reason, data]) => (
                    <Card key={reason} className="bg-muted/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{reason.replace(/_/g, ' ')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Count</span>
                            <span className="font-medium">{data.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Total Amount</span>
                            <span className="font-medium">${data.total_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Internal Payments Without Attribution - Detailed Table */}
          {data?.diagnostics?.unattributed_payments_detailed && data.diagnostics.unattributed_payments_detailed.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Internal Payments Without Attribution ({data.diagnostics.unattributed_payments_detailed.length} payments, ${data.diagnostics.internal_unattributed_amount?.toFixed(2) || '0.00'})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Amount</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Linked Content</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Buyer/User</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Provider</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Missing Reason</th>
                        <th className="p-3 text-left text-xs font-medium text-muted-foreground">Suggested Fix</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.diagnostics.unattributed_payments_detailed.map((payment) => (
                        <tr key={payment.payment_id} className="border-b hover:bg-muted/30">
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(payment.created_date).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-sm font-medium">${payment.amount.toFixed(2)}</td>
                          <td className="p-3 text-sm">
                            <Badge variant="outline">{payment.payment_type}</Badge>
                          </td>
                          <td className="p-3 text-sm max-w-xs truncate" title={payment.linked_content}>
                            {payment.linked_content}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {payment.user_id ? payment.user_id.substring(0, 8) + '...' : 'Unknown'}
                          </td>
                          <td className="p-3 text-sm">
                            <div className="flex flex-col">
                              <span>{payment.provider}</span>
                              {payment.provider_session_id && (
                                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {payment.provider_session_id.substring(0, 20)}...
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            <Badge variant={payment.missing_reason.includes('TEST') ? 'secondary' : 'destructive'} className="text-xs">
                              {payment.missing_reason.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground max-w-xs truncate" title={payment.suggested_fix}>
                            {payment.suggested_fix}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diagnostics */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  {data?.diagnostics?.payments_without_entitlement === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Payments Without Entitlement</p>
                    <p className="text-xs text-muted-foreground">{data?.diagnostics?.payments_without_entitlement || 0} payments</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">External Line Items</p>
                    <p className="text-xs text-muted-foreground">{data?.diagnostics?.external_line_items_count || 0} records</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Livecam Revenue</p>
                    <p className="text-xs text-muted-foreground">{data?.diagnostics?.livecam_line_items_count || 0} records</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Imported Platform</p>
                    <p className="text-xs text-muted-foreground">{data?.diagnostics?.imported_platform_line_items_count || 0} records</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Duplicate Webhooks</p>
                    <p className="text-xs text-muted-foreground">{data?.diagnostics?.duplicate_webhooks || 0} events</p>
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