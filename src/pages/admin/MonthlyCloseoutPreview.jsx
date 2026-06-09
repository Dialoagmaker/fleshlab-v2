import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Eye,
  FileText,
  Clock,
  XCircle
} from "lucide-react";
import SEOMeta from "@/components/SEOMeta";

export default function AdminMonthlyCloseoutPreview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState("2026-06");
  const [performer_id, setPerformer_id] = useState("all");
  const [include_test_mode, setInclude_test_mode] = useState(false);
  const [expandedPerformer, setExpandedPerformer] = useState(null);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await base44.functions.invoke('adminMonthlyCloseoutPreview', {
        month,
        performer_id: performer_id === "all" ? undefined : performer_id,
        include_test_mode,
      });
      setData(response.data);
    } catch (err) {
      console.error("Failed to load preview:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Don't auto-load on mount - require explicit preview button click
  }, []);

  const handlePreview = () => {
    loadPreview();
  };

  const getActionBadgeVariant = (action) => {
    switch (action) {
      case 'create_draft': return 'default';
      case 'carryover': return 'secondary';
      case 'skip_existing_draft': return 'outline';
      case 'skip_paid': return 'outline';
      case 'skip_on_hold': return 'destructive';
      default: return 'outline';
    }
  };

  const getActionBadgeText = (action) => {
    switch (action) {
      case 'create_draft': return 'Create Draft';
      case 'carryover': return 'Carryover';
      case 'skip_existing_draft': return 'Draft Exists';
      case 'skip_paid': return 'Already Paid';
      case 'skip_on_hold': return 'On Hold';
      case 'skip_no_data': return 'No Data';
      default: return action;
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'paid': return 'default';
      case 'approved': return 'secondary';
      case 'draft': return 'outline';
      case 'on_hold': return 'destructive';
      case 'not_generated': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title="Admin - Monthly Closeout Preview"
        description="Preview monthly payout closeout drafts before generation"
        canonical="/admin/monthly-closeout-preview"
        noIndex={true}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-[1600px] mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-foreground">Monthly Closeout Preview</h1>
            <p className="text-muted-foreground mt-1">
              Preview payout drafts before generation — no payouts created
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1600px] mx-auto px-4 py-8">
          {/* Warning Banner */}
          <Alert className="mb-6 bg-orange-500/10 border-orange-500/30">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-600">Preview Only</AlertTitle>
            <AlertDescription className="text-orange-600">
              This page shows a preview of what closeout drafts would be generated. 
              No payouts are created, approved, or paid from this page. 
              No notifications are sent. This is read-only.
            </AlertDescription>
          </Alert>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
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
                      {data?.performer_previews?.map((p) => (
                        <SelectItem key={p.performer_id} value={p.performer_id}>
                          {p.performer_name}
                        </SelectItem>
                      ))}
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
                  <Button onClick={handlePreview} className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Generate Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert className="mb-6 bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-600">Error</AlertTitle>
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {data && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-6">
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
                    <CardTitle className="text-sm font-medium">Eligible for Draft</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{data?.summary?.eligible_count || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Performers ≥ $100 threshold
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Below Threshold</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{data?.summary?.below_threshold_count || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Carryover to next month
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Draft Exists</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{data?.summary?.draft_exists_count || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Skip (already drafted)
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Already Paid</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{data?.summary?.paid_count || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Skip (already paid)
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
                      Skip (on hold)
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Performers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data?.summary?.performers_count || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      With line items
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Performer Preview Table */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Performer Closeout Preview</CardTitle>
                  <CardDescription>
                    Shows what action would be taken for each performer if closeout were generated
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr className="border-b">
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Performer</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Performer Share</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Studio Share</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Total Eligible</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Threshold</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Preview Action</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Existing Status</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Sources</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Line Items</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.performer_previews?.map((performer) => (
                          <tr key={performer.performer_id} className="border-b hover:bg-muted/30">
                            <td className="p-3 text-sm font-medium">{performer.performer_name}</td>
                            <td className="p-3 text-sm font-bold text-green-600">${performer.performer_share_total?.toFixed(2)}</td>
                            <td className="p-3 text-sm">${performer.studio_share_total?.toFixed(2)}</td>
                            <td className="p-3 text-sm">
                              <div className="flex flex-col">
                                <span className="font-medium">${performer.total_eligible_amount?.toFixed(2)}</span>
                                {performer.unpaid_carryover_amount && (
                                  <span className="text-xs text-muted-foreground">
                                    (incl. ${performer.unpaid_carryover_amount.toFixed(2)} carryover)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-sm">
                              <Badge variant={
                                performer.minimum_payout_threshold_status === 'eligible' ? 'default' : 'outline'
                              }>
                                {performer.minimum_payout_threshold_status === 'eligible' ? 'Eligible (≥$100)' : 'Below (<$100)'}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">
                              <Badge variant={getActionBadgeVariant(performer.payout_action_preview)}>
                                {getActionBadgeText(performer.payout_action_preview)}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">
                              <Badge variant={getStatusBadgeVariant(performer.existing_payout_status)}>
                                {performer.existing_payout_status}
                              </Badge>
                            </td>
                            <td className="p-3 text-xs">
                              <div className="flex flex-col gap-1">
                                {performer.source_breakdown.internal_fleshlab_gross > 0 && (
                                  <span>FLESHLAB: ${performer.source_breakdown.internal_fleshlab_gross.toFixed(2)}</span>
                                )}
                                {performer.source_breakdown.external_platform_gross > 0 && (
                                  <span className="text-blue-600">External: ${performer.source_breakdown.external_platform_gross.toFixed(2)}</span>
                                )}
                                {performer.source_breakdown.livecam_gross > 0 && (
                                  <span className="text-blue-600">Livecam: ${performer.source_breakdown.livecam_gross.toFixed(2)}</span>
                                )}
                                {performer.source_breakdown.imported_platform_gross > 0 && (
                                  <span className="text-blue-600">Imported: ${performer.source_breakdown.imported_platform_gross.toFixed(2)}</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-sm font-medium text-center">{performer.line_item_count}</td>
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

              {/* Expanded Line Items */}
              {expandedPerformer && data?.performer_previews?.map((performer) => {
                if (performer.performer_id !== expandedPerformer) return null;
                
                return (
                  <Card key={performer.performer_id} className="mb-6 bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Line Items for {performer.performer_name} ({performer.line_item_count} items)
                      </CardTitle>
                      <CardDescription>
                        Underlying RevenueLineItems that make up this performer's earnings for {month}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr className="border-b">
                              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Line Item ID</th>
                              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Source</th>
                              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Platform</th>
                              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Gross</th>
                              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Performer</th>
                              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Studio</th>
                              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {performer.line_item_ids?.map((itemId) => {
                              // Find the actual line item data from the preview
                              const lineItem = performer.line_items?.find(li => li.id === itemId);
                              return (
                                <tr key={itemId} className="border-b hover:bg-muted/20">
                                  <td className="p-3 text-xs font-mono text-muted-foreground">{itemId}</td>
                                  <td className="p-3 text-sm text-muted-foreground">
                                    {lineItem?.created_date ? new Date(lineItem.created_date).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="p-3 text-sm">{lineItem?.source_type || 'N/A'}</td>
                                  <td className="p-3 text-sm">{lineItem?.source_platform || '-'}</td>
                                  <td className="p-3 text-sm font-medium">${lineItem?.gross_amount_usd?.toFixed(2)}</td>
                                  <td className="p-3 text-sm text-green-600">${lineItem?.performer_amount_usd?.toFixed(2)}</td>
                                  <td className="p-3 text-sm">${lineItem?.studio_amount_usd?.toFixed(2)}</td>
                                  <td className="p-3 text-sm">
                                    <Badge variant={
                                      lineItem?.status === 'paid' ? 'default' :
                                      lineItem?.status === 'approved' ? 'secondary' :
                                      'outline'
                                    }>
                                      {lineItem?.status || 'estimated'}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Safety Warnings */}
              {data?.safety_warnings && data.safety_warnings.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Safety Checks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.safety_warnings.map((warning, idx) => (
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
                  <CardTitle>Preview Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Selected Month</p>
                      <p className="text-lg font-medium">{data?.period?.month || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Test Mode</p>
                      <p className="text-lg font-medium">{data?.period?.include_test_mode ? 'Included' : 'Excluded'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payout Threshold</p>
                      <p className="text-lg font-medium">${data?.metadata?.payout_threshold_usd || 100}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Generated At</p>
                      <p className="text-lg font-medium">
                        {data?.metadata?.generated_at ? new Date(data.metadata.generated_at).toLocaleString() : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Generated By</p>
                      <p className="text-lg font-medium">{data?.metadata?.generated_by || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Preview Mode</p>
                      <p className="text-lg font-medium text-green-600">
                        {data?.metadata?.preview_only ? 'Read-Only (No Mutations)' : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}