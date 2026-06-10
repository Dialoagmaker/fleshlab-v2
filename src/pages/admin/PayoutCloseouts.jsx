import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle, CheckCircle2, Users, AlertTriangle,
  ChevronDown, ChevronUp, Search, RefreshCw, Lock,
} from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import ActionModal from "@/components/admin/closeouts/ActionModal";

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'paid', label: 'Paid' },
];

function statusVariant(status) {
  if (status === 'paid') return 'default';
  if (status === 'approved') return 'secondary';
  if (status === 'on_hold' || status === 'held') return 'destructive';
  return 'outline';
}

function allowedActions(status) {
  if (status === 'draft' || status === 'pending' || status === 'estimated') return ['approve', 'hold', 'revert_to_draft'];
  if (status === 'approved') return ['hold', 'mark_paid', 'revert_to_draft'];
  if (status === 'on_hold' || status === 'held') return ['release_hold', 'revert_to_draft'];
  return []; // paid = locked
}

const ACTION_LABELS = {
  approve: 'Approve',
  hold: 'Put On Hold',
  release_hold: 'Release Hold',
  mark_paid: 'Mark Paid',
  revert_to_draft: 'Revert to Draft',
};
const ACTION_VARIANTS = {
  approve: 'default',
  hold: 'outline',
  release_hold: 'outline',
  mark_paid: 'secondary',
  revert_to_draft: 'outline',
};

