/**
 * adminUpdatePayoutCloseoutStatus — Admin-Only Status Management
 *
 * ALLOWED TRANSITIONS:
 *   draft     → approve
 *   draft     → hold
 *   approved  → hold
 *   approved  → mark_paid   (requires paid_reference or notes)
 *   on_hold   → release_hold  (returns to previous_status_before_hold or draft)
 *   any       → revert_to_draft  (only if not paid)
 *
 * NEVER: calls payment provider, modifies RevenueLineItems, auto-sends money
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VALID_ACTIONS = ['approve', 'hold', 'release_hold', 'mark_paid', 'revert_to_draft'];

const ALLOWED_TRANSITIONS = {
  draft:    ['approve', 'hold', 'revert_to_draft'],
  approved: ['hold', 'mark_paid', 'revert_to_draft'],
  on_hold:  ['release_hold', 'revert_to_draft'],
  held:     ['release_hold', 'revert_to_draft'], // legacy alias for on_hold
  pending:  ['approve', 'hold', 'revert_to_draft'], // legacy alias for draft
  estimated:['approve', 'hold', 'revert_to_draft'], // legacy alias for draft
  paid:     [], // locked — no financial changes
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { closeout_id, action, reason, paid_reference, notes } = body;

    if (!closeout_id) {
      return Response.json({ error: 'closeout_id is required', success: false }, { status: 400 });
    }
    if (!action || !VALID_ACTIONS.includes(action)) {
      return Response.json({
        error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`,
        success: false,
      }, { status: 400 });
    }

    // Fetch the existing record — list all and find by id (filter by id throws on bad id)
    const allEarnings = await base44.asServiceRole.entities.PerformerEarning.filter({});
    const earning = allEarnings.find(e => e.id === closeout_id);
    if (!earning) {
      return Response.json({ error: `Closeout not found: ${closeout_id}`, success: false }, { status: 404 });
    }
    const currentStatus = earning.status;

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(action)) {
      return Response.json({
        error: `Transition not allowed: ${currentStatus} → ${action}. Allowed from '${currentStatus}': [${allowed.join(', ') || 'none'}]`,
        success: false,
        current_status: currentStatus,
        allowed_actions: allowed,
      }, { status: 422 });
    }

    // Extra validation
    if (action === 'mark_paid' && !paid_reference && !notes) {
      return Response.json({
        error: 'mark_paid requires paid_reference or notes to be provided',
        success: false,
      }, { status: 400 });
    }

    // Parse existing metadata
    let meta = {};
    try { meta = JSON.parse(earning.notes || '{}'); } catch {}

    // Build status history entry
    const historyEntry = {
      from: currentStatus,
      to: null, // set below
      action,
      by: user.email,
      by_id: user.id,
      at: new Date().toISOString(),
      reason: reason || null,
    };

    // Determine new status and update metadata
    let newStatus;
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        meta.approved_by = user.email;
        meta.approved_by_id = user.id;
        meta.approved_date = new Date().toISOString();
        break;

      case 'hold':
        newStatus = 'on_hold';
        meta.previous_status_before_hold = currentStatus;
        meta.hold_reason = reason || null;
        meta.hold_date = new Date().toISOString();
        meta.held_by = user.email;
        meta.held_by_id = user.id;
        break;

      case 'release_hold': {
        // Return to previous status if recorded, else draft
        // Normalise legacy 'held' back to 'draft'
        const rawPrev = meta.previous_status_before_hold || 'draft';
        const prev = (rawPrev === 'held') ? 'draft' : rawPrev;
        newStatus = prev;
        meta.previous_status_before_hold = null;
        meta.hold_reason = null;
        meta.hold_date = null;
        meta.held_by = null;
        meta.released_by = user.email;
        meta.released_by_id = user.id;
        meta.released_date = new Date().toISOString();
        break;
      }

      case 'mark_paid':
        newStatus = 'paid';
        meta.paid_date = new Date().toISOString();
        meta.paid_reference = paid_reference || null;
        meta.paid_by = user.email;
        meta.paid_by_id = user.id;
        break;

      case 'revert_to_draft':
        newStatus = 'draft';
        meta.reverted_by = user.email;
        meta.reverted_by_id = user.id;
        meta.revert_date = new Date().toISOString();
        meta.revert_reason = reason || null;
        // Clear approval/payment fields on revert
        meta.approved_by = null;
        meta.approved_date = null;
        break;
    }

    historyEntry.to = newStatus;
    if (notes) meta.admin_notes = notes;
    if (!meta.status_history) meta.status_history = [];
    meta.status_history.push(historyEntry);

    // Write update — ONLY status and notes (no financial fields touched)
    await base44.asServiceRole.entities.PerformerEarning.update(earning.id, {
      status: newStatus,
      notes: JSON.stringify(meta),
    });

    console.log(`[adminUpdatePayoutCloseoutStatus] ${earning.id}: ${currentStatus} → ${newStatus} by ${user.email} (action: ${action})`);

    return Response.json({
      success: true,
      closeout_id: earning.id,
      previous_status: currentStatus,
      new_status: newStatus,
      action,
      updated_by: user.email,
      updated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[adminUpdatePayoutCloseoutStatus] Error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});