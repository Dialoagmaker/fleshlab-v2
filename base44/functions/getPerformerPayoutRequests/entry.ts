import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { performer_id, performer_token } = body;

    let performer = null;

    // Auth path 1: Performer session token
    if (performer_id && performer_token) {
      const sessions = await base44.asServiceRole.entities.PerformerSession.filter({
        performer_id, token: performer_token, revoked: false
      });
      if (!sessions || sessions.length === 0) {
        return Response.json({ error: 'Invalid or expired performer session' }, { status: 401 });
      }
      if (new Date(sessions[0].expires_at) < new Date()) {
        return Response.json({ error: 'Performer session expired' }, { status: 401 });
      }
      performer = await base44.asServiceRole.entities.Performer.get(performer_id);
    } else {
      // Auth path 2: Base44 user auth
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const performers = await base44.asServiceRole.entities.Performer.filter({ user_id: user.id });
      if (!performers || performers.length === 0) {
        return Response.json({ error: 'No performer profile linked to your account' }, { status: 404 });
      }
      performer = performers[0];
    }

    if (!performer) return Response.json({ error: 'Performer not found' }, { status: 404 });

    let requests = await base44.asServiceRole.entities.PayoutRequest.filter({ performer_id: performer.id });

    requests = (requests || []).sort((a, b) =>
      new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
    );

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

    return Response.json({ success: true, requests: performerVisible });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});