import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";
import { toast } from "sonner";

export default function KycSection({ performer }) {
  const queryClient = useQueryClient();

  // Hooks must be called unconditionally
  const updateKycStatus = useMutation({
    mutationFn: async ({ status }) => {
      if (!performer?.id) return;
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

  const runLockEvaluation = useMutation({
    mutationFn: async () => {
      if (!performer?.id) return;
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

  // Early return after hooks
  if (!performer || !performer.id) {
    return <div className="text-sm text-muted-foreground p-4">Performer data not available</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          KYC Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Select value={performer.kyc_status || "not_started"} onValueChange={(v) => updateKycStatus.mutate({ status: v })}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => runLockEvaluation.mutate()} disabled={runLockEvaluation.isPending}>
            {runLockEvaluation.isPending ? "Evaluating..." : "Run Compliance Check"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}