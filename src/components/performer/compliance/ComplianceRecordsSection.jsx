import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Download, Calendar, Plus, ExternalLink, CheckCircle, XCircle, AlertCircle, Eye, File as FileIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddComplianceRecordModal from "./AddComplianceRecordModal";
import { useAuth } from "@/lib/AuthContext";

const DOCUMENT_STATUSES = [
  { value: "valid", label: "Valid" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
];

const VERIFICATION_METHODS = [
  { value: "manual", label: "Manual Review" },
  { value: "philsys_national_id_check", label: "Philippines National ID Check" },
  { value: "third_party_provider", label: "Third-party Provider (Later)" },
];

const VERIFICATION_STATUSES = [
  { value: "not_started", label: "Not Started", color: "bg-gray-500/10 text-gray-500" },
  { value: "pending", label: "Pending", color: "bg-yellow-500/10 text-yellow-500" },
  { value: "passed", label: "Passed", color: "bg-green-500/10 text-green-500" },
  { value: "failed", label: "Failed", color: "bg-red-500/10 text-red-500" },
  { value: "needs_review", label: "Needs Review", color: "bg-orange-500/10 text-orange-500" },
];

const getStatusBadge = (status) => {
  const variants = {
    valid: "bg-green-500/10 text-green-500",
    signed: "bg-green-500/10 text-green-500",
    approved: "bg-green-500/10 text-green-500",
    pending: "bg-yellow-500/10 text-yellow-500",
    draft: "bg-yellow-500/10 text-yellow-500",
    sent: "bg-blue-500/10 text-blue-500",
    expired: "bg-red-500/10 text-red-500",
    revoked: "bg-red-500/10 text-red-500",
    cancelled: "bg-red-500/10 text-red-500",
    rejected: "bg-red-500/10 text-red-500",
    expiring_soon: "bg-orange-500/10 text-orange-500",
  };
  return variants[status] || "bg-gray-500/10 text-gray-500";
};

const getVerificationStatusConfig = (status) => {
  return VERIFICATION_STATUSES.find(s => s.value === status) || VERIFICATION_STATUSES[0];
};

export default function ComplianceRecordsSection({ performer, onRefresh }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  const { data: records, refetch: refetchRecords } = useQuery({
    queryKey: ["complianceRecords", performer?.id],
    queryFn: () => base44.entities.ComplianceRecord.filter({ performer_id: performer.id }, "-created_date"),
    enabled: !!performer?.id,
  });

  // Safe array default - prevent .map() on undefined
  const safeRecords = Array.isArray(records) ? records : [];

  // Helper to check if document is an image
  const isImageDocument = (docUrl) => {
    if (!docUrl) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const lowerUrl = docUrl.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext) || lowerUrl.endsWith(ext));
  };

  // Helper to get signed URL for viewing (using R2 public bucket URL if available)
  const getDocumentViewUrl = (r2Key) => {
    if (!r2Key) return null;
    // For now, use the R2 public bucket URL pattern
    // In production, you might want to create a backend function to generate signed URLs
    const bucketUrl = window.R2_PUBLIC_BUCKET_URL || 'https://fleshlab-video.aee5a2c1098dbb664c57f458dc7b99b3.r2.cloudflarestorage.com';
    return `${bucketUrl}/${r2Key}`;
  };

  const handleViewDocument = async (record) => {
    try {
      // For images, we'll use the R2 public URL directly
      const viewUrl = getDocumentViewUrl(record.document_url);
      if (viewUrl) {
        setSelectedImageUrl(viewUrl);
        setShowImageModal(true);
      } else {
        toast.error("Unable to generate document URL");
      }
    } catch (error) {
      toast.error(`Failed to load document: ${error.message}`);
    }
  };

  const updateRecord = useMutation({
    mutationFn: async ({ recordId, data }) => {
      if (!performer?.id) return;
      await base44.entities.ComplianceRecord.update(recordId, data);
    },
    onSuccess: () => {
      refetchRecords();
      toast.success("Verification updated");
    },
  });

  const handleVerificationUpdate = (recordId, verificationData) => {
    updateRecord.mutate({
      recordId,
      data: {
        ...verificationData,
        verification_checked_at: new Date().toISOString(),
        verification_checked_by: user?.id || 'unknown'
      }
    });
    setShowVerificationModal(false);
    setSelectedRecord(null);
  };

  if (!performer || !performer.id) {
    return <div className="text-sm text-muted-foreground p-4">Performer data not available</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Medical / ID Records
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {safeRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No compliance records yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Add Record" to create one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {safeRecords.map((r) => {
                const verificationConfig = getVerificationStatusConfig(r.verification_status);
                const VerificationIcon = 
                  r.verification_status === 'passed' ? CheckCircle :
                  r.verification_status === 'failed' ? XCircle :
                  r.verification_status === 'needs_review' ? AlertCircle : null;

                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card/50">
                    {/* Thumbnail or File Icon */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                      {isImageDocument(r.document_url) ? (
                        <img
                          src={getDocumentViewUrl(r.document_url)}
                          alt={r.document_type}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = '<div class="flex items-center justify-center w-full h-full text-muted-foreground"><FileIcon class="w-6 h-6" /></div>';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                          <FileIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{r.document_type}</Badge>
                        <Badge className={getStatusBadge(r.status)}>{r.status}</Badge>
                        {r.verification_status && r.verification_status !== 'not_started' && (
                          <Badge className={verificationConfig.color} variant="outline">
                            {VerificationIcon && <VerificationIcon className="w-3 h-3 mr-1" />}
                            {verificationConfig.label}
                          </Badge>
                        )}
                        {r.verification_method === 'philsys_national_id_check' && (
                          <Badge className="bg-blue-500/10 text-blue-500" variant="outline">
                            PhilSys ID Check
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {r.issued_at && <span>Issued: {new Date(r.issued_at).toLocaleDateString()}</span>}
                        {r.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Expires: {new Date(r.expires_at).toLocaleDateString()}
                          </span>
                        )}
                        {r.issuing_authority && <span className="truncate max-w-[150px]">{r.issuing_authority}</span>}
                        {r.verification_checked_at && (
                          <span className="text-xs">
                            Verified: {new Date(r.verification_checked_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {r.document_url && isImageDocument(r.document_url) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(r)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      )}
                      {r.document_url && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={getDocumentViewUrl(r.document_url)} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(r);
                          setShowVerificationModal(true);
                        }}
                      >
                        Verify
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showAddModal && (
        <AddComplianceRecordModal
          performerId={performer.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            refetchRecords();
            onRefresh?.();
          }}
        />
      )}

      {showVerificationModal && selectedRecord && (
        <Dialog open={showVerificationModal} onOpenChange={(open) => {
          if (!open) {
            setShowVerificationModal(false);
            setSelectedRecord(null);
          }
        }}>
          <VerificationModal
            record={selectedRecord}
            onClose={() => {
              setShowVerificationModal(false);
              setSelectedRecord(null);
            }}
            onSubmit={handleVerificationUpdate}
            isLoading={updateRecord.isPending}
          />
        </Dialog>
      )}

      {showImageModal && selectedImageUrl && (
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
              <DialogDescription>Viewing uploaded compliance document</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center min-h-[400px]">
              <img
                src={selectedImageUrl}
                alt="Document preview"
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => window.open(selectedImageUrl, '_blank')}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={() => setShowImageModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function VerificationModal({ record, onClose, onSubmit, isLoading }) {
  const [verificationMethod, setVerificationMethod] = useState(record.verification_method || "manual");
  const [verificationStatus, setVerificationStatus] = useState(record.verification_status || "not_started");
  const [verificationNote, setVerificationNote] = useState(record.verification_note || "");
  const [performerNote, setPerformerNote] = useState(record.performer_visible_note || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(record.id, {
      verification_method: verificationMethod,
      verification_status: verificationStatus,
      verification_note: verificationNote,
      performer_visible_note: performerNote,
      external_verification_url: verificationMethod === 'philsys_national_id_check' 
        ? 'https://everify.gov.ph/check' 
        : record.external_verification_url
    });
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Verify Document</DialogTitle>
        <DialogDescription>
          Document Type: {record.document_type}
          {record.issuing_authority && ` • ${record.issuing_authority}`}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document Preview */}
        {record.document_url && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Document</p>
            <a 
              href={record.document_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              View Document (New Tab)
            </a>
          </div>
        )}

        {/* Verification Method */}
        <div>
          <label className="text-sm font-medium mb-2 block">Verification Method</label>
          <Select value={verificationMethod} onValueChange={setVerificationMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {VERIFICATION_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {verificationMethod === 'philsys_national_id_check' && (
            <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-2">
              <p className="text-xs text-blue-200">
                <strong>Philippines National ID Check</strong>
              </p>
              <p className="text-xs text-blue-100">
                Use the official Philippine National ID Check to verify the PhilID/ePhilID/Digital National ID QR code. 
                This is a manual verification step.
              </p>
              <a
                href="https://everify.gov.ph/check"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Open National ID Check (everify.gov.ph)
              </a>
              <p className="text-xs text-blue-100/80">
                Opens in new tab. Manually scan/check the QR code and compare with uploaded ID.
              </p>
            </div>
          )}
        </div>

        {/* Verification Status */}
        <div>
          <label className="text-sm font-medium mb-2 block">Verification Status</label>
          <Select value={verificationStatus} onValueChange={setVerificationStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {VERIFICATION_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Internal Note */}
        <div>
          <label className="text-sm font-medium mb-2 block">Verification Note (Internal)</label>
          <Textarea
            value={verificationNote}
            onChange={(e) => setVerificationNote(e.target.value)}
            placeholder="Enter internal verification notes..."
            className="h-20"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Internal notes - never shown to performer
          </p>
        </div>

        {/* Performer Visible Note */}
        <div>
          <label className="text-sm font-medium mb-2 block">Note to Performer (Optional)</label>
          <Textarea
            value={performerNote}
            onChange={(e) => setPerformerNote(e.target.value)}
            placeholder="Enter message visible to performer..."
            className="h-20"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This message will be visible to the performer
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Verification"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}