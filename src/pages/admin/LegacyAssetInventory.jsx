import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Download } from "lucide-react";
import { Link } from "react-router-dom";

export default function LegacyAssetInventory() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["legacy-asset-inventory"],
    queryFn: () => base44.functions.invoke("generateLegacyAssetInventory", {}),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <AlertCircle className="w-6 h-6 text-destructive mb-2" />
        <p className="text-destructive">Failed to load inventory: {error.message}</p>
      </div>
    );
  }

  const { summary, inventory } = data || { summary: {}, inventory: [] };
  
  // Filter inventory
  let filtered = inventory;
  if (filter !== "all") {
    filtered = inventory.filter(v => v.asset_health === filter);
  }
  if (search) {
    filtered = filtered.filter(v => 
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.video_id.toLowerCase().includes(search.toLowerCase())
    );
  }

  const healthStatusConfig = {
    healthy_canonical: { label: "Healthy (Canonical)", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
    healthy_legacy: { label: "Healthy (Legacy)", color: "bg-yellow-500/10 text-yellow-600", icon: AlertTriangle },
    incomplete: { label: "Incomplete", color: "bg-orange-500/10 text-orange-600", icon: AlertCircle },
    broken: { label: "Broken", color: "bg-red-500/10 text-red-600", icon: XCircle },
    missing_source: { label: "Missing Source", color: "bg-purple-500/10 text-purple-600", icon: AlertCircle }
  };

  const urlTypeConfig = {
    canonical_cdn: { label: "Canonical CDN", color: "bg-green-500/10 text-green-600" },
    legacy_r2_dev: { label: "Legacy R2", color: "bg-yellow-500/10 text-yellow-600" },
    relative_r2_key: { label: "R2 Key", color: "bg-blue-500/10 text-blue-600" },
    external: { label: "External", color: "bg-gray-500/10 text-gray-600" },
    invalid: { label: "Invalid", color: "bg-red-500/10 text-red-600" }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Legacy Asset Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete audit of all video assets - canonical vs legacy R2 URLs
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
          <Download className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(summary.by_health_status || {}).map(([status, count]) => {
          const config = healthStatusConfig[status];
          const Icon = config?.icon || AlertCircle;
          return (
            <Card key={status}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {config?.label || status}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground mt-1">videos</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_videos || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Videos with Legacy URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.legacy_usage?.videos_with_legacy_urls || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.legacy_usage?.total_legacy_fields || 0} legacy fields total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready to Publish</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.can_publish_count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.cannot_publish_count || 0} cannot publish
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by health" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="healthy_canonical">Healthy (Canonical)</SelectItem>
            <SelectItem value="healthy_legacy">Healthy (Legacy)</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
            <SelectItem value="broken">Broken</SelectItem>
            <SelectItem value="missing_source">Missing Source</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search by title or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Video Asset Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Video ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-32">Health</TableHead>
                  <TableHead className="w-48">Thumbnail</TableHead>
                  <TableHead className="w-48">Trailer</TableHead>
                  <TableHead className="w-48">Source</TableHead>
                  <TableHead className="w-32">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((video) => (
                  <TableRow key={video.video_id}>
                    <TableCell className="font-mono text-xs">{video.video_id}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      <Link to={`/admin/videos/${video.video_id}`} className="hover:underline">
                        {video.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={video.status === 'published' ? 'default' : 'secondary'}>
                        {video.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const config = healthStatusConfig[video.asset_health];
                        const Icon = config?.icon || AlertCircle;
                        return (
                          <Badge className={config?.color || "bg-gray-500/10 text-gray-600"}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config?.label || video.asset_health}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const field = video.fields.primary_thumbnail_url;
                        if (!field || field.type === 'invalid') {
                          return <span className="text-xs text-red-600">Missing</span>;
                        }
                        return (
                          <div className="text-xs space-y-1">
                            <Badge className={urlTypeConfig[field.type]?.color || "bg-gray-500/10"}>
                              {urlTypeConfig[field.type]?.label || field.type}
                            </Badge>
                            {field.httpStatus && (
                              <div className={field.isReachable ? 'text-green-600' : 'text-red-600'}>
                                HTTP {field.httpStatus}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const field = video.fields.trailer_url;
                        if (!field || field.type === 'invalid') {
                          return <span className="text-xs text-red-600">Missing</span>;
                        }
                        return (
                          <div className="text-xs space-y-1">
                            <Badge className={urlTypeConfig[field.type]?.color || "bg-gray-500/10"}>
                              {urlTypeConfig[field.type]?.label || field.type}
                            </Badge>
                            {field.httpStatus && (
                              <div className={field.isReachable ? 'text-green-600' : 'text-red-600'}>
                                HTTP {field.httpStatus}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const field = video.fields.source_video_url;
                        if (!field || field.type === 'invalid') {
                          return <span className="text-xs text-red-600">Missing</span>;
                        }
                        return (
                          <div className="text-xs space-y-1">
                            <Badge className={urlTypeConfig[field.type]?.color || "bg-gray-500/10"}>
                              {urlTypeConfig[field.type]?.label || field.type}
                            </Badge>
                            {field.httpStatus && (
                              <div className={field.isReachable ? 'text-green-600' : 'text-red-600'}>
                                HTTP {field.httpStatus}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Link to={`/admin/videos/${video.video_id}`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Showing {filtered.length} of {inventory.length} videos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}