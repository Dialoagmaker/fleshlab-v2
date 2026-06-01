import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Calendar, Plus, Eye, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import AddContractModal from "./AddContractModal";
import AdminFileViewModal from "@/components/admin/AdminFileViewModal";

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

export default function ContractsSection({ performer, contracts, onRefresh }) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingContract, setViewingContract] = useState(null);
  const [verifyingContract, setVerifyingContract] = useState(null);

  // Safe array default - prevent .map() on undefined
  const safeContracts = Array.isArray(contracts) ? contracts : [];

  const updateContractStatus = useMutation({
    mutationFn: async ({ contractId, status }) => {
      if (!performer?.id) return;
      await base44.functions.invoke("contractService", {
        action: "update_contract_status",
        contract_id: contractId,
        performer_id: performer.id,
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", performer.id] });
      onRefresh?.();
      toast.success("Status updated");
    },
  });

  const verifyContract = useMutation({
    mutationFn: async ({ contractId }) => {
      if (!performer?.id) return;
      await base44.functions.invoke("contractService", {
        action: "verify_contract",
        contract_id: contractId,
        performer_id: performer.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", performer.id] });
      onRefresh?.();
      setVerifyingContract(null);
      toast.success("Contract verified");
    },
    onError: (error) => {
      toast.error(`Failed to verify: ${error.message}`);
    },
  });

  // Early return after hooks
  if (!performer || !performer.id) {
    return <div className="text-sm text-muted-foreground p-4">Performer data not available</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Contracts
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contract
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {safeContracts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No contracts yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Add Contract" to create one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {safeContracts.map((c) => (
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
                    {c.status === 'signed' && !c.verified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Verify contract "${c.title}"?\n\nThis confirms the contract has been reviewed and is valid.`)) {
                            verifyContract.mutate({ contractId: c.id });
                          }
                        }}
                        disabled={verifyContract.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {verifyContract.isPending ? "Verifying..." : "Verify"}
                      </Button>
                    )}
                    {c.verified && (
                      <Badge className="bg-green-500/10 text-green-500 border border-green-500/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {c.document_url && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setViewingContract(c);
                            setShowViewModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            try {
                              const result = await base44.functions.invoke('getAdminFileViewUrl', {
                                object_key: c.document_url,
                              });
                              if (result?.signed_url) {
                                window.open(result.signed_url, '_blank');
                              }
                            } catch (error) {
                              toast.error(`Failed to download: ${error.message}`);
                            }
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showAddModal && (
        <AddContractModal
          performerId={performer.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["contracts", performer.id] });
            onRefresh?.();
          }}
        />
      )}

      {showViewModal && viewingContract && (
        <AdminFileViewModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          recordId={viewingContract.id}
          recordType="contract"
          objectKey={viewingContract.document_url}
        />
      )}
    </>
  );
}