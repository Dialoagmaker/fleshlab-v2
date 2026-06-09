import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, FileText, Image, User } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function IDTab({ application }) {
  const [loadingUrls, setLoadingUrls] = useState({});

  const handleGetSignedUrl = async (r2_key, docType) => {
    if (!r2_key) return;
    
    setLoadingUrls(prev => ({ ...prev, [docType]: true }));
    try {
      const res = await base44.functions.invoke("getApplicationFileSignedUrl", {
        application_id: application.id,
        r2_key
      });
      
      if (res.signed_url) {
        window.open(res.signed_url, '_blank');
      }
    } catch (err) {
      console.error("Failed to get signed URL:", err);
    } finally {
      setLoadingUrls(prev => ({ ...prev, [docType]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-300">
        <AlertTriangle className="w-4 h-4 inline mr-2" />
        <strong>Highly Sensitive:</strong> KYC documents. Never share externally.
      </div>

      <div className="grid gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium">ID Document (Front)</h4>
              </div>
              {application.id_document_front_r2_key && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGetSignedUrl(application.id_document_front_r2_key, 'id_front')}
                  disabled={loadingUrls.id_front}
                >
                  {loadingUrls.id_front ? "Loading..." : "View"} <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
            {application.id_document_front_r2_key ? (
              <div className="text-sm text-muted-foreground">
                File uploaded
                <div className="text-xs mt-1 text-muted-foreground/60">
                  {application.id_document_front_r2_key.split('/').pop()}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not uploaded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium">ID Document (Back)</h4>
              </div>
              {application.id_document_back_r2_key && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGetSignedUrl(application.id_document_back_r2_key, 'id_back')}
                  disabled={loadingUrls.id_back}
                >
                  {loadingUrls.id_back ? "Loading..." : "View"} <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
            {application.id_document_back_r2_key ? (
              <div className="text-sm text-muted-foreground">
                File uploaded
                <div className="text-xs mt-1 text-muted-foreground/60">
                  {application.id_document_back_r2_key.split('/').pop()}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not uploaded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium">Selfie with ID</h4>
              </div>
              {application.selfie_with_id_r2_key && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGetSignedUrl(application.selfie_with_id_r2_key, 'selfie')}
                  disabled={loadingUrls.selfie}
                >
                  {loadingUrls.selfie ? "Loading..." : "View"} <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
            {application.selfie_with_id_r2_key ? (
              <div className="text-sm text-muted-foreground">
                File uploaded
                <div className="text-xs mt-1 text-muted-foreground/60">
                  {application.selfie_with_id_r2_key.split('/').pop()}
                </div>
              </div>
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