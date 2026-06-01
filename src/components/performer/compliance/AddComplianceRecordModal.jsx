import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, File, X } from "lucide-react";

const RECORD_TYPES = [
  { value: "id", label: "ID Document" },
  { value: "medical_test", label: "Medical Test" },
  { value: "std_test", label: "STI/HIV Test" },
  { value: "background_check", label: "Background Check" },
  { value: "work_permit", label: "Work Permit" },
  { value: "other", label: "Other" },
];

const RECORD_STATUSES = [
  { value: "valid", label: "Valid" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
];

export default function AddComplianceRecordModal({ performerId, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    document_type: "id",
    document_url: "",
    issued_at: new Date().toISOString().split("T")[0],
    expires_at: "",
    status: "valid",
    issuing_authority: "",
    notes: "",
  });

  const uploadFile = (uploadUrl, file) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) setUploadProgress((e.loaded / e.total) * 100);
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed: ${xhr.status}`));
      });
      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 50 * 1024 * 1024) {
      setSelectedFile(file);
    } else {
      toast.error("File must be under 50MB");
    }
  };

  const handleSubmit = async () => {
    if (!formData.document_type) {
      toast.error("Document type is required");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const { upload_url, r2_key } = await base44.functions.invoke("getComplianceUploadUrl", {
        performer_id: performerId,
        file_name: selectedFile.name,
        file_size_bytes: selectedFile.size,
        mime_type: selectedFile.type,
      });

      await uploadFile(upload_url, selectedFile);

      await base44.entities.ComplianceRecord.create({
        ...formData,
        document_url: r2_key,
      });

      toast.success("Compliance record created successfully");
      queryClient.invalidateQueries({ queryKey: ["complianceRecords", performerId] });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Compliance Record</DialogTitle>
          <DialogDescription>
            Create a new compliance record for this performer. Document Type and File are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="document_type">Document Type</Label>
            <Select
              value={formData.document_type}
              onValueChange={(value) => setFormData({ ...formData, document_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECORD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_file">Document File *</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
              {selectedFile ? (
                <div className="flex items-center gap-3">
                  <File className="w-6 h-6 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">PDF, JPG, PNG, DOC, DOCX (max 50MB)</p>
                  <Input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileSelect} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>Select File</Button>
                </div>
              )}
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Label>Uploading...</Label>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="issued_at">Issue Date</Label>
            <Input id="issued_at" type="date" value={formData.issued_at} onChange={(e) => setFormData({ ...formData, issued_at: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_at">Expiry Date</Label>
            <Input id="expires_at" type="date" value={formData.expires_at} onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RECORD_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuing_authority">Issuing Authority</Label>
            <Input id="issuing_authority" placeholder="e.g., DMV, Medical Center" value={formData.issuing_authority} onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Additional notes..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="h-20" />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isUploading || !selectedFile}>
            {isUploading ? "Uploading..." : "Create Record"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}