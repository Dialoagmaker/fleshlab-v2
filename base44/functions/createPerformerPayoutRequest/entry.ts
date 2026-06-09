import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MINIMUM_PAYOUT_USD = 50;

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

    const { currency = 'usd', performer_note, confirm_details } = body;
    const amount = parseFloat(body.amount);

    if (!body.amount || isNaN(amount) || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (amount < MINIMUM_PAYOUT_USD) {
      return Response.json({ error: `Minimum payout amount is $${MINIMUM_PAYOUT_USD} USD.` }, { status: 400 });
    }
    if (!currency || currency.toLowerCase() !== 'usd') {
      return Response.json({ error: 'Only USD payouts are supported at this time.' }, { status: 400 });
    }
    if (!confirm_details) {
      return Response.json({ error: 'You must confirm that your payout details are correct' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.PerformerProfilePrivate.filter({ performer_id: performer.id });
    const profile = profiles?.[0] || null;

    if (!profile || !profile.payout_method) {
      return Response.json({ error: 'Please set up your payout method first' }, { status: 400 });
    }

    let payoutSnapshot = '';
    if (profile.payout_details_encrypted) {
      try {
        const details = JSON.parse(profile.payout_details_encrypted);
        payoutSnapshot = createMaskedSnapshot(profile.payout_method, details);
      } catch (e) {
        payoutSnapshot = 'Details on file';
      }
    }

    const payoutRequest = await base44.asServiceRole.entities.PayoutRequest.create({
      performer_id: performer.id,
      requested_by_user_id: performer.user_id || null,
      amount,
      currency,
      payout_method: profile.payout_method,
      payout_snapshot_masked: payoutSnapshot,
      status: 'pending_review',
      performer_note: performer_note || '',
      requested_at: new Date().toISOString()
    });

    await base44.asServiceRole.entities.AuditLog.create({
      entity_type: 'PayoutRequest',
      entity_id: payoutRequest.id,
      actor_id: performer.id,
      actor_role: 'performer',
      action: 'payout_request_created',
      changes_json: JSON.stringify({ amount, currency, payout_method: profile.payout_method, performer_id: performer.id }),
      notes: `Performer submitted payout request: $${amount} ${currency.toUpperCase()}`
    });

    return Response.json({ success: true, payout_request_id: payoutRequest.id, message: 'Payout request submitted for review' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function createMaskedSnapshot(method, details) {
  switch (method) {
    case 'paypal': return `PayPal: ${details.paypal_email ? maskEmail(details.paypal_email) : 'on file'}`;
    case 'gcash': return `GCash: ${details.mobile_number ? maskPhone(details.mobile_number) : 'on file'}`;
    case 'paymaya': return `PayMaya: ${details.mobile_number ? maskPhone(details.mobile_number) : 'on file'}`;
    case 'bank_transfer': return `Bank: ${details.bank_name || 'on file'} ****${(details.account_number || '').slice(-4) || '****'}`;
    case 'wise': return `Wise: ${details.email ? maskEmail(details.email) : 'on file'}`;
    default: return 'Custom method on file';
  }
}
function maskEmail(email) {
  const [username, domain] = email.split('@');
  if (username.length <= 2) return `**@${domain}`;
  return `${username.substring(0, 2)}***@${domain}`;
}
function maskPhone(phone) {
  if (phone.length <= 4) return '****';
  return `****${phone.substring(phone.length - 4)}`;
}