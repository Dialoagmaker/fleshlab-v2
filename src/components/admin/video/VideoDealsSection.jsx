import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import VideoDealModal from './VideoDealModal';

export default function VideoDealsSection({ videoId }) {
  const [showModal, setShowModal] = useState(false);

  const { data: deals, isLoading, refetch } = useQuery({
    queryKey: ['video-deals', videoId],
    queryFn: async () => {
      const res = await base44.functions.invoke('videoDealService', {
        action: 'list_deals_for_video',
        video_id: videoId
      });
      return res.data;
    },
    enabled: !!videoId
  });

  const updateStatus = useMutation({
    mutationFn: async ({ deal_id, payment_status }) => {
      await base44.functions.invoke('videoDealService', {
        action: 'update_deal_status',
        deal_id,
        payment_status
      });
    },
    onSuccess: () => {
      toast.success('Deal status updated');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status');
    }
  });

  return (
    <section className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Commercial Deals</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
          <Button variant="default" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-3 h-3 mr-1" /> Add Deal
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading deals...</p>
      ) : !deals?.deals?.length ? (
        <p className="text-sm text-muted-foreground">No deals found for this video</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deal Type</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Disclosure</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.deals.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell>
                  <Badge variant={getDealTypeVariant(deal.deal_type)}>{deal.deal_type}</Badge>
                </TableCell>
                <TableCell className="font-medium">{deal.brand_name}</TableCell>
                <TableCell className="font-medium">${deal.deal_amount_usd?.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={getPaymentStatusVariant(deal.payment_status)}>{deal.payment_status}</Badge>
                </TableCell>
                <TableCell>
                  {deal.disclosure_required ? (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs">Required</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{deal.period_month || '-'}</TableCell>
                <TableCell className="max-w-[150px] truncate text-xs">{deal.notes || '-'}</TableCell>
                <TableCell>
                  <Select
                    value={deal.payment_status}
                    onValueChange={(value) => updateStatus.mutate({ deal_id: deal.id, payment_status: value })}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">unpaid</SelectItem>
                      <SelectItem value="invoiced">invoiced</SelectItem>
                      <SelectItem value="paid">paid</SelectItem>
                      <SelectItem value="cancelled">cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showModal && (
        <VideoDealModal
          videoId={videoId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            refetch();
          }}
        />
      )}
    </section>
  );
}

function getDealTypeVariant(type) {
  const variants = {
    sponsorship: 'default',
    product_placement: 'secondary',
    promotion: 'outline',
    affiliate: 'secondary'
  };
  return variants[type] || 'secondary';
}

function getPaymentStatusVariant(status) {
  const variants = {
    unpaid: 'secondary',
    invoiced: 'default',
    paid: 'default',
    cancelled: 'destructive'
  };
  return variants[status] || 'secondary';
}