import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VideoStatSnapshotModal({ videoId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    platform: 'xhamster',
    period_month: new Date().toISOString().slice(0, 7),
    views: 0,
    likes: 0,
    favourites: 0,
    revenue_usd: 0,
    sales_count: 0,
    tips_usd: 0,
    import_source: 'manual',
    notes: ''
  });

  const createSnapshot = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('videoStatsImportService', {
        action: 'create_snapshot',
        video_id: videoId,
        ...data
      });
    },
    onSuccess: () => {
      toast.success('Stats snapshot created');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create snapshot');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    createSnapshot.mutate(formData);
  };

  const set = (field, value) => setFormData({ ...formData, [field]: value });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Monthly Stats</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={formData.platform} onValueChange={(v) => set('platform', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="xhamster">xhamster</SelectItem>
                <SelectItem value="faphouse">faphouse</SelectItem>
                <SelectItem value="internal">internal</SelectItem>
                <SelectItem value="pornhub">pornhub</SelectItem>
                <SelectItem value="other">other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="period_month">Period Month</Label>
            <Input
              id="period_month"
              type="month"
              value={formData.period_month}
              onChange={(e) => set('period_month', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Views</Label>
              <Input type="number" value={formData.views} onChange={(e) => set('views', parseInt(e.target.value) || 0)} />
            </div>
            <div className="grid gap-2">
              <Label>Likes</Label>
              <Input type="number" value={formData.likes} onChange={(e) => set('likes', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Favourites</Label>
              <Input type="number" value={formData.favourites} onChange={(e) => set('favourites', parseInt(e.target.value) || 0)} />
            </div>
            <div className="grid gap-2">
              <Label>Revenue USD</Label>
              <Input type="number" step="0.01" value={formData.revenue_usd} onChange={(e) => set('revenue_usd', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Sales Count</Label>
              <Input type="number" value={formData.sales_count} onChange={(e) => set('sales_count', parseInt(e.target.value) || 0)} />
            </div>
            <div className="grid gap-2">
              <Label>Tips USD</Label>
              <Input type="number" step="0.01" value={formData.tips_usd} onChange={(e) => set('tips_usd', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="import_source">Import Source</Label>
            <Select value={formData.import_source} onValueChange={(v) => set('import_source', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">manual</SelectItem>
                <SelectItem value="csv_import">csv_import</SelectItem>
                <SelectItem value="api_sync">api_sync</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={createSnapshot.isPending}>Cancel</Button>
            <Button type="submit" disabled={createSnapshot.isPending}>
              {createSnapshot.isPending ? 'Creating...' : 'Create Snapshot'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}