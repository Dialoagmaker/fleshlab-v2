import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Lock, Unlock } from "lucide-react";

const getStatusBadge = (status) => {
  const variants = {
    active: "bg-green-500/10 text-green-500",
    suspended: "bg-yellow-500/10 text-yellow-500",
    pending_verification: "bg-blue-500/10 text-blue-500",
    terminated: "bg-red-500/10 text-red-500",
  };
  return variants[status] || "bg-gray-500/10 text-gray-500";
};

export default function AccountControlsSection({ performer }) {
  const queryClient = useQueryClient();

  const manualUnlock = useMutation({
    mutationFn: async ({ reason }) => {
      await base44.functions.invoke("performerComplianceService", {
        action: "manual_unlock",
        performer_id: performer.id,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performer", performer.id] });
      toast.success("Performer manually unlocked");
    },
    onError: (error) => {
      toast.error(`Failed to unlock: ${error.message}`);
    },
  });

  const manualLock = useMutation({
    mutationFn: async ({ reason }) => {
      await base44.functions.invoke("performerComplianceService", {
        action: "manual_lock",
        performer_id: performer.id,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performer", performer.id] });
      toast.success("Performer manually locked");
    },
    onError: (error) => {
      toast.error(`Failed to lock: ${error.message}`);
    },
  });

  if (!performer || !performer.id) {
    return <div className="text-sm text-muted-foreground p-4">Performer data not available</div>;
  }

  const handleUnlock = () => {
    const reason = window.prompt("Reason for manual unlock (required):");
    if (reason) {
      manualUnlock.mutate({ reason });
    }
  };

  const handleLock = () => {
    const reason = window.prompt("Reason for manual lock (required):");
    if (reason) {
      manualLock.mutate({ reason });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium capitalize">{performer.account_status || "active"}</p>
              <Badge className={getStatusBadge(performer.account_status || "active")}>{performer.account_status || "active"}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Compliance Locked</p>
              <p className="text-sm font-medium">{performer.compliance_locked ? "Yes" : "No"}</p>
              {performer.compliance_override && (
                <p className="text-xs text-muted-foreground mt-1">
                  Override: {performer.compliance_override_reason || "Admin override"}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-sm font-medium">${performer.outstanding_balance_usd?.toFixed(2) || "0.00"}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            {performer.compliance_locked ? (
              <Button
                variant="outline"
                onClick={handleUnlock}
                disabled={manualUnlock.isPending}
              >
                <Unlock className="w-4 h-4 mr-2" />
                {manualUnlock.isPending ? "Unlocking..." : "Manually Unlock"}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleLock}
                disabled={manualLock.isPending}
              >
                <Lock className="w-4 h-4 mr-2" />
                {manualLock.isPending ? "Locking..." : "Manually Lock"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}