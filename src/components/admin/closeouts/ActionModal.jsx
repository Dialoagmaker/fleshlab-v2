import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, AlertTriangle } from "lucide-react";

const REQUIRES_REASON  = ['hold', 'revert_to_draft'];
const REQUIRES_PAID_REF = ['mark_paid'];
const DESCRIPTIONS = {
  approve:        'Mark this closeout as approved. The performer share amount will be locked for payment processing.',
  hold:           'Place this closeout on hold. A reason is required.',
  release_hold:   'Release this closeout from hold. It will return to its previous status.',
  mark_paid:      'Mark this closeout as paid. This is irreversible — no further financial status changes can be made. A payment reference or note is required.',
  revert_to_draft:'Revert to draft status. Approval will be cleared. A reason is recommended.',
};

export default function ActionModal({ closeout, action, actionLabel, loading, onConfirm, onCancel }) {
  const [reason, setReason]           = useState('');
  const [paidReference, setPaidRef]   = useState('');
  const [notes, setNotes]             = useState('');

  const reasonRequired  = REQUIRES_REASON.includes(action);
  const paidRefRequired = REQUIRES_PAID_REF.includes(action);
  const canConfirm =
    (!reasonRequired || reason.trim())   &&
    (!paidRefRequired || paidReference.trim() || notes.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ reason: reason || undefined, paid_reference: paidReference || undefined, notes: notes || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold">{actionLabel}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {closeout.performer_name} — {closeout.month} — ${closeout.performer_share_total?.toFixed(2)}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5">{DESCRIPTIONS[action]}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {REQUIRES_REASON.includes(action) && (
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Reason <span className="text-red-500">*</span>
              </label>
              <Input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Enter reason…"
                required
              />
            </div>
          )}

          {REQUIRES_PAID_REF.includes(action) && (
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Payment Reference <span className="text-red-500">*</span>
              </label>
              <Input
                value={paidReference}
                onChange={e => setPaidRef(e.target.value)}
                placeholder="e.g. WISE-TXN-12345, GCASH-REF-xxx"
              />
              <p className="text-xs text-muted-foreground">Or provide a note below if no external reference.</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Notes {paidRefRequired && !paidReference.trim() ? <span className="text-red-500">*</span> : '(optional)'}</label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional admin note…"
            />
          </div>

          {action === 'mark_paid' && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 flex gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700 dark:text-orange-400">
                This marks the closeout as paid. No money is transferred by this action.
                Record the actual payment reference from your payment tool.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canConfirm || loading}>
              {loading ? 'Saving…' : `Confirm ${actionLabel}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}