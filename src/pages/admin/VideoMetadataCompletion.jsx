import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Clock, 
  Tag, 
  Calendar, 
  Film, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Eye,
  Sparkles,
  Download,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const ISSUE_ICONS = {
  missing_meta_title: { icon: Tag, color: "text-yellow-400" },
  missing_meta_description: { icon: FileText, color: "text-orange-400" },
  missing_short_summary: { icon: FileText, color: "text-blue-400" },
  missing_release_date: { icon: Calendar, color: "text-red-400" },
  missing_duration: { icon: Clock, color: "text-purple-400" },
  meta_title_too_long: { icon: AlertTriangle, color: "text-yellow-400" },
  meta_description_wrong_length: { icon: AlertTriangle, color: "text-orange-400" },
  short_summary_too_long: { icon: AlertTriangle, color: "text-blue-400" },
};

const ISSUE_LABELS = {
  missing_meta_title: "Missing Meta Title",
  missing_meta_description: "Missing Meta Description",
  missing_short_summary: "Missing Short Summary",
  missing_release_date: "Missing Release Date",
  missing_duration: "Missing Duration",
  meta_title_too_long: "Meta Title Too Long",
  meta_description_wrong_length: "Meta Description Wrong Length",
  short_summary_too_long: "Short Summary Too Long",
};

