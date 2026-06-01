// performerComplianceService — Service layer for performer compliance checks and locks
// Phase 2: Full compliance evaluation with KYC, contracts, medical records
//
// Actions:
//   compliance_check — Evaluates compliance status, returns issues
//   lock_evaluation — Locks/unlocks performer based on compliance gates

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
      const issues = [];
      const gates = {
        kyc_ok: false,
        release_contract_ok: false,
        medical_ok: false,
        balance_ok: false,
        account_status_ok: false,
      };

      // Level 1 — Identity: KYC status
      if (performer.kyc_status === 'approved') {
        gates.kyc_ok = true;
      } else {
        issues.push({ 
          type: 'kyc', 
          message: `KYC status: ${performer.kyc_status || 'not started'}`, 
          severity: 'high',
          gate: 'identity'
        });
      }

      // Level 2 — Legal: Valid signed AND verified release contract
      const contracts = await base44.asServiceRole.entities.Contract.filter({
        performer_id,
        contract_type: 'release',
        status: 'signed'
      });
      
      if (contracts && contracts.length > 0) {
        // Check if any signed release contract is not expired AND verified
        const hasValidContract = contracts.some(c => {
          if (!c.expires_at) return true; // No expiry = valid
          const notExpired = new Date(c.expires_at) > new Date();
          const verified = c.verified === true; // Must be verified
          return notExpired && verified;
        });
        
        if (hasValidContract) {
          gates.release_contract_ok = true;
        } else {
          // Provide detailed reason
          const hasExpired = contracts.some(c => c.expires_at && new Date(c.expires_at) <= new Date());
          const hasUnverified = contracts.some(c => c.verified !== true);
          
          if (hasExpired && hasUnverified) {
            issues.push({ 
              type: 'contract', 
              message: 'Release contract expired and not verified', 
              severity: 'critical',
              gate: 'legal'
            });
          } else if (hasExpired) {
            issues.push({ 
              type: 'contract', 
              message: 'Release contract expired', 
              severity: 'critical',
              gate: 'legal'
            });
          } else if (hasUnverified) {
            issues.push({ 
              type: 'contract', 
              message: 'Release contract not verified by admin', 
              severity: 'critical',
              gate: 'legal'
            });
          }
        }
      } else {
        issues.push({ 
          type: 'contract', 
          message: 'No signed release contract found', 
          severity: 'critical',
          gate: 'legal'
        });
      }

      // Level 3 — Health: Valid medical/HIV/STI ComplianceRecord
      const medicalRecords = await base44.asServiceRole.entities.ComplianceRecord.filter({
        performer_id,
        status: 'valid'
      });

      if (medicalRecords && medicalRecords.length > 0) {
        // Check for medical_test, std_test, or hiv_test
        const hasMedicalRecord = medicalRecords.some(r => {
          if (!['medical_test', 'std_test'].includes(r.document_type)) return false;
          if (!r.expires_at) return true; // No expiry = valid
          return new Date(r.expires_at) > new Date();
        });

        if (hasMedicalRecord) {
          gates.medical_ok = true;
        } else {
          issues.push({ 
            type: 'medical', 
            message: 'Medical/STI test expired or missing', 
            severity: 'high',
            gate: 'health'
          });
        }
      } else {
        issues.push({ 
          type: 'medical', 
          message: 'No valid medical/STI test record found', 
          severity: 'high',
          gate: 'health'
        });
      }

      // Level 4 — Financial: Outstanding balance
      if (!performer.outstanding_balance_usd || performer.outstanding_balance_usd <= 0) {
        gates.balance_ok = true;
      } else {
        issues.push({ 
          type: 'balance', 
          message: `Outstanding balance: $${performer.outstanding_balance_usd.toFixed(2)}`, 
          severity: 'medium',
          gate: 'financial'
        });
      }

      // Level 5 — Operational: Account status
      if (performer.account_status === 'active') {
        gates.account_status_ok = true;
      } else {
        issues.push({ 
          type: 'account', 
          message: `Account status: ${performer.account_status}`, 
          severity: 'critical',
          gate: 'operational'
        });
      }

      // Determine overall compliance
      const isCompliant = Object.values(gates).every(g => g === true);
      const shouldLock = !isCompliant;

      return Response.json({
        success: true,
        performer_id,
        is_compliant: isCompliant,
        should_lock: shouldLock,
        currently_locked: performer.compliance_locked || false,
        gates,
        issues,
        kyc_status: performer.kyc_status,
        account_status: performer.account_status,
      });
    }

    if (action === 'lock_evaluation') {
      // Run full compliance check
      const issues = [];
      let shouldLock = false;

      // Level 1 — Identity
      if (performer.kyc_status !== 'approved') {
        issues.push({ type: 'kyc', message: 'KYC not approved', severity: 'high' });
        shouldLock = true;
      }

      // Level 2 — Legal: Signed AND verified release contract
      const contracts = await base44.asServiceRole.entities.Contract.filter({
        performer_id,
        contract_type: 'release',
        status: 'signed'
      });

      const hasValidContract = contracts && contracts.some(c => {
        if (!c.expires_at) return true;
        const notExpired = new Date(c.expires_at) > new Date();
        const verified = c.verified === true; // Must be verified
        return notExpired && verified;
      });

      if (!hasValidContract) {
        const hasExpired = contracts && contracts.some(c => c.expires_at && new Date(c.expires_at) <= new Date());
        const hasUnverified = contracts && contracts.some(c => c.verified !== true);
        
        if (hasExpired && hasUnverified) {
          issues.push({ type: 'contract', message: 'Release contract expired and not verified', severity: 'critical' });
        } else if (hasExpired) {
          issues.push({ type: 'contract', message: 'Release contract expired', severity: 'critical' });
        } else if (hasUnverified) {
          issues.push({ type: 'contract', message: 'Release contract not verified by admin', severity: 'critical' });
        } else {
          issues.push({ type: 'contract', message: 'No valid release contract', severity: 'critical' });
        }
        shouldLock = true;
      }

      // Level 3 — Health
      const medicalRecords = await base44.asServiceRole.entities.ComplianceRecord.filter({
        performer_id,
        status: 'valid'
      });

      const hasMedicalRecord = medicalRecords && medicalRecords.some(r => {
        if (!['medical_test', 'std_test'].includes(r.document_type)) return false;
        if (!r.expires_at) return true;
        return new Date(r.expires_at) > new Date();
      });

      if (!hasMedicalRecord) {
        issues.push({ type: 'medical', message: 'No valid medical test', severity: 'high' });
        shouldLock = true;
      }

      // Level 4 — Financial
      if (performer.outstanding_balance_usd && performer.outstanding_balance_usd > 0) {
        issues.push({ type: 'balance', message: 'Outstanding balance', severity: 'medium' });
        // Balance alone doesn't trigger lock in Phase 2
      }

      // Level 5 — Operational
      if (performer.account_status !== 'active') {
        issues.push({ type: 'account', message: 'Account not active', severity: 'critical' });
        shouldLock = true;
      }

      // Update lock status if changed
      const oldLocked = performer.compliance_locked || false;
      const lockChanged = shouldLock !== oldLocked;

      if (lockChanged) {
        await base44.asServiceRole.entities.Performer.update(performer_id, {
          compliance_locked: shouldLock,
        });

        // Create AuditLog entry
        await base44.asServiceRole.entities.AuditLog.create({
          entity_type: 'Performer',
          entity_id: performer_id,
          actor_id: user.id,
          actor_role: user.role,
          action: 'compliance_lock_evaluation',
          changes_json: JSON.stringify({
            compliance_locked: {
              before: oldLocked,
              after: shouldLock,
            },
            reasons: issues.map(i => i.message),
          }),
          notes: shouldLock 
            ? `Performer locked due to: ${issues.map(i => i.message).join(', ')}`
            : 'Performer unlocked - all compliance gates passed',
        });
      }

      return Response.json({
        success: true,
        performer_id,
        compliance_locked: shouldLock,
        lock_changed: lockChanged,
        was_locked: oldLocked,
        reasons: issues.map(i => i.message),
        issues,
      });
    }

    if (action === 'manual_unlock') {
      // Admin manually unlocks performer (override)
      await base44.asServiceRole.entities.Performer.update(performer_id, {
        compliance_locked: false,
        compliance_override: true,
        compliance_override_reason: body.reason || 'Manual override by admin',
      });

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Performer',
        entity_id: performer_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'manual_compliance_unlock',
        changes_json: JSON.stringify({
          compliance_locked: {
            before: true,
            after: false,
          },
          compliance_override: true,
          reason: body.reason || 'Manual override by admin',
        }),
        notes: `Admin manually unlocked performer: ${body.reason || 'No reason provided'}`,
      });

      return Response.json({
        success: true,
        performer_id,
        compliance_locked: false,
        message: 'Performer manually unlocked by admin',
      });
    }

    if (action === 'manual_lock') {
      // Admin manually locks performer
      await base44.asServiceRole.entities.Performer.update(performer_id, {
        compliance_locked: true,
        freeze_reason: body.reason || 'Manual lock by admin',
      });

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Performer',
        entity_id: performer_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'manual_compliance_lock',
        changes_json: JSON.stringify({
          compliance_locked: {
            before: false,
            after: true,
          },
          freeze_reason: body.reason || 'Manual lock by admin',
        }),
        notes: `Admin manually locked performer: ${body.reason || 'No reason provided'}`,
      });

      return Response.json({
        success: true,
        performer_id,
        compliance_locked: true,
        message: 'Performer manually locked by admin',
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});