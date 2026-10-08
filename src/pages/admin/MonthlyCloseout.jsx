import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle2, DollarSign, Film, Users, TrendingUp, Archive, AlertTriangle } from "lucide-react";

export default function MonthlyCloseout() {
  const queryClient = useQueryClient();
  const [periodMonth, setPeriodMonth] = useState("2026-06");
  const [platform, setPlatform] = useState("all");
  const [selectedEarningIds, setSelectedEarningIds] = useState([]);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonAction, setReasonAction] = useState(null); // 'hold' or 'disputed'
  const [reasonText, setReasonText] = useState("");

  // Fetch preview data
  const { data: previewData, isLoading: isLoadingPreview, refetch: refetchPreview } = useQuery({
    queryKey: ['closeout-preview', periodMonth, platform],
    queryFn: async () => {
      const response = await base44.functions.invoke('monthlyCloseoutService', {
        action: 'get_closeout_preview',
        period_month: periodMonth,
        platform: platform
      });
      return response.data;
    },
    enabled: false
  });

  // Fetch existing earnings for the period
  const { data: existingEarnings, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['closeout-earnings', periodMonth],
    queryFn: async () => {
      const earnings = await base44.entities.PerformerEarning.filter({ period_month: periodMonth });
      // Enrich with video titles and performer names
      const enriched = await Promise.all(earnings.map(async (e) => {
        const video = e.video_id ? await base44.entities.Video.get(e.video_id) : null;
        const performer = await base44.entities.Performer.get(e.performer_id);
        return {
          ...e,
          video_title: video?.title || 'N/A',
          performer_name: performer?.display_name || 'Unknown'
        };
      }));
      return enriched;
    },
    enabled: !!periodMonth
  });

  // Generate draft earnings mutation
  const generateDraftsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('monthlyCloseoutService', {
        action: 'generate_draft_earnings',
        period_month: periodMonth,
        platform: platform
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Generated ${data.created_count} draft earnings`);
      if (data.skipped_count > 0) {
        toast.info(`Skipped ${data.skipped_count} existing earnings`);
      }
      if (data.failed_count > 0) {
        toast.error(`${data.failed_count} failed`);
      }
      refetchPreview();
      queryClient.invalidateQueries({ queryKey: ['closeout-earnings'] });
      setSelectedEarningIds([]);
    },
    onError: (error) => {
      toast.error(`Failed to generate drafts: ${error.message}`);
    }
  });

  // Batch update status mutation
  const batchUpdateMutation = useMutation({
    mutationFn: async ({ status, reason }) => {
      const response = await base44.functions.invoke('monthlyCloseoutService', {
        action: 'batch_update_status',
        earning_ids: selectedEarningIds,
        status,
        reason
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Updated ${data.updated_count} earnings to ${data.status}`);
      queryClient.invalidateQueries({ queryKey: ['closeout-earnings'] });
      refetchPreview();
      setSelectedEarningIds([]);
      setReasonText("");
      setShowReasonModal(false);
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    }
  });

  const handlePreview = () => {
    refetchPreview();
  };

  const handleGenerateDrafts = () => {
    setShowGenerateConfirm(true);
  };

  const confirmGenerateDrafts = () => {
    setShowGenerateConfirm(false);
    generateDraftsMutation.mutate();
  };

  const handleBatchAction = (action) => {
    if (selectedEarningIds.length === 0) {
      toast.error("Please select earnings to update");
      return;
    }
    if (action === 'hold' || action === 'disputed') {
      setReasonAction(action);
      setShowReasonModal(true);
    } else {
      batchUpdateMutation.mutate({ status: action });
    }
  };

  const confirmReasonAction = () => {
    if (!reasonText.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    batchUpdateMutation.mutate({ status: reasonAction, reason: reasonText });
  };

  const handleSelectAll = (checked) => {
    if (checked && existingEarnings) {
      setSelectedEarningIds(existingEarnings.map(e => e.id));
    } else {
      setSelectedEarningIds([]);
    }
  };

  const handleSelectEarning = (earningId, checked) => {
    if (checked) {
      setSelectedEarningIds(prev => [...prev, earningId]);
    } else {
      setSelectedEarningIds(prev => prev.filter(id => id !== earningId));
    }
  };

  const hasAnyNewEarnings = previewData?.preview?.some(p => !p.already_exists);
  const canGenerate = hasAnyNewEarnings && !generateDraftsMutation.isPending;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Monthly Closeout</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Period Month</Label>
              <Input
                type="month"
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="xhamster">xHamster</SelectItem>
                  <SelectItem value="faphouse">FaHouse</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="pornhub">PornHub</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handlePreview} disabled={isLoadingPreview} className="w-full">
                {isLoadingPreview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Preview Closeout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {previewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Video Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${previewData.summary.total_revenue_usd.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performer Net Payout</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${previewData.summary.estimated_performer_payout.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Studio Share</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${previewData.summary.studio_share.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Draft Earnings</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{previewData.summary.new_earnings_to_create}</div>
              {previewData.summary.duplicate_count > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {previewData.summary.duplicate_count} already exist
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Table */}
      {previewData && previewData.preview.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Earnings Preview</CardTitle>
              <Button
                onClick={handleGenerateDrafts}
                disabled={!canGenerate}
                variant={canGenerate ? "default" : "secondary"}
              >
                {generateDraftsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Draft Earnings
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video</TableHead>
                  <TableHead>Performer</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Video Revenue</TableHead>
                  <TableHead className="text-right">Perf. Count</TableHead>
                  <TableHead className="text-right">Gross Share</TableHead>
                  <TableHead className="text-right">Split %</TableHead>
                  <TableHead className="text-right">Net Amount</TableHead>
                  <TableHead className="text-right">Studio Share</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.preview.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.video_title}</TableCell>
                    <TableCell>{row.performer_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.platform}</Badge>
                    </TableCell>
                    <TableCell>{row.period_month}</TableCell>
                    <TableCell className="text-right">${row.video_revenue_usd.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{row.performer_count}</TableCell>
                    <TableCell className="text-right">${row.gross_share_usd.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{row.split_pct}%</TableCell>
                    <TableCell className="text-right font-semibold">${row.net_amount_usd.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${row.studio_share_usd.toFixed(2)}</TableCell>
                    <TableCell>
                      {row.already_exists ? (
                        <Badge variant="secondary">Already Exists</Badge>
                      ) : (
                        <Badge variant="default">New</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Existing Earnings Table */}
      {existingEarnings && existingEarnings.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Existing Earnings ({existingEarnings.length})</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction('approved')}
                  disabled={selectedEarningIds.length === 0}
                >
                  Approve Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction('hold')}
                  disabled={selectedEarningIds.length === 0}
                >
                  Hold Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction('disputed')}
                  disabled={selectedEarningIds.length === 0}
                >
                  Dispute Selected
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedEarningIds.length === existingEarnings.length && existingEarnings.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Performer</TableHead>
                  <TableHead>Video</TableHead>
                  <TableHead className="text-right">Gross USD</TableHead>
                  <TableHead className="text-right">Split %</TableHead>
                  <TableHead className="text-right">Net USD</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingEarnings.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedEarningIds.includes(earning.id)}
                        onCheckedChange={(checked) => handleSelectEarning(earning.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{earning.performer_name}</TableCell>
                    <TableCell>{earning.video_title}</TableCell>
                    <TableCell className="text-right">${earning.gross_amount_usd.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{earning.split_pct}%</TableCell>
                    <TableCell className="text-right font-semibold">${earning.net_amount_usd.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          earning.status === 'approved' ? 'default' :
                          earning.status === 'held' ? 'destructive' :
                          earning.status === 'disputed' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {earning.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {earning.source_ref_type || 'Manual'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{earning.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Generate Confirmation Dialog */}
      <Dialog open={showGenerateConfirm} onOpenChange={setShowGenerateConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Draft Earnings?</DialogTitle>
            <DialogDescription>
              This will create {previewData?.summary.new_earnings_to_create} pending PerformerEarning records.
              {previewData?.summary.duplicate_count > 0 && (
                <span className="block mt-2">
                  {previewData.summary.duplicate_count} earnings already exist and will be skipped.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={confirmGenerateDrafts}>
              Generate Drafts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reason Modal */}
      <Dialog open={showReasonModal} onOpenChange={setShowReasonModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reasonAction === 'hold' ? 'Hold Earnings' : 'Dispute Earnings'}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for marking {selectedEarningIds.length} earning(s) as {reasonAction}.
              This will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full p-3 border rounded-md min-h-[100px]"
              placeholder="Enter reason..."
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReasonModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmReasonAction}
              variant={reasonAction === 'hold' ? 'destructive' : 'destructive'}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}