// performerAdminService — Service layer for performer account management.
// Phase 1.6: Hardened with AuditLog writes and role-based access control.
//
// Actions:
//   freeze_account — Sets account_status to "suspended", records freeze_reason
//   unfreeze_account — Sets account_status to "active", clears freeze_reason
//   set_kyc_status — Updates kyc_status (not_started, pending, approved, rejected, expired)
//   set_revenue_split — Sets revenue_split_pct
//   update_platform_accounts — Updates onlyfans_url, twitter_url, instagram_url
//
// Security:
// - Server-side role checks via base44.auth.me()
// - All actions append to AuditLog (append-only)
// - Validation on all inputs

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Helper to extract IP from request
function getIpAddress(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // Direct connection - IP may not be available in all environments
  return null;
}

// Helper to validate URL format (light validation)
function isValidUrl(url) {
  if (!url || url.trim() === '') return true; // Empty is allowed (clearing field)
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // PART 1: AUTH CONTEXT - Server-side user identification
    // Using base44.auth.me() which returns the authenticated user from the request token
    // This is TRUSTED server-side - not from frontend payload
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized - No authenticated user' }, { status: 401 });
    }

    // PART 4: ROLE CHECKS - Server-side enforcement
    // Allowed roles: admin, super_admin (if exists)
    // Denied roles: user, viewer, performer, manager (not yet supported)
    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(user.role)) {
      return Response.json({ 
        error: `Forbidden - Role '${user.role}' not authorized. Admin access required.` 
      }, { status: 403 });
    }

    const actor_id = user.id;
    const actor_role = user.role;
    const ip_address = getIpAddress(req);

    const body = await req.json().catch(() => ({}));
    const { action, performer_id } = body;

    if (!performer_id) {
      return Response.json({ error: 'performer_id is required' }, { status: 400 });
    }

    // Fetch performer using service role (admin privileges)
    const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
    if (!performer) {
      return Response.json({ error: 'Performer not found' }, { status: 404 });
    }

    // PART 2: AUDITLOG HELPER - Append-only audit logging
    const appendAuditLog = async ({ action: logAction, changes_json, notes }) => {
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Performer',
        entity_id: performer_id,
        actor_id,
        actor_role,
        action: logAction,
        changes_json: JSON.stringify(changes_json, null, 2),
        ip_address,
        notes: notes || '',
      });
    };

    // Action: freeze_account
    if (action === 'freeze_account') {
      const { reason } = body;
      
      // Validation: reason required and non-empty
      if (!reason || reason.trim() === '') {
        return Response.json({ error: 'Freeze reason is required and cannot be empty' }, { status: 400 });
      }

      // Capture before state
      const before = {
        account_status: performer.account_status,
        freeze_reason: performer.freeze_reason || null,
        compliance_locked: performer.compliance_locked,
      };

      // Update performer
      await base44.asServiceRole.entities.Performer.update(performer_id, {
        account_status: 'suspended',
        freeze_reason: reason.trim(),
        compliance_locked: true, // Auto-lock on freeze
      });

      // Capture after state
      const after = {
        account_status: 'suspended',
        freeze_reason: reason.trim(),
        compliance_locked: true,
      };

      // Append AuditLog
      await appendAuditLog({
        action: 'freeze_account',
        changes_json: { before, after },
        notes: reason.trim(),
      });

      return Response.json({
        success: true,
        message: 'Account frozen',
        performer_id,
        account_status: 'suspended',
      });
    }

    // Action: unfreeze_account
    if (action === 'unfreeze_account') {
      const { reason } = body;
      
      // Validation: reason required and non-empty
      if (!reason || reason.trim() === '') {
        return Response.json({ error: 'Unfreeze reason is required and cannot be empty' }, { status: 400 });
      }

      // Capture before state
      const before = {
        account_status: performer.account_status,
        freeze_reason: performer.freeze_reason || null,
        compliance_locked: performer.compliance_locked,
      };

      // Update performer
      await base44.asServiceRole.entities.Performer.update(performer_id, {
        account_status: 'active',
        freeze_reason: null,
        // compliance_locked remains as-is - will be re-evaluated by compliance service
      });

      // Trigger compliance re-evaluation after unfreeze
      try {
        await base44.functions.invoke('performerComplianceService', {
          action: 'compliance_check',
          performer_id,
        });
      } catch (complianceError) {
        // Log but don't fail - compliance check is best-effort
        console.error('Compliance check after unfreeze failed:', complianceError);
      }

      // Capture after state
      const after = {
        account_status: 'active',
        freeze_reason: null,
        compliance_locked: performer.compliance_locked, // May change after compliance check
      };

      // Append AuditLog
      await appendAuditLog({
        action: 'unfreeze_account',
        changes_json: { before, after },
        notes: reason.trim(),
      });

      return Response.json({
        success: true,
        message: 'Account unfrozen',
        performer_id,
        account_status: 'active',
      });
    }

    // Action: set_kyc_status
    if (action === 'set_kyc_status') {
      const { kyc_status, reason } = body;
      
      // Validation: allowed values
      const validStatuses = ['not_started', 'pending', 'approved', 'rejected', 'expired'];
      if (!validStatuses.includes(kyc_status)) {
        return Response.json({ 
          error: `Invalid kyc_status. Must be one of: ${validStatuses.join(', ')}` 
        }, { status: 400 });
      }

      // Validation: reject requires reason
      if (kyc_status === 'rejected' && (!reason || reason.trim() === '')) {
        return Response.json({ error: 'Reason is required when rejecting KYC' }, { status: 400 });
      }

      // Capture before state
      const before = {
        kyc_status: performer.kyc_status,
        compliance_locked: performer.compliance_locked,
      };

      // Update performer
      await base44.asServiceRole.entities.Performer.update(performer_id, { kyc_status });

      // Trigger compliance re-evaluation after KYC change
      let complianceChanged = false;
      if (kyc_status !== 'approved') {
        try {
          await base44.functions.invoke('performerComplianceService', {
            action: 'lock_evaluation',
            performer_id,
            reason: `KYC status changed to ${kyc_status}` + (reason ? `: ${reason.trim()}` : ''),
          });
          complianceChanged = true;
        } catch (complianceError) {
          console.error('Compliance lock evaluation failed:', complianceError);
        }
      }

      // Fetch updated performer to get compliance_locked status
      const updatedPerformer = await base44.asServiceRole.entities.Performer.get(performer_id);

      // Capture after state
      const after = {
        kyc_status,
        compliance_locked: updatedPerformer.compliance_locked,
      };

      // Append AuditLog
      await appendAuditLog({
        action: 'set_kyc_status',
        changes_json: { before, after },
        notes: reason ? reason.trim() : `KYC status changed to ${kyc_status}`,
      });

      return Response.json({
        success: true,
        message: 'KYC status updated',
        performer_id,
        kyc_status,
      });
    }

    // Action: set_revenue_split
    if (action === 'set_revenue_split') {
      const { revenue_split_pct, reason } = body;
      
      // Validation: reason required
      if (!reason || reason.trim() === '') {
        return Response.json({ error: 'Reason is required when changing revenue split' }, { status: 400 });
      }

      // Validation: must be number between 0 and 100
      if (typeof revenue_split_pct !== 'number' || revenue_split_pct < 0 || revenue_split_pct > 100) {
        return Response.json({ 
          error: 'revenue_split_pct must be a number between 0 and 100' 
        }, { status: 400 });
      }

      // Capture before state
      const before = {
        revenue_split_pct: performer.revenue_split_pct,
      };

      // Update performer
      await base44.asServiceRole.entities.Performer.update(performer_id, { revenue_split_pct });

      // Capture after state
      const after = {
        revenue_split_pct,
      };

      // Append AuditLog
      await appendAuditLog({
        action: 'set_revenue_split',
        changes_json: { before, after },
        notes: reason.trim(),
      });

      return Response.json({
        success: true,
        message: 'Revenue split updated',
        performer_id,
        revenue_split_pct,
      });
    }

    // Action: update_platform_accounts
    if (action === 'update_platform_accounts') {
      const { onlyfans_url, twitter_url, instagram_url } = body;
      
      // Validation: URL formats
      if (onlyfans_url !== undefined && !isValidUrl(onlyfans_url)) {
        return Response.json({ error: 'Invalid OnlyFans URL format' }, { status: 400 });
      }
      if (twitter_url !== undefined && !isValidUrl(twitter_url)) {
        return Response.json({ error: 'Invalid Twitter URL format' }, { status: 400 });
      }
      if (instagram_url !== undefined && !isValidUrl(instagram_url)) {
        return Response.json({ error: 'Invalid Instagram URL format' }, { status: 400 });
      }

      const updates = {};
      const changes = {};
      
      if (onlyfans_url !== undefined) {
        updates.onlyfans_url = onlyfans_url ? onlyfans_url.trim() : null;
        changes.onlyfans_url = { 
          before: performer.onlyfans_url || null, 
          after: onlyfans_url ? onlyfans_url.trim() : null 
        };
      }
      if (twitter_url !== undefined) {
        updates.twitter_url = twitter_url ? twitter_url.trim() : null;
        changes.twitter_url = { 
          before: performer.twitter_url || null, 
          after: twitter_url ? twitter_url.trim() : null 
        };
      }
      if (instagram_url !== undefined) {
        updates.instagram_url = instagram_url ? instagram_url.trim() : null;
        changes.instagram_url = { 
          before: performer.instagram_url || null, 
          after: instagram_url ? instagram_url.trim() : null 
        };
      }

      // Only update if there are changes
      if (Object.keys(updates).length === 0) {
        return Response.json({ error: 'No platform accounts provided to update' }, { status: 400 });
      }

      // Update performer
      await base44.asServiceRole.entities.Performer.update(performer_id, updates);

      // Append AuditLog
      await appendAuditLog({
        action: 'update_platform_accounts',
        changes_json: changes,
        notes: `Updated platform accounts: ${Object.keys(updates).join(', ')}`,
      });

      return Response.json({
        success: true,
        message: 'Platform accounts updated',
        performer_id,
        updated_fields: Object.keys(updates),
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('performerAdminService error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});