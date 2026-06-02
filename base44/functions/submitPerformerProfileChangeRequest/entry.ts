import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Performer-side: Submit profile change request (for sensitive fields)
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

    const { change_type, requested_fields, performer_note } = body;

    if (!change_type || !requested_fields) {
      return Response.json({ 
        error: 'Missing required fields: change_type, requested_fields' 
      }, { status: 400 });
    }

    // Validate change_type
    const validTypes = ['contact_info', 'legal_name', 'address', 'payout_method', 'other'];
    if (!validTypes.includes(change_type)) {
      return Response.json({ error: 'Invalid change_type' }, { status: 400 });
    }

    // Create change request
    const changeRequest = await base44.asServiceRole.entities.ProfileChangeRequest.create({
      performer_id: performer.id,
      requested_by_user_id: user.id,
      change_type,
      requested_fields: JSON.stringify(requested_fields),
      status: 'pending_review',
      performer_note: performer_note || '',
      created_date: new Date().toISOString()
    });

    return Response.json({
      success: true,
      change_request_id: changeRequest.id,
      message: 'Profile change request submitted for review'
    });
  } catch (error) {
    console.error('submitPerformerProfileChangeRequest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});