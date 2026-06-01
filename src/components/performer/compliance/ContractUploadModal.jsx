import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const CONTRACT_TYPES = [
  { value: "release", label: "Model Release" },
  { value: "performer", label: "Performer Agreement" },
  { value: "licensing", label: "Content License" },
  { value: "guest", label: "Guest Agreement" },
];

export default function ContractUploadModal({ isOpen, onClose, performerId, onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [contractType, setContractType] = useState("release");

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }) => {
      const uploadRes = await base44.functions.invoke("createDocumentUploadUrl", {
        entity_type: "Contract",
        performer_id: performerId,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
      });

      const { upload_url, cdn_url } = uploadRes.data;
      await fetch(upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });

      await base44.functions.invoke("contractService", {
        action: "create_contract",
        performer_id: performerId,
        contract_type: type,
        title: file.name.replace(/\.[^/.]+$/, ""),
        document_url: cdn_url,
      });
    },
    onSuccess: () => {
      toast.success("Contract uploaded");
      onUploadComplete();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate({ file: selectedFile, type: contractType });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-semibold">Upload Contract</h3>

        <div className="space-y-2">
          <Label>Contract Type</Label>
          <Select value={contractType} onValueChange={setContractType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTRACT_TYPES.map((t) => (
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