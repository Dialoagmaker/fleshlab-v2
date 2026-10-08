import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function ContentReview() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isGeneratingPromo, setIsGeneratingPromo] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["content-review-videos"],
    queryFn: async () => {
      const allVideos = await base44.entities.Video.list("-updated_date", 200);
      return allVideos.filter(v => 
        v.status === "draft" && v.processing_status === "draft_ready"
      );
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (videoId) => {
      const res = await base44.functions.invoke("validatePublishSafety", { video_id: videoId });
      return res.data;
    },
    onSuccess: (data) => {
      setValidationResult(data);
    },
  });

  const generatePromoMutation = useMutation({
    mutationFn: async (videoId) => {
      const res = await base44.functions.invoke("generatePromoKit", { 
        video_id: videoId, 
        kit_type: "full" 
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Promo kit generated successfully");
      queryClient.invalidateQueries({ queryKey: ["content-review-videos"] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (videoId) => {
      const res = await base44.functions.invoke("publishVideoToWebsite", { video_id: videoId });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Video published successfully");
      queryClient.invalidateQueries({ queryKey: ["content-review-videos"] });
      setValidationResult(null);
      setSelectedVideo(null);
    },
  });

  const handleValidate = (videoId) => {
    setSelectedVideo(videoId);
    validateMutation.mutate(videoId);
  };

  const handleGeneratePromo = () => {
    if (!selectedVideo) return;
    setIsGeneratingPromo(true);
    generatePromoMutation.mutate(selectedVideo, {
      onSettled: () => setIsGeneratingPromo(false),
    });
  };

  const handlePublish = () => {
    if (!selectedVideo) return;
    if (!validationResult?.can_publish) {
      toast.error("Cannot publish: validation failed");
      return;
    }
    setIsPublishing(true);
    publishMutation.mutate(selectedVideo, {
      onSettled: () => setIsPublishing(false),
    });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content Review</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review and publish videos ready for release
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading...</div>
      ) : videos.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No videos currently ready for review. Videos must have status "draft" and processing_status "draft_ready".
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ready for Review ({videos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {videos.map(video => (
                  <div
                    key={video.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedVideo === video.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                    }`}
                    onClick={() => handleValidate(video.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{video.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Updated: {new Date(video.updated_date).toLocaleDateString()}
                        </div>
                        {video.promo_kit_generated_at && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Promo Kit Ready
                          </Badge>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validation and Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedVideo ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Select a video to validate and publish
                </div>
              ) : validateMutation.isPending ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : validationResult ? (
                <>
                  <div className="flex items-center gap-2">
                    {validationResult.can_publish ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <span className={`font-medium ${
                      validationResult.can_publish ? "text-green-500" : "text-destructive"
                    }`}>
                      {validationResult.can_publish ? "Ready to Publish" : "Cannot Publish"}
                    </span>
                  </div>

                  {validationResult.errors?.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-destructive">
                        Blocking Errors ({validationResult.errors.length}):
                      </div>
                      <ul className="text-sm text-destructive space-y-1 list-disc list-inside">
                        {validationResult.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validationResult.warnings?.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-yellow-500">
                        Warnings ({validationResult.warnings.length}):
                      </div>
                      <ul className="text-sm text-yellow-500 space-y-1 list-disc list-inside">
                        {validationResult.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validationResult.validation_summary && (
                    <div className="pt-4 border-t space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Performers:</span>{" "}
                        <span className="font-medium">{validationResult.validation_summary.performer_count}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Processing:</span>{" "}
                        <span className="font-medium">{validationResult.validation_summary.processing_status}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={handleGeneratePromo}
                      disabled={isGeneratingPromo || !validationResult.can_publish}
                      variant="outline"
                      className="flex-1"
                    >
                      {isGeneratingPromo && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Generate Promo Kit
                    </Button>
                    <Button
                      onClick={handlePublish}
                      disabled={isPublishing || !validationResult.can_publish}
                      className="flex-1"
                    >
                      {isPublishing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Publish to Website
                    </Button>
                  </div>

                  {validationResult.can_publish && (
                    <Link to={`/admin/promo-kit/${selectedVideo}`} className="block mt-2">
                      <Button variant="ghost" className="w-full" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Promo Kit Details
                      </Button>
                    </Link>
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}