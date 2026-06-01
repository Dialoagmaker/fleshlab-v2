import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, RefreshCw } from "lucide-react";

export default function VideoStatsTab({ performerId }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ period_month: '', platform: '', promotion_status: '' });
  const [editingSnapshot, setEditingSnapshot] = useState(null);

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
            <p className="text-sm text-muted-foreground">No stats found for this performer.</p>
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
    </div>
  );
}