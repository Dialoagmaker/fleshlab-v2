// performerComplianceService — Service layer for performer compliance checks and locks.
// Phase 1: Compliance evaluation and lock management.
//
// Actions:
//   compliance_check — Evaluates compliance status, returns issues
//   lock_evaluation — Locks performer if compliance issues found

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

    if (action === 'compliance_check') {
      // Phase 1: Stub compliance check
      // In future phases, this will check:
      // - KYC status
      // - Contract expiration
      // - Medical test expiration
      // - Compliance documents
      
      const issues = [];
      
      // Example checks (Phase 1 stubs)
      if (performer.kyc_status !== 'approved') {
        issues.push({ type: 'kyc', message: 'KYC not approved', severity: 'high' });
      }
      if (performer.compliance_locked) {
        issues.push({ type: 'compliance_lock', message: performer.compliance_lock_reason || 'Compliance locked', severity: 'critical' });
      }
      
      const isCompliant = issues.length === 0;

      return Response.json({
        success: true,
        performer_id,
        is_compliant: isCompliant,
        issues,
        compliance_locked: performer.compliance_locked || false,
        kyc_status: performer.kyc_status,
      });
    }

    if (action === 'lock_evaluation') {
      // Evaluate and lock if needed
      const { reason } = body;
      
      // For Phase 1, just lock with provided reason
      await base44.asServiceRole.entities.Performer.update(performer_id, {
        compliance_locked: true,
        compliance_lock_reason: reason || 'Compliance lock via evaluation',
      });

      return Response.json({
        success: true,
        message: 'Performer locked',
        performer_id,
        compliance_locked: true,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});