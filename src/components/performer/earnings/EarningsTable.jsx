import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function EarningsTable({ earnings, videos, isLoading, onRefresh }) {
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (earningId, newStatus) => {
    setUpdatingId(earningId);
    try {
      await base44.functions.invoke('performerFinanceService', {
        action: 'update_earning_status',
        earning_id: earningId,
        status: newStatus
      });
      toast.success('Status updated');
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      paid: 'default',
      held: 'destructive',
      disputed: 'destructive'
    };
    return variants[status] || 'secondary';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!earnings?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No earnings found for this period
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings for {earnings[0]?.period_month}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Video</TableHead>
              <TableHead>Gross</TableHead>
              <TableHead>Split %</TableHead>
              <TableHead>Net</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {earnings.map((earning) => (
              <TableRow key={earning.id}>
                <TableCell className="text-sm">
                  {new Date(earning.created_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{earning.earning_type.replace(/_/g, ' ')}</Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {earning.video_id ? (videos[earning.video_id] || 'Unknown') : '-'}
                </TableCell>
                <TableCell className="font-medium">
                  ${earning.gross_amount_usd?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                </TableCell>
                <TableCell>{earning.split_pct}%</TableCell>
                <TableCell className="font-medium">
                  ${earning.net_amount_usd?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(earning.status)}>
                    {earning.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[150px] truncate text-sm">
                  {earning.notes || '-'}
                </TableCell>
                <TableCell>
                  {updatingId === earning.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Select
                      value={earning.status}
                      onValueChange={(value) => handleStatusChange(earning.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">pending</SelectItem>
                        <SelectItem value="approved">approved</SelectItem>
                        <SelectItem value="paid">paid</SelectItem>
                        <SelectItem value="held">held</SelectItem>
                        <SelectItem value="disputed">disputed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}