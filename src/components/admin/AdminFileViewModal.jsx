import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { File, Download, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminFileViewModal({
  open,
  onOpenChange,
  objectKey,
  recordId,
  recordType,
  fileName,
  mimeType,
  title = "Document Preview",
}) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getSignedUrl = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("getAdminFileViewUrl", {
        object_key: objectKey,
        record_id: recordId,
        record_type: recordType,
      });
      return res.data;
    },
  });

  const isImage = mimeType?.startsWith("image/") || 
    fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = mimeType === "application/pdf" || 
    fileName?.match(/\.pdf$/i);

  useEffect(() => {
    if (open && (objectKey || recordId)) {
      loadSignedUrl();
    }
  }, [open, objectKey, recordId]);

  const loadSignedUrl = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getSignedUrl.mutateAsync();
      setSignedUrl(result.signed_url);
    } catch (error) {
      console.error("Failed to load signed URL:", error);
      setError(error.message);
      toast.error("Failed to load document");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (signedUrl) {
      const a = document.createElement("a");
      a.href = signedUrl;
      a.download = fileName || "document";
      a.click();
    }
  };

  const handleOpenInNewTab = () => {
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {fileName && <span>File: {fileName}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center min-h-[400px] bg-muted/50 rounded-lg">
          {isLoading ? (
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading document...</p>
            </div>
          ) : error ? (
            <div className="text-center text-destructive">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Failed to load document</p>
              <p className="text-xs mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSignedUrl}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : signedUrl ? (
            isImage ? (
              <img
                src={signedUrl}
                alt={fileName || "Document preview"}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            ) : isPDF ? (
              <iframe
                src={signedUrl}
                className="w-full h-[60vh] rounded-lg border"
                title="PDF Preview"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="mb-4">Preview not available for this file type</p>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Instead
                </Button>
              </div>
            )
          ) : (
            <div className="text-center text-muted-foreground">
              <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Document preview not available</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!signedUrl}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            onClick={handleOpenInNewTab}
            disabled={!signedUrl}
          >
            Open in New Tab
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}