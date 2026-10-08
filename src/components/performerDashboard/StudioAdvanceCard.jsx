import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function StudioAdvanceCard({ performer }) {
  // Simple eligibility logic for Phase 4A
  const isEligible = 
    performer.account_status === "active" &&
    performer.kyc_status === "approved" &&
    !performer.compliance_locked &&
    performer.outstanding_balance_usd === 0;

  const eligibilityReason = !isEligible ? (
    performer.account_status !== "active" ? "Account not active" :
    performer.kyc_status !== "approved" ? "KYC not approved" :
    performer.compliance_locked ? "Compliance locked" :
    performer.outstanding_balance_usd > 0 ? "Outstanding balance exists" :
    "Not eligible"
  ) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Studio Advance / Support Credit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Maximum Advance</span>
          <span className="text-lg font-semibold">Up to $500</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Eligibility</span>
          <Badge variant={isEligible ? "default" : "secondary"}>
            {isEligible ? "Eligible" : "Not Eligible"}
          </Badge>
        </div>

        {eligibilityReason && (
          <p className="text-xs text-muted-foreground">{eligibilityReason}</p>
        )}

        <Button disabled className="w-full" size="sm">
          Request Studio Advance
          <span className="text-xs text-muted-foreground ml-2">Coming Soon</span>
        </Button>

        <p className="text-xs text-muted-foreground pt-2 border-t">
          Studio advances are subject to management approval and depend on performance, 
          earnings history, reliability, compliance status and open studio balances.
        </p>
      </CardContent>
    </Card>
  );
}