import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, ExternalLink, FileText, User, Eye, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function IDTab({ application }) {
  const [loadingUrls, setLoadingUrls] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const handleOpenPreview = async (r2_key, docType, fileType = 'image') => {
    if (!r2_key) return;
    
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewUrl(null);
    
    try {
      const res = await base44.functions.invoke("getApplicationFileSignedUrl", {
        application_id: application.id,
        r2_key
      });
      
      const data = res.data || res;
      if (data.signed_url) {
        setPreviewUrl(data.signed_url);
        setPreviewType(fileType);
      } else {
        setPreviewError("Failed to generate preview URL");
      }
    } catch (err) {
      setPreviewError(err.message || "Failed to load document");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenInNewTab = async (r2_key, docType) => {
    if (!r2_key) return;
    
    setLoadingUrls(prev => ({ ...prev, [docType]: true }));
    try {
      const res = await base44.functions.invoke("getApplicationFileSignedUrl", {
        application_id: application.id,
        r2_key
      });
      
      const data = res.data || res;
      if (data.signed_url) {
        window.open(data.signed_url, '_blank');
      }
    } catch (err) {
      console.error("Failed to get signed URL:", err);
    } finally {
      setLoadingUrls(prev => ({ ...prev, [docType]: false }));
    }
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewType(null);
    setPreviewError(null);
  };

  const renderDocumentCard = (label, r2_key, docType, Icon) => {
    const isPdf = r2_key?.toLowerCase().endsWith('.pdf');
    const fileType = isPdf ? 'pdf' : 'image';
    
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium">{label}</h4>
            </div>
            {r2_key && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenPreview(r2_key, docType, fileType)}
                  disabled={loadingUrls[docType]}
                  className="gap-1"
                >
                  <Eye className="w-3 h-3" />
                  {loadingUrls[docType] ? "Loading..." : "Preview"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenInNewTab(r2_key, docType)}
                  disabled={loadingUrls[docType]}
                  className="gap-1"
                >
                  <Download className="w-3 h-3" />
                  Open
                </Button>
              </div>
            )}
          </div>
          {r2_key ? (
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span> File uploaded
              </div>
              <div className="text-xs text-muted-foreground/60 font-mono">
                {r2_key.split('/').pop()}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              <span className="text-red-500">✗</span> Not uploaded
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-red-500/10 border-red-500/30 text-red-300">
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          <strong>Highly Sensitive:</strong> KYC documents. Never share externally. Admin access only.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {renderDocumentCard("ID Document (Front)", application.id_document_front_r2_key || application.id_document_r2_key, 'id_front', FileText)}
        {renderDocumentCard("ID Document (Back)", application.id_document_back_r2_key, 'id_back', FileText)}
        {renderDocumentCard("Selfie with ID", application.selfie_with_id_r2_key, 'selfie', User)}
      </div>

      <div className="mt-4">
        <label className="text-sm text-muted-foreground">Compliance Status</label>
        <div className="mt-1">
          {application.compliance_upload_status === 'verified' ? (
            <span className="text-green-500 text-sm font-medium">✓ Verified</span>
          ) : application.compliance_upload_status === 'uploaded' ? (
            <span className="text-yellow-500 text-sm font-medium">⚠ Pending Review</span>
          ) : (
            <span className="text-muted-foreground text-sm">Not uploaded</span>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          
          {previewLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Generating secure preview...</p>
              </div>
            </div>
          )}
          
          {previewError && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-red-300">
                {previewError}
              </AlertDescription>
            </Alert>
          )}
          
          {previewUrl && !previewLoading && !previewError && (
            <div className="mt-4">
              {previewType === 'pdf' ? (
                <div className="space-y-2">
                  <Alert className="bg-blue-500/10 border-blue-500/30">
                    <AlertDescription className="text-sm">
                      PDF files open in a new tab for security. Click the button below.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => window.open(previewUrl, '_blank')} className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open PDF in New Tab
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="w-full h-auto rounded-lg border"
                    onError={() => setPreviewError("Failed to load image. File may be corrupted or expired.")}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}