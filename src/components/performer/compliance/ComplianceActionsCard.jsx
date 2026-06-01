import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Activity } from "lucide-react";
import { toast } from "sonner";

export default function ComplianceActionsCard({ performer, onRefresh }) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Compliance Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => runComplianceCheck.mutate()}
            disabled={runComplianceCheck.isPending}
          >
            {runComplianceCheck.isPending ? "Checking..." : "Run Compliance Check"}
          </Button>
          <Button variant="outline" onClick={onRefresh}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh Documents
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}