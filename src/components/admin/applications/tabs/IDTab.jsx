import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function IDTab({ application }) {
  return (
    <div className="space-y-4">
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-300">
        <AlertTriangle className="w-4 h-4 inline mr-2" />
        <strong>Highly Sensitive:</strong> KYC documents. Never share externally.
      </div>

      <div className="grid gap-4">
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">ID Document (Front)</h4>
            {application.id_document_r2_key ? (
              <div className="text-sm text-muted-foreground">File uploaded</div>
            ) : (
              <p className="text-sm text-muted-foreground">Not uploaded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">ID Document (Back)</h4>
            {application.id_document_back_r2_key ? (
              <div className="text-sm text-muted-foreground">File uploaded</div>
            ) : (
              <p className="text-sm text-muted-foreground">Not uploaded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">Selfie with ID</h4>
            {application.selfie_with_id_r2_key ? (
              <div className="text-sm text-muted-foreground">File uploaded</div>
            ) : (
              <p className="text-sm text-muted-foreground">Not uploaded</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <label className="text-sm text-muted-foreground">Compliance Status</label>
        <div className="mt-1">
          {application.compliance_upload_status === 'verified' ? (
            <span className="text-green-500 text-sm">✓ Verified</span>
          ) : application.compliance_upload_status === 'uploaded' ? (
            <span className="text-yellow-500 text-sm">⚠ Pending Review</span>
          ) : (
            <span className="text-muted-foreground text-sm">Not uploaded</span>
          )}
        </div>
      </div>
    </div>
  );
}