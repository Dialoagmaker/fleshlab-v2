import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const DEFAULT_SCOPE = ['photo', 'intro_video', 'hardcore_video', 'id_document_front', 'id_document_back', 'selfie_with_id'];

async function sha(value) {
  const data = new TextEncoder().encode(value || '');
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function safeScope(scope) {
  if (!Array.isArray(scope) || !scope.length) return DEFAULT_SCOPE;
  const allowed = new Set(DEFAULT_SCOPE);
  return scope.filter(item => allowed.has(item));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action = 'issue', application_id, token, token_id, expires_in_days = 7, allowed_upload_scope } = body || {};

    if (action === 'revoke') {
      let tokens = [];
      if (token_id) {
        const record = await base44.asServiceRole.entities.ApplicationUploadToken.get(token_id).catch(() => null);
        if (record) tokens = [record];
      } else if (token) {
        tokens = await base44.asServiceRole.entities.ApplicationUploadToken.filter({ token_hash: await sha(token) });
      } else if (application_id) {
        tokens = await base44.asServiceRole.entities.ApplicationUploadToken.filter({ application_id, status: 'issued' });
      } else {
        return Response.json({ error: 'token, token_id, or application_id required for revoke' }, { status: 400 });
      }

      for (const record of tokens) {
        if (record.status === 'issued') {
          await base44.asServiceRole.entities.ApplicationUploadToken.update(record.id, {
            status: 'revoked',
            revoked_at: new Date().toISOString(),
            revoked_by: user.id,
          });
        }
      }
      return Response.json({ success: true, revoked_count: tokens.length });
    }

    if (!application_id) {
      return Response.json({ error: 'application_id is required' }, { status: 400 });
    }

    const application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
    if (!application) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }

    const existing = await base44.asServiceRole.entities.ApplicationUploadToken.filter({ application_id, status: 'issued' });
    for (const record of existing || []) {
      await base44.asServiceRole.entities.ApplicationUploadToken.update(record.id, {
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
      });
    }

    const rawToken = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + Number(expires_in_days) * 24 * 60 * 60 * 1000).toISOString();
    const scope = safeScope(allowed_upload_scope);
    const tokenRecord = await base44.asServiceRole.entities.ApplicationUploadToken.create({
      application_id: application.id,
      token_hash: await sha(rawToken),
      status: 'issued',
      allowed_upload_scope: scope,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      validation_count: 0,
    });

    await base44.asServiceRole.entities.GuestProductionApplication.update(application.id, {
      last_activity_at: new Date().toISOString(),
    });

    const baseUrl = Deno.env.get('APP_BASE_URL') || 'http://localhost:5173';
    return Response.json({
      success: true,
      upload_url: `${baseUrl}/application-upload?token=${rawToken}`,
      token: rawToken,
      token_id: tokenRecord.id,
      expires_at: expiresAt,
      application_id: application.id,
      allowed_upload_scope: scope,
      applicant_name: application.applicant_name,
      applicant_email: application.email,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});