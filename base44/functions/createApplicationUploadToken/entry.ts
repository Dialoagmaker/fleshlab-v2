/**
 * createApplicationUploadToken
 * Admin-only. Generates a secure upload token for an applicant to upload/replace missing files.
 * Token is unguessable, scoped to one application, and optionally expires.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { v4 as uuidv4 } from 'npm:uuid@9.0.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { application_id, expires_in_days = 7 } = body;

    if (!application_id) {
      return Response.json({ error: 'application_id is required' }, { status: 400 });
    }

    // Verify application exists
    const application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
    if (!application) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }

    // Generate unguessable token
    const token = uuidv4();
    const expires_at = new Date(Date.now() + (expires_in_days * 24 * 60 * 60 * 1000)).toISOString();

    // Store token in application record
    await base44.asServiceRole.entities.GuestProductionApplication.update(application_id, {
      application_upload_token: token,
      application_upload_token_expires_at: expires_at,
      application_upload_token_created_at: new Date().toISOString(),
    });

    const uploadUrl = `${Deno.env.get('APP_BASE_URL')}/application-upload?token=${token}`;

    return Response.json({
      success: true,
      upload_url: uploadUrl,
      token,
      expires_at,
      application_id: application.id,
      applicant_name: application.applicant_name,
      applicant_email: application.email,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});