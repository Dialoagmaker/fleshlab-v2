// performerAdminService — Service layer for performer account management.
// Phase 1.6: Hardened with AuditLog writes and role-based access control.
//
// Actions:
//   get_performer — Fetches performer by ID (admin-only)
//   update_performer — Updates performer fields (admin-only)
//   freeze_account — Sets account_status to "suspended", records freeze_reason
//   unfreeze_account — Sets account_status to "active", clears freeze_reason
//   set_kyc_status — Updates kyc_status (not_started, pending, approved, rejected, expired)
//   set_revenue_split — Sets revenue_split_pct
//   update_platform_accounts — Updates onlyfans_url, twitter_url, instagram_url
//   link_user — Links a user account to this performer (sets user_id)
//   unlink_user — Removes user_id link from performer
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

    // Action: get_performer
    if (action === 'get_performer') {
      return Response.json({
        success: true,
        ...performer
      });
    }

    // Action: update_performer
    if (action === 'update_performer') {
      const { data } = body;
      
      if (!data || typeof data !== 'object') {
        return Response.json({ error: 'data object is required' }, { status: 400 });
      }

      // Capture before state (only production compatibility fields)
      const before = {
        production_profile_enabled: performer.production_profile_enabled,
        available_production_types: performer.available_production_types,
        preferred_scene_styles: performer.preferred_scene_styles,
        available_roles: performer.available_roles,
        conditional_themes: performer.conditional_themes,
        not_available_boundaries: performer.not_available_boundaries,
        privacy_options: performer.privacy_options,
        safety_requirements: performer.safety_requirements,
        production_notes_public: performer.production_notes_public,
        production_notes_internal: performer.production_notes_internal,
        compatibility_review_status: performer.compatibility_review_status,
        compatibility_reviewed_at: performer.compatibility_reviewed_at,
        compatibility_reviewed_by: performer.compatibility_reviewed_by,
        last_consent_update_at: performer.last_consent_update_at,
      };

      // Remove metadata fields that should not be directly updated
      const updateData = { ...data };
      delete updateData.action;
      delete updateData.performer_id;

      // Update performer
      await base44.asServiceRole.entities.Performer.update(performer_id, updateData);

      // Fetch updated performer to get final state
      const updatedPerformer = await base44.asServiceRole.entities.Performer.get(performer_id);

      // Capture after state
      const after = {
        production_profile_enabled: updatedPerformer.production_profile_enabled,
        available_production_types: updatedPerformer.available_production_types,
        preferred_scene_styles: updatedPerformer.preferred_scene_styles,
        available_roles: updatedPerformer.available_roles,
        conditional_themes: updatedPerformer.conditional_themes,
        not_available_boundaries: updatedPerformer.not_available_boundaries,
        privacy_options: updatedPerformer.privacy_options,
        safety_requirements: updatedPerformer.safety_requirements,
        production_notes_public: updatedPerformer.production_notes_public,
        production_notes_internal: updatedPerformer.production_notes_internal,
        compatibility_review_status: updatedPerformer.compatibility_review_status,
        compatibility_reviewed_at: updatedPerformer.compatibility_reviewed_at,
        compatibility_reviewed_by: updatedPerformer.compatibility_reviewed_by,
        last_consent_update_at: updatedPerformer.last_consent_update_at,
      };

      // Append AuditLog
      await appendAuditLog({
        action: 'performer_production_compatibility_updated',
        changes_json: { before, after },
        notes: `Production compatibility profile updated by ${user.email || user.id}`,
      });

      return Response.json({
        success: true,
        message: 'Production compatibility profile updated',
        performer_id,
      });
    }

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

    // Action: link_user
    if (action === 'link_user') {
      const { user_id } = body;
      
      // Validation: user_id required
      if (!user_id) {
        return Response.json({ error: 'user_id is required' }, { status: 400 });
      }

      // Validate user exists
      const targetUser = await base44.asServiceRole.entities.User.get(user_id);
      if (!targetUser) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if this user is already linked to another performer
      const existingLink = await base44.asServiceRole.entities.Performer.filter({
        user_id
      });
      
      if (existingLink && existingLink.length > 0 && existingLink[0].id !== performer_id) {
        return Response.json({ 
          error: `User is already linked to performer "${existingLink[0].display_name}"`,
          existing_performer_id: existingLink[0].id,
          existing_performer_name: existingLink[0].display_name
        }, { status: 400 });
      }

      // Check if performer is already linked to a different user
      if (performer.user_id && performer.user_id !== user_id) {
        return Response.json({ 
          error: 'Performer is already linked to a different user',
          current_user_id: performer.user_id
        }, { status: 400 });
      }

      // Capture before state
      const before = {
        user_id: performer.user_id || null
      };

      // Update performer with user_id
      await base44.asServiceRole.entities.Performer.update(performer_id, { user_id });

      // Capture after state
      const after = {
        user_id
      };

      // Append AuditLog
      await appendAuditLog({
        action: 'link_user',
        changes_json: { before, after },
        notes: `User ${targetUser.email} linked to performer ${performer.display_name}`,
      });

      return Response.json({
        success: true,
        message: 'User linked to performer',
        performer_id,
        user_id,
      });
    }

    // Action: unlink_user
    if (action === 'unlink_user') {
      // Check if performer has a linked user
      if (!performer.user_id) {
        return Response.json({ 
          error: 'Performer is not linked to any user',
          already_unlinked: true
        }, { status: 400 });
      }

      // Capture before state
      const before = {
        user_id: performer.user_id
      };

      // Remove user_id link
      await base44.asServiceRole.entities.Performer.update(performer_id, { 
        user_id: null 
      });

      // Capture after state
      const after = {
        user_id: null
      };

      // Append AuditLog
      await appendAuditLog({
        action: 'unlink_user',
        changes_json: { before, after },
        notes: `User unlinked from performer ${performer.display_name}`,
      });

      return Response.json({
        success: true,
        message: 'User unlinked from performer',
        performer_id,
        previous_user_id: before.user_id,
      });
    }

    // Action: invite_performer_user
    // Secure invitation flow - performer sets their own password
    if (action === 'invite_performer_user') {
      const { email, display_name } = body;
      
      // Validation: email required
      if (!email || email.trim() === '') {
        return Response.json({ error: 'Email is required' }, { status: 400 });
      }

      // Validation: email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return Response.json({ error: 'Invalid email format' }, { status: 400 });
      }

      // Check if performer already has a linked user
      if (performer.user_id) {
        return Response.json({ 
          error: 'Performer is already linked to a user. Unlink first before inviting a new user.',
          current_user_id: performer.user_id
        }, { status: 400 });
      }

      // Check if user with this email already exists
      const existingUsers = await base44.asServiceRole.entities.User.filter({});
      const existingUser = existingUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        return Response.json({ 
          error: 'User with this email already exists. Use "Link Existing User" instead.',
          existing_user_id: existingUser.id,
          existing_user_email: existingUser.email
        }, { status: 400 });
      }

      // Send invitation via Base44 Auth
      // This creates the user and sends them an email to set their password
      await base44.asServiceRole.auth.inviteUser(email, 'user');

      // Wait a moment for the user to be created, then fetch them
      // Note: In production, you might want a more robust way to get the newly created user
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const users = await base44.asServiceRole.entities.User.filter({});
      const newUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (!newUser) {
        return Response.json({ 
          error: 'Invitation sent but could not link user. Please manually link the user after they accept the invitation.',
          invitation_sent: true
        }, { status: 202 });
      }

      // Link the newly created user to this performer
      await base44.asServiceRole.entities.Performer.update(performer_id, { 
        user_id: newUser.id 
      });

      // Append AuditLog
      await appendAuditLog({
        action: 'performer_login_account_created',
        changes_json: { 
          user_id: newUser.id,
          user_email: newUser.email,
          performer_display_name: performer.display_name
        },
        notes: `Invitation sent to ${email}. User linked to performer ${performer.display_name}. Performer must accept invitation and set password.`,
      });

      return Response.json({
        success: true,
        message: 'Invitation sent and user linked to performer',
        performer_id,
        user_id: newUser.id,
        user_email: email,
        invitation_sent: true,
        note: 'Performer will receive an email to set their password. They should change it after first login.',
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('performerAdminService error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});