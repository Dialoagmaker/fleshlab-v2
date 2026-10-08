import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-side: Reject performer profile change request
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    
    const user = await base44.auth.me();
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { change_request_id, admin_notes, performer_visible_message } = body;

    if (!change_request_id) {
      return Response.json({ error: 'Missing change_request_id' }, { status: 400 });
    }

    // Get change request
    const changeRequest = await base44.asServiceRole.entities.ProfileChangeRequest.get(change_request_id);
    if (!changeRequest) {
      return Response.json({ error: 'Change request not found' }, { status: 404 });
    }

    // Update change request status
    await base44.asServiceRole.entities.ProfileChangeRequest.update(change_request_id, {
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      admin_notes_private: admin_notes || changeRequest.admin_notes_private,
      performer_visible_message: performer_visible_message || 'Your profile change was rejected. Please contact studio management.'
    });

    return Response.json({ 
      success: true,
      message: 'Profile change rejected'
    });
  } catch (error) {
    console.error('rejectPerformerProfileChange error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});