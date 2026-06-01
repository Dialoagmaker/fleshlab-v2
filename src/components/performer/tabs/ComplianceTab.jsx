export default function ComplianceTab({ performer }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Compliance</h2>
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">KYC Status</p>
            <p className="text-sm text-foreground capitalize">{performer.kyc_status || "pending"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Account Status</p>
            <p className="text-sm text-foreground capitalize">{performer.account_status || "active"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Compliance Locked</p>
            <p className="text-sm text-foreground">{performer.compliance_locked ? "Yes" : "No"}</p>
          </div>
          {performer.compliance_lock_reason && (
            <div>
              <p className="text-xs text-muted-foreground">Lock Reason</p>
              <p className="text-sm text-foreground">{performer.compliance_lock_reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}