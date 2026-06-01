import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Calendar } from "lucide-react";
import { toast } from "sonner";

const DOCUMENT_STATUSES = [
  { value: "valid", label: "Valid" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
];

const DOCUMENT_TYPES = [
  { value: "id", label: "ID Document" },
  { value: "medical_test", label: "Medical Test" },
  { value: "std_test", label: "STI/HIV Test" },
  { value: "background_check", label: "Background Check" },
  { value: "work_permit", label: "Work Permit" },
  { value: "other", label: "Other" },
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

export default function ComplianceRecordsSection({ performer }) {
  const queryClient = useQueryClient();
  const [documentType, setDocumentType] = useState("id");
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: records, refetch: refetchRecords } = useQuery({
    queryKey: ["complianceRecords", performer.id],
    queryFn: () => base44.entities.ComplianceRecord.filter({ performer_id: performer.id }, "-created_date"),
  });

  const updateRecordStatus = useMutation({
    mutationFn: async ({ recordId, status }) => {
      await base44.functions.invoke("complianceRecordService", {
        action: "update_record_status",
        record_id: recordId,
        performer_id: performer.id,
        status,
      });
    },
    onSuccess: () => {
      refetchRecords();
      toast.success("Status updated");
    },
  });

  const updateRecordExpiry = useMutation({
    mutationFn: async ({ recordId, expiresAt }) => {
      await base44.functions.invoke("complianceRecordService", {
        action: "update_record_expiry",
        record_id: recordId,
        performer_id: performer.id,
        expires_at: expiresAt,
      });
    },
    onSuccess: () => {
      refetchRecords();
      queryClient.invalidateQueries({ queryKey: ["performer", performer.id] });
      toast.success("Expiry updated");
    },
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      const uploadRes = await base44.functions.invoke("createDocumentUploadUrl", {
        entity_type: "ComplianceRecord",
        performer_id: performer.id,
        file_name: selectedFile.name,
        file_size_bytes: selectedFile.size,
        mime_type: selectedFile.type,
        document_type: documentType,
      });

      const { upload_url, cdn_url } = uploadRes.data;
      await fetch(upload_url, { method: "PUT", body: selectedFile, headers: { "Content-Type": selectedFile.type } });

      await base44.functions.invoke("complianceRecordService", {
        action: "create_record",
        performer_id: performer.id,
        document_type: documentType,
        document_url: cdn_url,
        status: "valid",
        issued_at: new Date().toISOString(),
      });

      toast.success("Record uploaded");
      refetchRecords();
      setSelectedFile(null);
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Medical / ID Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        {records?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No records</p>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{r.document_type}</Badge>
                    <Badge className={getStatusBadge(r.status)}>{r.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {r.issued_at && <span>Issued: {new Date(r.issued_at).toLocaleDateString()}</span>}
                    {r.expires_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Expires: {new Date(r.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={r.status}
                    onValueChange={(v) => updateRecordStatus.mutate({ recordId: r.id, status: v })}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {r.document_url && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={r.document_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}