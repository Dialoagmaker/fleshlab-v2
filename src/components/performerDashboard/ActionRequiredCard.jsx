import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function ActionRequiredCard({ performer }) {
  const actions = [];

  // Check KYC
  if (performer.kyc_status === "pending") {
    actions.push({ type: "warning", message: "KYC verification pending - please submit required documents" });
  } else if (performer.kyc_status === "rejected") {
    actions.push({ type: "error", message: "KYC verification rejected - contact management" });
  } else if (performer.kyc_status === "expired") {
    actions.push({ type: "error", message: "KYC verification expired - please resubmit" });
  }

  // Check account status
  if (performer.account_status === "suspended") {
    actions.push({ type: "error", message: "Account suspended - contact management" });
  } else if (performer.account_status === "pending_verification") {
    actions.push({ type: "warning", message: "Account pending verification" });
  }

  // Check compliance lock
  if (performer.compliance_locked) {
    actions.push({ type: "error", message: "Account compliance locked - no changes allowed until unlocked" });
  }

  // Check outstanding balance
  if (performer.outstanding_balance_usd > 0) {
    actions.push({ type: "warning", message: `Outstanding balance: $${performer.outstanding_balance_usd.toFixed(2)}` });
  }

  if (actions.length === 0) {
    return (
      <Card className="border-green-800/50 bg-green-950/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            All Good
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No action required right now. Keep up the great work!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-800/50 bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
          <AlertCircle className="w-5 h-5" />
          Action Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, idx) => (
          <Alert key={idx} variant={action.type === "error" ? "destructive" : "default"} className="bg-transparent">
            <AlertDescription className="text-sm">
              {action.type === "error" ? <XCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {action.message}
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}