import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Play, DollarSign, Eye, Heart, Star, AlertCircle, CheckCircle, Clock, Film, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DetailedVideoCard({ video }) {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    published: "bg-green-500/10 text-green-500 border-green-500/20",
    draft: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    unlisted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    archived: "bg-gray-500/10 text-gray-500 border-gray-500/20"
  };

  const assetStatusColor = {
    complete: "text-green-500",
    partial: "text-yellow-500",
    missing: "text-red-500"
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">{video.title}</CardTitle>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={cn("text-xs border", statusColors[video.status] || statusColors.draft)}>
                {video.status}
              </Badge>
              {video.lead_performer && (
                <Badge variant="secondary" className="text-xs">Lead</Badge>
              )}
              {video.featured && (
                <Badge variant="outline" className="text-xs">Featured</Badge>
              )}
              {video.active_promo && (
                <Badge className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">
                  Active Promo
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3 py-3 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
              <Eye className="w-3 h-3" />
              <span>Views</span>
            </div>
            <p className="text-sm font-semibold mt-1">
              {video.stats_summary?.views_total?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="text-center border-l border-border">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
              <Heart className="w-3 h-3" />
              <span>Likes</span>
            </div>
            <p className="text-sm font-semibold mt-1">
              {video.stats_summary?.likes_total?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="text-center border-l border-border">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
              <DollarSign className="w-3 h-3" />
              <span>Your Share</span>
            </div>
            <p className="text-sm font-semibold mt-1 text-green-500">
              ${(video.stats_summary?.performer_amount_total || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t border-border animate-in slide-in-from-top-2">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">{formatDuration(video.duration)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{video.performer_role || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(video.created_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Published</p>
                <p className="font-medium">{formatDate(video.published_at)}</p>
              </div>
            </div>

            {/* Asset Status */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Asset Status</p>
              <div className="flex items-center gap-3 text-sm">
                <div className={cn("flex items-center gap-1", assetStatusColor[video.asset_status] || "text-muted-foreground")}>
                  {video.asset_status === 'complete' ? <CheckCircle className="w-3 h-3" /> : 
                   video.asset_status === 'partial' ? <AlertCircle className="w-3 h-3" /> : 
                   <Clock className="w-3 h-3" />}
                  <span className="capitalize">{video.asset_status}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Film className="w-3 h-3" />
                  <span>Source: {video.source_asset_exists ? '✓' : '✗'}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Play className="w-3 h-3" />
                  <span>Preview: {video.preview_exists ? '✓' : '✗'}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Star className="w-3 h-3" />
                  <span>Thumb: {video.thumbnail_exists ? '✓' : '✗'}</span>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Revenue Breakdown</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-secondary/50 rounded p-2 text-center">
                  <p className="text-xs text-muted-foreground">Gross</p>
                  <p className="font-semibold">${(video.stats_summary?.gross_revenue_total || 0).toFixed(2)}</p>
                </div>
                <div className="bg-green-500/10 rounded p-2 text-center">
                  <p className="text-xs text-green-500">Your Share ({video.stats_summary?.performer_share_percent || 0}%)</p>
                  <p className="font-semibold text-green-500">${(video.stats_summary?.performer_amount_total || 0).toFixed(2)}</p>
                </div>
                <div className="bg-blue-500/10 rounded p-2 text-center">
                  <p className="text-xs text-blue-500">Studio Share</p>
                  <p className="font-semibold text-blue-500">${(video.stats_summary?.studio_amount_total || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Platform Breakdown */}
            {video.stats_by_platform && video.stats_by_platform.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Platform Breakdown</p>
                <div className="space-y-2">
                  {video.stats_by_platform.map((platform, idx) => (
                    <div key={idx} className="bg-secondary/30 rounded p-2 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium capitalize">{platform.platform}</span>
                        <Badge variant="outline" className="text-xs">{platform.period_month}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <span>Views: {platform.views?.toLocaleString() || 0}</span>
                        <span>Likes: {platform.likes?.toLocaleString() || 0}</span>
                        <span className="text-green-500">Your Share: ${(platform.performer_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Processing Status</p>
                <p className="font-medium capitalize">{video.processing_status || 'unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Compliance</p>
                <p className="font-medium capitalize text-green-500">{video.compliance_status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Release Status</p>
                <p className="font-medium capitalize">{video.release_status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Promo Status</p>
                <p className="font-medium capitalize">{video.promo_status}</p>
              </div>
            </div>

            {/* Public Link */}
            {video.public_url && (
              <div className="pt-2 border-t border-border">
                <a 
                  href={video.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>View Public Page</span>
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}