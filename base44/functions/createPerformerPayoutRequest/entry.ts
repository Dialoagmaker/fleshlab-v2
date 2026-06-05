import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Performer-side: Create payout request
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    
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

    const MINIMUM_PAYOUT_USD = 100;

    const { currency = 'usd', payout_method, performer_note, confirm_details } = body;
    const amount = parseFloat(body.amount);

    if (!body.amount || isNaN(amount) || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (amount < MINIMUM_PAYOUT_USD) {
      return Response.json({ error: 'Minimum payout amount is $100 USD.' }, { status: 400 });
    }

    if (!currency || currency.toLowerCase() !== 'usd') {
      return Response.json({ error: 'Only USD payouts are supported at this time.' }, { status: 400 });
    }

    if (!payout_method) {
      return Response.json({ error: 'Missing required field: payout_method' }, { status: 400 });
    }

    if (!confirm_details) {
      return Response.json({ 
        error: 'You must confirm that your payout details are correct' 
      }, { status: 400 });
    }

    // Get performer's payout profile
    const profiles = await base44.asServiceRole.entities.PerformerProfilePrivate.filter({
      performer_id: performer.id
    });

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    if (!profile || !profile.payout_method) {
      return Response.json({ 
        error: 'Please set up your payout method first' 
      }, { status: 400 });
    }

    // Create masked snapshot of payout details
    let payoutSnapshot = '';
    if (profile.payout_details_encrypted) {
      try {
        const details = JSON.parse(profile.payout_details_encrypted);
        payoutSnapshot = createMaskedSnapshot(payout_method, details);
      } catch (e) {
        payoutSnapshot = 'Details on file';
      }
    }

    // Create payout request
    const payoutRequest = await base44.asServiceRole.entities.PayoutRequest.create({
      performer_id: performer.id,
      requested_by_user_id: user.id,
      amount,
      currency,
      payout_method,
      payout_snapshot_masked: payoutSnapshot,
      status: 'pending_review',
      performer_note: performer_note || '',
      requested_at: new Date().toISOString()
    });

    // Create audit log
    await base44.asServiceRole.entities.AuditLog.create({
      entity_type: 'PayoutRequest',
      entity_id: payoutRequest.id,
      actor_id: user.id,
      actor_role: 'performer',
      action: 'payout_request_created',
      changes_json: JSON.stringify({
        amount,
        currency,
        payout_method,
        performer_id: performer.id
      }),
      notes: `Performer submitted payout request: $${amount} ${currency.toUpperCase()}`
    });

    return Response.json({
      success: true,
      payout_request_id: payoutRequest.id,
      message: 'Payout request submitted for review'
    });
  } catch (error) {
    console.error('createPerformerPayoutRequest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function createMaskedSnapshot(method, details) {
  switch (method) {
    case 'paypal':
      return `PayPal: ${details.paypal_email ? maskEmail(details.paypal_email) : 'on file'}`;
    case 'gcash':
      return `GCash: ${details.mobile_number ? maskPhone(details.mobile_number) : 'on file'}`;
    case 'paymaya':
      return `PayMaya: ${details.mobile_number ? maskPhone(details.mobile_number) : 'on file'}`;
    case 'bank_transfer':
      return `Bank: ${details.bank_name || 'on file'} ****${(details.account_number || '').slice(-4) || '****'}`;
    case 'wise':
      return `Wise: ${details.email ? maskEmail(details.email) : 'on file'}`;
    default:
      return 'Custom method on file';
  }
}

function maskEmail(email) {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (username.length <= 2) return `**@${domain}`;
  return `${username.substring(0, 2)}***@${domain}`;
}

function maskPhone(phone) {
  if (!phone) return '';
  if (phone.length <= 4) return '****';
  return `****${phone.substring(phone.length - 4)}`;
}