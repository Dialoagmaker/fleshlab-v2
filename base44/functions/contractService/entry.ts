// contractService — Service layer for contract management with audit logging
// 
// Actions:
//   create_contract — Create new contract with document
//   update_contract_status — Change contract status
//   update_contract_expiry — Set contract expiration
//

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

    if (action === 'create_contract') {
      const { 
        contract_type, 
        title, 
        document_url, 
        notes,
        expires_at 
      } = data;

      if (!contract_type || !title || !document_url) {
        return Response.json({ 
          error: 'Missing required fields: contract_type, title, document_url' 
        }, { status: 400 });
      }

      // Create contract record
      const contract = await base44.asServiceRole.entities.Contract.create({
        performer_id,
        contract_type,
        title,
        document_url,
        status: 'draft',
        notes: notes || null,
        expires_at: expires_at || null,
      });

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract.id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'contract_uploaded',
        changes_json: JSON.stringify({
          contract_type,
          title,
          document_url,
        }),
        notes: `Contract uploaded: ${title} (${contract_type})`,
      });

      return Response.json({
        success: true,
        contract_id: contract.id,
        message: 'Contract created',
      });
    }

    if (action === 'update_contract_status') {
      const { contract_id, status } = data;

      if (!contract_id || !status) {
        return Response.json({ 
          error: 'Missing required fields: contract_id, status' 
        }, { status: 400 });
      }

      // Get current contract
      const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 });
      }

      const oldStatus = contract.status;

      // Update status
      await base44.asServiceRole.entities.Contract.update(contract_id, { status });

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'contract_status_changed',
        changes_json: JSON.stringify({
          status: {
            before: oldStatus,
            after: status,
          },
        }),
        notes: `Contract status changed from ${oldStatus} to ${status}`,
      });

      return Response.json({
        success: true,
        contract_id,
        message: 'Contract status updated',
      });
    }

    if (action === 'update_contract_expiry') {
      const { contract_id, expires_at } = data;

      if (!contract_id || !expires_at) {
        return Response.json({ 
          error: 'Missing required fields: contract_id, expires_at' 
        }, { status: 400 });
      }

      // Get current contract
      const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 });
      }

      const oldExpiry = contract.expires_at;

      // Update expiry
      await base44.asServiceRole.entities.Contract.update(contract_id, { expires_at });

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Contract',
        entity_id: contract_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'contract_expiry_changed',
        changes_json: JSON.stringify({
          expires_at: {
            before: oldExpiry,
            after: expires_at,
          },
        }),
        notes: `Contract expiry changed from ${oldExpiry || 'none'} to ${expires_at}`,
      });

      return Response.json({
        success: true,
        contract_id,
        message: 'Contract expiry updated',
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});