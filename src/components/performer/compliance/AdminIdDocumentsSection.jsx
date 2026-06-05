import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Shield, Eye, CheckCircle, XCircle, Clock, AlertTriangle, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const DOC_LABELS = {
  id_front: "Government ID — Front Side",
  id_back: "Government ID — Back Side",
  selfie_with_id: "Selfie Holding ID",
};

const STATUS_CONFIG = {
  requested: { label: "Awaiting Upload", color: "bg-gray-500/20 text-gray-400", icon: Clock },
  uploaded: { label: "Pending Review", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  approved: { label: "Approved", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400", icon: XCircle },
  expired: { label: "Expired", color: "bg-orange-500/20 text-orange-400", icon: AlertTriangle },
};

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocRow({ doc, onApprove, onReject, onView, isPending }) {
  const sc = STATUS_CONFIG[doc.status] || STATUS_CONFIG.uploaded;
  const Icon = sc.icon;
  const isReviewable = ["uploaded", "under_review", "rejected"].includes(doc.status);

  return (
    <div className="border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-sm text-foreground mb-0.5">
            {DOC_LABELS[doc.document_type] || doc.document_type}
          </div>
          <div className="text-xs text-muted-foreground space-x-2">
            {doc.filename && <span>{doc.filename}</span>}
            {doc.file_size_bytes && <span>({formatBytes(doc.file_size_bytes)})</span>}
            {doc.issued_at && <span>· Uploaded {new Date(doc.issued_at).toLocaleDateString()}</span>}
            {doc.reviewed_at && <span>· Reviewed {new Date(doc.reviewed_at).toLocaleDateString()}</span>}
          </div>
          {doc.rejection_reason && (
            <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
              <span className="font-semibold">Reason:</span> {doc.rejection_reason}
            </div>
          )}
        </div>
        <Badge className={`${sc.color} shrink-0 text-xs`}>
          <Icon className="w-3 h-3 mr-1" />
          {sc.label}
        </Badge>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(doc)}
          disabled={doc.status === "requested"}
          className="gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          View / Download
        </Button>
        {isReviewable && (
          <>
            <Button
              size="sm"
              onClick={() => onApprove(doc.id)}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onReject(doc)}
              disabled={isPending}
              className="gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function RejectModal({ doc, onClose, onSubmit, isPending }) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Document</DialogTitle>
          <DialogDescription>
            {DOC_LABELS[doc.document_type] || doc.document_type}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="text-sm font-medium">Rejection Reason (shown to performer)</label>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Image is blurry. Please upload a clearer photo."
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => onSubmit(reason)}
            disabled={isPending || !reason.trim()}
          >
            {isPending ? "Rejecting..." : "Reject Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewModal({ url, filename, onClose }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>View Document</DialogTitle>
          <DialogDescription>{filename}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This signed link expires in 30 minutes. Do not share it.
          </p>
          <div className="flex gap-3">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </Button>
            </a>
            <a href={url} download={filename}>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </a>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminIdDocumentsSection({ performer }) {
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState(null);
  const [viewData, setViewData] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-id-docs", performer?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerIdVerificationService", {
        action: "admin_get_id_documents",
        performer_id: performer.id,
      });
      return res.data;
    },
    enabled: !!performer?.id,
  });

  const docs = data?.documents || [];
  const docTypes = ["id_front", "id_back", "selfie_with_id"];

  const approveMutation = useMutation({
    mutationFn: async (document_id) => {
      const res = await base44.functions.invoke("performerIdVerificationService", {
        action: "admin_approve_document",
        document_id,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-id-docs", performer.id] });
      queryClient.invalidateQueries({ queryKey: ["performer", performer.id] });
      toast.success("Document approved.");
    },
    onError: (err) => toast.error(err.message || "Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ document_id, reason }) => {
      const res = await base44.functions.invoke("performerIdVerificationService", {
        action: "admin_reject_document",
        document_id,
        reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-id-docs", performer.id] });
      toast.success("Document rejected.");
      setRejectTarget(null);
    },
    onError: (err) => toast.error(err.message || "Failed to reject"),
  });

  const handleView = async (doc) => {
    try {
      const res = await base44.functions.invoke("performerIdVerificationService", {
        action: "admin_get_signed_url",
        document_id: doc.id,
      });
      if (!res.data?.signed_url) throw new Error(res.data?.error || "Could not generate download link");
      setViewData({ url: res.data.signed_url, filename: doc.filename || "document" });
    } catch (err) {
      toast.error(err.message || "Could not generate secure view link");
    }
  };

  if (!performer?.id) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="w-5 h-5 text-primary" />
          ID Verification Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading documents...</div>
        ) : docs.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
            No ID documents uploaded yet by this performer.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show all 3 doc types — uploaded or placeholder */}
            {docTypes.map((type) => {
              const doc = docs.filter(d => d.document_type === type)
                .sort((a, b) => new Date(b.issued_at || 0) - new Date(a.issued_at || 0))[0];
              if (!doc) {
                return (
                  <div key={type} className="border border-dashed border-border rounded-xl p-4 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{DOC_LABELS[type]}</span>
                    <span className="ml-3 text-xs">Not yet uploaded by performer</span>
                  </div>
                );
              }
              return (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  onApprove={(id) => approveMutation.mutate(id)}
                  onReject={(d) => setRejectTarget(d)}
                  onView={handleView}
                  isPending={approveMutation.isPending || rejectMutation.isPending}
                />
              );
            })}
          </div>
        )}
      </CardContent>

      {rejectTarget && (
        <RejectModal
          doc={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onSubmit={(reason) => rejectMutation.mutate({ document_id: rejectTarget.id, reason })}
          isPending={rejectMutation.isPending}
        />
      )}

      {viewData && (
        <ViewModal
          url={viewData.url}
          filename={viewData.filename}
          onClose={() => setViewData(null)}
        />
      )}
    </Card>
  );
}