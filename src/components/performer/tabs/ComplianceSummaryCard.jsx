import { Badge } from "@/components/ui/badge";

export function ComplianceSummaryCard({ performer }) {
  const getStatusBadge = (status) => {
    const variants = {
      valid: "bg-green-500/10 text-green-500",
      signed: "bg-green-500/10 text-green-500",
      approved: "bg-green-500/10 text-green-500",
      pending: "bg-yellow-500/10 text-yellow-500",
      draft: "bg-yellow-500/10 text-yellow-500",
      sent: "bg-blue-500/10 text-blue-500",
      expired: "bg-red-500/10 text-red-500",
      revoked: "bg-red-500/10 text-red-500",
      cancelled: "bg-red-500/10 text-red-500",
      rejected: "bg-red-500/10 text-red-500",
      expiring_soon: "bg-orange-500/10 text-orange-500",
      active: "bg-green-500/10 text-green-500",
      suspended: "bg-red-500/10 text-red-500",
      pending_verification: "bg-yellow-500/10 text-yellow-500",
      terminated: "bg-red-500/10 text-red-500",
    };
    return variants[status] || "bg-gray-500/10 text-gray-500";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">KYC</p>
        <Badge className={getStatusBadge(performer.kyc_status)}>
          {performer.kyc_status || "pending"}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Account</p>
        <Badge className={getStatusBadge(performer.account_status)}>
          {performer.account_status || "active"}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Compliance</p>
        <Badge variant={performer.compliance_locked ? "destructive" : "secondary"}>
          {performer.compliance_locked ? "Locked" : "Clear"}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Balance</p>
        <p className="text-sm font-medium">${performer.outstanding_balance_usd?.toFixed(2) || "0.00"}</p>
      </div>
    </div>
  );
}