import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function EarningsBreakdownTable({ earnings, summary, reconciliation, isAdmin }) {
  if (!earnings || earnings.length === 0) {
    return null;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getDisplayDate = (earning) => {
    return formatDate(earning.paid_at)
      || formatDate(earning.date)
      || formatDate(earning.created_date)
      || earning.period_month
      || "—";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'paid_out': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'approved': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'held': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'estimated': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'estimated_not_included': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status, paidOutInfo) => {
    if (status === 'paid_out' && paidOutInfo) {
      if (paidOutInfo.allocation_type === 'partial') {
        return `Partially Paid (${formatDate(paidOutInfo.paid_at)})`;
      }
      return `Paid Out (${formatDate(paidOutInfo.paid_at)})`;
    }
    if (status === 'estimated_not_included') {
      return 'Estimated (Not in Payout)';
    }
    return status;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Earnings Breakdown</CardTitle>
        <p className="text-sm text-muted-foreground">
          Detailed breakdown of all income sources for this period
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Source Type</TableHead>
                <TableHead>Platform / Source</TableHead>
                <TableHead className="hidden lg:table-cell">Description</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Split %</TableHead>
                <TableHead className="text-right">Your Share</TableHead>
                <TableHead className="text-right hidden md:table-cell">Studio Share</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.map((earning, idx) => (
                <TableRow key={earning.id}>
                  <TableCell className="font-medium text-xs">
                   {getDisplayDate(earning)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {earning.source_type?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm capitalize">
                    {earning.source_platform || 'N/A'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                    {earning.description || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm">
                    ${(earning.gross_amount_usd || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {earning.performer_share_percent || 0}%
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm text-green-500">
                    ${(earning.performer_amount_usd || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-blue-500 hidden md:table-cell">
                    ${(earning.studio_amount_usd || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      className={getStatusColor(earning.status)} 
                      variant="outline" 
                      title={
                        earning.paid_out_info 
                          ? (earning.status === 'paid_out' 
                              ? `Included in payout ${formatDate(earning.paid_out_info.paid_at)}${earning.paid_out_info.allocation_type === 'partial' ? ` (${earning.paid_out_info.amount_included.toFixed(2)} of ${earning.performer_amount_usd.toFixed(2)})` : ''}`
                              : earning.paid_out_info.reason)
                          : ''
                      }
                    >
                      {getStatusLabel(earning.status, earning.paid_out_info)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Footer */}
        {summary && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Total Gross</p>
              <p className="text-lg font-semibold">${(summary.gross_total || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Your Share</p>
              <p className="text-lg font-semibold text-green-500">${(summary.performer_total || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Studio Share</p>
              <p className="text-lg font-semibold text-blue-500">${(summary.studio_total || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Items</p>
              <p className="text-lg font-semibold">{earnings.length}</p>
            </div>
          </div>
        )}
        
        {/* Reconciliation Footer */}
        {reconciliation?.total_paid_amount && (
          <div className="mt-4 pt-4 border-t bg-orange-500/5 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-orange-400">Payout Reconciliation</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Paid This Period</p>
                <p className="text-base font-semibold text-blue-400">${reconciliation.total_paid_amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Matched to Earnings</p>
                <p className="text-base font-semibold text-emerald-500">${reconciliation.allocated_to_earnings.toFixed(2)}</p>
              </div>
              {reconciliation.unallocated_adjustment > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Manual Adjustment</p>
                  <p className="text-base font-semibold text-orange-400" title="This payout includes amounts not matched to earnings rows (e.g., missing snapshots, rounded values, or manual admin adjustments)">
                    ${reconciliation.unallocated_adjustment.toFixed(2)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Available Balance</p>
                <p className="text-base font-semibold">$0.00</p>
              </div>
            </div>
            {reconciliation.unallocated_adjustment > 0 && isAdmin && (
              <p className="text-xs text-muted-foreground pt-1 border-t">
                <strong>Admin Note:</strong> ${reconciliation.unallocated_adjustment.toFixed(2)} of this payout is not matched to earnings rows. 
                Review missing snapshots or mark as manual adjustment.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}