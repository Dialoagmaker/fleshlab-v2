import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Check, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { computeUploadReadiness, getReadinessBadgeColor } from "@/lib/applicationReadiness";

export default function ApplicationTable({ applications, isLoading, onReview, onDelete }) {
  if (isLoading) {
    return (
      <tbody>
        <tr>
          <td colSpan={6} className="p-8 text-center text-muted-foreground">
            Loading applications...
          </td>
        </tr>
      </tbody>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={6} className="p-8 text-center text-muted-foreground">
            No applications found
          </td>
        </tr>
      </tbody>
    );
  }

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-500",
    media_pending: "bg-orange-500/10 text-orange-500",
    reviewing: "bg-blue-500/10 text-blue-500",
    contacted: "bg-purple-500/10 text-purple-500",
    more_info_requested: "bg-amber-500/10 text-amber-500",
    approved: "bg-green-500/10 text-green-500",
    rejected: "bg-red-500/10 text-red-500",
    contract_pending: "bg-indigo-500/10 text-indigo-500",
    contract_sent: "bg-indigo-500/10 text-indigo-500",
    contract_signed: "bg-indigo-500/10 text-indigo-500",
    performer_created: "bg-pink-500/10 text-pink-500",
    user_linked: "bg-cyan-500/10 text-cyan-500",
    active: "bg-emerald-500/10 text-emerald-500",
  };

  return (
    <tbody>
      {applications.map((app) => {
        const readiness = computeUploadReadiness(app);
        
        return (
          <tr key={app.id} className="border-t border-border hover:bg-secondary/50">
            <td className="p-4">
              <div>
                <div className="font-medium">{app.applicant_name}</div>
                <div className="text-xs text-muted-foreground">{app.nationality || "—"}</div>
              </div>
            </td>
            <td className="p-4">
              <div className="text-sm">{app.email}</div>
              <div className="text-xs text-muted-foreground">{app.phone || "—"}</div>
            </td>
            <td className="p-4">
              <div className="space-y-1">
                {/* Upload Readiness Badge */}
                <Badge className={getReadinessBadgeColor(readiness.readiness_status)} variant="outline">
                  {readiness.all_required_complete ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertCircle className="w-3 h-3 mr-1" />
                  )}
                  {readiness.readiness_status.replace('_', ' ')}
                </Badge>
                
                {/* Missing Items Summary */}
                {!readiness.all_required_complete && readiness.missing_items.length > 0 && (
                  <div className="text-xs text-orange-400 truncate max-w-[200px]">
                    Missing: {readiness.missing_items.slice(0, 2).join(', ')}
                    {readiness.missing_items.length > 2 && '...'}
                  </div>
                )}
                
                {/* Progress Counts */}
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>Photos: {readiness.upload_counts.photos.uploaded}/{readiness.upload_counts.photos.required}</div>
                  <div>Videos: {readiness.upload_counts.videos.uploaded}/{readiness.upload_counts.videos.required}</div>
                  <div>ID: {readiness.upload_counts.id_verification.id_front ? '✓' : '✗'} Selfie: {readiness.upload_counts.id_verification.selfie ? '✓' : '✗'}</div>
                </div>
              </div>
            </td>
            <td className="p-4 text-sm text-muted-foreground">
              {app.submitted_at ? format(new Date(app.submitted_at), 'MMM d, yyyy') : '—'}
            </td>
            <td className="p-4">
              <Badge className={statusColors[app.status] || "bg-gray-500/10 text-gray-500"}>
                {app.status}
              </Badge>
            </td>
            <td className="p-4">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReview(app)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Review
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(app)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}