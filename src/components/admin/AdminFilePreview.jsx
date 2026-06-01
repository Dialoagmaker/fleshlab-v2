import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { File, Download, Eye, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminFilePreview({
  objectKey,
  recordId,
  recordType,
  fileName,
  mimeType,
  showThumbnail = false,
  thumbnailSize = "w-16 h-16",
  showDownload = true,
  showView = true,
  className = "",
}) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    if (showThumbnail && objectKey) {
      loadSignedUrl();
    }
  }, [objectKey]);

  const loadSignedUrl = async () => {
    if (!objectKey && !recordId) return;
    
    setIsLoading(true);
    try {
      const result = await getSignedUrl.mutateAsync();
      setSignedUrl(result.signed_url);
    } catch (error) {
      console.error("Failed to load signed URL:", error);
      toast.error("Failed to load file preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async () => {
    await loadSignedUrl();
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  };

  const handleDownload = async () => {
    await loadSignedUrl();
    if (signedUrl) {
      const a = document.createElement("a");
      a.href = signedUrl;
      a.download = fileName || "document";
      a.click();
    }
  };

  if (showThumbnail) {
    return (
      <div className={`relative ${thumbnailSize} rounded-lg overflow-hidden border bg-muted ${className}`}>
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : signedUrl && isImage ? (
          <img
            src={signedUrl}
            alt={fileName || "Preview"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentNode.innerHTML = `
                <div class="flex items-center justify-center w-full h-full text-muted-foreground">
                  <File class="w-6 h-6" />
                </div>
              `;
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground">
            <File className="w-6 h-6" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showView && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleView}
          disabled={isLoading || !objectKey}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Eye className="w-4 h-4 mr-1" />
          )}
          View
        </Button>
      )}

      {showDownload && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          disabled={isLoading || !objectKey}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
}