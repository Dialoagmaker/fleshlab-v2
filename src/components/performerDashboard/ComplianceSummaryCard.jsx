import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ComplianceSummaryCard({ performer, contracts, records }) {
  // Use Performer.kyc_status as source of truth - NOT ComplianceRecord verification_status
  const kycStatus = performer.kyc_status || "pending";
  const accountStatus = performer.account_status || "unknown";
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Compliance Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">KYC Status</p>
            <Badge 
              variant={kycStatus === "approved" ? "default" : kycStatus === "rejected" ? "destructive" : "secondary"} 
              className="mt-1"
            >
              {kycStatus}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Account Status</p>
            <Badge variant={accountStatus === "active" ? "default" : "secondary"} className="mt-1">
              {accountStatus}
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
        
        {/* Additional info if contracts/records provided */}
        {(contracts || records) && (
          <div className="pt-3 border-t grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Contracts</p>
              <p className="text-sm font-medium mt-1">{contracts?.length || 0} on file</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Documents</p>
              <p className="text-sm font-medium mt-1">{records?.length || 0} on file</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}