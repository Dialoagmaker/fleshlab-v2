import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Upload, AlertCircle, Lock, FileText, Image as ImageIcon, Video, User, ExternalLink, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function UploadStatusSection({ application, token, onRefresh }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingToken, setGeneratingToken] = useState(false);

  useEffect(() => {
    loadStatus();
  }, [application?.id]);

  const loadStatus = async () => {
    if (!application?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await base44.functions.invoke("getApplicantUploadStatus", {
        application_id: application.id,
        token
      });
      
      if (res.error) {
        setError(res.error);
      } else {
        setStatus(res);
      }
    } catch (err) {
      setError(err.message || "Failed to load upload status");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!application?.id) return;
    
    setGeneratingToken(true);
    try {
      const res = await base44.functions.invoke("regenerateApplicationUploadToken", {
        application_id: application.id
      });
      
      if (res.success) {
        // Token regenerated - refresh status
        loadStatus();
        if (onRefresh) onRefresh(res.upload_url);
      }
    } catch (err) {
      console.error("Failed to regenerate token:", err);
    } finally {
      setGeneratingToken(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading upload status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-500/10 border-red-500/30">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription className="text-red-300">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!status) return null;

  const { upload_counts, missing_items, all_required_complete, status_message, admin_feedback } = status;

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <Card className={status.status === 'rejected' ? 'border-red-500/30 bg-red-500/5' : status.status === 'approved' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-primary/30'}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {status.status === 'approved' ? (
                <Check className="w-6 h-6 text-emerald-500" />
              ) : status.status === 'rejected' ? (
                <AlertCircle className="w-6 h-6 text-red-500" />
              ) : status.status === 'under_review' ? (
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-amber-500" />
              )}
              <div>
                <h3 className="font-semibold text-lg capitalize">{status.status.replace('_', ' ')}</h3>
                <p className="text-sm text-muted-foreground">{status_message}</p>
              </div>
            </div>
            <Badge variant={all_required_complete ? "default" : "secondary"}>
              {all_required_complete ? "Complete" : "Incomplete"}
            </Badge>
          </div>

          {/* Missing Items */}
          {missing_items.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium text-red-300 mb-2">Missing Required Uploads:</p>
              <ul className="text-sm text-red-200 space-y-1">
                {missing_items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Admin Feedback */}
          {(admin_feedback.rejection_reason || admin_feedback.more_info_request_message) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium text-amber-300 mb-2">Admin Feedback:</p>
              {admin_feedback.rejection_reason && (
                <p className="text-sm text-amber-100">{admin_feedback.rejection_reason}</p>
              )}
              {admin_feedback.more_info_request_message && (
                <p className="text-sm text-amber-100">{admin_feedback.more_info_request_message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Counts Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Photos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium">Photos</h4>
              </div>
              <Badge variant={upload_counts.photos.uploaded >= upload_counts.photos.required ? "default" : "secondary"}>
                {upload_counts.photos.uploaded}/{upload_counts.photos.required}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {upload_counts.photos.missing > 0 
                ? `${upload_counts.photos.missing} photo${upload_counts.photos.missing > 1 ? 's' : ''} missing`
                : "Complete"}
            </p>
          </CardContent>
        </Card>

        {/* Videos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium">Videos</h4>
              </div>
              <Badge variant={upload_counts.videos.uploaded >= upload_counts.videos.required ? "default" : "secondary"}>
                {upload_counts.videos.uploaded}/{upload_counts.videos.required}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {upload_counts.videos.missing > 0 
                ? `${upload_counts.videos.missing} video${upload_counts.videos.missing > 1 ? 's' : ''} missing`
                : "Complete"}
            </p>
          </CardContent>
        </Card>

        {/* ID Verification */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium">ID Verification</h4>
              </div>
              <Badge variant={upload_counts.id_verification.complete ? "default" : "secondary"}>
                {upload_counts.id_verification.complete ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span className={upload_counts.id_verification.id_front ? "text-green-500" : "text-red-500"}>
                  {upload_counts.id_verification.id_front ? "✓" : "✗"}
                </span>
                ID Document
              </div>
              <div className="flex items-center gap-2">
                <span className={upload_counts.id_verification.selfie ? "text-green-500" : "text-red-500"}>
                  {upload_counts.id_verification.selfie ? "✓" : "✗"}
                </span>
                Selfie with ID
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Expiry Warning */}
      {status.token_expires_at && (
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-sm">
            Your upload link expires on {new Date(status.token_expires_at).toLocaleDateString()}.
            {generatingToken ? (
              <span className="ml-2">Generating new link...</span>
            ) : (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto ml-2"
                onClick={handleRegenerateToken}
                disabled={generatingToken}
              >
                Generate new link
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}