export default function VideoMetadataCompletion() {
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const queryClient = useQueryClient();

  // Fetch analysis
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['video-metadata-analysis'],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzeVideoMetadata', { action: 'analyze' });
      return response.data;
    },
  });

  // Generate preview mutation
  const generatePreviewMutation = useMutation({
    mutationFn: async (videoIds) => {
      const response = await base44.functions.invoke('analyzeVideoMetadata', { 
        action: 'generate_preview', 
        videoIds 
      });
      return response.data;
    },
    onSuccess: (data) => {
      setPreviewData(data.previews);
      setShowPreview(true);
    },
  });

  // Apply changes mutation
  const applyChangesMutation = useMutation({
    mutationFn: async ({ videoIds, override = false }) => {
      const response = await base44.functions.invoke('analyzeVideoMetadata', { 
        action: 'apply', 
        videoIds,
        override
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['video-metadata-analysis']);
      queryClient.invalidateQueries(['videos']);
      setSelectedVideos([]);
      setPreviewData(null);
      setShowPreview(false);
    },
  });

  const toggleVideo = (videoId) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const selectAll = () => {
    if (analysis?.analysis) {
      setSelectedVideos(analysis.analysis.map(a => a.video_id));
    }
  };

  const clearSelection = () => {
    setSelectedVideos([]);
  };

  const handleGeneratePreview = () => {
    if (selectedVideos.length > 0) {
      generatePreviewMutation.mutate(selectedVideos);
    }
  };

  const handleApplyChanges = () => {
    if (selectedVideos.length > 0) {
      applyChangesMutation.mutate({ videoIds: selectedVideos, override: false });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Analyzing video metadata...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bulk Metadata Completion</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Automatically fill missing SEO fields, summaries, and dates for migrated videos
        </p>
      </div>

      {/* Stats Overview */}
      {analysis && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Film className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analysis.stats.total_videos}</p>
                  <p className="text-xs text-muted-foreground">Total Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Tag className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analysis.stats.missing_meta_title}</p>
                  <p className="text-xs text-muted-foreground">Missing Meta Title</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <FileText className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analysis.stats.missing_meta_description}</p>
                  <p className="text-xs text-muted-foreground">Missing Meta Desc</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analysis.stats.missing_short_summary}</p>
                  <p className="text-xs text-muted-foreground">Missing Summary</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Calendar className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analysis.stats.missing_release_date}</p>
                  <p className="text-xs text-muted-foreground">Missing Date</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analysis.stats.missing_duration}</p>
                  <p className="text-xs text-muted-foreground">Missing Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alert */}
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <AlertTriangle className="w-4 h-4 text-blue-400" />
        <AlertDescription className="text-blue-400 ml-2">
          <strong>Dry-run mode:</strong> This tool generates metadata without overwriting existing fields. 
          Review proposed changes before applying. Estimated LLM calls: <strong>{analysis?.estimated_llm_calls || 0}</strong>
        </AlertDescription>
      </Alert>

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedVideos.length === analysis?.analysis?.length && analysis?.analysis?.length > 0}
              onCheckedChange={selectedVideos.length === analysis?.analysis?.length ? clearSelection : selectAll}
            />
            <span className="text-sm">
              {selectedVideos.length} of {analysis?.analysis?.length || 0} videos selected
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleGeneratePreview}
            disabled={selectedVideos.length === 0 || generatePreviewMutation.isPending}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            {generatePreviewMutation.isPending ? "Generating..." : "Preview Changes"}
          </Button>
          <Button
            onClick={handleApplyChanges}
            disabled={selectedVideos.length === 0 || applyChangesMutation.isPending}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {applyChangesMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {applyChangesMutation.isPending ? "Applying..." : "Fill Missing Metadata"}
          </Button>
        </div>
      </div>

      {/* Preview Panel */}
      {showPreview && previewData && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Proposed Changes Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {previewData.map((preview, idx) => (
                  <div key={idx} className="bg-muted rounded-lg p-4 border border-border">
                    <h4 className="font-semibold text-sm mb-2">{preview.video_title}</h4>
                    <div className="grid gap-2 text-xs">
                      {preview.proposed.meta_title && (
                        <div className="flex gap-2">
                          <Badge variant="outline" className="shrink-0">Meta Title</Badge>
                          <span className="text-muted-foreground">{preview.proposed.meta_title}</span>
                        </div>
                      )}
                      {preview.proposed.meta_description && (
                        <div className="flex gap-2">
                          <Badge variant="outline" className="shrink-0">Meta Description</Badge>
                          <span className="text-muted-foreground">{preview.proposed.meta_description}</span>
                        </div>
                      )}
                      {preview.proposed.short_summary && (
                        <div className="flex gap-2">
                          <Badge variant="outline" className="shrink-0">Short Summary</Badge>
                          <span className="text-muted-foreground">{preview.proposed.short_summary}</span>
                        </div>
                      )}
                      {preview.proposed.release_date && (
                        <div className="flex gap-2">
                          <Badge variant="outline" className="shrink-0">Release Date</Badge>
                          <span className="text-muted-foreground">{preview.proposed.release_date}</span>
                        </div>
                      )}
                      {preview.proposed.duration_note && (
                        <div className="flex gap-2">
                          <Badge variant="outline" className="shrink-0 bg-yellow-500/10 text-yellow-400">Duration</Badge>
                          <span className="text-yellow-400">{preview.proposed.duration_note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Videos List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Videos Requiring Metadata ({analysis?.analysis?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {analysis?.analysis?.map((item) => (
                <div
                  key={item.video_id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors bg-card"
                >
                  <Checkbox
                    checked={selectedVideos.includes(item.video_id)}
                    onCheckedChange={() => toggleVideo(item.video_id)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{item.video_title}</span>
                      {item.hasMultipleIssues && (
                        <Badge variant="destructive" className="text-xs">
                          {item.issues.length} issues
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.issues.map((issue, idx) => {
                        const IssueConfig = ISSUE_ICONS[issue];
                        const Icon = IssueConfig?.icon || AlertTriangle;
                        return (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className={`gap-1 text-xs ${IssueConfig?.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {ISSUE_LABELS[issue]}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <Link to={`/admin/videos/${item.video_id}`}>
                    <Button variant="ghost" size="sm" className="gap-1">
                      Edit <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Duration Notice */}
      <Alert className="bg-purple-500/10 border-purple-500/30">
        <Clock className="w-4 h-4 text-purple-400" />
        <AlertDescription className="text-purple-400 ml-2">
          <strong>Note:</strong> Duration cannot be auto-filled. Videos missing duration_seconds require manual review 
          or a separate tool to extract metadata from video files.
        </AlertDescription>
      </Alert>
    </div>
  );
}