import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Image, Video, User, AlertCircle, Calendar, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function ApplicationReadinessSummary({ application }) {
  if (!application) return null;

  // Calculate readiness (same logic as getApplicationUploadStatus)
  const photoCount = (application.profile_photo_r2_keys || []).length;
  const videoCount = [application.intro_video_r2_key, application.hardcore_video_r2_key].filter(Boolean).length;
  const hasIdFront = !!(application.id_document_front_r2_key || application.id_document_r2_key);
  const hasIdBack = !!application.id_document_back_r2_key;
  const hasSelfie = !!application.selfie_with_id_r2_key;

  // Missing items
  const missingItems = [];
  if (photoCount < 5) missingItems.push(`${5 - photoCount} photo${5 - photoCount > 1 ? 's' : ''}`);
  if (!application.intro_video_r2_key) missingItems.push('intro video');
  if (!application.hardcore_video_r2_key) missingItems.push('hardcore video');
  if (!hasIdFront) missingItems.push('ID document');
  if (!hasSelfie) missingItems.push('selfie with ID');

  const allRequiredComplete = missingItems.length === 0;

  // Determine readiness status
  let readinessStatus = 'incomplete';
  if (allRequiredComplete) {
    if (application.status === 'approved') readinessStatus = 'approved';
    else if (application.status === 'rejected') readinessStatus = 'rejected';
    else if (['reviewing', 'contacted', 'more_info_requested'].includes(application.status)) readinessStatus = 'under_review';
    else readinessStatus = 'ready_for_review';
  } else {
    if (application.status === 'media_pending') readinessStatus = 'media_pending';
    else if (!hasIdFront && application.compliance_upload_status === 'uploaded') readinessStatus = 'id_pending';
    else readinessStatus = 'incomplete';
  }

  const readiness = {
    readiness_status: readinessStatus,
    all_required_complete: allRequiredComplete,
    missing_items: missingItems,
    upload_counts: {
      photos: { uploaded: photoCount, required: 5, missing: Math.max(0, 5 - photoCount) },
      videos: { uploaded: videoCount, required: 2, missing: 2 - videoCount },
      id_verification: { id_front: hasIdFront, id_back: hasIdBack, selfie: hasSelfie, complete: hasIdFront && hasSelfie }
    },
    last_activity_at: application.last_activity_at || application.updated_date,
    token_expires_at: application.application_upload_token_expires_at
  };

  const statusColors = {
    incomplete: "bg-gray-500/10 text-gray-500",
    media_pending: "bg-orange-500/10 text-orange-500",
    id_pending: "bg-red-500/10 text-red-500",
    ready_for_review: "bg-green-500/10 text-green-500",
    under_review: "bg-blue-500/10 text-blue-500",
    approved: "bg-emerald-500/10 text-emerald-500",
    rejected: "bg-red-500/10 text-red-500"
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Upload Readiness</h3>
          <Badge className={statusColors[readinessStatus]}>
            {readinessStatus.replace('_', ' ')}
          </Badge>
        </div>

        {/* Upload Progress Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          {/* Photos */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Image className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Photos</span>
                <Badge variant={photoCount >= 5 ? "default" : "secondary"} size="sm">
                  {photoCount}/5
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {photoCount < 5 ? `${5 - photoCount} missing` : "Complete"}
              </div>
            </div>
          </div>

          {/* Videos */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Videos</span>
                <Badge variant={videoCount >= 2 ? "default" : "secondary"} size="sm">
                  {videoCount}/2
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {videoCount < 2 ? `${2 - videoCount} missing` : "Complete"}
              </div>
            </div>
          </div>

          {/* ID Verification */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ID Verification</span>
                <Badge variant={hasIdFront && hasSelfie ? "default" : "secondary"} size="sm">
                  {hasIdFront && hasSelfie ? '✓' : '✗'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground flex gap-2">
                <span className={hasIdFront ? "text-green-500" : "text-red-500"}>
                  ID: {hasIdFront ? '✓' : '✗'}
                </span>
                <span className={hasSelfie ? "text-green-500" : "text-red-500"}>
                  Selfie: {hasSelfie ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Missing Items Alert */}
        {!allRequiredComplete && missingItems.length > 0 && (
          <Alert className="bg-orange-500/10 border-orange-500/30 mb-4">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <AlertDescription className="text-orange-300 text-sm">
              <strong>Missing Required Uploads:</strong> {missingItems.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Complete Badge */}
        {allRequiredComplete && (
          <Alert className="bg-green-500/10 border-green-500/30 mb-4">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <AlertDescription className="text-green-300 text-sm">
              All required uploads complete
            </AlertDescription>
          </Alert>
        )}

        {/* Timestamps */}
        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t text-sm text-muted-foreground">
          {readiness.last_activity_at && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Last Activity: {format(new Date(readiness.last_activity_at), 'MMM d, yyyy HH:mm')}</span>
            </div>
          )}
          {readiness.token_expires_at && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Upload Token Expires: {format(new Date(readiness.token_expires_at), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}