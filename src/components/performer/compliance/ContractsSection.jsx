import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Calendar } from "lucide-react";
import { toast } from "sonner";

const CONTRACT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "signed", label: "Signed" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
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

export default function ContractsSection({ performer }) {
  const queryClient = useQueryClient();
  const [contractType, setContractType] = useState("release");
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: contracts, refetch: refetchContracts } = useQuery({
    queryKey: ["contracts", performer.id],
    queryFn: () => base44.entities.Contract.filter({ performer_id: performer.id }, "-created_date"),
  });

  const updateContractStatus = useMutation({
    mutationFn: async ({ contractId, status }) => {
      await base44.functions.invoke("contractService", {
        action: "update_contract_status",
        contract_id: contractId,
        performer_id: performer.id,
        status,
      });
    },
    onSuccess: () => {
      refetchContracts();
      toast.success("Status updated");
    },
  });

  const updateContractExpiry = useMutation({
    mutationFn: async ({ contractId, expiresAt }) => {
      await base44.functions.invoke("contractService", {
        action: "update_contract_expiry",
        contract_id: contractId,
        performer_id: performer.id,
        expires_at: expiresAt,
      });
    },
    onSuccess: () => {
      refetchContracts();
      queryClient.invalidateQueries({ queryKey: ["performer", performer.id] });
      toast.success("Expiry updated");
    },
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      const uploadRes = await base44.functions.invoke("createDocumentUploadUrl", {
        entity_type: "Contract",
        performer_id: performer.id,
        file_name: selectedFile.name,
        file_size_bytes: selectedFile.size,
        mime_type: selectedFile.type,
      });

      const { upload_url, cdn_url } = uploadRes.data;
      await fetch(upload_url, { method: "PUT", body: selectedFile, headers: { "Content-Type": selectedFile.type } });

      await base44.functions.invoke("contractService", {
        action: "create_contract",
        performer_id: performer.id,
        contract_type: contractType,
        title: selectedFile.name.replace(/\.[^/.]+$/, ""),
        document_url: cdn_url,
        status: "draft",
      });

      toast.success("Contract uploaded");
      refetchContracts();
      setSelectedFile(null);
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
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
            <input
              type="file"
              id="contract-upload"
              accept=".pdf,.jpg,.png,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0])}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedFile}
              onClick={handleUpload}
            >
              <Upload className="w-4 h-4 mr-2" />
              {selectedFile ? "Upload" : "Select File"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {contracts?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contracts</p>
        ) : (
          <div className="space-y-3">
            {contracts.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{c.title}</p>
                    <Badge className={getStatusBadge(c.status)}>{c.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="capitalize">{c.contract_type}</span>
                    {c.expires_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={c.status}
                    onValueChange={(v) => updateContractStatus.mutate({ contractId: c.id, status: v })}
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
                  {c.document_url && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={c.document_url} target="_blank" rel="noopener noreferrer">
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