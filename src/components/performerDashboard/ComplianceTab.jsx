import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Download, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ComplianceTab({ performerId }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["performer-compliance", performerId],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_compliance",
        performer_id: performerId
      });
      return res.data;
    },
    enabled: !!performerId
  });

  // Mutation for generating signed URLs
  const downloadMutation = useMutation({
    mutationFn: async ({ documentType, documentId, filename }) => {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "create_document_signed_url",
        document_type: documentType,
        document_id: documentId
      });
      return { ...res.data, filename };
    },
    onSuccess: (data) => {
      if (data.signed_url) {
        // Open in new tab/window
        window.open(data.signed_url, '_blank');
        toast.success(`Download started: ${data.filename}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate download link');
    }
  });

  const handleDownload = (documentType, documentId, filename) => {
    downloadMutation.mutate({ documentType, documentId, filename });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const expiryDays = (expiresAt) => {
    if (!expiresAt) return null;
    const days = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      {/* KYC Status */}
      <Card>
        <CardHeader><CardTitle>KYC Status</CardTitle></CardHeader>
        <CardContent>
          <Badge variant={data?.kyc_status === "approved" ? "default" : "secondary"} className="text-sm">
            {data?.kyc_status}
          </Badge>
          {data?.kyc_status !== "approved" && (
            <p className="text-sm text-muted-foreground mt-2">
              KYC verification is required before payouts can be processed.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Contracts */}
      <Card>
        <CardHeader><CardTitle>Contracts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!data?.contracts || data.contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contracts on file.</p>
          ) : (
            data.contracts.map(contract => {
              const daysUntilExpiry = expiryDays(contract.expires_at);
              const canDownload = contract.status === "signed";
              
              return (
                <div key={contract.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium capitalize">{contract.contract_type?.replace(/_/g, " ")}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={contract.status === "signed" ? "default" : "secondary"}>{contract.status}</Badge>
                      {canDownload && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(
                            "contract",
                            contract.id,
                            `${contract.contract_type}_contract`
                          )}
                          disabled={downloadMutation.isPending}
                          className="h-7 px-2"
                        >
                          {downloadMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  {contract.signed_at && (
                    <p className="text-xs text-muted-foreground">Signed: {new Date(contract.signed_at).toLocaleDateString()}</p>
                  )}
                  {contract.expires_at && (
                    <p className={`text-xs ${daysUntilExpiry < 30 ? "text-yellow-500" : "text-muted-foreground"}`}>
                      {daysUntilExpiry < 0 
                        ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                        : `Expires in ${daysUntilExpiry} days`
                      }
                    </p>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Compliance Records */}
      <Card>
        <CardHeader><CardTitle>Compliance Records</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!data?.compliance_records || data.compliance_records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No compliance records on file.</p>
          ) : (
            data.compliance_records.map(record => {
              const daysUntilExpiry = expiryDays(record.expires_at);
              const canDownload = record.status === "valid";
              
              return (
                <div key={record.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium capitalize">{record.document_type.replace(/_/g, " ")}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={record.status === "valid" ? "default" : "secondary"}>{record.status}</Badge>
                      {canDownload && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(
                            "compliance_record",
                            record.id,
                            `${record.document_type}_record`
                          )}
                          disabled={downloadMutation.isPending}
                          className="h-7 px-2"
                        >
                          {downloadMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  {record.issued_at && (
                    <p className="text-xs text-muted-foreground">Issued: {new Date(record.issued_at).toLocaleDateString()}</p>
                  )}
                  {record.expires_at && (
                    <p className={`text-xs ${daysUntilExpiry < 30 ? "text-yellow-500" : "text-muted-foreground"}`}>
                      {daysUntilExpiry < 0 
                        ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                        : `Expires in ${daysUntilExpiry} days`
                      }
                    </p>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}