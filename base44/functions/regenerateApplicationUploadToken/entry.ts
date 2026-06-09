/**
 * regenerateApplicationUploadToken
 * Generates a new upload token for an existing application.
 * Used when applicant needs to re-upload files or token expired.
 * Access control: Only applicant/performer themselves or admin.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const body = await req.json();
    const { application_id } = body;

    if (!application_id) {
      return Response.json({ error: 'Missing application_id' }, { status: 400 });
    }

    const application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
    
    if (!application) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }

    // Access control
    const isOwner = 
      application.applicant_user_id === user?.id || 
      application.linked_user_id === user?.id ||
      application.email === user?.email;
    
    const isAdmin = user?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate new token
    const newToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

    await base44.asServiceRole.entities.GuestProductionApplication.update(application_id, {
      application_upload_token: newToken,
      application_upload_token_expires_at: expiresAt.toISOString(),
      last_activity_at: new Date().toISOString()
    });

    // Create upload URL
    const baseUrl = Deno.env.get('APP_BASE_URL') || globalThis.location?.origin || 'http://localhost:5173';
    const uploadUrl = `${baseUrl}/application-upload?token=${newToken}`;

    return Response.json({
      success: true,
      token: newToken,
      upload_url: uploadUrl,
      expires_at: expiresAt.toISOString(),
      expires_in_days: 7
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});