import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play, Film, Calendar, Clock, Eye, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

/**
 * Asset URL Classification
 * Returns: "canonical_cdn" | "legacy_r2_dev" | "relative_r2_key" | "invalid"
 */
function classifyAssetUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { type: 'invalid', isLegacy: false, recommendation: 'Add asset URL' };
  }
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { type: 'relative_r2_key', isLegacy: false, recommendation: 'Will be resolved via CDN' };
  }
  if (/pub-[a-f0-9]+\.r2\.dev/i.test(trimmed)) {
    return { type: 'legacy_r2_dev', isLegacy: true, recommendation: 'Working but should be migrated later' };
  }
  if (trimmed.startsWith('https://video.fleshlab.online/')) {
    return { type: 'canonical_cdn', isLegacy: false, recommendation: 'Optimal' };
  }
  return { type: 'external', isLegacy: false, recommendation: 'External URL' };
}

/**
 * Build asset URL from value (URL or R2 key)
 * Preserves legacy R2.dev URLs, builds CDN URL for bare paths
 */
function buildAssetUrl(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://video.fleshlab.online/${trimmed.replace(/^\/+/, "")}`;
}

/**
 * Check if URL is legacy R2.dev URL
 */
function isLegacyR2Url(value) {
  if (!value) return false;
  return /r2\.dev/i.test(String(value));
}

/**
 * Classify asset URL for debug display
 */
function classifyAssetUrlDetailed(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { type: 'invalid', isLegacy: false };
  }
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { type: 'relative_r2_key', isLegacy: false };
  }
  if (/pub-[a-f0-9]+\.r2\.dev/i.test(trimmed)) {
    return { type: 'legacy_r2_dev', isLegacy: true };
  }
  if (trimmed.startsWith('https://video.fleshlab.online/')) {
    return { type: 'canonical_cdn', isLegacy: false };
  }
  return { type: 'external', isLegacy: false };
}

/**
 * Video Identification Panel
 * Shows thumbnail, preview player, and key metadata to help admin identify performers
 */
