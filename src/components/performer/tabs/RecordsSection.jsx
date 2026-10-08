import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Download, Calendar, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const DOCUMENT_TYPES = [
  { value: "id", label: "ID Document" },
  { value: "medical_test", label: "Medical Test" },
  { value: "std_test", label: "STI/HIV Test" },
  { value: "background_check", label: "Background Check" },
  { value: "work_permit", label: "Work Permit" },
  { value: "other", label: "Other" },
];

const DOCUMENT_STATUSES = [
  { value: "valid", label: "Valid" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
];

export default function RecordsSection({ performerId, onRecordUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("id");

  const { data: records, isLoading, refetch } = useQuery({
    queryKey: ["complianceRecords", performerId],
    queryFn: () => base44.entities.ComplianceRecord.filter({ performer_id: performerId }, "-created_date"),
    enabled: !!performerId,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentType, issuedAt, expiresAt }) => {
      // Get upload URL
      const uploadRes = await base44.functions.invoke("createDocumentUploadUrl", {
        entity_type: "ComplianceRecord",
        performer_id: performerId,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        document_type: documentType,
      });

      const { upload_url, cdn_url } = uploadRes.data;

      // Upload to R2
      const putRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!putRes.ok) throw new Error("Upload failed");

      // Create compliance record via service
      const result = await base44.functions.invoke("complianceRecordService", {
        action: "create_record",
        performer_id: performerId,
        document_type: documentType,
        document_url: cdn_url,
        issued_at: issuedAt,
        expires_at: expiresAt,
      });

      return result.data;
    },
    onSuccess: () => {
      refetch();
      onRecordUploaded?.();
      toast.success("Compliance record uploaded successfully");
      setSelectedFile(null);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ recordId, status }) => {
      await base44.functions.invoke("complianceRecordService", {
        action: "update_record_status",
        record_id: recordId,
        status,
      });
    },
    onSuccess: () => {
      refetch();
      toast.success("Record status updated");
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    // Prompt for dates
    const issuedAt = prompt("Issued date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (!issuedAt) return;
    
    const expiresAt = prompt("Expiry date (YYYY-MM-DD, optional):", "");
    
    uploadMutation.mutate({
      file: selectedFile,
      documentType,
      issuedAt,
      expiresAt: expiresAt || null,
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      valid: "bg-green-500/10 text-green-500",
      expiring_soon: "bg-yellow-500/10 text-yellow-500",
      expired: "bg-red-500/10 text-red-500",
      revoked: "bg-red-500/10 text-red-500",
    };
    return variants[status] || "bg-gray-500/10 text-gray-500";
  };

  const getTypeBadge = (type) => {
    const variants = {
      id: "bg-blue-500/10 text-blue-500",
      medical_test: "bg-purple-500/10 text-purple-500",
      std_test: "bg-purple-500/10 text-purple-500",
      background_check: "bg-orange-500/10 text-orange-500",
      work_permit: "bg-green-500/10 text-green-500",
      other: "bg-gray-500/10 text-gray-500",
    };
    return variants[type] || "bg-gray-500/10 text-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance Records
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="Document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <input
                type="file"
                id="record-upload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploadMutation.isPending}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploadMutation.isPending || !selectedFile}
                onClick={handleUpload}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadMutation.isPending ? "Uploading..." : selectedFile ? "Upload" : "Select File"}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading records...</p>
        ) : records?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No compliance records uploaded</p>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg bg-card/50"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeBadge(record.document_type)}>
                      {DOCUMENT_TYPES.find(t => t.value === record.document_type)?.label || record.document_type}
                    </Badge>
                    <Badge className={getStatusBadge(record.status)}>
                      {record.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {record.issued_at && (
                      <span>Issued: {new Date(record.issued_at).toLocaleDateString()}</span>
                    )}
                    {record.expires_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Expires: {new Date(record.expires_at).toLocaleDateString()}
                      </span>
                    )}
                    {record.issuing_authority && (
                      <span>• {record.issuing_authority}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={record.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ 
                      recordId: record.id, 
                      status: value 
                    })}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {record.document_url && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={record.document_url} target="_blank" rel="noopener noreferrer">
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