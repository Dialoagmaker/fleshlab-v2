import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { action, performer_id, provider, session_id, verification_data } = await req.json();

    // Validate performer_id for all actions
    if (!performer_id) {
      return Response.json({ error: 'Performer ID is required' }, { status: 400 });
    }

    // Verify performer exists
    const performer = await base44.entities.Performer.get(performer_id);
    if (!performer) {
      return Response.json({ error: 'Performer not found' }, { status: 404 });
    }

    switch (action) {
      case 'create_session': {
        // Create new identity verification session
        if (!provider) {
          return Response.json({ error: 'Verification provider is required' }, { status: 400 });
        }

        const session = await base44.entities.IdentityVerificationSession.create({
          performer_id,
          provider,
          status: 'pending',
          created_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

        // Create audit log
        await base44.entities.AuditLog.create({
          entity_type: 'IdentityVerificationSession',
          entity_id: session.id,
          actor_id: user.id,
          actor_role: user.role,
          action: 'verification_session_created',
          changes_json: JSON.stringify({
            performer_id,
            provider,
            created_by: user.email
          }),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return Response.json({
          success: true,
          session: {
            id: session.id,
            performer_id: session.performer_id,
            provider: session.provider,
            status: session.status,
            created_at: session.created_date,
            expires_at: session.expires_at
          }
        });
      }

      case 'update_status': {
        if (!session_id) {
          return Response.json({ error: 'Session ID is required' }, { status: 400 });
        }

        const { status, verification_result_summary, performer_visible_message } = verification_data || {};
        
        if (!status) {
          return Response.json({ error: 'Status is required' }, { status: 400 });
        }

        const session = await base44.entities.IdentityVerificationSession.get(session_id);
        if (!session || session.performer_id !== performer_id) {
          return Response.json({ error: 'Session not found' }, { status: 404 });
        }

        const updateData = {
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        };

        if (verification_result_summary) {
          updateData.verification_result_summary = verification_result_summary;
        }

        if (performer_visible_message) {
          updateData.performer_visible_message = performer_visible_message;
        }

        if (['approved', 'verified', 'completed'].includes(status)) {
          updateData.completed_at = new Date().toISOString();
        }

        await base44.entities.IdentityVerificationSession.update(session_id, updateData);

        // Create audit log
        await base44.entities.AuditLog.create({
          entity_type: 'IdentityVerificationSession',
          entity_id: session_id,
          actor_id: user.id,
          actor_role: user.role,
          action: 'verification_status_updated',
          changes_json: JSON.stringify({
            old_status: session.status,
            new_status: status,
            updated_by: user.email
          }),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return Response.json({
          success: true,
          session: {
            id: session.id,
            status: updateData.status,
            completed_at: updateData.completed_at
          }
        });
      }

      case 'get_sessions': {
        const sessions = await base44.entities.IdentityVerificationSession.filter(
          { performer_id },
          '-created_date'
        );

        return Response.json({
          success: true,
          sessions: sessions.map(s => ({
            id: s.id,
            provider: s.provider,
            status: s.status,
            created_at: s.created_date,
            completed_at: s.completed_at,
            expires_at: s.expires_at,
            verification_result_summary: s.verification_result_summary,
            performer_visible_message: s.performer_visible_message
          }))
        });
      }

      case 'get_session': {
        if (!session_id) {
          return Response.json({ error: 'Session ID is required' }, { status: 400 });
        }

        const session = await base44.entities.IdentityVerificationSession.get(session_id);
        if (!session || session.performer_id !== performer_id) {
          return Response.json({ error: 'Session not found' }, { status: 404 });
        }

        return Response.json({
          success: true,
          session: {
            id: session.id,
            performer_id: session.performer_id,
            provider: session.provider,
            status: session.status,
            created_at: session.created_date,
            reviewed_at: session.reviewed_at,
            completed_at: session.completed_at,
            expires_at: session.expires_at,
            verification_result_summary: session.verification_result_summary,
            performer_visible_message: session.performer_visible_message,
            reviewed_by: session.reviewed_by
          }
        });
      }

      case 'link_to_compliance_record': {
        if (!session_id || !verification_data?.compliance_record_id) {
          return Response.json({ error: 'Session ID and compliance record ID are required' }, { status: 400 });
        }

        const { compliance_record_id } = verification_data;
        
        const session = await base44.entities.IdentityVerificationSession.get(session_id);
        if (!session || session.performer_id !== performer_id) {
          return Response.json({ error: 'Session not found' }, { status: 404 });
        }

        const complianceRecord = await base44.entities.ComplianceRecord.get(compliance_record_id);
        if (!complianceRecord || complianceRecord.performer_id !== performer_id) {
          return Response.json({ error: 'Compliance record not found' }, { status: 404 });
        }

        await base44.entities.ComplianceRecord.update(compliance_record_id, {
          verification_session_id: session_id,
          verification_provider: session.provider,
          verification_status: session.status === 'approved' || session.status === 'verified' ? 'verified' : 'pending',
          verified_at: session.completed_at
        });

        return Response.json({
          success: true,
          message: 'Compliance record linked to verification session'
        });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});