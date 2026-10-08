import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Building2, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter
} from "lucide-react";
import SEOMeta from "@/components/SEOMeta";

export default function AdminMonthlyPayoutSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState("2026-06");
  const [performer_id, setPerformer_id] = useState("all");
  const [source_platform, setSource_platform] = useState("all");
  const [include_test_mode, setInclude_test_mode] = useState(false);
  const [expandedPerformer, setExpandedPerformer] = useState(null);

  useEffect(() => {
    loadPayoutData();
  }, [month, performer_id, source_platform, include_test_mode]);

  const loadPayoutData = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('adminMonthlyPayoutSummary', {
        month,
        performer_id: performer_id === "all" ? undefined : performer_id,
        source_platform,
        include_test_mode,
      });
      setData(response.data);
    } catch (err) {
      console.error("Failed to load payout data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadPayoutData();
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
              <p>Failed to load payout data: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title="Admin - Monthly Payout Summary"
        description="View monthly performer payout summary and readiness"
        canonical="/admin/monthly-payout-summary"
        noIndex={true}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-[1600px] mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-foreground">Monthly Payout Summary</h1>
            <p className="text-muted-foreground mt-1">
              Read-only performer earnings summary before payout approval
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1600px] mx-auto px-4 py-8">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <Input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Performer</label>
                  <Select value={performer_id} onValueChange={setPerformer_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Performers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Performers</SelectItem>
                      {data?.performer_summaries?.map((p) => (
                        <SelectItem key={p.performer_id} value={p.performer_id}>
                          {p.performer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source Platform</label>
                  <Select value={source_platform} onValueChange={setSource_platform}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="fleshlab">FLESHLAB (Internal)</SelectItem>
                      <SelectItem value="external">External Platforms</SelectItem>
                      <SelectItem value="livecam">Livecam</SelectItem>
                      <SelectItem value="imported">Imported Platforms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Mode</label>
                  <Select value={include_test_mode ? "true" : "false"} onValueChange={(v) => setInclude_test_mode(v === "true")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Exclude Test Records</SelectItem>
                      <SelectItem value="true">Include Test Records</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button onClick={handleRefresh} className="w-full">
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Performer Earnings</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data?.summary?.total_performer_earnings?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  Across all performers
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Studio Share</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${data?.summary?.total_studio_share?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  Studio revenue share
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eligible for Payout</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{data?.summary?.eligible_for_payout_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Performers ≥ $100 threshold
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Below Threshold</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{data?.summary?.below_threshold_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Performers &lt; $100 threshold
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On Hold</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{data?.summary?.on_hold_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Payouts on hold
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performer Payout Table */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Performer Payout Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Performer</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Gross Revenue</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Performer Share</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Studio Share</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Source Breakdown</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Payout Status</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Threshold</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Line Items</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.performer_summaries?.map((performer) => (
                      <tr key={performer.performer_id} className="border-b hover:bg-muted/30">
                        <td className="p-3 text-sm font-medium">{performer.performer_name}</td>
                        <td className="p-3 text-sm font-bold">${performer.gross_revenue_total?.toFixed(2)}</td>
                        <td className={`p-3 text-sm font-medium ${
                          performer.minimum_payout_threshold_status === 'eligible' 
                            ? 'text-green-600' 
                            : 'text-orange-600'
                        }`}>
                          ${performer.performer_share_total?.toFixed(2)}
                        </td>
                        <td className="p-3 text-sm">${performer.studio_share_total?.toFixed(2)}</td>
                        <td className="p-3 text-xs">
                          <div className="flex flex-col gap-1">
                            {performer.source_breakdown.internal_fleshlab_gross > 0 && (
                              <span className="text-xs">FLESHLAB: ${performer.source_breakdown.internal_fleshlab_gross.toFixed(2)}</span>
                            )}
                            {performer.source_breakdown.external_platform_gross > 0 && (
                              <span className="text-xs text-blue-600">External: ${performer.source_breakdown.external_platform_gross.toFixed(2)}</span>
                            )}
                            {performer.source_breakdown.livecam_gross > 0 && (
                              <span className="text-xs text-blue-600">Livecam: ${performer.source_breakdown.livecam_gross.toFixed(2)}</span>
                            )}
                            {performer.source_breakdown.imported_platform_gross > 0 && (
                              <span className="text-xs text-blue-600">Imported: ${performer.source_breakdown.imported_platform_gross.toFixed(2)}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant={
                            performer.payout_status === 'paid' ? 'default' :
                            performer.payout_status === 'approved' ? 'secondary' :
                            performer.payout_status === 'on_hold' ? 'destructive' :
                            'outline'
                          }>
                            {performer.payout_status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant={
                            performer.minimum_payout_threshold_status === 'eligible' ? 'default' : 'outline'
                          }>
                            {performer.minimum_payout_threshold_status === 'eligible' ? 'Eligible' : 'Below'}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-center">{performer.line_item_count}</td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExpandedPerformer(expandedPerformer === performer.performer_id ? null : performer.performer_id)}
                          >
                            {expandedPerformer === performer.performer_id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Expanded Performer Line Items */}
          {expandedPerformer && data?.performer_summaries?.map((performer) => {
            if (performer.performer_id !== expandedPerformer) return null;
            
            return (
              <Card key={performer.performer_id} className="mb-6 ml-8 mr-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {performer.performer_name} - Revenue Line Items ({performer.line_items?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr className="border-b">
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Source</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Platform</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Gross</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Performer Share</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Studio Share</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performer.line_items?.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-muted/30">
                            <td className="p-3 text-sm text-muted-foreground">
                              {item.created_date ? new Date(item.created_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-3 text-sm">
                              <Badge variant="outline">{item.source_type}</Badge>
                            </td>
                            <td className="p-3 text-sm">{item.source_platform || 'N/A'}</td>
                            <td className="p-3 text-sm font-medium">${item.gross_amount_usd?.toFixed(2)}</td>
                            <td className="p-3 text-sm">${item.performer_amount_usd?.toFixed(2)}</td>
                            <td className="p-3 text-sm">${item.studio_amount_usd?.toFixed(2)}</td>
                            <td className="p-3 text-sm">
                              <Badge variant={
                                item.status === 'paid' ? 'default' :
                                item.status === 'approved' ? 'secondary' :
                                'outline'
                              }>
                                {item.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm max-w-xs truncate" title={item.video_reference || item.payment_reference || ''}>
                              {item.video_reference || item.payment_reference || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Sanity Checks */}
          {data?.sanity_warnings && data.sanity_warnings.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Sanity Checks
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

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Report Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Selected Month</p>
                  <p className="text-lg font-medium">{data?.period?.month || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Source Filter</p>
                  <p className="text-lg font-medium">{data?.period?.source_platform || 'all'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payout Threshold</p>
                  <p className="text-lg font-medium">${data?.metadata?.payout_threshold_usd || 100} USD</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Generated At</p>
                  <p className="text-lg font-medium">
                    {data?.metadata?.generated_at ? new Date(data.metadata.generated_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Generated By</p>
                  <p className="text-lg font-medium">{data?.metadata?.generated_by || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Test Mode</p>
                  <p className="text-lg font-medium">{data?.period?.include_test_mode ? 'Included' : 'Excluded'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}