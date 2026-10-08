import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

function audit(base44, subjectId, action, actorId, details, severity = 'info') {
  return base44.asServiceRole.entities.RecruitmentAuditLog.create({
    subject_type: 'application', subject_id: subjectId, action, actor_type: 'admin', actor_id: actorId,
    severity, details_json: JSON.stringify(details || {}), created_at: new Date().toISOString()
  }).catch(() => null);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    const { application_id } = await req.json();
    if (!application_id) return Response.json({ error: 'application_id required' }, { status: 400 });

    const app = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
    if (!app) return Response.json({ error: 'Application not found' }, { status: 404 });

    if (['approved','contract_pending','contract_sent','contract_signed','performer_created','user_linked','active'].includes(app.status)) {
      await audit(base44, app.id, 'approval_idempotent_noop', user.id, { status: app.status });
      return Response.json({ success: true, already_approved: true, status: app.status });
    }

    const readinessRes = await base44.functions.invoke('recruitmentReadinessEngine', { application_id, mode: 'approval' });
    const readiness = readinessRes.data?.readiness || readinessRes.readiness;
    if (!readiness?.ready_for_approval) {
      await audit(base44, app.id, 'approval_blocked', user.id, { errors: readiness?.errors || [] }, 'warning');
      return Response.json({ success: false, error: 'Application is not ready for approval', validation_errors: readiness?.errors || [] }, { status: 422 });
    }

    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, action: 'Application approved after backend readiness validation', actor_id: user.id, old_status: app.status, new_status: 'approved' };
    await base44.asServiceRole.entities.GuestProductionApplication.update(app.id, {
      status: 'approved', approved_at: timestamp, approved_by: user.id,
      status_history: [...(app.status_history || []), JSON.stringify(logEntry)]
    });
    await audit(base44, app.id, 'approval_granted', user.id, { readiness_summary: readiness.summary, old_status: app.status });
    return Response.json({ success: true, status: 'approved', approved_at: timestamp, readiness });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});