export default function VideoIdentificationPanel({ video, brands = [], onClearThumbnail, onClearPreview }) {
  // Guarded render state for thumbnail - tracks current URL being tested
  const [thumbnailRenderState, setThumbnailRenderState] = React.useState('pending');
  const [thumbnailRenderUrl, setThumbnailRenderUrl] = React.useState(null);
  
  // Enhanced validation state - separates browser fetch, render test, and server validation
  const [urlValidation, setUrlValidation] = React.useState({
    thumbnail: { 
      status: 'pending', 
      httpStatus: null, 
      error: null,
      renderStatus: 'pending', // 'pending' | 'accessible' | 'failed'
      fetchStatus: 'pending', // 'pending' | 'success' | 'blocked' | 'failed'
    },
    preview: { 
      status: 'pending', 
      httpStatus: null, 
      error: null,
      renderStatus: 'pending',
      fetchStatus: 'pending',
    },
    source: { 
      status: 'pending', 
      httpStatus: null, 
      error: null,
      renderStatus: 'pending',
      fetchStatus: 'pending',
    },
  });
  
  // Build canonical URLs - must be called before hooks (unconditional)
  const thumbnailUrl = video ? buildAssetUrl(video.primary_thumbnail_url) : null;
  const previewUrl = video ? (buildAssetUrl(video.trailer_url) || buildAssetUrl(video.source_video_url)) : null;
  const sourceUrl = video ? buildAssetUrl(video.source_video_url) : null;
  
  // Reset thumbnail render state when URL changes
  React.useEffect(() => {
    if (thumbnailUrl && thumbnailUrl !== thumbnailRenderUrl) {
      console.log('🔄 Thumbnail URL changed, resetting render state');
      setThumbnailRenderState('pending');
      setThumbnailRenderUrl(thumbnailUrl);
      setUrlValidation(prev => ({
        ...prev,
        thumbnail: { ...prev.thumbnail, renderStatus: 'pending', status: 'pending' }
      }));
    }
  }, [thumbnailUrl, thumbnailRenderUrl]);
  
  // Classify URLs for validation handling (used in useEffect)
  const thumbClassification = classifyAssetUrl(video?.primary_thumbnail_url);
  const previewClassification = classifyAssetUrl(video?.trailer_url || video?.source_video_url);
  const sourceClassification = classifyAssetUrl(video?.source_video_url);
  
  // Classify URLs for display (used in UI)
  const thumbnailDisplayClassification = classifyAssetUrlDetailed(video.primary_thumbnail_url);
  const previewDisplayClassification = classifyAssetUrlDetailed(video.trailer_url || video.source_video_url);
  
  // Validate URLs on mount - must be called before any early returns
  // CRITICAL: Browser fetch/HEAD is blocked by CORS for video.fleshlab.online
  // So we ONLY use render events (img onLoad, video onLoadedMetadata) for health status
  // Server-side validation (backend functions) can still use HEAD/GET
  React.useEffect(() => {
    const validateUrl = async (name, url, classification) => {
      if (!url) {
        setUrlValidation(prev => ({ 
          ...prev, 
          [name]: { 
            ...prev[name],
            status: 'missing', 
            httpStatus: null, 
            error: 'URL is null/empty',
            fetchStatus: 'not_applicable',
            renderStatus: 'not_applicable'
          } 
        }));
        return;
      }
      
      // For all video.fleshlab.online URLs, browser fetch will fail due to CORS
      // Mark as "cors_blocked" and rely entirely on render test
      if (url.includes('video.fleshlab.online')) {
        setUrlValidation(prev => ({
          ...prev,
          [name]: {
            ...prev[name],
            fetchStatus: 'cors_blocked',
            error: 'CORS headers not configured - relying on render test',
            status: 'pending_render_test'
          }
        }));
        return;
      }
      
      // For legacy R2 URLs, browser fetch may fail due to CORS even if asset loads
      if (classification.type === 'legacy_r2_dev') {
        setUrlValidation(prev => ({
          ...prev,
          [name]: {
            ...prev[name],
            fetchStatus: 'blocked',
            error: 'Legacy R2 URL - browser fetch blocked by CORS (asset may still render)',
            status: 'pending_render_test'
          }
        }));
        return;
      }
      
      // For external URLs with CORS, try fetch but don't block on failure
      try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        const httpStatus = response.status;
        const isSuccess = [200, 206, 304].includes(httpStatus);
        
        setUrlValidation(prev => ({
          ...prev,
          [name]: {
            ...prev[name],
            fetchStatus: isSuccess ? 'success' : 'failed',
            status: 'pending_render_test',  // Always wait for render test
            httpStatus,
            error: isSuccess ? null : `HTTP ${httpStatus}`,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length'),
          }
        }));
      } catch (err) {
        // Fetch failed - but asset might still render (CORS issue)
        setUrlValidation(prev => ({
          ...prev,
          [name]: {
            ...prev[name],
            fetchStatus: 'failed',
            status: 'pending_render_test',
            httpStatus: null, 
            error: `Fetch blocked: ${err.message || 'Network error'}`
          }
        }));
      }
    };
    
    validateUrl('thumbnail', thumbnailUrl, thumbClassification);
    validateUrl('preview', previewUrl, previewClassification);
    validateUrl('source', sourceUrl, classifyAssetUrl(video?.source_video_url));
  }, [thumbnailUrl, previewUrl, sourceUrl, video]);
  
  // Helper to update render status
  const updateRenderStatus = (name, status) => {
    setUrlValidation(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        renderStatus: status,
        status: status === 'accessible' ? 'healthy' : (status === 'failed' ? 'broken' : prev[name].status)
      }
    }));
  };
  
  // Build stable asset URL - NO cache buster to avoid src mismatch
  const buildRenderUrl = (url) => {
    if (!url) return null;
    // Remove any trailing whitespace/newlines
    return String(url).trim();
  };
  
  if (!video) return null;

  const brand = brands.find(b => b.id === video.brand_id);
  
  const hasThumbnail = !!thumbnailUrl;
  const hasVideo = !!previewUrl;

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
              {urlValidation.thumbnail.status === 'missing' ? (
                <div className="w-full h-full flex items-center justify-center text-destructive text-xs p-4 text-center">
                  <div>
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    <p>No thumbnail URL</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Always render img for legacy R2 URLs - don't block on fetch status */}
                  <img
                    src={thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    // Never set crossOrigin - blocks rendering for R2 URLs
                    // Guarded render: only update state if src matches current renderUrl
                    onError={(e) => {
                      const currentSrc = e.target.src;
                      const matchesCurrentUrl = currentSrc === thumbnailUrl;
                      console.error('❌ Thumbnail img onError:', {
                        video_id: video.id,
                        actual_src: currentSrc,
                        diagnostic_url: thumbnailUrl,
                        matches_current_url: matchesCurrentUrl,
                        render_state_at_error: thumbnailRenderState,
                        error: e.type
                      });
                      // Only mark failed if this is the current URL we're testing
                      if (matchesCurrentUrl) {
                        setThumbnailRenderState('failed');
                        updateRenderStatus('thumbnail', 'failed');
                      }
                    }}
                    onLoad={(e) => {
                      const currentSrc = e.target.src;
                      const matchesCurrentUrl = currentSrc === thumbnailUrl;
                      console.log('✅ Thumbnail img onLoad:', {
                        video_id: video.id,
                        actual_src: currentSrc,
                        diagnostic_url: thumbnailUrl,
                        matches_current_url: matchesCurrentUrl,
                        naturalWidth: e.target.naturalWidth,
                        naturalHeight: e.target.naturalHeight,
                        render_state_at_load: thumbnailRenderState
                      });
                      // Only mark accessible if this is the current URL we're testing
                      if (matchesCurrentUrl) {
                        setThumbnailRenderState('accessible');
                        updateRenderStatus('thumbnail', 'accessible');
                      }
                    }}
                  />
                  {/* Loading overlay while pending */}
                  {urlValidation.thumbnail.renderStatus === 'pending' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-white opacity-50" />
                    </div>
                  )}
                  {/* Error overlay */}
                  {urlValidation.thumbnail.renderStatus === 'failed' && (
                    <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center text-destructive text-xs p-4 text-center">
                      <div>
                        <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-semibold">Render test failed</p>
                        <p className="text-[10px] mt-1 break-all">{thumbnailUrl}</p>
                      </div>
                    </div>
                  )}
                  {/* Timeout overlay */}
                  {urlValidation.thumbnail.renderStatus === 'timeout' && (
                    <div className="absolute inset-0 bg-yellow-500/10 flex items-center justify-center text-yellow-600 text-xs p-4 text-center">
                      <div>
                        <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-semibold">Render test timeout</p>
                        <p className="text-[10px] mt-1">Try opening URL directly</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {hasThumbnail && thumbnailUrl && (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] font-mono text-muted-foreground break-all flex-1">{thumbnailUrl}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(thumbnailUrl, '_blank')}
                    className="text-[10px] h-6 px-2"
                  >
                    Open ↗
                  </Button>
                </div>
                {/* Legacy URL Warning */}
                {isLegacyR2Url(video.primary_thumbnail_url) && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mt-1 text-[10px] text-yellow-600">
                    ⚠️ Legacy R2 URL — working but should be migrated later
                  </div>
                )}
                {/* Debug Panel - Separated validation types */}
                <div className="bg-muted/50 border border-border rounded p-2 mt-1 text-[10px] space-y-1">
                  <div className="flex gap-2 items-center">
                    <span className="font-semibold">URL Type:</span>
                    <span className={
                      thumbnailDisplayClassification.type === 'canonical_cdn' ? 'text-green-600' :
                      thumbnailDisplayClassification.type === 'legacy_r2_dev' ? 'text-yellow-600' :
                      'text-muted-foreground'
                    }>
                      {thumbnailDisplayClassification.type === 'canonical_cdn' ? '✅ Canonical CDN' :
                       thumbnailDisplayClassification.type === 'legacy_r2_dev' ? '⚠️ Legacy R2' :
                       thumbnailDisplayClassification.type}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">Browser Fetch:</span>
                    <span className={
                      urlValidation.thumbnail.fetchStatus === 'success' ? 'text-green-600' :
                      urlValidation.thumbnail.fetchStatus === 'blocked' ? 'text-yellow-600' :
                      urlValidation.thumbnail.fetchStatus === 'failed' ? 'text-red-600' :
                      'text-muted-foreground'
                    }>
                      {urlValidation.thumbnail.fetchStatus === 'success' ? '✅ Success' :
                       urlValidation.thumbnail.fetchStatus === 'blocked' ? '⚠️ Blocked (CORS)' :
                       urlValidation.thumbnail.fetchStatus === 'failed' ? '❌ Failed' :
                       urlValidation.thumbnail.fetchStatus}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">Render Test:</span>
                    <span className={
                      urlValidation.thumbnail.renderStatus === 'accessible' ? 'text-green-600' :
                      urlValidation.thumbnail.renderStatus === 'failed' ? 'text-red-600' :
                      urlValidation.thumbnail.renderStatus === 'timeout' ? 'text-yellow-600' :
                      'text-yellow-600'
                    }>
                      {urlValidation.thumbnail.renderStatus === 'accessible' ? '✅ Accessible' :
                       urlValidation.thumbnail.renderStatus === 'failed' ? '❌ Failed' :
                       urlValidation.thumbnail.renderStatus === 'timeout' ? '⏱️ Timeout' :
                       '⏳ Pending'}
                    </span>
                  </div>
                  {urlValidation.thumbnail.httpStatus && (
                    <div>HTTP Status: {urlValidation.thumbnail.httpStatus}</div>
                  )}
                  {urlValidation.thumbnail.contentType && (
                    <div>Content-Type: {urlValidation.thumbnail.contentType}</div>
                  )}
                  {/* Final Health Status - Render test is authoritative for CORS-blocked URLs */}
                  <div className="pt-1 border-t border-border mt-1">
                    <div className="flex gap-2">
                      <span className="font-semibold">Final Health:</span>
                      <span className={
                        urlValidation.thumbnail.renderStatus === 'accessible' ? 'text-green-600 font-bold' :
                        urlValidation.thumbnail.renderStatus === 'failed' ? 'text-red-600 font-bold' :
                        urlValidation.thumbnail.renderStatus === 'timeout' ? 'text-yellow-600' :
                        urlValidation.thumbnail.fetchStatus === 'cors_blocked' ? 'text-yellow-600' :
                        urlValidation.thumbnail.fetchStatus === 'success' ? 'text-green-600 font-bold' :
                        'text-muted-foreground'
                      }>
                        {urlValidation.thumbnail.renderStatus === 'accessible' ? '✅ Healthy (Render OK)' :
                         urlValidation.thumbnail.renderStatus === 'failed' ? '❌ Render Failed' :
                         urlValidation.thumbnail.renderStatus === 'timeout' ? '⏱️ Render Timeout' :
                         urlValidation.thumbnail.fetchStatus === 'cors_blocked' ? '⚠️ CORS Blocked (Render Pending)' :
                         urlValidation.thumbnail.fetchStatus === 'success' ? '✅ Fetch OK' :
                         'Pending'}
                      </span>
                    </div>
                    {/* Show actual src vs diagnostic for debugging */}
                    <div className="text-[9px] text-muted-foreground mt-1 space-y-0.5">
                      <div>Actual img src: <span className="font-mono break-all">{thumbnailUrl}</span></div>
                      <div>Diagnostic URL: <span className="font-mono break-all">{thumbnailUrl}</span></div>
                      <div>Match: <span className={thumbnailUrl === thumbnailUrl ? 'text-green-600' : 'text-red-600'}>{thumbnailUrl === thumbnailUrl ? '✅ Yes' : '❌ No'}</span></div>
                    </div>
                  </div>
                </div>
              </>
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
              {urlValidation.preview.status === 'missing' ? (
                <div className="w-full h-full flex items-center justify-center text-destructive text-xs p-4 text-center">
                  <div>
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    <p>No preview URL</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Always render video for legacy R2 URLs - don't block on fetch status */}
                  <video
                    key={previewUrl}
                    src={buildRenderUrl(previewUrl)}
                    controls
                    className="w-full h-full"
                    preload="metadata"
                    // Never set crossOrigin - blocks rendering for R2 URLs
                    onLoadedMetadata={(e) => {
                      console.log('✅ Preview video onLoadedMetadata:', {
                        video_id: video.id,
                        actual_src: e.target.src,
                        diagnostic_url: previewUrl,
                        match: e.target.src === previewUrl,
                        duration: e.target.duration,
                        readyState: e.target.readyState,
                        networkState: e.target.networkState
                      });
                      updateRenderStatus('preview', 'accessible');
                    }}
                    onCanPlay={() => {
                      console.log('✅ Preview video onCanPlay:', {
                        video_id: video.id,
                        actual_src: previewUrl,
                        diagnostic_url: previewUrl
                      });
                      updateRenderStatus('preview', 'accessible');
                    }}
                    onError={(e) => {
                      const videoEl = e.target;
                      console.error('❌ Preview video onError:', {
                        video_id: video.id,
                        actual_src: videoEl.src,
                        diagnostic_url: previewUrl,
                        match: videoEl.src === previewUrl,
                        error_code: videoEl.error?.code,
                        error_message: videoEl.error?.message,
                        networkState: videoEl.networkState,
                        readyState: videoEl.readyState
                      });
                      updateRenderStatus('preview', 'failed');
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                  {/* Loading overlay while pending */}
                  {urlValidation.preview.renderStatus === 'pending' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-white opacity-50" />
                    </div>
                  )}
                  {/* Error overlay */}
                  {urlValidation.preview.renderStatus === 'failed' && (
                    <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center text-destructive text-xs p-4 text-center">
                      <div>
                        <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-semibold">Render test failed</p>
                        <p className="text-[10px] mt-1 break-all">{previewUrl}</p>
                      </div>
                    </div>
                  )}
                  {/* Timeout overlay */}
                  {urlValidation.preview.renderStatus === 'timeout' && (
                    <div className="absolute inset-0 bg-yellow-500/10 flex items-center justify-center text-yellow-600 text-xs p-4 text-center">
                      <div>
                        <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-semibold">Render test timeout</p>
                        <p className="text-[10px] mt-1">Try opening URL directly</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {previewUrl && (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] font-mono text-muted-foreground break-all flex-1">{previewUrl}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="text-[10px] h-6 px-2"
                  >
                    Open ↗
                  </Button>
                </div>
                {/* Legacy URL Warning */}
                {isLegacyR2Url(video.trailer_url || video.source_video_url) && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mt-1 text-[10px] text-yellow-600">
                    ⚠️ Legacy R2 URL — working but should be migrated later
                  </div>
                )}
                {/* Debug Panel - Separated validation types */}
                <div className="bg-muted/50 border border-border rounded p-2 mt-1 text-[10px] space-y-1">
                  <div className="flex gap-2 items-center">
                    <span className="font-semibold">URL Type:</span>
                    <span className={
                      previewDisplayClassification.type === 'canonical_cdn' ? 'text-green-600' :
                      previewDisplayClassification.type === 'legacy_r2_dev' ? 'text-yellow-600' :
                      'text-muted-foreground'
                    }>
                      {previewDisplayClassification.type === 'canonical_cdn' ? '✅ Canonical CDN' :
                       previewDisplayClassification.type === 'legacy_r2_dev' ? '⚠️ Legacy R2' :
                       previewDisplayClassification.type}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">Browser Fetch:</span>
                    <span className={
                      urlValidation.preview.fetchStatus === 'success' ? 'text-green-600' :
                      urlValidation.preview.fetchStatus === 'blocked' ? 'text-yellow-600' :
                      urlValidation.preview.fetchStatus === 'failed' ? 'text-red-600' :
                      'text-muted-foreground'
                    }>
                      {urlValidation.preview.fetchStatus === 'success' ? '✅ Success' :
                       urlValidation.preview.fetchStatus === 'blocked' ? '⚠️ Blocked (CORS)' :
                       urlValidation.preview.fetchStatus === 'failed' ? '❌ Failed' :
                       urlValidation.preview.fetchStatus}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">Render Test:</span>
                    <span className={
                      urlValidation.preview.renderStatus === 'accessible' ? 'text-green-600' :
                      urlValidation.preview.renderStatus === 'failed' ? 'text-red-600' :
                      urlValidation.preview.renderStatus === 'timeout' ? 'text-yellow-600' :
                      'text-yellow-600'
                    }>
                      {urlValidation.preview.renderStatus === 'accessible' ? '✅ Accessible' :
                       urlValidation.preview.renderStatus === 'failed' ? '❌ Failed' :
                       urlValidation.preview.renderStatus === 'timeout' ? '⏱️ Timeout' :
                       '⏳ Pending'}
                    </span>
                  </div>
                  {urlValidation.preview.httpStatus && (
                    <div>HTTP Status: {urlValidation.preview.httpStatus}</div>
                  )}
                  {urlValidation.preview.contentType && (
                    <div>Content-Type: {urlValidation.preview.contentType}</div>
                  )}
                  {/* Final Health Status - Render test is authoritative for CORS-blocked URLs */}
                  <div className="pt-1 border-t border-border mt-1">
                    <div className="flex gap-2">
                      <span className="font-semibold">Final Health:</span>
                      <span className={
                        urlValidation.preview.renderStatus === 'accessible' ? 'text-green-600 font-bold' :
                        urlValidation.preview.renderStatus === 'failed' ? 'text-red-600 font-bold' :
                        urlValidation.preview.renderStatus === 'timeout' ? 'text-yellow-600' :
                        urlValidation.preview.fetchStatus === 'cors_blocked' ? 'text-yellow-600' :
                        urlValidation.preview.fetchStatus === 'success' ? 'text-green-600 font-bold' :
                        'text-muted-foreground'
                      }>
                        {urlValidation.preview.renderStatus === 'accessible' ? '✅ Healthy (Render OK)' :
                         urlValidation.preview.renderStatus === 'failed' ? '❌ Render Failed' :
                         urlValidation.preview.renderStatus === 'timeout' ? '⏱️ Render Timeout' :
                         urlValidation.preview.fetchStatus === 'cors_blocked' ? '⚠️ CORS Blocked (Render Pending)' :
                         urlValidation.preview.fetchStatus === 'success' ? '✅ Fetch OK' :
                         'Pending'}
                      </span>
                    </div>
                    {/* Show actual src vs diagnostic for debugging */}
                    <div className="text-[9px] text-muted-foreground mt-1 space-y-0.5">
                      <div>Actual video src: <span className="font-mono break-all">{previewUrl}</span></div>
                      <div>Diagnostic URL: <span className="font-mono break-all">{previewUrl}</span></div>
                      <div>Match: <span className={previewUrl === previewUrl ? 'text-green-600' : 'text-red-600'}>{previewUrl === previewUrl ? '✅ Yes' : '❌ No'}</span></div>
                    </div>
                  </div>
                </div>
              </>
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

      {/* Asset Diagnostic Panel - Enhanced with separated validation */}
      <div className="border-t border-border pt-4 mt-4">
        <h3 className="text-xs font-semibold text-foreground mb-3">🔍 Asset Diagnostic (Enhanced)</h3>
        <div className="bg-muted/30 rounded-lg p-4 space-y-4 text-xs">
          {/* Thumbnail Diagnostic */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {urlValidation.thumbnail.renderStatus === 'accessible' ? (
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              ) : urlValidation.thumbnail.renderStatus === 'pending' ? (
                <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
              ) : urlValidation.thumbnail.renderStatus === 'failed' ? (
                <AlertCircle className="w-3 h-3 text-destructive" />
              ) : urlValidation.thumbnail.fetchStatus === 'blocked' ? (
                <AlertCircle className="w-3 h-3 text-yellow-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-destructive" />
              )}
              <span className="font-semibold">Thumbnail:</span>
              <span className={
                urlValidation.thumbnail.renderStatus === 'accessible' ? 'text-green-600' :
                urlValidation.thumbnail.renderStatus === 'timeout' ? 'text-yellow-600' :
                urlValidation.thumbnail.fetchStatus === 'blocked' ? 'text-yellow-600' :
                'text-destructive'
              }>
                {urlValidation.thumbnail.renderStatus === 'accessible' ? '✅ Render accessible' :
                 urlValidation.thumbnail.renderStatus === 'timeout' ? '⏱️ Render timeout' :
                 urlValidation.thumbnail.fetchStatus === 'blocked' ? '⚠️ Legacy - awaiting render' :
                 urlValidation.thumbnail.renderStatus === 'failed' ? '❌ Render failed' :
                 urlValidation.thumbnail.status === 'missing' ? '⚠️ missing' :
                 `❌ ${urlValidation.thumbnail.httpStatus || 'error'}`}
              </span>
            </div>
            <div className="ml-5 space-y-0.5 text-[10px] font-mono">
              <div className="text-muted-foreground">Raw field:</div>
              <div className="break-all">{video.primary_thumbnail_url || <span className="text-destructive">null</span>}</div>
              <div className="text-muted-foreground mt-1">URL Type:</div>
              <div className={
                thumbnailDisplayClassification.type === 'canonical_cdn' ? 'text-green-600' :
                thumbnailDisplayClassification.type === 'legacy_r2_dev' ? 'text-yellow-600' :
                ''
              }>
                {thumbnailDisplayClassification.type}
              </div>
              {urlValidation.thumbnail.fetchStatus !== 'not_applicable' && (
                <div>Fetch Status: {urlValidation.thumbnail.fetchStatus}</div>
              )}
              {urlValidation.thumbnail.renderStatus !== 'pending' && (
                <div>Render Status: {urlValidation.thumbnail.renderStatus}</div>
              )}
              {urlValidation.thumbnail.httpStatus && (
                <div>HTTP Status: {urlValidation.thumbnail.httpStatus}</div>
              )}
            </div>
          </div>

          {/* Preview Diagnostic */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {urlValidation.preview.renderStatus === 'accessible' ? (
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              ) : urlValidation.preview.renderStatus === 'pending' ? (
                <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
              ) : urlValidation.preview.renderStatus === 'failed' ? (
                <AlertCircle className="w-3 h-3 text-destructive" />
              ) : urlValidation.preview.fetchStatus === 'blocked' ? (
                <AlertCircle className="w-3 h-3 text-yellow-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-destructive" />
              )}
              <span className="font-semibold">Preview:</span>
              <span className={
                urlValidation.preview.renderStatus === 'accessible' ? 'text-green-600' :
                urlValidation.preview.renderStatus === 'timeout' ? 'text-yellow-600' :
                urlValidation.preview.fetchStatus === 'blocked' ? 'text-yellow-600' :
                'text-destructive'
              }>
                {urlValidation.preview.renderStatus === 'accessible' ? '✅ Render accessible' :
                 urlValidation.preview.renderStatus === 'timeout' ? '⏱️ Render timeout' :
                 urlValidation.preview.fetchStatus === 'blocked' ? '⚠️ Legacy - awaiting render' :
                 urlValidation.preview.renderStatus === 'failed' ? '❌ Render failed' :
                 urlValidation.preview.status === 'missing' ? '⚠️ missing' :
                 `❌ ${urlValidation.preview.httpStatus || 'error'}`}
              </span>
            </div>
            <div className="ml-5 space-y-0.5 text-[10px] font-mono">
              <div className="text-muted-foreground">Raw fields:</div>
              <div className="break-all">trailer_url: {video.trailer_url || <span className="text-destructive">null</span>}</div>
              <div className="break-all">source: {video.source_video_url || <span className="text-destructive">null</span>}</div>
              <div className="text-muted-foreground mt-1">URL Type:</div>
              <div className={
                previewDisplayClassification.type === 'canonical_cdn' ? 'text-green-600' :
                previewDisplayClassification.type === 'legacy_r2_dev' ? 'text-yellow-600' :
                ''
              }>
                {previewDisplayClassification.type}
              </div>
              {urlValidation.preview.fetchStatus !== 'not_applicable' && (
                <div>Fetch Status: {urlValidation.preview.fetchStatus}</div>
              )}
              {urlValidation.preview.renderStatus !== 'pending' && (
                <div>Render Status: {urlValidation.preview.renderStatus}</div>
              )}
              {urlValidation.preview.httpStatus && (
                <div>HTTP Status: {urlValidation.preview.httpStatus}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}