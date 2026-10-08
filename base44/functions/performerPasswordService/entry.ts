import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Verify admin access
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const body = await req.json();
    const { action, performer_id, username, initial_password, confirm_password, enable_login } = body;

    // Action: create_login
    if (action === 'create_login') {
      // Validate inputs
      if (!performer_id || !username || !initial_password || !confirm_password) {
        return Response.json({ 
          error: 'Performer ID, username, initial password, and confirm password are required' 
        }, { status: 400 });
      }

      if (initial_password.length < 10) {
        return Response.json({ 
          error: 'Password must be at least 10 characters long' 
        }, { status: 400 });
      }

      if (initial_password !== confirm_password) {
        return Response.json({ 
          error: 'Passwords do not match' 
        }, { status: 400 });
      }

      // Check if username already exists
      const existingPerformers = await base44.asServiceRole.entities.Performer.filter({
        performer_username: username
      });

      if (existingPerformers && existingPerformers.length > 0) {
        if (existingPerformers[0].id !== performer_id) {
          return Response.json({ 
            error: 'Username already exists. Please choose a different username.' 
          }, { status: 400 });
        }
      }

      // Hash password with bcrypt (salt rounds = 12)
      const passwordHash = await bcrypt.hash(initial_password, 12);

      // Update performer with secure credentials
      const now = new Date().toISOString();
      await base44.asServiceRole.entities.Performer.update(performer_id, {
        performer_username: username,
        performer_password_hash: passwordHash,
        performer_must_change_password: true,
        performer_login_enabled: enable_login !== false, // default true
        performer_login_created_at: now
      });

      // Create AuditLog entry (NO password stored)
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Performer',
        entity_id: performer_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'performer_login_created',
        changes_json: JSON.stringify({
          performer_id: performer_id,
          username: username,
          login_enabled: enable_login !== false,
          must_change_password: true,
          created_at: now
        }),
        notes: `Admin ${user.email} created login credentials for performer`
      });

      return Response.json({
        success: true,
        message: 'Login credentials created successfully',
        temporary_password: initial_password // Show only once, then never again
      });
    }

    // Action: reset_password
    if (action === 'reset_password') {
      if (!performer_id || !initial_password || !confirm_password) {
        return Response.json({ 
          error: 'Performer ID, new password, and confirm password are required' 
        }, { status: 400 });
      }

      if (initial_password.length < 10) {
        return Response.json({ 
          error: 'Password must be at least 10 characters long' 
        }, { status: 400 });
      }

      if (initial_password !== confirm_password) {
        return Response.json({ 
          error: 'Passwords do not match' 
        }, { status: 400 });
      }

      // Verify performer exists
      const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
      if (!performer) {
        return Response.json({ 
          error: 'Performer not found' 
        }, { status: 404 });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(initial_password, 12);

      // Update performer
      await base44.asServiceRole.entities.Performer.update(performer_id, {
        performer_password_hash: passwordHash,
        performer_must_change_password: true,
        performer_login_enabled: true
      });

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Performer',
        entity_id: performer_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'performer_login_password_reset',
        changes_json: JSON.stringify({
          performer_id: performer_id,
          username: performer.performer_username,
          reset_by: user.email,
          reset_at: new Date().toISOString()
        }),
        notes: `Admin ${user.email} reset password for performer ${performer.display_name}`
      });

      return Response.json({
        success: true,
        message: 'Password reset successfully',
        temporary_password: initial_password // Show only once
      });
    }

    // Action: enable_login
    if (action === 'enable_login') {
      if (!performer_id) {
        return Response.json({ 
          error: 'Performer ID is required' 
        }, { status: 400 });
      }

      await base44.asServiceRole.entities.Performer.update(performer_id, {
        performer_login_enabled: true
      });

      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Performer',
        entity_id: performer_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'performer_login_enabled',
        changes_json: JSON.stringify({
          performer_id: performer_id,
          enabled_by: user.email,
          enabled_at: new Date().toISOString()
        }),
        notes: `Admin ${user.email} enabled login for performer`
      });

      return Response.json({ success: true, message: 'Login enabled' });
    }

    // Action: disable_login
    if (action === 'disable_login') {
      if (!performer_id) {
        return Response.json({ 
          error: 'Performer ID is required' 
        }, { status: 400 });
      }

      await base44.asServiceRole.entities.Performer.update(performer_id, {
        performer_login_enabled: false
      });

      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Performer',
        entity_id: performer_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'performer_login_disabled',
        changes_json: JSON.stringify({
          performer_id: performer_id,
          disabled_by: user.email,
          disabled_at: new Date().toISOString()
        }),
        notes: `Admin ${user.email} disabled login for performer`
      });

      return Response.json({ success: true, message: 'Login disabled' });
    }

    // Action: get_performer_login_info
    if (action === 'get_performer_login_info') {
      if (!performer_id) {
        return Response.json({ 
          error: 'Performer ID is required' 
        }, { status: 400 });
      }

      const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
      if (!performer) {
        return Response.json({ 
          error: 'Performer not found' 
        }, { status: 404 });
      }

      // Return ONLY safe fields (NO password hash)
      return Response.json({
        success: true,
        login_info: {
          username: performer.performer_username || null,
          login_enabled: performer.performer_login_enabled || false,
          must_change_password: performer.performer_must_change_password || false,
          last_login_at: performer.performer_last_login_at || null,
          login_created_at: performer.performer_login_created_at || null,
          has_password: !!performer.performer_password_hash
        }
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});