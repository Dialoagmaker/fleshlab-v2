import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function resolvePerformer(base44, body) {
  const { performer_id, performer_token } = body;
  if (performer_id && performer_token) {
    const sessions = await base44.asServiceRole.entities.PerformerSession.filter({
      performer_id, token: performer_token, revoked: false
    });
    if (!sessions || sessions.length === 0) return null;
    if (new Date(sessions[0].expires_at) < new Date()) return null;
    return base44.asServiceRole.entities.Performer.get(performer_id);
  }
  const user = await base44.auth.me();
  if (!user) return null;
  const performers = await base44.asServiceRole.entities.Performer.filter({ user_id: user.id });
  return performers?.[0] || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const performer = await resolvePerformer(base44, body);
    if (!performer) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { payout_method, payout_details } = body;

    if (!payout_method || !payout_details) {
      return Response.json({ error: 'Missing required fields: payout_method, payout_details' }, { status: 400 });
    }

    const validMethods = ['bank_transfer', 'paypal', 'gcash', 'paymaya', 'wise', 'other'];
    if (!validMethods.includes(payout_method)) {
      return Response.json({ error: 'Invalid payout_method' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.PerformerProfilePrivate.filter({ performer_id: performer.id });
    let profile;
    if (profiles && profiles.length > 0) {
      profile = profiles[0];
    } else {
      profile = await base44.asServiceRole.entities.PerformerProfilePrivate.create({ performer_id: performer.id });
    }

    await base44.asServiceRole.entities.PerformerProfilePrivate.update(profile.id, {
      payout_method,
      payout_details_encrypted: JSON.stringify(payout_details),
      payout_status: 'pending_verification',
      payout_verified: false,
      updated_at: new Date().toISOString()
    });

    // Create change request for admin review
    await base44.asServiceRole.entities.ProfileChangeRequest.create({
      performer_id: performer.id,
      requested_by_user_id: performer.user_id || null,
      change_type: 'payout_method',
      requested_fields: JSON.stringify({ payout_method, payout_details }),
      status: 'pending_review',
      performer_note: 'Payout method updated',
      created_date: new Date().toISOString()
    });

    return Response.json({ success: true, message: 'Payout method updated and submitted for verification' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});