import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const DOCUMENT_TYPES = [
  { value: "id", label: "ID Document" },
  { value: "medical_test", label: "Medical Test" },
  { value: "std_test", label: "STI/HIV Test" },
  { value: "background_check", label: "Background Check" },
  { value: "work_permit", label: "Work Permit" },
  { value: "other", label: "Other" },
];

export default function ComplianceRecordUploadModal({ isOpen, onClose, performerId, onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("id");

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }) => {
      const uploadRes = await base44.functions.invoke("createDocumentUploadUrl", {
        entity_type: "ComplianceRecord",
        performer_id: performerId,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        document_type: type,
      });

      const { upload_url, cdn_url } = uploadRes.data;
      await fetch(upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });

      await base44.functions.invoke("complianceRecordService", {
        action: "create_record",
        performer_id: performerId,
        document_type: type,
        document_url: cdn_url,
        status: "valid",
        issued_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Record uploaded");
      onUploadComplete();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate({ file: selectedFile, type: documentType });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-semibold">Upload Compliance Record</h3>

        <div className="space-y-2">
          <Label>Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>File</Label>
          <Input
            type="file"
            accept=".pdf,.jpg,.png,.doc,.docx"
            onChange={(e) => setSelectedFile(e.target.files?.[0])}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
            {uploadMutation.isPending ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}