import http from 'node:http';
import { Pool } from 'pg';
import { loadConfig } from './config.js';
import { HttpError, unavailable } from './errors.js';
import { RecruitingService } from './recruiting.js';
import { createAzureBlob } from './blob.js';
import { AuthService, requireSameOrigin } from './auth.js';

const config = loadConfig();
const pool = new Pool({ connectionString: config.databaseUrl || undefined });
const unavailableBlob = { issueWriteUrl: async () => { throw unavailable('Private upload storage'); }, verifyObject: async () => null };
const recruiting = new RecruitingService(pool, createAzureBlob(config) || unavailableBlob);
const auth = new AuthService(pool, config);

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers });
  res.end(JSON.stringify(body));
}
async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (Buffer.concat(chunks).length > 1024 * 1024) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request is too large.');
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw new HttpError(400, 'INVALID_JSON', 'Request body must be JSON.'); }
}
function tokenFrom(req) { return req.headers['x-application-continuation']; }

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'GET' && url.pathname === '/healthz') return send(res, 200, { status: 'ok', service: 'fleshlab-api', mediaMigrationEnabled: config.mediaMigrationEnabled });
    if (req.method === 'GET' && url.pathname === '/api/v1/auth/me') return send(res, 200, await auth.current(req));
    if (req.method === 'POST' && url.pathname === '/api/v1/auth/register') { requireSameOrigin(req, config); return send(res, 201, await auth.register(await body(req), req.socket.remoteAddress)); }
    if (req.method === 'POST' && url.pathname === '/api/v1/auth/login') {
      requireSameOrigin(req, config);
      const result = await auth.login(await body(req), req.socket.remoteAddress);
      return send(res, 200, result.user, { 'set-cookie': result.cookie });
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/auth/verify-email') { requireSameOrigin(req, config); return send(res, 200, await auth.verifyEmail(await body(req))); }
    if (req.method === 'POST' && url.pathname === '/api/v1/auth/password/reset-request') { requireSameOrigin(req, config); return send(res, 202, await auth.requestPasswordReset(await body(req), req.socket.remoteAddress)); }
    if (req.method === 'POST' && url.pathname === '/api/v1/auth/password/reset') { requireSameOrigin(req, config); return send(res, 200, await auth.resetPassword(await body(req))); }
    if (req.method === 'POST' && url.pathname === '/api/v1/auth/logout') { requireSameOrigin(req, config); return send(res, 204, {}, { 'set-cookie': await auth.logout(req) }); }
    if (req.method === 'POST' && url.pathname === '/api/v1/recruiting/applications') return send(res, 201, await recruiting.createApplication(await body(req), req.headers['idempotency-key']));
    if (req.method === 'POST' && url.pathname === '/api/v1/recruiting/applications/draft') return send(res, 201, await recruiting.startDraft(await body(req)));
    if (req.method === 'GET' && url.pathname === '/api/v1/recruiting/applications/resume') return send(res, 200, await recruiting.resume(url.searchParams.get('token')));
    if (req.method === 'POST' && url.pathname === '/api/v1/recruiting/uploads') return send(res, 201, await recruiting.issueUpload(tokenFrom(req), await body(req)));
    if (req.method === 'POST' && /^\/api\/v1\/recruiting\/uploads\/[^/]+\/confirm$/.test(url.pathname)) {
      return send(res, 200, await recruiting.confirmUpload(tokenFrom(req), url.pathname.split('/')[5]));
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/functions/createApplicationUploadUrl') {
      const input = await body(req);
      return send(res, 201, await recruiting.issueSessionUpload(input.application_session_id, { name: input.file_name, contentType: input.mime_type, byteSize: Number(input.file_size_bytes), fileType: input.file_type }));
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/functions/uploadFileViaToken') {
      const input = await body(req);
      const continuation = String(input.token || '');
      if (input.validate_only) {
        const resumed = await recruiting.resume(continuation);
        return send(res, 200, { application_id: resumed.application.id, uploads: resumed.uploads });
      }
      return send(res, 201, await recruiting.issueSessionUpload(continuation, { name: input.file_name, contentType: input.mime_type, byteSize: Number(input.file_size_bytes), fileType: input.file_type }));
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/functions/finalizeTokenUpload') {
      const input = await body(req);
      return send(res, 200, await recruiting.confirmSessionUpload(input.token || input.application_session_id, input.intent_id));
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/functions/submitPerformerApplication') return send(res, 201, await recruiting.submitLegacy(await body(req)));
    if (req.method === 'GET' && url.pathname === '/api/v1/admin/recruiting/applications') {
      await auth.requireRole(req, ['staff', 'admin']);
      return send(res, 200, await recruiting.listForReview({ cursor: url.searchParams.get('cursor'), limit: url.searchParams.get('limit'), status: url.searchParams.get('status') }));
    }
    if (/^\/api\/v1\/admin\/recruiting\/applications\/[^/]+$/.test(url.pathname)) {
      const applicationId = url.pathname.split('/').at(-1);
      if (req.method === 'GET') { await auth.requireRole(req, ['staff', 'admin']); return send(res, 200, await recruiting.reviewDetail(applicationId)); }
      if (req.method === 'PATCH') { requireSameOrigin(req, config); await auth.requireRole(req, ['staff', 'admin']); return send(res, 200, await recruiting.updateReview(applicationId, await body(req))); }
    }
    if (/^\/api\/v1\/admin\/recruiting\/applications\/[^/]+\/approve$/.test(url.pathname) && req.method === 'POST') {
      requireSameOrigin(req, config); await auth.requireRole(req, ['staff', 'admin']); return send(res, 200, await recruiting.approve(url.pathname.split('/').at(-2)));
    }
    if (/^\/api\/v1\/admin\/recruiting\/applications\/[^/]+\/contract$/.test(url.pathname) && req.method === 'POST') {
      requireSameOrigin(req, config); await auth.requireRole(req, ['staff', 'admin']); return send(res, 200, await recruiting.recordContract(url.pathname.split('/').at(-2), await body(req)));
    }
    if (/^\/api\/v1\/admin\/recruiting\/applications\/[^/]+\/performer$/.test(url.pathname) && req.method === 'POST') {
      requireSameOrigin(req, config); await auth.requireRole(req, ['admin']); const input = await body(req); return send(res, 200, await recruiting.assignPerformer(url.pathname.split('/').at(-2), input.performer_user_id));
    }
    throw unavailable(`${req.method} ${url.pathname}`);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    send(res, status, { error: { code: error.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error.' : error.message } });
  }
});

server.listen(config.port, '127.0.0.1', () => console.log(`FLESHLAB API listening on 127.0.0.1:${config.port}`));
