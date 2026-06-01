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
import { Pencil, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

export default function VideoStatsTab({ performerId }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ period_month: '', platform: '', promotion_status: '' });
  const [editingSnapshot, setEditingSnapshot] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

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
      refetch();
      setEditingSnapshot(null);
    }
  });

  const createSnapshot = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('performerVideoStatsService', {
        action: 'create_snapshot',
        performer_id: performerId,
        ...data
      });
    },
    onSuccess: () => {
      refetch();
      setShowAddModal(false);
    }
  });

  const handleSave = () => {
    if (editingSnapshot) {
      updateSnapshot.mutate({
        snapshot_id: editingSnapshot.id,
        data: {
          views: editingSnapshot.views,
          revenue_usd: editingSnapshot.revenue_usd,
          promotion_status: editingSnapshot.promotion_status,
          promotion_note: editingSnapshot.promotion_note,
          admin_note: editingSnapshot.admin_note
        }
      });
    }
  };

  const stats = statsData?.stats || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Video Stats</CardTitle>
          <p className="text-sm text-muted-foreground">
            Platform statistics for all videos of this performer.
          </p>
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
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Platform</Label>
              <Select value={filters.platform || ''} onValueChange={(v) => setFilters({ ...filters, platform: v || undefined })}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All</SelectItem>
                  <SelectItem value="xhamster">xhamster</SelectItem>
                  <SelectItem value="faphouse">faphouse</SelectItem>
                  <SelectItem value="internal">internal</SelectItem>
                  <SelectItem value="pornhub">pornhub</SelectItem>
                  <SelectItem value="other">other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Promotion Status</Label>
              <Select value={filters.promotion_status || ''} onValueChange={(v) => setFilters({ ...filters, promotion_status: v || undefined })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All</SelectItem>
                  <SelectItem value="none">none</SelectItem>
                  <SelectItem value="planned">planned</SelectItem>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="ended">ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
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
                Add Video Stat
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Likes</TableHead>
                  <TableHead>Favourites</TableHead>
                  <TableHead>Revenue USD</TableHead>
                  <TableHead>Promo Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {stat.video_title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{stat.platform}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{stat.period_month}</TableCell>
                    <TableCell>{stat.views?.toLocaleString()}</TableCell>
                    <TableCell>{stat.likes?.toLocaleString()}</TableCell>
                    <TableCell>{stat.favourites?.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">${stat.revenue_usd?.toFixed(2)}</TableCell>
                    <TableCell>
                      {editingSnapshot?.id === stat.id ? (
                        <Select 
                          value={editingSnapshot.promotion_status || 'none'} 
                          onValueChange={(v) => setEditingSnapshot({...editingSnapshot, promotion_status: v})}
                        >
                          <SelectTrigger className="w-28">
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
                        <Badge 
                          variant={
                            stat.promotion_status === 'active' ? 'default' :
                            stat.promotion_status === 'planned' ? 'secondary' :
                            stat.promotion_status === 'ended' ? 'destructive' : 'outline'
                          }
                          className="text-xs"
                        >
                          {stat.promotion_status || 'none'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingSnapshot?.id === stat.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="default" onClick={handleSave}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingSnapshot(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditingSnapshot(stat)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Video Stat Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Video Stat</DialogTitle>
          </DialogHeader>
          <AddVideoStatForm
            performerId={performerId}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              refetch();
              setShowAddModal(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddVideoStatForm({ performerId, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    video_id: '',
    platform: 'xhamster',
    period_month: new Date().toISOString().slice(0, 7),
    views: '',
    likes: '',
    revenue_usd: '',
    promotion_status: 'none',
    admin_note: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get performer's videos
  const { data: videoPerformers, isLoading: videosLoading } = useQuery({
    queryKey: ['performer-videos-for-stats', performerId],
    queryFn: async () => {
      const vps = await base44.entities.VideoPerformer.filter({ performer_id: performerId });
      const videos = [];
      for (const vp of vps) {
        const video = await base44.entities.Video.get(vp.video_id);
        if (video) videos.push({ id: video.id, title: video.title });
      }
      return videos;
    }
  });

  const createSnapshot = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('performerVideoStatsService', {
        action: 'create_snapshot',
        performer_id: performerId,
        ...data
      });
    },
    onSuccess: () => {
      toast.success('Video stat created');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create stat');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.video_id) {
      toast.error('Please select a video');
      return;
    }
    setIsSubmitting(true);
    createSnapshot.mutate({
      video_id: formData.video_id,
      platform: formData.platform,
      period_month: formData.period_month,
      views: parseInt(formData.views) || 0,
      likes: parseInt(formData.likes) || 0,
      revenue_usd: parseFloat(formData.revenue_usd) || 0,
      promotion_status: formData.promotion_status,
      admin_note: formData.admin_note
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="video_id">Video</Label>
        <Select
          value={formData.video_id}
          onValueChange={(value) => setFormData({ ...formData, video_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={videosLoading ? "Loading videos..." : "Select a video"} />
          </SelectTrigger>
          <SelectContent>
            {videoPerformers?.map((video) => (
              <SelectItem key={video.id} value={video.id}>
                {video.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="platform">Platform</Label>
        <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
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
          onChange={(e) => setFormData({ ...formData, period_month: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="views">Views</Label>
        <Input
          id="views"
          type="number"
          value={formData.views}
          onChange={(e) => setFormData({ ...formData, views: e.target.value })}
          placeholder="0"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="likes">Likes</Label>
        <Input
          id="likes"
          type="number"
          value={formData.likes}
          onChange={(e) => setFormData({ ...formData, likes: e.target.value })}
          placeholder="0"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="revenue_usd">Revenue (USD)</Label>
        <Input
          id="revenue_usd"
          type="number"
          step="0.01"
          value={formData.revenue_usd}
          onChange={(e) => setFormData({ ...formData, revenue_usd: e.target.value })}
          placeholder="0.00"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="promotion_status">Promotion Status</Label>
        <Select value={formData.promotion_status} onValueChange={(v) => setFormData({ ...formData, promotion_status: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">none</SelectItem>
            <SelectItem value="planned">planned</SelectItem>
            <SelectItem value="active">active</SelectItem>
            <SelectItem value="ended">ended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="admin_note">Admin Note</Label>
        <Input
          id="admin_note"
          value={formData.admin_note}
          onChange={(e) => setFormData({ ...formData, admin_note: e.target.value })}
          placeholder="Optional notes"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.video_id}>
          {isSubmitting ? 'Creating...' : 'Create Video Stat'}
        </Button>
      </DialogFooter>
    </form>
  );
}