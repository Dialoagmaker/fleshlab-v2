import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertCircle, XCircle, Loader2, ExternalLink, Download, MessageSquare, Film } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending_review: { label: "Pending Review", color: "bg-yellow-500/10 text-yellow-500" },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-500" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500" },
  needs_changes: { label: "Needs Changes", color: "bg-orange-500/10 text-orange-500" }
};

const CONTENT_TYPE_CONFIG = {
  raw_video: { label: "Raw Video", icon: Film },
  photos: { label: "Photos", icon: null },
  behind_the_scenes: { label: "Behind the Scenes", icon: null },
  fanclub_preview: { label: "Fanclub Preview", icon: null },
  other: { label: "Other", icon: null }
};

export default function PerformerSubmissionsReview() {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageForm, setMessageForm] = useState({ message: "", review_status: "approved" });
  const queryClient = useQueryClient();

  // Load all submissions
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["performer-submissions"],
    queryFn: async () => {
      return await base44.entities.ContentSubmission.list("-uploaded_at", 100);
    },
  });

  // Get performer details for a submission
  const getPerformerName = async (performerId) => {
    try {
      const performer = await base44.entities.Performer.get(performerId);
      return performer?.display_name || "Unknown Performer";
    } catch {
      return "Unknown Performer";
    }
  };

  // Update submission mutation
  const updateMutation = useMutation({
    mutationFn: async ({ submissionId, data }) => {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "admin_update_submission",
        submission_id: submissionId,
        data
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Submission updated successfully");
      queryClient.invalidateQueries({ queryKey: ["performer-submissions"] });
      setSelectedSubmission(null);
      setShowMessageDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update submission");
    }
  });

  const handleReview = (submission, status) => {
    setSelectedSubmission(submission);
    setMessageForm({ message: "", review_status: status });
    setShowMessageDialog(true);
  };

  const handleSubmitReview = () => {
    if (!selectedSubmission) return;
    
    updateMutation.mutate({
      submissionId: selectedSubmission.id,
      data: {
        review_status: messageForm.review_status,
        performer_visible_message: messageForm.message,
        reviewed_at: new Date().toISOString()
      }
    });
  };

  const handleDownload = async (submission) => {
    try {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_submission_download_url",
        submission_id: submission.id
      });
      
      if (res.data.signed_url) {
        window.open(res.data.signed_url, "_blank");
      } else {
        toast.error("Failed to get download URL");
      }
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p>Loading submissions...</p>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(s => s.review_status === "pending_review");
  const reviewedSubmissions = submissions.filter(s => s.review_status !== "pending_review");

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performer Content Submissions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review and approve content submitted by performers
        </p>
      </div>

      {submissions.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Submissions</AlertTitle>
          <AlertDescription>
            No performer submissions yet. Performers can upload content through their dashboard.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {/* Pending Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Pending Review ({pendingSubmissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingSubmissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>All caught up! No pending submissions.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSubmissions.map((submission) => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                      onReview={handleReview}
                      onDownload={handleDownload}
                      getPerformerName={getPerformerName}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Reviewed */}
          {reviewedSubmissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Recently Reviewed ({reviewedSubmissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reviewedSubmissions.slice(0, 10).map((submission) => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                      onDownload={handleDownload}
                      getPerformerName={getPerformerName}
                      showActions={false}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.title} - {CONTENT_TYPE_CONFIG[selectedSubmission?.content_type]?.label || selectedSubmission?.content_type}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="review_status">Decision *</Label>
              <Select
                value={messageForm.review_status}
                onValueChange={(value) => setMessageForm({ ...messageForm, review_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve</SelectItem>
                  <SelectItem value="needs_changes">Needs Changes</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message to Performer *</Label>
              <Textarea
                id="message"
                value={messageForm.message}
                onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                placeholder={
                  messageForm.review_status === "approved" 
                    ? "Great work! This has been approved and will be processed..." 
                    : "Please explain what changes are needed or why this was rejected..."
                }
                className="min-h-[120px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                This message will be visible to the performer
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={!messageForm.message.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubmissionCard({ submission, onReview, onDownload, getPerformerName, showActions = true }) {
  const [performerName, setPerformerName] = useState("Loading...");

  useState(() => {
    getPerformerName(submission.performer_id).then(setPerformerName);
  }, [submission.performer_id]);

  const statusConfig = STATUS_CONFIG[submission.review_status] || { label: submission.review_status, color: "bg-muted" };
  const contentTypeConfig = CONTENT_TYPE_CONFIG[submission.content_type] || { label: submission.content_type };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="py-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base">{submission.title}</h3>
                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                {contentTypeConfig.icon && <contentTypeConfig.icon className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{performerName}</span>
                <span className="mx-2">•</span>
                <span>{CONTENT_TYPE_CONFIG[submission.content_type]?.label || submission.content_type}</span>
                <span className="mx-2">•</span>
                <span>Uploaded: {new Date(submission.uploaded_at || submission.created_date).toLocaleDateString()}</span>
              </div>
              {submission.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {submission.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(submission)}
              >
                <Download className="w-4 h-4" />
              </Button>
              
              {showActions && submission.review_status === "pending_review" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => onReview(submission, "approved")}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
          </div>

          {/* Admin Notes (if any) */}
          {submission.admin_notes && (
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              <span className="font-medium text-muted-foreground">Admin Notes:</span>
              <p className="text-muted-foreground mt-1">{submission.admin_notes}</p>
            </div>
          )}

          {/* Performer Visible Message */}
          {submission.performer_visible_message && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Response to Performer</span>
              </div>
              <p className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md p-3">
                {submission.performer_visible_message}
              </p>
            </div>
          )}

          {/* File Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>File: {submission.file_name}</span>
            <span>Size: {(submission.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
            {submission.linked_video_id && (
              <Link to={`/admin/videos/${submission.linked_video_id}`} className="text-primary hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Linked Video
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}