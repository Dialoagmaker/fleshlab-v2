import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const CONTRACT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "signed", label: "Signed" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ContractsSection({ performerId }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [contractType, setContractType] = useState("release");

  const { data: contracts, isLoading, refetch } = useQuery({
    queryKey: ["contracts", performerId],
    queryFn: () => base44.entities.Contract.filter({ performer_id: performerId }, "-created_date"),
    enabled: !!performerId,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, contractType, title }) => {
      const uploadRes = await base44.functions.invoke("createDocumentUploadUrl", {
        entity_type: "Contract",
        performer_id: performerId,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
      });

      const { upload_url, cdn_url } = uploadRes.data;

      const putRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!putRes.ok) throw new Error("Upload failed");

      await base44.functions.invoke("contractService", {
        action: "create_contract",
        performer_id: performerId,
        contract_type: contractType,
        title: title || file.name,
        document_url: cdn_url,
      });

      return { success: true };
    },
    onSuccess: () => {
      refetch();
      toast.success("Contract uploaded");
      setSelectedFile(null);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ contractId, status }) => {
      await base44.functions.invoke("contractService", {
        action: "update_contract_status",
        contract_id: contractId,
        status,
      });
    },
    onSuccess: () => {
      refetch();
      toast.success("Status updated");
    },
  });

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate({
      file: selectedFile,
      contractType,
      title: selectedFile.name.replace(/\.[^/.]+$/, ""),
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      signed: "bg-green-500/10 text-green-500",
      draft: "bg-yellow-500/10 text-yellow-500",
      sent: "bg-blue-500/10 text-blue-500",
      expired: "bg-red-500/10 text-red-500",
      cancelled: "bg-red-500/10 text-red-500",
    };
    return variants[status] || "bg-gray-500/10 text-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contracts
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="release">Model Release</SelectItem>
                <SelectItem value="performer">Performer Agreement</SelectItem>
                <SelectItem value="licensing">Content License</SelectItem>
                <SelectItem value="guest">Guest Agreement</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <input
                type="file"
                id="contract-upload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0])}
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
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : contracts?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contracts uploaded</p>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{contract.title}</p>
                    <Badge className={getStatusBadge(contract.status)}>{contract.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="capitalize">{contract.contract_type}</span>
                    {contract.expires_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(contract.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={contract.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ 
                      contractId: contract.id, 
                      status: value 
                    })}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {contract.document_url && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={contract.document_url} target="_blank" rel="noopener noreferrer">
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