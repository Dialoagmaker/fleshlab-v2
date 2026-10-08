import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Lock, DollarSign, User, ShieldCheck } from "lucide-react";

export default function PerformerHeader({ performer, onRefresh }) {
  const queryClient = useQueryClient();
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [freezeReason, setFreezeReason] = useState("");
  const [kycDialogOpen, setKycDialogOpen] = useState(false);

  // Freeze/Unfreeze mutation
  const freezeAccount = useMutation({
    mutationFn: async (reason) => {
      const action = performer.account_status === "suspended" ? "unfreeze_account" : "freeze_account";
      const res = await base44.functions.invoke("performerAdminService", {
        action,
        performer_id: performer.id,
        reason,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["performer", performer.id] });
      onRefresh?.();
      toast.success(data.message);
      setFreezeDialogOpen(false);
      setFreezeReason("");
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  // KYC Status mutation
  const setKycStatus = useMutation({
    mutationFn: async (kyc_status) => {
      const res = await base44.functions.invoke("performerAdminService", {
        action: "set_kyc_status",
        performer_id: performer.id,
        kyc_status,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["performer", performer.id] });
      onRefresh?.();
      toast.success(data.message);
      setKycDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  // Status badge helpers
  const isFrozen = performer.account_status === "suspended";
  const isComplianceLocked = performer.compliance_locked;

  const kycBadgeColors = {
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    expired: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  const statusBadgeColors = {
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    suspended: "bg-red-500/10 text-red-400 border-red-500/20",
    pending_verification: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    terminated: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      {/* Top row: Avatar + Name + Actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex-shrink-0">
            {performer.profile_image_url ? (
              <img src={performer.profile_image_url} alt={performer.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <User className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Name + Slug */}
          <div>
            <h1 className="text-xl font-bold text-foreground">{performer.display_name}</h1>
            <p className="text-sm font-mono text-muted-foreground">/{performer.slug}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={isFrozen ? "default" : "destructive"}
            size="sm"
            onClick={() => setFreezeDialogOpen(true)}
            className="gap-2"
          >
            {isFrozen ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isFrozen ? "Unfreeze" : "Freeze"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setKycDialogOpen(true)}
            className="gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Update KYC
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* KYC Status */}
        <Badge className={kycBadgeColors[performer.kyc_status] || kycBadgeColors.pending}>
          <ShieldCheck className="w-3 h-3 mr-1" />
          KYC: {performer.kyc_status || "pending"}
        </Badge>

        {/* Account Status */}
        <Badge className={statusBadgeColors[performer.account_status] || statusBadgeColors.active}>
          {performer.account_status === "suspended" ? "Frozen" : performer.account_status || "active"}
        </Badge>

        {/* Compliance Lock */}
        <Badge variant={isComplianceLocked ? "destructive" : "outline"} className={isComplianceLocked ? "bg-red-500/10 text-red-400 border-red-500/20" : ""}>
          {isComplianceLocked ? <Lock className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
          {isComplianceLocked ? "Compliance Locked" : "Compliance Clear"}
        </Badge>

        {/* Outstanding Balance */}
        {performer.outstanding_balance_usd > 0 && (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
            <DollarSign className="w-3 h-3 mr-1" />
            ${performer.outstanding_balance_usd.toFixed(2)} OWED
          </Badge>
        )}
      </div>

      {/* Freeze Reason / Compliance Lock Reason */}
      {(performer.freeze_reason || performer.compliance_lock_reason) && (
        <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
          {performer.freeze_reason && (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Freeze Reason</p>
                <p className="text-xs text-muted-foreground">{performer.freeze_reason}</p>
              </div>
            </div>
          )}
          {performer.compliance_lock_reason && (
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Compliance Lock Reason</p>
                <p className="text-xs text-muted-foreground">{performer.compliance_lock_reason}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Freeze Dialog */}
      <Dialog open={freezeDialogOpen} onOpenChange={setFreezeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isFrozen ? "Unfreeze Account" : "Freeze Account"}</DialogTitle>
            <DialogDescription>
              {isFrozen
                ? "This will reactivate the performer's account and restore their access."
                : "This will suspend the performer's account and prevent them from accessing the platform."}
              Provide a reason for this action.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="freeze_reason">Reason *</Label>
            <Textarea
              id="freeze_reason"
              value={freezeReason}
              onChange={(e) => setFreezeReason(e.target.value)}
              rows={4}
              placeholder={isFrozen ? "Enter reason for unfreezing..." : "Enter reason for freezing..."}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={isFrozen ? "default" : "destructive"}
              onClick={() => freezeAccount.mutate(freezeReason)}
              disabled={!freezeReason.trim() || freezeAccount.isPending}
            >
              {freezeAccount.isPending ? "Processing..." : isFrozen ? "Unfreeze Account" : "Freeze Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KYC Dialog */}
      <Dialog open={kycDialogOpen} onOpenChange={setKycDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update KYC Status</DialogTitle>
            <DialogDescription>
              Select the new KYC status for this performer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              onValueChange={(value) => setKycStatus.mutate(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select KYC status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}