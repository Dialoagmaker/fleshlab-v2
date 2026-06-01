import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ComplianceSummaryCard({ performer }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Compliance Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">KYC Status</p>
            <Badge variant={performer.kyc_status === "approved" ? "default" : "secondary"} className="mt-1">
              {performer.kyc_status}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Account Status</p>
            <Badge variant={performer.account_status === "active" ? "default" : "secondary"} className="mt-1">
              {performer.account_status}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Compliance Lock</p>
            <Badge variant={performer.compliance_locked ? "destructive" : "default"} className="mt-1">
              {performer.compliance_locked ? "Locked" : "Active"}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-sm font-medium mt-1">
              ${performer.outstanding_balance_usd?.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}