export default function PayoutCloseouts() {
  const [closeouts, setCloseouts] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [month, setMonth]         = useState('');
  const [performerId, setPerformerId] = useState('all');
  const [status, setStatus]       = useState('all');
  const [expanded, setExpanded]   = useState(null);

  // Action modal state
  const [modal, setModal] = useState(null); // { closeout, action }
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const loadCloseouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionSuccess(null);
    const response = await base44.functions.invoke('adminListPayoutCloseouts', {
      month: month || undefined,
      performer_id: performerId === 'all' ? undefined : performerId,
      status,
    });
    setCloseouts(response.data);
    setLoading(false);
  }, [month, performerId, status]);

  const handleAction = async ({ reason, paid_reference, notes }) => {
    if (!modal) return;
    setActionLoading(true);
    setActionError(null);
    const response = await base44.functions.invoke('adminUpdatePayoutCloseoutStatus', {
      closeout_id: modal.closeout.closeout_id,
      action: modal.action,
      reason,
      paid_reference,
      notes,
    });
    setActionLoading(false);
    if (!response.data?.success) {
      setActionError(response.data?.error || 'Unknown error');
      return;
    }
    setActionSuccess(`${modal.closeout.performer_name}: ${modal.closeout.status} → ${response.data.new_status}`);
    setModal(null);
    loadCloseouts();
  };

  const list = closeouts?.closeouts || [];
  const uniquePerformers = list.reduce((acc, c) => {
    if (!acc.find(p => p.id === c.performer_id)) acc.push({ id: c.performer_id, name: c.performer_name });
    return acc;
  }, []);

  return (
    <>
      <SEOMeta title="Admin - Payout Closeouts" description="Manage payout closeout drafts" canonical="/admin/payout-closeouts" noIndex />

      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="max-w-[1600px] mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-foreground">Payout Closeout Management</h1>
            <p className="text-muted-foreground mt-1">Review, approve, hold, or mark paid existing closeout drafts</p>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 py-8">
          <Alert className="mb-6 bg-orange-500/10 border-orange-500/30">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-600">Status Management Only</AlertTitle>
            <AlertDescription className="text-orange-600">
              This page manages existing closeout draft statuses. No payments are triggered. No RevenueLineItems are modified. No payout provider is called.
            </AlertDescription>
          </Alert>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-5">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Month</label>
                  <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Performer</label>
                  <Select value={performerId} onValueChange={setPerformerId}>
                    <SelectTrigger><SelectValue placeholder="All Performers" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Performers</SelectItem>
                      {uniquePerformers.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end col-span-2">
                  <Button onClick={loadCloseouts} disabled={loading} className="w-full gap-2">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? 'Loading…' : 'Load Closeouts'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert className="mb-6 bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-600">Error</AlertTitle>
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          {actionSuccess && (
            <Alert className="mb-6 bg-green-500/10 border-green-500/30">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-600">Status Updated</AlertTitle>
              <AlertDescription className="text-green-600">{actionSuccess}</AlertDescription>
            </Alert>
          )}

          {actionError && (
            <Alert className="mb-4 bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-600">Action Failed</AlertTitle>
              <AlertDescription className="text-red-600">{actionError}</AlertDescription>
            </Alert>
          )}

          {/* Summary counts */}
          {closeouts && (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-6">
              {['all','draft','approved','on_hold','paid'].map(s => {
                const count = s === 'all' ? list.length : list.filter(c => c.status === s).length;
                return (
                  <Card key={s} className="cursor-pointer" onClick={() => setStatus(s)}>
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground capitalize">{s === 'all' ? 'Total' : s.replace('_',' ')}</p>
                      <p className={`text-2xl font-bold ${s === 'approved' ? 'text-green-600' : s === 'on_hold' ? 'text-red-600' : s === 'paid' ? 'text-blue-600' : ''}`}>{count}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Closeout table */}
          {closeouts && (
            <Card>
              <CardHeader>
                <CardTitle>Closeout Drafts ({list.length})</CardTitle>
                <CardDescription>Click a row to expand details. Use action buttons to manage status.</CardDescription>
              </CardHeader>
              <CardContent>
                {list.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No closeout drafts found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use Monthly Closeout Preview → Generate Drafts to create closeout drafts for eligible performers.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr className="border-b">
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Performer</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Month</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Performer Share</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Studio Share</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Sources</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Created</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                          <th className="p-3 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map(c => (
                          <>
                            <tr key={c.closeout_id} className="border-b hover:bg-muted/20">
                              <td className="p-3 text-sm font-medium">{c.performer_name}</td>
                              <td className="p-3 text-sm text-muted-foreground">{c.month}</td>
                              <td className="p-3 text-sm font-bold text-green-600">${c.performer_share_total?.toFixed(2)}</td>
                              <td className="p-3 text-sm">${c.studio_share_total?.toFixed(2)}</td>
                              <td className="p-3 text-xs">
                                {c.source_breakdown ? (
                                  <div className="flex flex-col gap-0.5">
                                    {c.source_breakdown.internal_fleshlab_gross > 0 && <span>FLESHLAB: ${c.source_breakdown.internal_fleshlab_gross.toFixed(2)}</span>}
                                    {c.source_breakdown.livecam_gross > 0 && <span className="text-blue-600">Livecam: ${c.source_breakdown.livecam_gross.toFixed(2)}</span>}
                                    {c.source_breakdown.imported_platform_gross > 0 && <span className="text-blue-600">Imported: ${c.source_breakdown.imported_platform_gross.toFixed(2)}</span>}
                                    {c.source_breakdown.external_platform_gross > 0 && !c.source_breakdown.livecam_gross && !c.source_breakdown.imported_platform_gross && <span className="text-blue-600">External: ${c.source_breakdown.external_platform_gross.toFixed(2)}</span>}
                                  </div>
                                ) : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="p-3">
                                <Badge variant={statusVariant(c.status)}>
                                  {c.status === 'paid' && <Lock className="w-3 h-3 mr-1" />}
                                  {c.status?.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="p-3 text-xs text-muted-foreground">
                                {c.created_date ? new Date(c.created_date).toLocaleDateString() : '—'}
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {allowedActions(c.status).map(a => (
                                    <Button
                                      key={a}
                                      size="sm"
                                      variant={ACTION_VARIANTS[a]}
                                      className="text-xs h-7"
                                      onClick={() => { setModal({ closeout: c, action: a }); setActionError(null); }}
                                    >
                                      {ACTION_LABELS[a]}
                                    </Button>
                                  ))}
                                  {c.status === 'paid' && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Lock className="w-3 h-3" /> Locked
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <Button
                                  variant="ghost" size="icon"
                                  onClick={() => setExpanded(expanded === c.closeout_id ? null : c.closeout_id)}
                                >
                                  {expanded === c.closeout_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </Button>
                              </td>
                            </tr>

                            {/* Expanded detail row */}
                            {expanded === c.closeout_id && (
                              <tr key={`${c.closeout_id}-detail`} className="border-b bg-muted/10">
                                <td colSpan={9} className="p-4">
                                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground mb-1">Closeout ID</p>
                                      <p className="text-xs font-mono">{c.closeout_id}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground mb-1">Generated By</p>
                                      <p className="text-xs">{c.generated_by || '—'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground mb-1">Line Items ({c.revenue_line_item_ids?.length || 0})</p>
                                      <div className="flex flex-wrap gap-1">
                                        {c.revenue_line_item_ids?.length > 0
                                          ? c.revenue_line_item_ids.map(id => (
                                              <span key={id} className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{id}</span>
                                            ))
                                          : <span className="text-xs text-muted-foreground">—</span>
                                        }
                                      </div>
                                    </div>
                                    {c.approved_by && (
                                      <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">Approved By</p>
                                        <p className="text-xs">{c.approved_by} <span className="text-muted-foreground">on {c.approved_date ? new Date(c.approved_date).toLocaleString() : '—'}</span></p>
                                      </div>
                                    )}
                                    {c.hold_reason && (
                                      <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">Hold Reason</p>
                                        <p className="text-xs text-orange-600">{c.hold_reason}</p>
                                      </div>
                                    )}
                                    {c.paid_reference && (
                                      <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">Payment Reference</p>
                                        <p className="text-xs font-mono">{c.paid_reference}</p>
                                        <p className="text-xs text-muted-foreground">{c.paid_by} on {c.paid_date ? new Date(c.paid_date).toLocaleString() : '—'}</p>
                                      </div>
                                    )}
                                    {c.admin_notes && (
                                      <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">Admin Notes</p>
                                        <p className="text-xs">{c.admin_notes}</p>
                                      </div>
                                    )}
                                    {c.status_history?.length > 0 && (
                                      <div className="col-span-full">
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">Status History</p>
                                        <div className="space-y-1">
                                          {c.status_history.map((h, i) => (
                                            <div key={i} className="text-xs flex gap-2 items-center text-muted-foreground">
                                              <Badge variant="outline" className="text-xs">{h.from} → {h.to}</Badge>
                                              <span>{h.action}</span>
                                              <span>by {h.by}</span>
                                              <span>{h.at ? new Date(h.at).toLocaleString() : ''}</span>
                                              {h.reason && <span className="italic">"{h.reason}"</span>}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!closeouts && !loading && (
            <div className="py-16 text-center text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Set filters and click "Load Closeouts" to view existing drafts.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {modal && (
        <ActionModal
          closeout={modal.closeout}
          action={modal.action}
          actionLabel={ACTION_LABELS[modal.action]}
          loading={actionLoading}
          onConfirm={handleAction}
          onCancel={() => { setModal(null); setActionError(null); }}
        />
      )}
    </>
  );
}