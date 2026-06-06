import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, RefreshCw, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PLATFORMS = [
  { value: "xhamster", label: "xHamster" },
  { value: "faphouse", label: "FapHouse" },
  { value: "chaturbate", label: "Chaturbate" },
  { value: "stripchat", label: "Stripchat" },
  { value: "bongacams", label: "BongaCams" },
  { value: "pornhub", label: "Pornhub" },
  { value: "xvideos", label: "XVideos" },
  { value: "twitter_x", label: "Twitter/X" },
  { value: "internal", label: "Internal" },
  { value: "boyfriendtv", label: "BoyFriendTV" },
  { value: "other", label: "Other" },
];

const PROMO_VARIANTS = {
  active: "default",
  planned: "secondary",
  ended: "destructive",
  none: "outline"
};

export default function VideoStatsTab({ performerId }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ period_month: '', platform: '' });
  const [editingSnapshot, setEditingSnapshot] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data: statsData, isLoading, refetch } = useQuery({
    queryKey: ['performer-video-stats', performerId, filters],
    queryFn: async () => {
      const res = await base44.functions.invoke('performerVideoStatsService', {
        action: 'get_performer_video_stats',
        performer_id: performerId,
        ...filters
      });
      return res.data;
    },
    enabled: !!performerId
  });

  const updateSnapshot = useMutation({
    mutationFn: async ({ snapshot_id, data }) => {
      return await base44.functions.invoke('performerVideoStatsService', {
        action: 'update_snapshot',
        snapshot_id,
        data
      });
    },
    onSuccess: () => {
      toast.success('Stat updated');
      refetch();
      setEditingSnapshot(null);
    },
    onError: (e) => toast.error(e.message || 'Update failed')
  });

  const deleteSnapshot = useMutation({
    mutationFn: async (snapshot_id) => {
      return await base44.functions.invoke('performerVideoStatsService', {
        action: 'delete_snapshot',
        snapshot_id
      });
    },
    onSuccess: () => {
      toast.success('Stat deleted');
      refetch();
      setDeletingId(null);
    },
    onError: (e) => toast.error(e.message || 'Delete failed')
  });

  const handleSave = () => {
    if (!editingSnapshot) return;
    updateSnapshot.mutate({
      snapshot_id: editingSnapshot.id,
      data: {
        views: editingSnapshot.views,
        likes: editingSnapshot.likes,
        favourites: editingSnapshot.favourites,
        revenue_usd: editingSnapshot.revenue_usd,
        promotion_status: editingSnapshot.promotion_status,
        promotion_note: editingSnapshot.promotion_note,
        admin_note: editingSnapshot.admin_note,
        external_title: editingSnapshot.external_title,
        external_url: editingSnapshot.external_url,
        notes: editingSnapshot.notes
      }
    });
  };

  const stats = statsData?.stats || [];
  const canDelete = (stat) => stat.source_type === 'external_manual' || stat.import_source === 'manual_admin_entry';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Video Stats</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Platform statistics for internal and external videos of this performer.
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add External Video Stat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 items-center flex-wrap mb-6">
            <div className="space-y-1">
              <Label className="text-xs">Period</Label>
              <Input
                type="month"
                value={filters.period_month}
                onChange={(e) => setFilters({ ...filters, period_month: e.target.value })}
                className="w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Platform</Label>
              <Select
                value={filters.platform || '_all'}
                onValueChange={(v) => setFilters({ ...filters, platform: v === '_all' ? '' : v })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Platforms</SelectItem>
                  {PLATFORMS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto self-end">
              <RefreshCw className="w-3 h-3 mr-1" /> Refresh
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading stats...</p>
          ) : !stats || stats.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">No stats found for this performer.</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add External Video Stat
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Video / Title</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Likes</TableHead>
                    <TableHead>Favs</TableHead>
                    <TableHead>Revenue USD</TableHead>
                    <TableHead>Promo</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell className="max-w-[220px]">
                        {editingSnapshot?.id === stat.id && stat._is_external_only ? (
                          <Input
                            value={editingSnapshot.external_title || ''}
                            onChange={(e) => setEditingSnapshot({ ...editingSnapshot, external_title: e.target.value })}
                            className="h-7 text-xs"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium text-sm">{stat.video_title}</span>
                            {stat._is_external_only && (
                              <Badge variant="outline" className="text-[10px] shrink-0 text-amber-500 border-amber-500/30">External</Badge>
                            )}
                            {stat.external_url && (
                              <a href={stat.external_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
                              </a>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {PLATFORMS.find(p => p.value === stat.platform)?.label || stat.platform}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{stat.period_month}</TableCell>
                      <TableCell>
                        {editingSnapshot?.id === stat.id ? (
                          <Input
                            type="number"
                            value={editingSnapshot.views ?? ''}
                            onChange={(e) => setEditingSnapshot({ ...editingSnapshot, views: parseInt(e.target.value) || 0 })}
                            className="w-20 h-7 text-xs"
                          />
                        ) : stat.views?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {editingSnapshot?.id === stat.id ? (
                          <Input
                            type="number"
                            value={editingSnapshot.likes ?? ''}
                            onChange={(e) => setEditingSnapshot({ ...editingSnapshot, likes: parseInt(e.target.value) || 0 })}
                            className="w-20 h-7 text-xs"
                          />
                        ) : stat.likes?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {editingSnapshot?.id === stat.id ? (
                          <Input
                            type="number"
                            value={editingSnapshot.favourites ?? ''}
                            onChange={(e) => setEditingSnapshot({ ...editingSnapshot, favourites: parseInt(e.target.value) || 0 })}
                            className="w-20 h-7 text-xs"
                          />
                        ) : stat.favourites?.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {editingSnapshot?.id === stat.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editingSnapshot.revenue_usd ?? ''}
                            onChange={(e) => setEditingSnapshot({ ...editingSnapshot, revenue_usd: parseFloat(e.target.value) || 0 })}
                            className="w-24 h-7 text-xs"
                          />
                        ) : `$${stat.revenue_usd?.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        {editingSnapshot?.id === stat.id ? (
                          <Select
                            value={editingSnapshot.promotion_status || 'none'}
                            onValueChange={(v) => setEditingSnapshot({ ...editingSnapshot, promotion_status: v })}
                          >
                            <SelectTrigger className="w-28 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">none</SelectItem>
                              <SelectItem value="planned">planned</SelectItem>
                              <SelectItem value="active">active</SelectItem>
                              <SelectItem value="ended">ended</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={PROMO_VARIANTS[stat.promotion_status] || 'outline'} className="text-xs">
                            {stat.promotion_status || 'none'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingSnapshot?.id === stat.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="default" onClick={handleSave} disabled={updateSnapshot.isPending}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingSnapshot(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setEditingSnapshot({ ...stat })}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            {canDelete(stat) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setDeletingId(stat.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add External Video Stat Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add External Video Stat</DialogTitle>
          </DialogHeader>
          <AddExternalStatForm
            performerId={performerId}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              refetch();
              setShowAddModal(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this stat entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this manually created video stat. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteSnapshot.mutate(deletingId)}
              disabled={deleteSnapshot.isPending}
            >
              {deleteSnapshot.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AddExternalStatForm({ performerId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    platform: 'xhamster',
    period_month: new Date().toISOString().slice(0, 7),
    video_id: '',
    external_title: '',
    external_url: '',
    views: '',
    likes: '',
    favourites: '',
    revenue_usd: '',
    promotion_status: 'none',
    notes: ''
  });

  // Fetch performer's internal videos for the optional dropdown
  const { data: performerVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['performer-videos-for-stats', performerId],
    queryFn: async () => {
      const vps = await base44.entities.VideoPerformer.filter({ performer_id: performerId });
      if (!vps || vps.length === 0) return [];
      const videos = await Promise.all(
        vps.map(vp => base44.entities.Video.get(vp.video_id).catch(() => null))
      );
      return videos.filter(Boolean).map(v => ({ id: v.id, title: v.title }));
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('performerVideoStatsService', {
        action: 'create_external_snapshot',
        performer_id: performerId,
        ...data
      });
    },
    onSuccess: () => {
      toast.success('External video stat added');
      onSuccess();
    },
    onError: (e) => toast.error(e.message || 'Failed to create stat')
  });

  const isExternalOnly = !formData.video_id;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.platform || !formData.period_month) {
      toast.error('Platform and period month are required');
      return;
    }
    if (isExternalOnly && !formData.external_title.trim()) {
      toast.error('External title is required when no internal video is selected');
      return;
    }
    if (!/^\d{4}-\d{2}$/.test(formData.period_month)) {
      toast.error('Period month must be in YYYY-MM format');
      return;
    }

    createMutation.mutate({
      video_id: formData.video_id || undefined,
      platform: formData.platform,
      period_month: formData.period_month,
      external_title: isExternalOnly ? formData.external_title : undefined,
      external_url: formData.external_url || undefined,
      views: parseInt(formData.views) || 0,
      likes: parseInt(formData.likes) || 0,
      favourites: parseInt(formData.favourites) || 0,
      revenue_usd: parseFloat(formData.revenue_usd) || 0,
      promotion_status: formData.promotion_status,
      notes: formData.notes || undefined
    });
  };

  const set = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Period Month */}
      <div className="grid gap-1.5">
        <Label>Period Month <span className="text-destructive">*</span></Label>
        <Input
          type="month"
          value={formData.period_month}
          onChange={(e) => set('period_month', e.target.value)}
          required
        />
      </div>

      {/* Platform */}
      <div className="grid gap-1.5">
        <Label>Platform <span className="text-destructive">*</span></Label>
        <Select value={formData.platform} onValueChange={(v) => set('platform', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PLATFORMS.map(p => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Internal Video (optional) */}
      <div className="grid gap-1.5">
        <Label>
          Internal Video <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Select
          value={formData.video_id || '_none'}
          onValueChange={(v) => set('video_id', v === '_none' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={videosLoading ? "Loading..." : "No internal video / external only"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">— No internal video / external only —</SelectItem>
            {performerVideos.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Link to an existing FLESHLAB video, or leave empty for external-only entries.
        </p>
      </div>

      {/* External Title — required only when no internal video */}
      <div className="grid gap-1.5">
        <Label>
          External Video Title
          {isExternalOnly && <span className="text-destructive"> *</span>}
          {!isExternalOnly && <span className="text-muted-foreground text-xs"> (optional)</span>}
        </Label>
        <Input
          value={formData.external_title}
          onChange={(e) => set('external_title', e.target.value)}
          placeholder="e.g. Example Upload on xHamster"
          required={isExternalOnly}
        />
      </div>

      {/* External URL */}
      <div className="grid gap-1.5">
        <Label>External URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input
          type="url"
          value={formData.external_url}
          onChange={(e) => set('external_url', e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-1.5">
          <Label>Views</Label>
          <Input
            type="number"
            min="0"
            value={formData.views}
            onChange={(e) => set('views', e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Likes</Label>
          <Input
            type="number"
            min="0"
            value={formData.likes}
            onChange={(e) => set('likes', e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Favourites</Label>
          <Input
            type="number"
            min="0"
            value={formData.favourites}
            onChange={(e) => set('favourites', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      {/* Revenue */}
      <div className="grid gap-1.5">
        <Label>Gross Revenue (USD)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={formData.revenue_usd}
          onChange={(e) => set('revenue_usd', e.target.value)}
          placeholder="0.00"
        />
      </div>

      {/* Promo Status */}
      <div className="grid gap-1.5">
        <Label>Promo Status</Label>
        <Select value={formData.promotion_status} onValueChange={(v) => set('promotion_status', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="grid gap-1.5">
        <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Optional admin notes"
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={createMutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add Stat'}
        </Button>
      </DialogFooter>
    </form>
  );
}