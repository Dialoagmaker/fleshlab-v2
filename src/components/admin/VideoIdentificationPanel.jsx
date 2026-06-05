import React from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play, Film, Calendar, Clock, Eye, X } from "lucide-react";

/**
 * Video Identification Panel
 * Shows thumbnail, preview player, and key metadata to help admin identify performers
 */
export default function VideoIdentificationPanel({ video, brands = [], onClearThumbnail, onClearPreview }) {
  if (!video) return null;

  const brand = brands.find(b => b.id === video.brand_id);
  
  // Get priority media URL for preview
  const getPreviewUrl = () => {
    // Priority 1: trailer_url
    if (video.trailer_url?.trim()) return video.trailer_url;
    // Priority 2: source_video_url
    if (video.source_video_url?.trim()) return video.source_video_url;
    // Priority 3: preview_video_url (if exists)
    if (video.preview_video_url?.trim()) return video.preview_video_url;
    return null;
  };

  const previewUrl = getPreviewUrl();
  const hasVideo = !!previewUrl;
  const hasThumbnail = !!video.primary_thumbnail_url;

  // Calculate duration display
  const durationDisplay = video.duration_seconds 
    ? `${Math.floor(video.duration_seconds / 60)}:${String(video.duration_seconds % 60).padStart(2, '0')}`
    : null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h2 className="text-sm font-semibold text-foreground mb-4">Video Identification</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Thumbnail + Preview */}
        <div className="space-y-3">
          {/* Thumbnail */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              Thumbnail
              {hasThumbnail && onClearThumbnail && (
                <button onClick={onClearThumbnail} className="text-xs text-destructive hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> URL löschen
                </button>
              )}
            </Label>
            <div className="aspect-video bg-secondary rounded-lg overflow-hidden border border-border relative">
              {hasThumbnail ? (
                <img
                  src={video.primary_thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Film className="w-12 h-12 opacity-50" />
                </div>
              )}
            </div>
          </div>

          {/* Video Preview */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              Video Preview
              {hasVideo && onClearPreview && (
                <button onClick={onClearPreview} className="text-xs text-destructive hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> URL löschen
                </button>
              )}
            </Label>
            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-border relative">
              {hasVideo ? (
                <video
                  key={previewUrl}
                  src={previewUrl}
                  controls
                  className="w-full h-full"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No video preview available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Metadata */}
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <h3 className="text-lg font-bold text-foreground leading-snug">
              {video.title}
            </h3>
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <Label>Brand / Studio</Label>
            {brand ? (
              <Badge variant="secondary" className="px-3 py-1.5">
                {brand.name}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground italic">No brand assigned</span>
            )}
          </div>

          {/* Status & Access Tier */}
          <div className="flex gap-3">
            <div className="space-y-2 flex-1">
              <Label>Status</Label>
              <Badge 
                className={
                  video.status === 'published' ? 'bg-green-500/10 text-green-500' :
                  video.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500' :
                  video.status === 'archived' ? 'bg-red-500/10 text-red-500' :
                  'bg-blue-500/10 text-blue-500'
                }
              >
                {video.status}
              </Badge>
            </div>
            <div className="space-y-2 flex-1">
              <Label>Access Tier</Label>
              <Badge 
                className={
                  video.access_tier === 'free' ? 'bg-green-500/10 text-green-500' :
                  video.access_tier === 'fanclub' ? 'bg-purple-500/10 text-purple-500' :
                  'bg-primary/10 text-primary'
                }
              >
                {video.access_tier}
              </Badge>
            </div>
          </div>

          {/* Meta Row */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {video.release_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{new Date(video.release_date).toLocaleDateString()}</span>
              </div>
            )}
            {durationDisplay && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{durationDisplay}</span>
              </div>
            )}
            {video.view_count !== undefined && video.view_count > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>{video.view_count.toLocaleString()} views</span>
              </div>
            )}
          </div>

          {/* Categories */}
          {video.categories && video.categories.length > 0 && (
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-1.5">
                {video.categories.slice(0, 6).map((cat, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {cat}
                  </Badge>
                ))}
                {video.categories.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{video.categories.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {video.tags.slice(0, 6).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-muted">
                    {tag}
                  </Badge>
                ))}
                {video.tags.length > 6 && (
                  <Badge variant="outline" className="text-xs bg-muted">
                    +{video.tags.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}