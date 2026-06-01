import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  if (!performer || !performer.id) {
    return <div className="text-sm text-muted-foreground p-4">Performer data not available</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm font-medium capitalize">{performer.account_status || "active"}</p>
            <Badge className={getStatusBadge(performer.account_status || "active")}>{performer.account_status || "active"}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Compliance Locked</p>
            <p className="text-sm font-medium">{performer.compliance_locked ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-sm font-medium">${performer.outstanding_balance_usd?.toFixed(2) || "0.00"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}