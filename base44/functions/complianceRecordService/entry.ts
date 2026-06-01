// complianceRecordService — Service layer for compliance record management with audit logging
// 
// Actions:
//   create_record — Create compliance record after document upload
//   update_record_status — Update record status with audit log
//   update_record_expiry — Update expiry date with audit log

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, performer_id, contract_id, record_id, ...data } = body;

    // For create actions, performer_id is required
    if (action === 'create_contract' || action === 'create_record') {
      if (!performer_id) {
        return Response.json({ error: 'performer_id is required' }, { status: 400 });
      }
      const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
      if (!performer) {
        return Response.json({ error: 'Performer not found' }, { status: 404 });
      }
    }

    // For update actions, verify entity exists
    if (action.includes('update_contract') && contract_id) {
      const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 });
      }
    }
    if (action.includes('update_record') && record_id) {
      const record = await base44.asServiceRole.entities.ComplianceRecord.get(record_id);
      if (!record) {
        return Response.json({ error: 'ComplianceRecord not found' }, { status: 404 });
      }
    }

    if (action === 'create_record') {
      const { 
        document_type, 
        document_url, 
        issued_at,
        expires_at,
        issuing_authority,
        notes 
      } = data;

      if (!document_type || !document_url) {
        return Response.json({ 
          error: 'Missing required fields: document_type, document_url' 
        }, { status: 400 });
      }

      // Create compliance record
      const record = await base44.asServiceRole.entities.ComplianceRecord.create({
        performer_id,
        document_type,
        document_url,
        status: 'pending',
        issued_at: issued_at || null,
        expires_at: expires_at || null,
        issuing_authority: issuing_authority || null,
        notes: notes || null,
      });

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'ComplianceRecord',
        entity_id: record.id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'compliance_record_uploaded',
        changes_json: JSON.stringify({
          document_type,
          document_url,
          issued_at,
          expires_at,
        }),
        notes: `Compliance record uploaded: ${document_type}`,
      });

      return Response.json({
        success: true,
        record_id: record.id,
        message: 'Compliance record created',
      });
    }

    if (action === 'update_record_status') {
      const { record_id, status } = data;

      if (!record_id || !status) {
        return Response.json({ 
          error: 'Missing required fields: record_id, status' 
        }, { status: 400 });
      }

      // Get current record
      const record = await base44.asServiceRole.entities.ComplianceRecord.get(record_id);
      if (!record) {
        return Response.json({ error: 'ComplianceRecord not found' }, { status: 404 });
      }

      const oldStatus = record.status;

      // Update status
      await base44.asServiceRole.entities.ComplianceRecord.update(record_id, { status });

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'ComplianceRecord',
        entity_id: record_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'compliance_record_status_changed',
        changes_json: JSON.stringify({
          status: {
            before: oldStatus,
            after: status,
          },
        }),
        notes: `Compliance record status changed from ${oldStatus} to ${status}`,
      });

      return Response.json({
        success: true,
        record_id,
        message: 'Compliance record status updated',
      });
    }

    if (action === 'update_record_expiry') {
      const { record_id, expires_at } = data;

      if (!record_id || !expires_at) {
        return Response.json({ 
          error: 'Missing required fields: record_id, expires_at' 
        }, { status: 400 });
      }

      // Get current record
      const record = await base44.asServiceRole.entities.ComplianceRecord.get(record_id);
      if (!record) {
        return Response.json({ error: 'ComplianceRecord not found' }, { status: 404 });
      }

      const oldExpiry = record.expires_at;

      // Update expiry
      await base44.asServiceRole.entities.ComplianceRecord.update(record_id, { expires_at });

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'ComplianceRecord',
        entity_id: record_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'compliance_record_expiry_changed',
        changes_json: JSON.stringify({
          expires_at: {
            before: oldExpiry,
            after: expires_at,
          },
        }),
        notes: `Compliance record expiry changed from ${oldExpiry || 'none'} to ${expires_at}`,
      });

      return Response.json({
        success: true,
        record_id,
        message: 'Compliance record expiry updated',
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});