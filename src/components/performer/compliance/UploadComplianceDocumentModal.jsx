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
import { Upload, X, File } from "lucide-react";
import { toast } from "sonner";

const DOCUMENT_TYPES = [
  { value: "id_front", label: "ID Document (Front)" },
  { value: "id_back", label: "ID Document (Back)" },
  { value: "selfie_with_id", label: "Selfie with ID" },
  { value: "performer_contract", label: "Performer Contract" },
  { value: "model_release", label: "Model Release" },
  { value: "release_agreement", label: "Release Agreement" },
  { value: "consent_form", label: "Consent Form" },
  { value: "age_verification", label: "Age Verification" },
  { value: "medical_test", label: "Medical Test" },
  { value: "sti_hiv_test", label: "STI/HIV Test" },
  { value: "background_check", label: "Background Check" },
  { value: "work_permit", label: "Work Permit" },
  { value: "other", label: "Other" },
];

const DOCUMENT_STATUSES = [
  { value: "uploaded", label: "Uploaded" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function UploadComplianceDocumentModal({ performerId, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    document_type: "id_front",
    title: "",
    status: "uploaded",
    issued_at: "",
    expires_at: "",
    admin_note: "",
    performer_visible_note: "",
  });

  // Removed unused mutation - direct function call instead

  const uploadFile = (uploadUrl, file) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("File size exceeds 50MB limit");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.document_type) {
      toast.error("Please select a document type");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }
    if (!formData.title) {
      toast.error("Please enter a title");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Step 1: Get upload URL
      const res = await base44.functions.invoke('getUploadUrl', {
        performer_id: performerId,
        file_name: selectedFile.name,
        file_size_bytes: selectedFile.size,
        mime_type: selectedFile.type,
      });
      const { upload_url, r2_key } = res.data;

      // Step 2: Upload file to R2
      await uploadFile(upload_url, selectedFile);

      // Step 3: Create compliance record with the file reference
      await base44.entities.ComplianceRecord.create({
        performer_id: performerId,
        document_type: formData.document_type,
        document_url: r2_key, // Store R2 key for admin access
        status: formData.status,
        issued_at: formData.issued_at || null,
        expires_at: formData.expires_at || null,
        verification_status: "pending",
        admin_note: formData.admin_note,
        performer_visible_note: formData.performer_visible_note,
      });

      toast.success("Document uploaded successfully");
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Compliance Document</DialogTitle>
          <DialogDescription>
            Upload a compliance document for this performer. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="document_type">Document Type *</Label>
            <Select
              value={formData.document_type}
              onValueChange={(value) => setFormData({ ...formData, document_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>File *</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="flex flex-col items-center justify-center gap-4">
                {selectedFile ? (
                  <div className="flex items-center gap-3 w-full">
                    <File className="w-8 h-8 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload className="w-10 h-10 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Drop file here or click to browse</p>
                        <p className="text-xs text-muted-foreground">
                          PDF, JPG, PNG, GIF, DOC, DOCX (max 50MB)
                        </p>
                      </div>
                    </div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Select File
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Label>Uploading...</Label>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Model Release - June 2024"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issued_at">Issued Date</Label>
              <Input
                id="issued_at"
                type="date"
                value={formData.issued_at}
                onChange={(e) => setFormData({ ...formData, issued_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiry Date</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="admin_note">Admin Notes (Internal)</Label>
            <Textarea
              id="admin_note"
              placeholder="Internal notes about this document..."
              value={formData.admin_note}
              onChange={(e) => setFormData({ ...formData, admin_note: e.target.value })}
              className="h-20"
            />
            <p className="text-xs text-muted-foreground">
              Internal notes - never shown to performer
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="performer_visible_note">Note to Performer (Optional)</Label>
            <Textarea
              id="performer_visible_note"
              placeholder="Message visible to performer..."
              value={formData.performer_visible_note}
              onChange={(e) => setFormData({ ...formData, performer_visible_note: e.target.value })}
              className="h-20"
            />
            <p className="text-xs text-muted-foreground">
              This message will be visible to the performer
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}