import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-side: Approve payout request
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    
    const user = await base44.auth.me();
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { payout_request_id, performer_visible_message, admin_notes } = body;

    if (!payout_request_id) {
      return Response.json({ error: 'Missing payout_request_id' }, { status: 400 });
    }

    // Get payout request
    const request = await base44.asServiceRole.entities.PayoutRequest.get(payout_request_id);
    if (!request) {
      return Response.json({ error: 'Payout request not found' }, { status: 404 });
    }

    // Update status
    await base44.asServiceRole.entities.PayoutRequest.update(payout_request_id, {
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      performer_visible_message: performer_visible_message || request.performer_visible_message,
      admin_notes_private: admin_notes || request.admin_notes_private
    });

    // Create audit log
    await base44.asServiceRole.entities.AuditLog.create({
      entity_type: 'PayoutRequest',
      entity_id: payout_request_id,
      actor_id: user.id,
      actor_role: user.role,
      action: 'payout_request_approved',
      changes_json: JSON.stringify({
        status: { before: request.status, after: 'approved' },
        amount: request.amount,
        performer_id: request.performer_id
      }),
      notes: `Payout request approved: $${request.amount} ${request.currency.toUpperCase()}`
    });

    return Response.json({ 
      success: true,
      message: 'Payout request approved'
    });
  } catch (error) {
    console.error('approvePayoutRequest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});