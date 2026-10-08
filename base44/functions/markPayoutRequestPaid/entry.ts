import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-side: Mark payout request as paid
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

    if (request.status !== 'approved') {
      return Response.json({ 
        error: 'Only approved payout requests can be marked as paid' 
      }, { status: 400 });
    }

    // Update status
    await base44.asServiceRole.entities.PayoutRequest.update(payout_request_id, {
      status: 'paid',
      paid_at: new Date().toISOString(),
      paid_by: user.id,
      performer_visible_message: performer_visible_message || 'Your payout has been processed. Thank you!',
      admin_notes_private: admin_notes || request.admin_notes_private
    });

    // Create audit log
    await base44.asServiceRole.entities.AuditLog.create({
      entity_type: 'PayoutRequest',
      entity_id: payout_request_id,
      actor_id: user.id,
      actor_role: user.role,
      action: 'payout_request_paid',
      changes_json: JSON.stringify({
        status: { before: request.status, after: 'paid' },
        amount: request.amount,
        performer_id: request.performer_id,
        paid_at: new Date().toISOString()
      }),
      notes: `Payout request marked as paid: $${request.amount} ${request.currency.toUpperCase()}`
    });

    return Response.json({ 
      success: true,
      message: 'Payout request marked as paid'
    });
  } catch (error) {
    console.error('markPayoutRequestPaid error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});