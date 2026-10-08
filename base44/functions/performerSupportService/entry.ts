import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // A. create_request - Allowed for authenticated linked performer only
    if (action === 'create_request') {
      const { subject, category, message } = body;

      // Validation
      if (!subject || subject.length < 3 || subject.length > 120) {
        return Response.json({ 
          error: 'Subject is required and must be between 3 and 120 characters' 
        }, { status: 400 });
      }

      if (!message || message.length < 10 || message.length > 4000) {
        return Response.json({ 
          error: 'Message is required and must be between 10 and 4000 characters' 
        }, { status: 400 });
      }

      const validCategories = [
        'general', 'profile', 'videos', 'compliance', 'earnings_question',
        'fanclub', 'technical_issue', 'safety_privacy', 'other'
      ];
      if (!category || !validCategories.includes(category)) {
        return Response.json({ 
          error: 'Invalid category' 
        }, { status: 400 });
      }

      // Find linked Performer via Performer.user_id
      const performers = await base44.asServiceRole.entities.Performer.filter({
        user_id: user.id
      });

      if (!performers || performers.length === 0) {
        return Response.json({ 
          error: 'No linked performer profile found. Please contact management.' 
        }, { status: 403 });
      }

      const linkedPerformer = performers[0];

      // Auto-set priority for safety/privacy categories
      let priority = 'normal';
      if (category === 'safety_privacy') {
        priority = 'high';
      }

      // Create PerformerSupportRequest
      const newRequest = await base44.asServiceRole.entities.PerformerSupportRequest.create({
        performer_id: linkedPerformer.id,
        user_id: user.id,
        subject,
        category,
        message,
        status: 'open',
        priority,
        admin_note: '',
        performer_visible_response: ''
      });

      // Create AuditLog entry
      try {
        await base44.asServiceRole.entities.AuditLog.create({
          entity_type: 'PerformerSupportRequest',
          entity_id: newRequest.id,
          actor_id: user.id,
          actor_role: user.role || 'user',
          action: 'performer_support_request_created',
          changes_json: JSON.stringify({
            subject,
            category,
            status: 'open',
            priority
          }),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        });
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError);
      }

      return Response.json({ 
        success: true, 
        request: {
          id: newRequest.id,
          subject: newRequest.subject,
          category: newRequest.category,
          message: newRequest.message,
          status: newRequest.status,
          performer_visible_response: newRequest.performer_visible_response,
          created_at: newRequest.created_at,
          updated_at: newRequest.updated_at,
          resolved_at: newRequest.resolved_at
        }
      });
    }

    // B. list_my_requests - Allowed for authenticated linked performer only
    if (action === 'list_my_requests') {
      // Find linked Performer
      const performers = await base44.asServiceRole.entities.Performer.filter({
        user_id: user.id
      });

      if (!performers || performers.length === 0) {
        return Response.json({ 
          error: 'No linked performer profile found' 
        }, { status: 403 });
      }

      const linkedPerformer = performers[0];

      // Return only requests where performer_id equals linked Performer id
      const requests = await base44.asServiceRole.entities.PerformerSupportRequest.filter({
        performer_id: linkedPerformer.id
      }, '-created_at');

      // Do not return admin_note - sanitize for performer
      const sanitizedRequests = requests.map(r => ({
        id: r.id,
        subject: r.subject,
        category: r.category,
        message: r.message,
        status: r.status,
        performer_visible_response: r.performer_visible_response,
        created_at: r.created_at,
        updated_at: r.updated_at,
        resolved_at: r.resolved_at
      }));

      return Response.json({ 
        success: true, 
        requests: sanitizedRequests 
      });
    }

    // C. admin_list_requests - Allowed for admin / super_admin only
    if (action === 'admin_list_requests') {
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }

      const { status, category, performer_id, priority } = body;

      // Build filter query
      const filterQuery = {};
      if (status) filterQuery.status = status;
      if (category) filterQuery.category = category;
      if (performer_id) filterQuery.performer_id = performer_id;
      if (priority) filterQuery.priority = priority;

      const requests = await base44.asServiceRole.entities.PerformerSupportRequest.filter(
        filterQuery,
        '-created_at'
      );

      // Enrich with performer data
      const enrichedRequests = await Promise.all(requests.map(async (r) => {
        const performer = await base44.asServiceRole.entities.Performer.get(r.performer_id);
        const performerUser = performer?.user_id ? await base44.asServiceRole.entities.User.get(performer.user_id) : null;
        
        return {
          id: r.id,
          performer_id: r.performer_id,
          performer_name: performer?.display_name || 'Unknown',
          user_email: performerUser?.email || 'Unknown',
          user_id: r.user_id,
          subject: r.subject,
          category: r.category,
          message: r.message,
          status: r.status,
          priority: r.priority,
          admin_note: r.admin_note,
          performer_visible_response: r.performer_visible_response,
          created_at: r.created_at,
          updated_at: r.updated_at,
          resolved_at: r.resolved_at,
          resolved_by: r.resolved_by
        };
      }));

      return Response.json({ 
        success: true, 
        requests: enrichedRequests 
      });
    }

    // D. admin_update_request - Allowed for admin / super_admin only
    if (action === 'admin_update_request') {
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }

      const { request_id, status, priority, admin_note, performer_visible_response } = body;

      if (!request_id) {
        return Response.json({ error: 'request_id required' }, { status: 400 });
      }

      // Get current request
      const currentRequest = await base44.asServiceRole.entities.PerformerSupportRequest.get(request_id);
      if (!currentRequest) {
        return Response.json({ error: 'Request not found' }, { status: 404 });
      }

      // Build update data
      const updateData = {};
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (admin_note !== undefined) updateData.admin_note = admin_note;
      if (performer_visible_response !== undefined) updateData.performer_visible_response = performer_visible_response;

      // If status becomes resolved or closed, set resolved_at and resolved_by
      if ((status === 'resolved' || status === 'closed') && currentRequest.status !== status) {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user.email || user.id;
      }

      updateData.updated_at = new Date().toISOString();

      // Update request
      const updatedRequest = await base44.asServiceRole.entities.PerformerSupportRequest.update(
        request_id,
        updateData
      );

      // Create AuditLog entry
      try {
        await base44.asServiceRole.entities.AuditLog.create({
          entity_type: 'PerformerSupportRequest',
          entity_id: request_id,
          actor_id: user.id,
          actor_role: user.role || 'admin',
          action: 'performer_support_request_updated',
          changes_json: JSON.stringify({
            old_status: currentRequest.status,
            new_status: status,
            old_priority: currentRequest.priority,
            new_priority: priority,
            updated_fields: Object.keys(updateData)
          }),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          notes: `Admin update by ${user.email || user.id}`
        });
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError);
      }

      return Response.json({ 
        success: true, 
        request: updatedRequest 
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});