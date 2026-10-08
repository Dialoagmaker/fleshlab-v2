import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, ExternalLink, Image as ImageIcon, Video, Eye, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function MediaTab({ application }) {
  const [loadingUrls, setLoadingUrls] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const handleOpenPreview = async (r2_key, mediaType, index = null) => {
    if (!r2_key) return;
    
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewUrl(null);
    
    const key = index !== null ? `${mediaType}_${index}` : mediaType;
    
    try {
      const res = await base44.functions.invoke("getApplicationFileSignedUrl", {
        application_id: application.id,
        r2_key
      });
      
      const data = res.data || res;
      if (data.signed_url) {
        setPreviewUrl(data.signed_url);
        setPreviewType(mediaType === 'video' ? 'video' : 'image');
      } else {
        setPreviewError("Failed to generate preview URL");
      }
    } catch (err) {
      setPreviewError(err.message || "Failed to load media");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenInNewTab = async (r2_key, mediaType) => {
    if (!r2_key) return;
    
    setLoadingUrls(prev => ({ ...prev, [mediaType]: true }));
    try {
      const res = await base44.functions.invoke("getApplicationFileSignedUrl", {
        application_id: application.id,
        r2_key
      });
      
      const data = res.data || res;
      if (data.signed_url) {
        window.open(data.signed_url, '_blank');
      }
    } catch (err) {
      console.error("Failed to get signed URL:", err);
    } finally {
      setLoadingUrls(prev => ({ ...prev, [mediaType]: false }));
    }
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewType(null);
    setPreviewError(null);
  };

  const renderPhotoGrid = () => {
    const photos = application.profile_photo_r2_keys || [];
    const hasPhotos = photos.length > 0;
    
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium">Profile Photos</h4>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              photos.length >= 5 
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                : photos.length > 0
                ? "bg-amber-600/20 text-amber-400 border border-amber-600/30"
                : "bg-red-600/20 text-red-400 border border-red-600/30"
            }`}>
              {photos.length}/5
            </span>
          </div>
          
          {hasPhotos ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {photos.map((photoKey, index) => (
                <div key={index} className="space-y-2">
                  <div className="aspect-[3/4] rounded-lg bg-secondary border border-border overflow-hidden relative group">
                    <button
                      onClick={() => handleOpenPreview(photoKey, 'photo', index)}
                      className="w-full h-full flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </button>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPreview(photoKey, 'photo', index);
                        }}
                        className="gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Photo {index + 1}
                    <div className="text-[10px] font-mono truncate" title={photoKey}>
                      {photoKey.split('/').pop()}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 5 - photos.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="space-y-2">
                  <div className="aspect-[3/4] rounded-lg bg-secondary/30 border border-border border-dashed flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <div className="text-xs text-muted-foreground/40 text-center">
                    Photo {photos.length + i + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No profile photos uploaded
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderVideoCard = (label, r2_key, videoType, hint) => {
    const hasVideo = !!r2_key;
    
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              <div>
                <h4 className="font-medium">{label}</h4>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
            </div>
            {hasVideo && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenPreview(r2_key, 'video', videoType)}
                  disabled={loadingUrls[videoType]}
                  className="gap-1"
                >
                  <Eye className="w-3 h-3" />
                  {loadingUrls[videoType] ? "Loading..." : "Preview"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenInNewTab(r2_key, videoType)}
                  disabled={loadingUrls[videoType]}
                  className="gap-1"
                >
                  <Download className="w-3 h-3" />
                  Open
                </Button>
              </div>
            )}
          </div>
          {hasVideo ? (
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span> File uploaded
              </div>
              <div className="text-xs text-muted-foreground/60 font-mono">
                {r2_key.split('/').pop()}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              <span className="text-red-500">✗</span> Not uploaded
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-300">
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          <strong>Privacy Notice:</strong> These files contain sensitive content. Do not distribute. Admin access only.
        </AlertDescription>
      </Alert>

      {/* Photos */}
      {renderPhotoGrid()}

      {/* Videos */}
      <div className="grid md:grid-cols-2 gap-4">
        {renderVideoCard(
          "Intro / Body Video",
          application.intro_video_r2_key,
          'intro',
          "Show body, physique and presence"
        )}
        {renderVideoCard(
          "Hardcore / Action Video",
          application.hardcore_video_r2_key,
          'hardcore',
          "Show explicit action"
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Media Preview</DialogTitle>
          </DialogHeader>
          
          {previewLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Generating secure preview...</p>
              </div>
            </div>
          )}
          
          {previewError && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-red-300">
                {previewError}
              </AlertDescription>
            </Alert>
          )}
          
          {previewUrl && !previewLoading && !previewError && (
            <div className="mt-4">
              {previewType === 'video' ? (
                <div className="space-y-2">
                  <Alert className="bg-blue-500/10 border-blue-500/30">
                    <AlertDescription className="text-sm">
                      Video files open in a new tab for playback.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => window.open(previewUrl, '_blank')} className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Video in New Tab
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Media preview"
                    className="w-full h-auto rounded-lg border"
                    onError={() => setPreviewError("Failed to load image. File may be corrupted or expired.")}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}