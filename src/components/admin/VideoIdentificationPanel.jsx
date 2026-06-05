import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play, Film, Calendar, Clock, Eye, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

/**
 * Build canonical asset URL from value (URL or R2 key)
 */
function buildAssetUrl(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://video.fleshlab.online/${trimmed.replace(/^\/+/, "")}`;
}

/**
 * Video Identification Panel
 * Shows thumbnail, preview player, and key metadata to help admin identify performers
 */
export default function VideoIdentificationPanel({ video, brands = [], onClearThumbnail, onClearPreview }) {
  // URL validation state - must be called before any early returns
  const [urlValidation, setUrlValidation] = React.useState({
    thumbnail: { status: 'pending', httpStatus: null, error: null },
    preview: { status: 'pending', httpStatus: null, error: null },
    source: { status: 'pending', httpStatus: null, error: null },
  });
  
  if (!video) return null;

  const brand = brands.find(b => b.id === video.brand_id);
  
  // Build canonical URLs
  const thumbnailUrl = buildAssetUrl(video.primary_thumbnail_url);
  const previewUrl = buildAssetUrl(video.trailer_url) || buildAssetUrl(video.source_video_url);
  const sourceUrl = buildAssetUrl(video.source_video_url);
  
  const hasThumbnail = !!thumbnailUrl;
  const hasVideo = !!previewUrl;
  
  // Validate URLs on mount
  React.useEffect(() => {
    const validateUrl = async (name, url) => {
      if (!url) {
        setUrlValidation(prev => ({ ...prev, [name]: { status: 'missing', httpStatus: null, error: 'URL is null/empty' } }));
        return;
      }
      
      try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        setUrlValidation(prev => ({
          ...prev,
          [name]: {
            status: response.ok ? 'valid' : 'error',
            httpStatus: response.status,
            error: response.ok ? null : `HTTP ${response.status}`,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length'),
          }
        }));
      } catch (err) {
        setUrlValidation(prev => ({
          ...prev,
          [name]: { status: 'error', httpStatus: null, error: err.message || 'Network error' }
        }));
      }
    };
    
    validateUrl('thumbnail', thumbnailUrl);
    validateUrl('preview', previewUrl);
    validateUrl('source', sourceUrl);
  }, [thumbnailUrl, previewUrl, sourceUrl]);

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
              {urlValidation.thumbnail.status === 'pending' ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                </div>
              ) : urlValidation.thumbnail.status === 'valid' ? (
                <img
                  src={thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center text-destructive text-xs p-4 text-center">
                        <div>
                          <AlertCircle class="w-6 h-6 mx-auto mb-2" />
                          <p>Image failed to load</p>
                          <p class="font-mono text-[10px] mt-1">${thumbnailUrl.substring(0, 60)}...</p>
                        </div>
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-destructive text-xs p-4 text-center">
                  <div>
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    <p>{urlValidation.thumbnail.status === 'missing' ? 'No thumbnail URL' : 'Thumbnail URL not reachable'}</p>
                    {thumbnailUrl && <p class="font-mono text-[10px] mt-1 break-all">{thumbnailUrl}</p>}
                    {urlValidation.thumbnail.httpStatus && <p class="text-[10px] mt-0.5">HTTP {urlValidation.thumbnail.httpStatus}</p>}
                    {urlValidation.thumbnail.error && <p class="text-[10px] mt-0.5">{urlValidation.thumbnail.error}</p>}
                  </div>
                </div>
              )}
            </div>
            {hasThumbnail && thumbnailUrl && (
              <p className="text-[10px] font-mono text-muted-foreground break-all">{thumbnailUrl}</p>
            )}
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
              {urlValidation.preview.status === 'pending' ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                </div>
              ) : urlValidation.preview.status === 'valid' ? (
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
                <div className="w-full h-full flex items-center justify-center text-destructive text-xs p-4 text-center">
                  <div>
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    <p>{urlValidation.preview.status === 'missing' ? 'No preview URL' : 'Preview URL not reachable'}</p>
                    {previewUrl && <p className="font-mono text-[10px] mt-1 break-all">{previewUrl}</p>}
                    {urlValidation.preview.httpStatus && <p className="text-[10px] mt-0.5">HTTP {urlValidation.preview.httpStatus}</p>}
                    {urlValidation.preview.error && <p className="text-[10px] mt-0.5">{urlValidation.preview.error}</p>}
                  </div>
                </div>
              )}
            </div>
            {previewUrl && (
              <p className="text-[10px] font-mono text-muted-foreground break-all">{previewUrl}</p>
            )}
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

      {/* Asset Diagnostic Panel */}
      <div className="border-t border-border pt-4 mt-4">
        <h3 className="text-xs font-semibold text-foreground mb-3">🔍 Asset Diagnostic</h3>
        <div className="bg-muted/30 rounded-lg p-4 space-y-4 text-xs">
          {/* Thumbnail Diagnostic */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {urlValidation.thumbnail.status === 'valid' ? (
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              ) : urlValidation.thumbnail.status === 'pending' ? (
                <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
              ) : (
                <AlertCircle className="w-3 h-3 text-destructive" />
              )}
              <span className="font-semibold">Thumbnail:</span>
              <span className={urlValidation.thumbnail.status === 'valid' ? 'text-green-600' : 'text-destructive'}>
                {urlValidation.thumbnail.status === 'valid' ? '✅ accessible' : urlValidation.thumbnail.status === 'missing' ? '⚠️ missing' : `❌ ${urlValidation.thumbnail.httpStatus || 'error'}`}
              </span>
            </div>
            <div className="ml-5 space-y-0.5 text-[10px] font-mono">
              <div className="text-muted-foreground">Raw field (primary_thumbnail_url):</div>
              <div className="break-all">{video.primary_thumbnail_url || <span className="text-destructive">null</span>}</div>
              <div className="text-muted-foreground mt-1">Resolved URL:</div>
              <div className="break-all">{thumbnailUrl || <span className="text-destructive">null</span>}</div>
              {urlValidation.thumbnail.contentType && (
                <div className="text-muted-foreground">Content-Type: {urlValidation.thumbnail.contentType}</div>
              )}
              {urlValidation.thumbnail.contentLength && (
                <div className="text-muted-foreground">Content-Length: {urlValidation.thumbnail.contentLength} bytes</div>
              )}
            </div>
          </div>

          {/* Preview Diagnostic */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {urlValidation.preview.status === 'valid' ? (
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              ) : urlValidation.preview.status === 'pending' ? (
                <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
              ) : (
                <AlertCircle className="w-3 h-3 text-destructive" />
              )}
              <span className="font-semibold">Preview:</span>
              <span className={urlValidation.preview.status === 'valid' ? 'text-green-600' : 'text-destructive'}>
                {urlValidation.preview.status === 'valid' ? '✅ accessible' : urlValidation.preview.status === 'missing' ? '⚠️ missing' : `❌ ${urlValidation.preview.httpStatus || 'error'}`}
              </span>
            </div>
            <div className="ml-5 space-y-0.5 text-[10px] font-mono">
              <div className="text-muted-foreground">Raw fields (trailer_url → source_video_url):</div>
              <div className="break-all">trailer_url: {video.trailer_url || <span className="text-destructive">null</span>}</div>
              <div className="break-all">source_video_url: {video.source_video_url || <span className="text-destructive">null</span>}</div>
              <div className="text-muted-foreground mt-1">Resolved URL:</div>
              <div className="break-all">{previewUrl || <span className="text-destructive">null</span>}</div>
              {urlValidation.preview.contentType && (
                <div className="text-muted-foreground">Content-Type: {urlValidation.preview.contentType}</div>
              )}
              {urlValidation.preview.contentLength && (
                <div className="text-muted-foreground">Content-Length: {urlValidation.preview.contentLength} bytes</div>
              )}
            </div>
          </div>

          {/* Source Diagnostic */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {urlValidation.source.status === 'valid' ? (
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              ) : urlValidation.source.status === 'pending' ? (
                <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
              ) : (
                <AlertCircle className="w-3 h-3 text-destructive" />
              )}
              <span className="font-semibold">Source:</span>
              <span className={urlValidation.source.status === 'valid' ? 'text-green-600' : 'text-destructive'}>
                {urlValidation.source.status === 'valid' ? '✅ accessible' : urlValidation.source.status === 'missing' ? '⚠️ missing' : `❌ ${urlValidation.source.httpStatus || 'error'}`}
              </span>
            </div>
            <div className="ml-5 space-y-0.5 text-[10px] font-mono">
              <div className="text-muted-foreground">Raw field (source_video_url):</div>
              <div className="break-all">{video.source_video_url || <span className="text-destructive">null</span>}</div>
              <div className="text-muted-foreground mt-1">Resolved URL:</div>
              <div className="break-all">{sourceUrl || <span className="text-destructive">null</span>}</div>
              {urlValidation.source.contentType && (
                <div className="text-muted-foreground">Content-Type: {urlValidation.source.contentType}</div>
              )}
              {urlValidation.source.contentLength && (
                <div className="text-muted-foreground">Content-Length: {urlValidation.source.contentLength} bytes</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}