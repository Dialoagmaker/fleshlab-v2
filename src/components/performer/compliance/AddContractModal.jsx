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
import { uploadAdminFile } from "@/lib/adminFileUpload";

const CONTRACT_TYPES = [
  { value: "performer", label: "Performer Agreement" },
  { value: "guest", label: "Guest Agreement" },
  { value: "licensing", label: "Licensing Agreement" },
  { value: "release", label: "Model Release" },
];

const CONTRACT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "signed", label: "Signed" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AddContractModal({ performerId, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    contract_type: "release",
    title: "",
    status: "draft",
    signed_at: "",
    expires_at: "",
    notes: "",
  });

  const createContract = useMutation({
    mutationFn: async (data) => {
      console.log('[createContract] mutationFn called with data:', { ...data, document_url: data.document_url?.substring(0, 50) + '...' });
      console.log('[createContract] performer_id:', performerId);
      const res = await base44.functions.invoke("contractService", {
        action: "create_contract",
        performer_id: performerId,
        ...data,
      });
      console.log('[createContract] Backend response:', res.data);
      return res.data;
    },
    onSuccess: () => {
      console.log('[createContract] onSuccess - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ["contracts", performerId] });
      toast.success("Contract created successfully");
      onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error('[createContract] onError:', error);
      toast.error(`Failed to create contract: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    },
    onSettled: () => {
      console.log('[createContract] onSettled called');
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File must be under 50MB");
      return;
    }
    
    // Validate MIME type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Allowed: PDF, JPG, PNG, GIF, WebP, DOC, DOCX");
      return;
    }
    
    setSelectedFile(file);
    if (!formData.title) {
      setFormData({ ...formData, title: file.name });
    }
  };

  const handleSubmit = async () => {
    console.log('[AddContractModal] handleSubmit called');
    console.log('[AddContractModal] performerId:', performerId);
    console.log('[AddContractModal] selectedFile:', selectedFile?.name, selectedFile?.size, selectedFile?.type);
    console.log('[AddContractModal] formData:', formData);
    
    if (!performerId) {
      console.error('[AddContractModal] performerId is missing');
      toast.error("Performer ID is missing");
      return;
    }
    if (!formData.title) {
      toast.error("Title is required");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      console.log('[AddContractModal] Starting upload...');
      setIsUploading(true);
      setUploadProgress(0);

      // Upload file using centralized helper
      console.log('[AddContractModal] Calling uploadAdminFile...');
      const uploadResult = await uploadAdminFile({
        file: selectedFile,
        contextType: 'contract',
        performerId: performerId,
        onProgress: (progress) => {
          console.log('[AddContractModal] Upload progress:', progress);
          setUploadProgress(progress);
        },
      });

      console.log('[AddContractModal] Upload completed. object_key:', uploadResult.object_key);

      // Create contract and wait for it to complete
      console.log('[AddContractModal] Creating contract...');
      await new Promise((resolve, reject) => {
        createContract.mutate({
          ...formData,
          document_url: uploadResult.object_key, // Store R2 key, not signed URL
        }, {
          onSuccess: () => {
            console.log('[AddContractModal] Contract created successfully');
            resolve();
          },
          onError: (error) => {
            console.error('[AddContractModal] Contract creation failed:', error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error("[AddContractModal] Contract upload error:", error);
      console.error("[AddContractModal] Error stack:", error.stack);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      console.log('[AddContractModal] Finally block - resetting upload state');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Contract</DialogTitle>
          <DialogDescription>
            Create a new contract for this performer. Title and file upload are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="contract_type">Contract Type</Label>
            <Select
              value={formData.contract_type}
              onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Model Release - June 2024"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

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
                {CONTRACT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signed_at">Signed Date</Label>
            <Input
              id="signed_at"
              type="datetime-local"
              value={formData.signed_at}
              onChange={(e) => setFormData({ ...formData, signed_at: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_at">Expiry Date</Label>
            <Input
              id="expires_at"
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
            />
          </div>

          {/* Document URL field removed - file upload handles storage */}

          <div className="space-y-2">
            <Label htmlFor="notes">Admin Notes</Label>
            <Textarea
              id="notes"
              placeholder="Internal notes about this contract..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="h-20"
            />
          </div>
        </div>

        <div className="space-y-4">
          {/* File Upload */}
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

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Label>Uploading...</Label>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createContract.isPending || isUploading || !selectedFile}>
            {isUploading ? "Uploading..." : createContract.isPending ? "Creating..." : "Create Contract"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}