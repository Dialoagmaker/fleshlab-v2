import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

export default function EarningEntryModal({ performer, periodMonth, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    earning_type: 'bonus',
    video_id: '',
    gross_amount_usd: '',
    split_pct: '',
    period_month: periodMonth,
    status: 'pending',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const gross = parseFloat(formData.gross_amount_usd);
      if (isNaN(gross)) {
        toast.error('Please enter a valid gross amount');
        setIsSubmitting(false);
        return;
      }
      const split = formData.split_pct ? parseFloat(formData.split_pct) : performer.revenue_split_pct || 70;
      const net = gross * split / 100;

      await base44.functions.invoke('performerFinanceService', {
        action: 'create_earning',
        performer_id: performer.id,
        video_id: formData.video_id || null,
        earning_type: formData.earning_type,
        gross_amount_usd: gross,
        split_pct: split,
        net_amount_usd: net,
        period_month: formData.period_month,
        status: formData.status,
        notes: formData.notes || null
      });

      toast.success('Earning created');
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to create earning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Manual Earning</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="earning_type">Earning Type</Label>
            <Select
              value={formData.earning_type}
              onValueChange={(value) => setFormData({ ...formData, earning_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xhamster_share">xhamster_share</SelectItem>
                <SelectItem value="faphouse_share">faphouse_share</SelectItem>
                <SelectItem value="video_sale">video_sale</SelectItem>
                <SelectItem value="fanclub_share">fanclub_share</SelectItem>
                <SelectItem value="livestream">livestream</SelectItem>
                <SelectItem value="sponsorship_share">sponsorship_share</SelectItem>
                <SelectItem value="product_placement_share">product_placement_share</SelectItem>
                <SelectItem value="bonus">bonus</SelectItem>
                <SelectItem value="adjustment">adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="video_id">Video (Optional)</Label>
            <Input
              id="video_id"
              value={formData.video_id}
              onChange={(e) => setFormData({ ...formData, video_id: e.target.value })}
              placeholder="Leave empty for non-video earnings"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="gross_amount_usd">Gross Amount (USD)</Label>
            <Input
              id="gross_amount_usd"
              type="number"
              step="0.01"
              value={formData.gross_amount_usd}
              onChange={(e) => setFormData({ ...formData, gross_amount_usd: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="split_pct">Split % (Optional)</Label>
            <Input
              id="split_pct"
              type="number"
              min="0"
              max="100"
              value={formData.split_pct}
              onChange={(e) => setFormData({ ...formData, split_pct: e.target.value })}
              placeholder={`Defaults to ${performer.revenue_split_pct || 70}%`}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use performer's current split ({performer.revenue_split_pct || 70}%)
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="period_month">Period Month</Label>
            <Input
              id="period_month"
              value={formData.period_month}
              onChange={(e) => setFormData({ ...formData, period_month: e.target.value })}
              placeholder="YYYY-MM"
              pattern="\d{4}-\d{2}"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="approved">approved</SelectItem>
                <SelectItem value="held">held</SelectItem>
                <SelectItem value="disputed">disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Earning'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}