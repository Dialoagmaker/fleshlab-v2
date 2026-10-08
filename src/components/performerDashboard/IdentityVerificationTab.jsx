import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Upload, CheckCircle, Clock, XCircle, AlertTriangle, RefreshCw, FileText } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const DOC_CONFIG = {
  id_front: {
    label: "Government ID — Front Side",
    description: "Please upload a clear photo of the front side of your government-issued ID.",
    required: true,
  },
  id_back: {
    label: "Government ID — Back Side",
    description: "Please upload a clear photo of the back side of your government-issued ID.",
    required: true,
  },
  selfie_with_id: {
    label: "Selfie Holding Your ID",
    description: "Please upload a selfie holding your ID next to your face. Your face and the ID must be clearly visible.",
    required: true,
  },
};

const STATUS_CONFIG = {
  requested: { label: "Pending Upload", color: "bg-gray-500/20 text-gray-400", icon: Clock },
  uploaded: { label: "Pending Review", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  approved: { label: "Approved", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  rejected: { label: "Rejected — Re-upload Required", color: "bg-red-500/20 text-red-400", icon: XCircle },
  expired: { label: "Expired", color: "bg-orange-500/20 text-orange-400", icon: AlertTriangle },
};

const ACCEPTED_TYPES = ".jpg,.jpeg,.png,.pdf";
const ACCEPTED_MIMES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getOverallStatus(documents) {
  const types = ["id_front", "id_back", "selfie_with_id"];
  const uploaded = types.filter(t => documents.some(d => d.document_type === t));
  if (uploaded.length === 0) return "not_submitted";
  const allApproved = types.every(t => documents.some(d => d.document_type === t && d.status === "approved"));
  if (allApproved) return "approved";
  const anyRejected = documents.some(d => d.status === "rejected");
  if (anyRejected) return "rejected";
  if (uploaded.length < 3) return "partial";
  return "pending_review";
}

function IdDocumentCard({ docType, existingDoc, onUploaded, performerId, performerToken }) {
  const config = DOC_CONFIG[docType];
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  const statusCfg = existingDoc ? (STATUS_CONFIG[existingDoc.status] || STATUS_CONFIG.uploaded) : null;
  const StatusIcon = statusCfg?.icon || Upload;
  const canUpload = !uploading && (!existingDoc || existingDoc.status === "rejected" || existingDoc.status === "expired");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Client-side validation
    if (!ACCEPTED_MIMES.includes(file.type)) {
      setError("Unsupported file type. Please upload JPG, PNG, or PDF.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large. Maximum allowed size is 20MB.");
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      // Step 1: Get signed upload URL
      const urlRes = await base44.functions.invoke("performerIdVerificationService", {
        action: "create_upload_url",
        performer_id: performerId,
        performer_token: performerToken,
        document_type: docType,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
      });

      if (!urlRes.data?.success) {
        throw new Error(urlRes.data?.error || "We could not prepare your upload. Please try again.");
      }

      const { upload_url, document_id } = urlRes.data;
      setProgress(30);

      // Step 2: PUT directly to R2
      const putRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!putRes.ok) {
        throw new Error("Upload failed. Please check your file and try again.");
      }

      setProgress(80);

      // Step 3: Confirm upload
      const confirmRes = await base44.functions.invoke("performerIdVerificationService", {
        action: "confirm_upload",
        performer_id: performerId,
        performer_token: performerToken,
        document_id,
      });

      if (!confirmRes.data?.success) {
        throw new Error(confirmRes.data?.error || "Upload failed. Please try again.");
      }

      setProgress(100);
      toast.success(`${config.label} uploaded successfully.`);
      onUploaded();
    } catch (err) {
      setError(err.message || "Upload failed. Please check your file and try again.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-sm text-foreground">{config.label}</span>
            {config.required && <span className="text-red-400 text-xs font-bold">Required</span>}
          </div>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
        {statusCfg && (
          <Badge className={`${statusCfg.color} shrink-0 text-xs`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusCfg.label}
          </Badge>
        )}
      </div>

      {existingDoc && (
        <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{existingDoc.filename}</span>
          {existingDoc.file_size_bytes && <span className="ml-2">({formatBytes(existingDoc.file_size_bytes)})</span>}
          {existingDoc.uploaded_at && (
            <span className="ml-2">· Uploaded {new Date(existingDoc.uploaded_at).toLocaleDateString()}</span>
          )}
        </div>
      )}

      {existingDoc?.status === "rejected" && existingDoc.rejection_reason && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">
          <span className="font-semibold">Rejection reason:</span> {existingDoc.rejection_reason}
        </div>
      )}

      {existingDoc?.performer_visible_note && existingDoc.status !== "rejected" && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 text-xs text-primary">
          {existingDoc.performer_visible_note}
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      {uploading && (
        <div className="space-y-1">
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">Uploading... {progress}%</p>
        </div>
      )}

      {canUpload && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {existingDoc ? "Replace File" : "Upload File"}
          </Button>
        </>
      )}
    </div>
  );
}

export default function IdentityVerificationTab({ performerId, performerToken }) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["performer-id-documents", performerId],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerIdVerificationService", {
        action: "get_id_documents",
        performer_id: performerId,
        performer_token: performerToken,
      });
      return res.data;
    },
    enabled: !!performerId && !!performerToken,
  });

  const documents = data?.documents || [];
  const overallStatus = getOverallStatus(documents);

  const getDocForType = (type) => documents.find(d => d.document_type === type) || null;

  const overallStatusDisplay = {
    not_submitted: { label: "Not Submitted", color: "bg-gray-500/20 text-gray-400", icon: AlertTriangle },
    partial: { label: "Partially Submitted", color: "bg-orange-500/20 text-orange-400", icon: AlertTriangle },
    pending_review: { label: "Pending Review", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
    approved: { label: "Verified", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
    rejected: { label: "Action Required", color: "bg-red-500/20 text-red-400", icon: XCircle },
  };
  const overall = overallStatusDisplay[overallStatus];
  const OverallIcon = overall.icon;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Identity Verification</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${overall.color} text-xs`}>
                <OverallIcon className="w-3 h-3 mr-1" />
                {overall.label}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          <CardDescription className="text-sm mt-3 leading-relaxed">
            To work with FLESHLAB, all performers must complete age and identity verification before any production can be approved.
            Please upload the required documents below. Your documents are stored securely and reviewed only by the FLESHLAB compliance team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-xs text-primary mb-5">
            <Shield className="w-3.5 h-3.5 inline mr-1" />
            Your legal details and ID documents are never shown publicly. They are reviewed only by the FLESHLAB compliance team.
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading documents...</div>
          ) : (
            <div className="space-y-4">
              {["id_front", "id_back", "selfie_with_id"].map((type) => (
                <IdDocumentCard
                  key={type}
                  docType={type}
                  existingDoc={getDocForType(type)}
                  onUploaded={() => queryClient.invalidateQueries({ queryKey: ["performer-id-documents", performerId] })}
                  performerId={performerId}
                  performerToken={performerToken}
                />
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
            <p>Accepted formats: JPG, JPEG, PNG, PDF · Maximum 20MB per file</p>
            <p>Required documents: Government ID front, Government ID back, Selfie with ID.</p>
            <p>Your application or performer profile cannot be fully approved until identity verification is complete.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}