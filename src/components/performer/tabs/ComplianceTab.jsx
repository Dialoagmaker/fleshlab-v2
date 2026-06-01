import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Upload, Download, Calendar, CheckCircle2, Activity, Shield } from "lucide-react";

const CONTRACT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "signed", label: "Signed" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

const DOCUMENT_STATUSES = [
  { value: "valid", label: "Valid" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
];

export default function ComplianceTab({ performer }) {
  const queryClient = useQueryClient();
  const [contractType, setContractType] = useState("release");
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: contracts, refetch: refetchContracts } = useQuery({
    queryKey: ["contracts", performer.id],
    queryFn: () => base44.entities.Contract.filter({ performer_id: performer.id }, "-created_date"),
  });

  const { data: records, refetch: refetchRecords } = useQuery({
    queryKey: ["complianceRecords", performer.id],
    queryFn: () => base44.entities.ComplianceRecord.filter({ performer_id: performer.id }, "-created_date"),
  });

  const updateKycStatus = useMutation({
    mutationFn: async ({ status }) => {
      await base44.functions.invoke("performerAdminService", {
        action: "set_kyc_status",
        performer_id: performer.id,
        kyc_status: status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performer", performer.id] });
      toast.success("KYC updated");
    },
  });

  const runComplianceCheck = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("performerComplianceService", {
        action: "compliance_check",
        performer_id: performer.id,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.issues?.length === 0 ? "All gates passed" : `${data.issues.length} issue(s)`);
    },
  });

  const runLockEvaluation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("performerComplianceService", {
        action: "lock_evaluation",
        performer_id: performer.id,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performer", performer.id] });
      toast.success("Evaluation complete");
    },
  });

  const handleContractUpload = async () => {
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
      
      await base44.entities.Contract.create({
        performer_id: performer.id,
        contract_type: contractType,
        title: selectedFile.name.replace(/\.[^/.]+$/, ""),
        status: "draft",
        document_url: cdn_url,
      });

      toast.success("Contract uploaded");
      refetchContracts();
      setSelectedFile(null);
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
    }
  };

  const updateContractStatus = useMutation({
    mutationFn: async ({ contractId, status }) => {
      await base44.entities.Contract.update(contractId, { status });
    },
    onSuccess: () => {
      refetchContracts();
      toast.success("Status updated");
    },
  });

  const updateRecordStatus = useMutation({
    mutationFn: async ({ recordId, status }) => {
      await base44.entities.ComplianceRecord.update(recordId, { status });
    },
    onSuccess: () => {
      refetchRecords();
      toast.success("Record updated");
    },
  });

  const getStatusBadge = (status) => {
    const variants = {
      valid: "bg-green-500/10 text-green-500", signed: "bg-green-500/10 text-green-500", approved: "bg-green-500/10 text-green-500",
      pending: "bg-yellow-500/10 text-yellow-500", draft: "bg-yellow-500/10 text-yellow-500", sent: "bg-blue-500/10 text-blue-500",
      expired: "bg-red-500/10 text-red-500", revoked: "bg-red-500/10 text-red-500", cancelled: "bg-red-500/10 text-red-500",
      rejected: "bg-red-500/10 text-red-500", expiring_soon: "bg-orange-500/10 text-orange-500",
    };
    return variants[status] || "bg-gray-500/10 text-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader><CardTitle>Compliance Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div><p className="text-xs text-muted-foreground">KYC</p><Badge className={getStatusBadge(performer.kyc_status)}>{performer.kyc_status || "pending"}</Badge></div>
            <div><p className="text-xs text-muted-foreground">Account</p><Badge className={getStatusBadge(performer.account_status)}>{performer.account_status}</Badge></div>
            <div><p className="text-xs text-muted-foreground">Compliance</p><Badge variant={performer.compliance_locked ? "destructive" : "secondary"}>{performer.compliance_locked ? "Locked" : "Clear"}</Badge></div>
            <div><p className="text-xs text-muted-foreground">Contracts</p><p className="text-sm font-medium">{contracts?.length || 0}</p></div>
            <div><p className="text-xs text-muted-foreground">Records</p><p className="text-sm font-medium">{records?.length || 0}</p></div>
            <div><p className="text-xs text-muted-foreground">Balance</p><p className="text-sm font-medium">${performer.outstanding_balance_usd?.toFixed(2) || "0.00"}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* KYC */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />KYC Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={performer.kyc_status} onValueChange={(v) => updateKycStatus.mutate({ status: v })}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => runLockEvaluation.mutate()} disabled={runLockEvaluation.isPending}>
              {runLockEvaluation.isPending ? "Evaluating..." : "Run Compliance Check"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contracts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" />Contracts</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="release">Model Release</SelectItem>
                  <SelectItem value="performer">Performer Agreement</SelectItem>
                  <SelectItem value="licensing">Content License</SelectItem>
                  <SelectItem value="guest">Guest Agreement</SelectItem>
                </SelectContent>
              </Select>
              <input type="file" id="contract-upload" accept=".pdf,.jpg,.png,.doc,.docx" onChange={(e) => setSelectedFile(e.target.files?.[0])} className="hidden" />
              <Button variant="outline" size="sm" disabled={!selectedFile} onClick={handleContractUpload}>
                <Upload className="w-4 h-4 mr-2" />{selectedFile ? "Upload" : "Select File"}
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
                      {c.expires_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.expires_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={c.status} onValueChange={(v) => updateContractStatus.mutate({ contractId: c.id, status: v })}>
                      <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{CONTRACT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                    {c.document_url && <Button variant="ghost" size="icon" asChild><a href={c.document_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a></Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Records */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Medical / ID Records</CardTitle></CardHeader>
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
                      {r.expires_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Expires: {new Date(r.expires_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={r.status} onValueChange={(v) => updateRecordStatus.mutate({ recordId: r.id, status: v })}>
                      <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{DOCUMENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                    {r.document_url && <Button variant="ghost" size="icon" asChild><a href={r.document_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a></Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Controls */}
      <Card>
        <CardHeader><CardTitle>Account Controls</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-xs text-muted-foreground">Status</p><p className="text-sm font-medium capitalize">{performer.account_status}</p></div>
            <div><p className="text-xs text-muted-foreground">Compliance Locked</p><p className="text-sm font-medium">{performer.compliance_locked ? "Yes" : "No"}</p></div>
            <div><p className="text-xs text-muted-foreground">Balance</p><p className="text-sm font-medium">${performer.outstanding_balance_usd?.toFixed(2) || "0.00"}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Geo Placeholder */}
      <Card>
        <CardHeader><CardTitle>Geo Blocking</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Performer-level Geo Blocking will be managed here in a later phase.</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />Compliance Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => runComplianceCheck.mutate()} disabled={runComplianceCheck.isPending}>
              {runComplianceCheck.isPending ? "Checking..." : "Run Compliance Check"}
            </Button>
            <Button variant="outline" onClick={() => { refetchContracts(); refetchRecords(); toast.success("Refreshed"); }}>
              <Activity className="w-4 h-4 mr-2" />Refresh Documents
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}