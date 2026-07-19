import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

async function sha(value) {
  const data = new TextEncoder().encode(value || '');
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_SCOPE = ['photo', 'intro_video', 'hardcore_video', 'id_document_front', 'id_document_back', 'selfie_with_id'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { application_id } = await req.json();
    if (!application_id) return Response.json({ error: 'Missing application_id' }, { status: 400 });

    const application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
    if (!application) return Response.json({ error: 'Application not found' }, { status: 404 });

    const isOwner = application.applicant_user_id === user?.id || application.linked_user_id === user?.id || application.email === user?.email;
    const isAdmin = user?.role === 'admin';
    if (!isOwner && !isAdmin) return Response.json({ error: 'Access denied' }, { status: 403 });

    const existing = await base44.asServiceRole.entities.ApplicationUploadToken.filter({ application_id, status: 'issued' });
    for (const record of existing || []) {
      await base44.asServiceRole.entities.ApplicationUploadToken.update(record.id, { status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: user?.id || 'owner' });
    }

    const rawToken = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const tokenRecord = await base44.asServiceRole.entities.ApplicationUploadToken.create({
      application_id,
      token_hash: await sha(rawToken),
      status: 'issued',
      allowed_upload_scope: DEFAULT_SCOPE,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      validation_count: 0,
    });

    await base44.asServiceRole.entities.GuestProductionApplication.update(application_id, { last_activity_at: new Date().toISOString() });
    const baseUrl = Deno.env.get('APP_BASE_URL') || 'http://localhost:5173';
    return Response.json({ success: true, token: rawToken, token_id: tokenRecord.id, upload_url: `${baseUrl}/application-upload?token=${rawToken}`, expires_at: expiresAt, expires_in_days: 7 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});