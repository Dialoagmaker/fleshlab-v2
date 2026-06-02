import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Performer-side: Get own payout requests
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get authenticated user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find performer linked to this user
    const performers = await base44.asServiceRole.entities.Performer.filter({
      user_id: user.id
    });

    if (!performers || performers.length === 0) {
      return Response.json({ error: 'No performer profile linked to your account' }, { status: 404 });
    }

    const performer = performers[0];

    // Get payout requests for this performer only
    let requests = await base44.asServiceRole.entities.PayoutRequest.filter({
      performer_id: performer.id
    });

    // Sort by requested_at descending
    requests = (requests || []).sort((a, b) => 
      new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
    );

    // Return only performer-visible fields
    const performerVisible = requests.map(r => ({
      id: r.id,
      amount: r.amount,
      currency: r.currency,
      payout_method: r.payout_method,
      payout_snapshot_masked: r.payout_snapshot_masked,
      status: r.status,
      performer_note: r.performer_note,
      performer_visible_message: r.performer_visible_message,
      requested_at: r.requested_at,
      reviewed_at: r.reviewed_at,
      paid_at: r.paid_at
    }));

    return Response.json({
      success: true,
      payout_requests: performerVisible
    });
  } catch (error) {
    console.error('getPerformerPayoutRequests error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});