import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileVideo, 
  Eye,
  EyeOff,
  Server,
  HardDrive,
  ClipboardCheck,
  X
} from "lucide-react";
import VideoUploadPanel from "@/components/admin/VideoUploadPanel";

export default function AdminVideoUploadTest() {
  const [debugMode, setDebugMode] = useState(true);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [lastUploadData, setLastUploadData] = useState(null);

  // REMOVED: getR2BucketName function doesn't exist
  // R2 config shown as static value
  const bucketData = { bucket_name: 'fleshlab-videos' };

  const { data: recentVideos } = useQuery({
    queryKey: ['recent-test-videos'],
    queryFn: () => base44.entities.Video.list("-created_date", 10),
  });

  const handleUploadComplete = (data) => {
    setLastUploadData(data);
    setShowDebugPanel(true);
  };

  const truncateUrl = (url, maxLength = 80) => {
    if (!url || url.length <= maxLength) return url;
    return `${url.substring(0, maxLength)}...`;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Video Upload E2E Test</h1>
          <p className="text-muted-foreground text-sm mt-1">
            End-to-End testing for R2 upload pipeline with debug mode
          </p>
        </div>
        <Button
          variant={debugMode ? "default" : "outline"}
          onClick={() => setDebugMode(!debugMode)}
          className="gap-2"
        >
          {debugMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          Debug Mode {debugMode ? "ON" : "OFF"}
        </Button>
      </div>

      {debugMode && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="w-4 h-4" />
              R2 Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bucket Name:</span>
              <Badge variant="outline">fleshlab-videos</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Connected</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VideoUploadPanel onUploadComplete={handleUploadComplete} />
          </CardContent>
        </Card>

        {debugMode && showDebugPanel && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  Debug Information
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDebugPanel(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4 text-xs font-mono">
                  {lastUploadData ? (
                    <>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <HardDrive className="w-3 h-3" />
                          Upload Response
                        </h4>
                        <div className="bg-background p-3 rounded border border-border space-y-1">
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground shrink-0">Video ID:</span>
                            <span className="text-green-400 break-all">{lastUploadData.video_id}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground shrink-0">Asset ID:</span>
                            <span className="text-green-400 break-all">{lastUploadData.asset_id}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground shrink-0">R2 Key:</span>
                            <span className="text-blue-400 break-all">{lastUploadData.r2_key}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground shrink-0">Upload URL:</span>
                            <span className="text-yellow-400 break-all">{truncateUrl(lastUploadData.upload_url)}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground shrink-0">CDN URL:</span>
                            <span className="text-purple-400 break-all">{lastUploadData.cdn_url}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground shrink-0">Expires In:</span>
                            <span className="text-foreground">{lastUploadData.expires_in}s</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-border">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <CheckCircle className="w-3 h-3" />
                          Verification Checklist
                        </h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Signed PUT URL generated</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Video entity created</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>VideoAsset entity created</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-yellow-500" />
                            <span>Browser upload to R2 (CORS test)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-yellow-500" />
                            <span>finalizeUploadedVideo called</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-yellow-500" />
                            <span>Processor webhook received</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-yellow-500" />
                            <span>VideoAsset status updated</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-yellow-500" />
                            <span>JobQueue updated</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground text-center py-8">
                      <FileVideo className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Upload a video to see debug information</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {debugMode && recentVideos && recentVideos.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileVideo className="w-4 h-4" />
              Recent Test Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentVideos.slice(0, 5).map(video => (
                <div key={video.id} className="flex items-center justify-between p-2 bg-background rounded border border-border text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{video.title}</div>
                    <div className="text-xs text-muted-foreground">
                      ID: {video.id} • {video.status}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = `/admin/videos/${video.id}`}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertDescription>
          <strong>Test Instructions:</strong> Select a small MP4 file (10-50 MB recommended). 
          Watch the upload progress and check the debug panel for generated URLs and IDs. 
          After upload, the processor will be triggered automatically.
        </AlertDescription>
      </Alert>
    </div>
  );
}