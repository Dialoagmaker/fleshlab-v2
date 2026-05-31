import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Film, Users, CheckCircle2, AlertCircle, ExternalLink, Search, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function MissingPerformerAssignments() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Fetch all data
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["missing-assignments-videos"],
    queryFn: () => base44.entities.Video.list(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["missing-assignments-brands"],
    queryFn: () => base44.entities.Brand.list(),
  });

  const { data: videoPerformers = [] } = useQuery({
    queryKey: ["missing-assignments-video-performers"],
    queryFn: () => base44.entities.VideoPerformer.list(),
  });

  // Compute assignment map
  const videoAssignmentMap = useMemo(() => {
    const map = new Map();
    videoPerformers.forEach(vp => {
      if (!map.has(vp.video_id)) {
        map.set(vp.video_id, []);
      }
      map.get(vp.video_id).push(vp.performer_id);
    });
    return map;
  }, [videoPerformers]);

  // Find videos without performers
  const missingVideos = useMemo(() => {
    return videos.filter(video => {
      const assignments = videoAssignmentMap.get(video.id);
      return !assignments || assignments.length === 0;
    });
  }, [videos, videoAssignmentMap]);

  // Filter missing videos
  const filteredMissingVideos = useMemo(() => {
    return missingVideos.filter(video => {
      if (filterStatus && video.status !== filterStatus) return false;
      if (filterBrand && video.brand_id !== filterBrand) return false;
      if (searchQuery && !video.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [missingVideos, filterStatus, filterBrand, searchQuery]);

  // Build brand lookup
  const brandMap = useMemo(() => {
    const map = {};
    brands.forEach(brand => {
      map[brand.id] = brand.name;
    });
    return map;
  }, [brands]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = videos.length;
    const assigned = videos.filter(v => {
      const assignments = videoAssignmentMap.get(v.id);
      return assignments && assignments.length > 0;
    }).length;
    const missing = missingVideos.length;
    const coverage = total > 0 ? ((assigned / total) * 100).toFixed(1) : 0;

    return { total, assigned, missing, coverage };
  }, [videos, videoAssignmentMap, missingVideos]);

  // Handle open in Quick Match
  const handleOpenQuickMatch = () => {
    // Navigate to Quick Match with a URL param to filter to missing only
    navigate("/admin/video-performer-match?filter=missing");
  };

  if (videosLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Film className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading videos...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Missing Performer Assignments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Videos without performer assignments
          </p>
        </div>
        <Button onClick={handleOpenQuickMatch} className="gap-2">
          <ExternalLink className="w-4 h-4" />
          Open Missing Videos Only
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-500">Videos with Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats.assigned}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-destructive">Videos without Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.missing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-primary">Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.coverage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert */}
      {stats.missing > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">
                  {stats.missing} video{stats.missing !== 1 ? 's' : ''} missing performer assignments
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  These videos will not appear on performer pages and will show "Videos Coming Soon"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Missing Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search by Title</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search videos..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Brand</Label>
              <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="All brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Brands</SelectItem>
                  {brands.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing Videos Grid */}
      {filteredMissingVideos.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Missing Assignments ({filteredMissingVideos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMissingVideos.map(video => {
                  const brand = brands.find(b => b.id === video.brand_id);
                  const assignmentCount = videoAssignmentMap.get(video.id)?.length || 0;

                  return (
                    <div
                      key={video.id}
                      className="border border-border rounded-lg p-4 bg-card hover:border-primary/50 transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video bg-secondary rounded-lg overflow-hidden mb-3">
                        {video.primary_thumbnail_url ? (
                          <img
                            src={video.primary_thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Film className="w-8 h-8 opacity-50" />
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-2">
                        {video.title}
                      </h3>

                      {/* Meta */}
                      <div className="space-y-2 text-xs">
                        {brand && (
                          <Badge variant="secondary" className="px-2 py-0.5">
                            {brand.name}
                          </Badge>
                        )}

                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded ${
                            video.status === 'published' ? 'bg-green-500/10 text-green-500' :
                            video.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {video.status}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(video.created_date).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{assignmentCount} performer{assignmentCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Link to={`/admin/videos/${video.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-1">
                            Edit Video
                          </Button>
                        </Link>
                        <Link
                          to={`/admin/video-performer-match?video=${video.id}`}
                          className="flex-1"
                        >
                          <Button variant="default" size="sm" className="w-full gap-1">
                            Assign <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">All Videos Assigned!</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterBrand || filterStatus
                  ? 'No missing videos match your current filters'
                  : 'All videos have performer assignments'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}