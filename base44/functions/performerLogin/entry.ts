import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return Response.json({ 
        error: 'Invalid performer username or password' 
      }, { status: 401 });
    }

    // Find performer by multiple possible identifiers:
    // - performer_username
    // - slug (stage name)
    // - display_name
    // - linked user email (fallback)
    let performer = null;
    
    // Try performer_username first
    const byUsername = await base44.asServiceRole.entities.Performer.filter({
      performer_username: identifier
    });
    if (byUsername && byUsername.length > 0) {
      performer = byUsername[0];
    }
    
    // Try slug (stage name)
    if (!performer) {
      const bySlug = await base44.asServiceRole.entities.Performer.filter({
        slug: identifier
      });
      if (bySlug && bySlug.length > 0) {
        performer = bySlug[0];
      }
    }
    
    // Try display_name
    if (!performer) {
      const byDisplayName = await base44.asServiceRole.entities.Performer.filter({
        display_name: identifier
      });
      if (byDisplayName && byDisplayName.length > 0) {
        performer = byDisplayName[0];
      }
    }
    
    // Fallback: try to find by linked user email
    if (!performer) {
      const users = await base44.asServiceRole.entities.User.filter({
        email: identifier
      });
      if (users && users.length > 0) {
        const user = users[0];
        if (user.performer_profile_id || user.performer_id) {
          const performerId = user.performer_profile_id || user.performer_id;
          const performerRecords = await base44.asServiceRole.entities.Performer.filter({
            id: performerId
          });
          if (performerRecords && performerRecords.length > 0) {
            performer = performerRecords[0];
          }
        }
      }
    }

    // If no performer found, return generic error
    if (!performer) {
      return Response.json({ 
        error: 'Invalid performer username or password' 
      }, { status: 401 });
    }

    // Check if login is enabled
    if (!performer.performer_login_enabled) {
      return Response.json({ 
        error: 'Invalid performer username or password' 
      }, { status: 401 });
    }

    // Check account status
    if (performer.account_status !== 'active') {
      return Response.json({ 
        error: 'Invalid performer username or password' 
      }, { status: 401 });
    }

    // Verify password with bcrypt
    const passwordMatch = await bcrypt.compare(password, performer.performer_password_hash);
    
    if (!passwordMatch) {
      return Response.json({ 
        error: 'Invalid username or password' 
      }, { status: 401 });
    }

    // Update last login timestamp
    await base44.asServiceRole.entities.Performer.update(performer.id, {
      performer_last_login_at: new Date().toISOString()
    });

    // Create AuditLog entry
    await base44.asServiceRole.entities.AuditLog.create({
      entity_type: 'Performer',
      entity_id: performer.id,
      actor_id: performer.id,
      actor_role: 'performer',
      action: 'performer_login',
      changes_json: JSON.stringify({
        performer_id: performer.id,
        username: performer.performer_username,
        timestamp: new Date().toISOString()
      }),
      notes: 'Performer logged in successfully'
    });

    // Return safe performer object (NO password hash, NO admin-only fields)
    const safePerformer = {
      id: performer.id,
      display_name: performer.display_name,
      slug: performer.slug,
      profile_image_url: performer.profile_image_url,
      cover_image_url: performer.cover_image_url,
      status: performer.status,
      account_status: performer.account_status,
      kyc_status: performer.kyc_status,
      verified: performer.verified,
      fanclub_enabled: performer.fanclub_enabled,
      must_change_password: performer.performer_must_change_password
    };

    // Generate JWT token (7 days expiration for security)
    const tokenPayload = {
      performer_id: performer.id,
      user_type: 'performer',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    // Use Base44's token generation (simplified - in production use proper JWT signing)
    // For MVP, we'll use a secure random token stored in a session entity
    const sessionToken = crypto.randomUUID();
    
    // Create session record
    await base44.asServiceRole.entities.PerformerSession.create({
      performer_id: performer.id,
      token: sessionToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Check if user has linked Base44 account
    let linkedUserId = null;
    if (performer.user_id) {
      linkedUserId = performer.user_id;
    }

    return Response.json({
      success: true,
      token: sessionToken,
      performer: safePerformer,
      user_id: linkedUserId,
      message: performer.performer_must_change_password ? 
        'Login successful. Password change required.' : 
        'Login successful'
    });

  } catch (error) {
    return Response.json({ 
      error: 'Login failed. Please try again.' 
    }, { status: 500 });
  }
});