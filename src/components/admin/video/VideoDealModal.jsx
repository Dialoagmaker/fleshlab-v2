import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VideoDealModal({ videoId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    deal_type: 'sponsorship',
    brand_name: '',
    deal_amount_usd: 0,
    currency: 'usd',
    payment_status: 'unpaid',
    disclosure_required: false,
    disclosure_text: '',
    period_month: new Date().toISOString().slice(0, 7),
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.brand_name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    if (formData.disclosure_required && !formData.disclosure_text.trim()) {
      toast.error('Disclosure text is required when disclosure is enabled');
      return;
    }

    setIsSubmitting(true);

    try {
      await base44.functions.invoke('videoDealService', {
        action: 'create_deal',
        video_id: videoId,
        ...formData
      });
      toast.success('Deal created');
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to create deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Commercial Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="deal_type">Deal Type</Label>
            <Select value={formData.deal_type} onValueChange={(v) => setFormData({ ...formData, deal_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sponsorship">sponsorship</SelectItem>
                <SelectItem value="product_placement">product_placement</SelectItem>
                <SelectItem value="promotion">promotion</SelectItem>
                <SelectItem value="affiliate">affiliate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="brand_name">Brand Name *</Label>
            <Input
              id="brand_name"
              value={formData.brand_name}
              onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
              placeholder="e.g., BrandX"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Amount USD</Label>
              <Input type="number" step="0.01" value={formData.deal_amount_usd} onChange={(e) => setFormData({ ...formData, deal_amount_usd: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="grid gap-2">
              <Label>Currency</Label>
              <Input value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} disabled />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="payment_status">Payment Status</Label>
            <Select value={formData.payment_status} onValueChange={(v) => setFormData({ ...formData, payment_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">unpaid</SelectItem>
                <SelectItem value="invoiced">invoiced</SelectItem>
                <SelectItem value="paid">paid</SelectItem>
                <SelectItem value="cancelled">cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="disclosure_required"
              checked={formData.disclosure_required}
              onCheckedChange={(checked) => setFormData({ ...formData, disclosure_required: checked })}
            />
            <Label htmlFor="disclosure_required">Disclosure Required</Label>
          </div>

          {formData.disclosure_required && (
            <div className="grid gap-2">
              <Label htmlFor="disclosure_text">Disclosure Text *</Label>
              <Textarea
                id="disclosure_text"
                value={formData.disclosure_text}
                onChange={(e) => setFormData({ ...formData, disclosure_text: e.target.value })}
                rows={2}
                placeholder="e.g., This video is sponsored by BrandX"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="period_month">Period Month</Label>
            <Input
              id="period_month"
              type="month"
              value={formData.period_month}
              onChange={(e) => setFormData({ ...formData, period_month: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Deal'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}