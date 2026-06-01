// performerComplianceService — Service layer for performer compliance checks and locks.
// This is the foundation for the Compliance tab and compliance_locked field enforcement.
//
// Methods:
//   checkCompliance(performerId) — Returns compliance status and any blocking issues
//   lockPerformer(performerId, reason) — Sets compliance_locked flag
//   unlockPerformer(performerId) — Clears compliance_locked flag

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, performer_id } = body;

    if (!performer_id) {
      return Response.json({ error: 'performer_id is required' }, { status: 400 });
    }

    // Fetch performer
    const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
    if (!performer) {
      return Response.json({ error: 'Performer not found' }, { status: 404 });
    }

    if (action === 'check') {
      // Check compliance status
      // In Phase 1, this is a stub — will be extended with real compliance rules
      const issues = [];
      const isCompliant = issues.length === 0;

      return Response.json({
        success: true,
        performer_id,
        is_compliant: isCompliant,
        issues,
        compliance_locked: performer.compliance_locked || false,
      });
    }

    if (action === 'lock') {
      const { reason } = body;
      await base44.asServiceRole.entities.Performer.update(performer_id, {
        compliance_locked: true,
        compliance_lock_reason: reason || 'Manual lock by admin',
      });

      return Response.json({
        success: true,
        message: 'Performer locked',
        performer_id,
      });
    }

    if (action === 'unlock') {
      await base44.asServiceRole.entities.Performer.update(performer_id, {
        compliance_locked: false,
        compliance_lock_reason: null,
      });

      return Response.json({
        success: true,
        message: 'Performer unlocked',
        performer_id,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});