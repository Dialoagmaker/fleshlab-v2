import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Performer-side: Update payout method
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

    const { payout_method, payout_details } = body;

    if (!payout_method || !payout_details) {
      return Response.json({ 
        error: 'Missing required fields: payout_method, payout_details' 
      }, { status: 400 });
    }

    // Validate payout_method
    const validMethods = ['bank_transfer', 'paypal', 'gcash', 'paymaya', 'wise', 'other'];
    if (!validMethods.includes(payout_method)) {
      return Response.json({ error: 'Invalid payout_method' }, { status: 400 });
    }

    // Get or create private profile
    const profiles = await base44.asServiceRole.entities.PerformerProfilePrivate.filter({
      performer_id: performer.id
    });

    let profile;
    if (profiles && profiles.length > 0) {
      profile = profiles[0];
    } else {
      // Create new profile
      profile = await base44.asServiceRole.entities.PerformerProfilePrivate.create({
        performer_id: performer.id
      });
    }

    // Encrypt payout details (in production, use proper encryption)
    const encryptedDetails = JSON.stringify(payout_details);

    // Update profile
    await base44.asServiceRole.entities.PerformerProfilePrivate.update(profile.id, {
      payout_method,
      payout_details_encrypted: encryptedDetails,
      payout_status: 'pending_verification',
      payout_verified: false,
      updated_at: new Date().toISOString()
    });

    // Create change request for admin review
    await base44.asServiceRole.entities.ProfileChangeRequest.create({
      performer_id: performer.id,
      requested_by_user_id: user.id,
      change_type: 'payout_method',
      requested_fields: JSON.stringify({ payout_method, payout_details }),
      status: 'pending_review',
      performer_note: 'Payout method updated',
      created_date: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Payout method updated and submitted for verification'
    });
  } catch (error) {
    console.error('updatePerformerPayoutMethod error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});