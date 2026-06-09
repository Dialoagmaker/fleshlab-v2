import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

export default function InfoTab({ application }) {
  const handleWorkTypeChange = async (value) => {
    try {
      await base44.entities.GuestProductionApplication.update(application.id, { work_type: value });
    } catch (err) {
      console.error('Failed to update work type:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Applicant Name</label>
          <p className="font-medium">{application.applicant_name}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Email</label>
          <p className="font-medium">{application.email}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Phone</label>
          <p className="font-medium">{application.phone || "—"}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Nationality</label>
          <p className="font-medium">{application.nationality || "—"}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">City</label>
          <p className="font-medium">{application.city || "—"}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Request Type</label>
          <p className="font-medium">{application.request_type || "performer_application"}</p>
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground">Experience</label>
        <p className="text-sm mt-1 whitespace-pre-wrap">{application.experience || "—"}</p>
      </div>

      <div>
        <label className="text-sm text-muted-foreground">Social Links</label>
        <p className="text-sm mt-1">{application.social_links || "—"}</p>
      </div>

      <div>
        <label className="text-sm text-muted-foreground">Package Interest</label>
        <p className="text-sm mt-1">{application.package_interest || "—"}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Preferred Revenue Model</label>
          <Badge variant="outline" className="mt-1">
            {application.preferred_revenue_model?.replace(/_/g, ' ') || "Undecided"}
          </Badge>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Work Type *</label>
          <Select
            value={application.work_type || ''}
            onValueChange={handleWorkTypeChange}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select work type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solo">Solo Only</SelectItem>
              <SelectItem value="pair">Pair Only</SelectItem>
              <SelectItem value="both">Both (Solo & Pair)</SelectItem>
            </SelectContent>
          </Select>
          {!application.work_type && (
            <p className="text-xs text-orange-400 mt-1">Required before approval</p>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground">Submitted At</label>
        <p className="text-sm mt-1">
          {application.submitted_at ? format(new Date(application.submitted_at), 'PPP p') : "—"}
        </p>
      </div>
    </div>
  );
}