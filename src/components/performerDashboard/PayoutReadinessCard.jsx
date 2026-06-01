import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PayoutReadinessCard({ performer }) {
  let status = "Eligible";
  let statusVariant = "default";
  let reason = null;

  if (performer.account_status === "suspended" || performer.account_status === "terminated") {
    status = "Account Frozen";
    statusVariant = "destructive";
    reason = "Account suspended or terminated";
  } else if (performer.kyc_status !== "approved") {
    status = "Missing KYC";
    statusVariant = "destructive";
    reason = "KYC verification required";
  } else if (performer.compliance_locked) {
    status = "Compliance Locked";
    statusVariant = "destructive";
    reason = "Compliance review in progress";
  } else if (performer.outstanding_balance_usd > 0) {
    status = "Outstanding Balance";
    statusVariant = "secondary";
    reason = `Balance: $${performer.outstanding_balance_usd.toFixed(2)}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payout Readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={statusVariant}>{status}</Badge>
        </div>
        {reason && (
          <p className="text-xs text-muted-foreground">{reason}</p>
        )}
        <p className="text-xs text-muted-foreground pt-2 border-t">
          Payout readiness is based on compliance, account status and open balances. 
          Final approval is handled by management.
        </p>
      </CardContent>
    </Card>
  );
}