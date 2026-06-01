import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, RefreshCw, Pencil } from 'lucide-react';
import VideoStatSnapshotModal from './VideoStatSnapshotModal';

export default function VideoStatsSection({ videoId }) {
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ platform: '', period_month: '', promotion_status: '' });

  const { data: snapshots, isLoading, refetch } = useQuery({
    queryKey: ['video-stats', videoId, filters],
    queryFn: async () => {
      const res = await base44.functions.invoke('videoStatsImportService', {
        action: 'list_snapshots_for_video',
        video_id: videoId,
        platform: filters.platform || undefined,
        period_month: filters.period_month || undefined
      });
      return res.data;
    },
    enabled: !!videoId
  });

  return (
    <section className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Platform Stats</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
          <Button variant="default" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-3 h-3 mr-1" /> Add Monthly Stats
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs">Platform</Label>
          <Select value={filters.platform} onValueChange={(v) => setFilters({ ...filters, platform: v })}>
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
          <Label className="text-xs">Period</Label>
          <Input
            type="month"
            value={filters.period_month}
            onChange={(e) => setFilters({ ...filters, period_month: e.target.value })}
            className="w-32"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Promotion</Label>
          <Select value={filters.promotion_status} onValueChange={(v) => setFilters({ ...filters, promotion_status: v })}>
            <SelectTrigger className="w-32">
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
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading stats...</p>
      ) : !snapshots?.snapshots?.length ? (
        <p className="text-sm text-muted-foreground">No stats found for this video</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Likes</TableHead>
              <TableHead>Favourites</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Promo Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshots.snapshots.map((snap) => (
              <TableRow key={snap.id}>
                <TableCell className="font-mono text-xs">{snap.period_month}</TableCell>
                <TableCell><Badge variant="secondary">{snap.platform}</Badge></TableCell>
                <TableCell>{snap.views?.toLocaleString()}</TableCell>
                <TableCell>{snap.likes?.toLocaleString()}</TableCell>
                <TableCell>{snap.favourites?.toLocaleString()}</TableCell>
                <TableCell className="font-medium">${snap.revenue_usd?.toFixed(2)}</TableCell>
                <TableCell>
                  {snap.promotion_status && (
                    <Badge variant={
                      snap.promotion_status === 'active' ? 'default' :
                      snap.promotion_status === 'planned' ? 'secondary' :
                      snap.promotion_status === 'ended' ? 'destructive' : 'outline'
                    }>
                      {snap.promotion_status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">{snap.import_source}</TableCell>
                <TableCell className="max-w-[150px] truncate text-xs">{snap.notes || snap.admin_note || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal */}
      {showModal && (
        <VideoStatSnapshotModal
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