import http from 'node:http';
import { Pool } from 'pg';
import { loadConfig } from './config.js';
import { HttpError, unavailable } from './errors.js';
import { RecruitingService } from './recruiting.js';
import { createAzureBlob } from './blob.js';
import { AuthService, requireSameOrigin } from './auth.js';
import { DashboardService } from './dashboards.js';
import { importEntities, snapshotFromExports } from './import-base44.js';
import { CatalogueService } from './catalog.js';
import { DataExportService } from './data-export.js';
import { NewsService } from './news.js';
import { DiscoveryService } from './discovery.js';
import { CampaignService } from './campaigns.js';
import { MarketingService } from './marketing.js';
import { AdminOperationsService } from './admin-operations.js';
import { V3CatalogueService } from './v3-catalogue.js';
import { V3CreatorService } from './v3-creators.js';
import { V3CommerceService } from './v3-commerce.js';
import { V3OperationsService } from './v3-operations.js';
import { V3ContractService, contractSigningEnabled } from './v3-contracts.js';

const config = loadConfig();
const pool = new Pool({ connectionString: config.databaseUrl || undefined });
const unavailableBlob = { issueWriteUrl: async () => { throw unavailable('Private upload storage'); }, verifyObject: async () => null };
const recruiting = new RecruitingService(pool, createAzureBlob(config) || unavailableBlob);
const auth = new AuthService(pool, config);
const dashboards = new DashboardService(pool);
const catalogue = new CatalogueService(pool);
const dataExports = new DataExportService(pool);
const news = new NewsService(pool);
const discovery = new DiscoveryService(pool);
const campaigns = new CampaignService(pool);
const marketing = new MarketingService(pool);
const adminOperations = new AdminOperationsService(pool);
const v3Catalogue = new V3CatalogueService(pool);
const v3Creators = new V3CreatorService(pool);
const v3Commerce = new V3CommerceService(pool);
const v3Operations = new V3OperationsService(pool);
const v3Contracts = new V3ContractService(pool);

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers });
  res.end(JSON.stringify(body));
}
function sendBinary(res, status, bytes, headers = {}) {
  res.writeHead(status, { 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff', ...headers });
  res.end(bytes);
}
async function body(req, maximumBytes = 1024 * 1024) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const value = Buffer.concat(chunks);
  if (value.length > maximumBytes) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request is too large.');
  try { return JSON.parse(value.toString('utf8') || '{}'); } catch { throw new HttpError(400, 'INVALID_JSON', 'Request body must be JSON.'); }
}
function tokenFrom(req) { return req.headers['x-application-continuation']; }

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'GET' && url.pathname === '/healthz') return send(res, 200, { status: 'ok', service: 'fleshlab-api', mediaMigrationEnabled: config.mediaMigrationEnabled });
    if (req.method === 'POST' && url.pathname === '/api/v1/public/functions/getPublicNews') return send(res, 200, await news.list({ publicOnly: true }));
    if (req.method === 'POST' && url.pathname === '/api/v1/public/functions/getPublicNewsArticleBySlug') return send(res, 200, await news.get((await body(req)).slug, { publicOnly: true }));
    if (req.method === 'POST' && /^\/api\/v1\/public\/functions\/[a-zA-Z0-9_-]+$/.test(url.pathname)) {
      const result = await catalogue.dispatch(url.pathname.split('/').at(-1), await body(req));
      if (result) return send(res, 200, result, { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
      throw unavailable(`Public function ${url.pathname.split('/').at(-1)}`);
    }
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
    if (req.method === 'GET' && url.pathname === '/api/v1/dashboard/profile') return send(res, 200, await dashboards.profile(await auth.current(req)));
    if (req.method === 'PATCH' && url.pathname === '/api/v1/dashboard/profile') { requireSameOrigin(req, config); return send(res, 200, await dashboards.updateProfile(await auth.current(req), await body(req))); }
    if (req.method === 'GET' && url.pathname === '/api/v1/dashboard/customer') return send(res, 200, await dashboards.customer(await auth.current(req)));
    if (req.method === 'GET' && url.pathname === '/api/v1/dashboard/performer') return send(res, 200, await dashboards.performer(await auth.current(req)));
    if (req.method === 'GET' && url.pathname === '/api/v1/dashboard/admin') return send(res, 200, await dashboards.admin(await auth.current(req)));
    if (req.method === 'GET' && url.pathname === '/api/v1/admin/catalogue') {
      await auth.requireRole(req, ['admin']);
      return send(res, 200, await catalogue.adminSnapshot());
    }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/catalogue/overview') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Catalogue.overview()); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/catalogue\/(brands|performers|videos)$/.test(url.pathname)) { await auth.requireRole(req,['staff','admin']); const type=url.pathname.split('/').at(-1); return send(res,200,await v3Catalogue.list(type==='brands'?'brands':type==='performers'?'performers':'videos',{q:url.searchParams.get('q'),page:url.searchParams.get('page'),limit:url.searchParams.get('limit')})); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/catalogue\/(brand|performer|video)\/[^/]+$/.test(url.pathname)) { await auth.requireRole(req,['staff','admin']); const parts=url.pathname.split('/'); return send(res,200,await v3Catalogue.detail(parts.at(-2),parts.at(-1))); }
    if (req.method === 'PATCH' && /^\/api\/v3\/admin\/catalogue\/(brand|performer|video)\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); const parts=url.pathname.split('/'); return send(res,200,await v3Catalogue.update(parts.at(-2),parts.at(-1),await body(req),user)); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/catalogue\/video\/[^/]+\/performers$/.test(url.pathname)) { await auth.requireRole(req,['staff','admin']); return send(res,200,{records:await v3Catalogue.relationships(url.pathname.split('/').at(-2))}); }
    if (req.method === 'PUT' && /^\/api\/v3\/admin\/catalogue\/video\/[^/]+\/performers$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,200,{records:await v3Catalogue.replaceRelationships(url.pathname.split('/').at(-2),(await body(req)).performer_ids,user)}); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/catalogue/collections') { await auth.requireRole(req,['staff','admin']); return send(res,200,{records:await v3Catalogue.collections()}); }
    if (req.method === 'POST' && url.pathname === '/api/v3/admin/catalogue/collections') { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Catalogue.saveCollection(null,await body(req),user)); }
    if (req.method === 'PATCH' && /^\/api\/v3\/admin\/catalogue\/collections\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,200,await v3Catalogue.saveCollection(url.pathname.split('/').at(-1),await body(req),user)); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/catalogue\/collections\/[^/]+\/videos$/.test(url.pathname)) { await auth.requireRole(req,['staff','admin']); return send(res,200,{records:await v3Catalogue.collectionVideos(url.pathname.split('/').at(-2))}); }
    if (req.method === 'PUT' && /^\/api\/v3\/admin\/catalogue\/collections\/[^/]+\/videos$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,200,{records:await v3Catalogue.replaceCollectionVideos(url.pathname.split('/').at(-2),(await body(req)).video_ids,user)}); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/catalogue/migration-report') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Catalogue.migrationReport()); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/creators/overview') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Creators.overview()); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/creators/applications') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Creators.applications({status:url.searchParams.get('status'),q:url.searchParams.get('q'),page:url.searchParams.get('page'),limit:url.searchParams.get('limit')})); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/creators\/applications\/[^/]+$/.test(url.pathname)) { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Creators.application(url.pathname.split('/').at(-1))); }
    if (req.method === 'PATCH' && /^\/api\/v3\/admin\/creators\/applications\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Creators.updateApplication(url.pathname.split('/').at(-1),await body(req),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/creators\/applications\/[^/]+\/convert$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,200,await v3Creators.ensureCreator(url.pathname.split('/').at(-2),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/creators\/applications\/[^/]+\/performer-link$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,200,await v3Creators.linkPerformer(url.pathname.split('/').at(-2),await body(req),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/creators\/applications\/[^/]+\/account-link$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); const input=await body(req); return send(res,200,await v3Creators.linkAccount(url.pathname.split('/').at(-2),input.performer_user_id,user)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/creators') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Creators.creators({q:url.searchParams.get('q'),page:url.searchParams.get('page'),limit:url.searchParams.get('limit')})); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/creators\/records\/[^/]+$/.test(url.pathname)) { const user=await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Creators.creator(url.pathname.split('/').at(-1),{actor:user})); }
    if (req.method === 'PATCH' && /^\/api\/v3\/admin\/creators\/records\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,200,await v3Creators.updateCreator(url.pathname.split('/').at(-1),await body(req),user)); }
    if (req.method === 'PATCH' && /^\/api\/v3\/admin\/creators\/records\/[^/]+\/onboarding\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['staff','admin']); const parts=url.pathname.split('/'); return send(res,200,await v3Creators.updateOnboarding(parts.at(-3),parts.at(-1),await body(req),user)); }
    if (req.method === 'PATCH' && /^\/api\/v3\/admin\/creators\/records\/[^/]+\/documents\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['staff','admin']); const parts=url.pathname.split('/'); return send(res,200,await v3Creators.reviewDocument(parts.at(-3),parts.at(-1),await body(req),user)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/creator/me') return send(res,200,await v3Creators.creatorForUser(await auth.current(req)));
    if (req.method === 'PATCH' && url.pathname === '/api/v3/creator/me') { requireSameOrigin(req,config); const user=await auth.current(req); const current=await v3Creators.creatorForUser(user); return send(res,200,await v3Creators.updateCreator(current.creator.id,await body(req),user,{self:true})); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/commerce/overview') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Commerce.overview()); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/contracts/overview') { const user=await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Contracts.overview(user)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/contracts/templates') { const user=await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Contracts.templates(user)); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/contracts\/templates\/[^/]+$/.test(url.pathname)) { const user=await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Contracts.template(url.pathname.split('/').at(-1),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/contracts\/templates\/[^/]+\/versions$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Contracts.createVersion(url.pathname.split('/').at(-2),await body(req),user)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/contracts') { const user=await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Contracts.instances(user)); }
    if (req.method === 'POST' && url.pathname === '/api/v3/admin/contracts/assign') { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Contracts.assign(await body(req),user)); }
    if (req.method === 'POST' && url.pathname === '/api/v3/admin/contracts/import-legacy') { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Contracts.importLegacy(await body(req),user)); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/contracts\/[^/]+\/pdf$/.test(url.pathname)) { const user=await auth.requireRole(req,['staff','admin']); const result=await v3Contracts.pdf(url.pathname.split('/').at(-2),user,{admin:true}); return sendBinary(res,200,result.bytes,{'content-type':'application/pdf','content-disposition':`attachment; filename="${result.contract_number}.pdf"`}); }
    if (req.method === 'GET' && url.pathname === '/api/v3/creator/contracts') { const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Contracts.creatorInstances(user)); }
    if (req.method === 'GET' && /^\/api\/v3\/creator\/contracts\/[^/]+\/pdf$/.test(url.pathname)) { const user=await auth.requireRole(req,['performer']); const result=await v3Contracts.pdf(url.pathname.split('/').at(-2),user); return sendBinary(res,200,result.bytes,{'content-type':'application/pdf','content-disposition':`attachment; filename="${result.contract_number}.pdf"`}); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/production/overview') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Operations.production()); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/growth/overview') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Operations.growth()); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/system/overview') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Operations.system()); }
    if (req.method === 'GET' && /^\/api\/v1\/admin\/exports\/(?:all|Brand|Performer|Video|VideoPerformer)$/i.test(url.pathname)) {
      await auth.requireRole(req, ['admin']);
      return send(res, 200, await dataExports.exports(url.pathname.split('/').at(-1)));
    }
    if (req.method === 'GET' && url.pathname === '/api/v1/admin/news') { await auth.requireRole(req, ['admin']); return send(res, 200, await news.list()); }
    if (req.method === 'POST' && url.pathname === '/api/v1/admin/news') { requireSameOrigin(req, config); await auth.requireRole(req, ['admin']); return send(res, 201, await news.save(null, await body(req))); }
    if (/^\/api\/v1\/admin\/news\/[^/]+$/.test(url.pathname)) { const id=url.pathname.split('/').at(-1); if(req.method==='PATCH'){requireSameOrigin(req,config);await auth.requireRole(req,['admin']);return send(res,200,await news.save(id,await body(req)));} if(req.method==='DELETE'){requireSameOrigin(req,config);await auth.requireRole(req,['admin']);return send(res,200,await news.remove(id));} }
    if (req.method === 'GET' && url.pathname === '/api/v1/admin/discovery') { await auth.requireRole(req, ['staff', 'admin']); return send(res, 200, await discovery.snapshot(await auth.current(req))); }
    if (req.method === 'GET' && url.pathname === '/api/v1/admin/campaigns') { await auth.requireRole(req, ['admin']); return send(res, 200, await campaigns.list()); }
    if (req.method === 'GET' && url.pathname === '/api/v1/admin/marketing') { await auth.requireRole(req, ['staff','admin']); return send(res, 200, await marketing.snapshot(await auth.current(req))); }
    if (req.method === 'GET' && /^\/api\/v1\/admin\/operations\/(rendering|qa|audit|certification|readiness|automation|settings)$/.test(url.pathname)) {
      await auth.requireRole(req, ['admin']); return send(res, 200, { records: await adminOperations.list(url.pathname.split('/').at(-1)) });
    }
    if (req.method === 'POST' && /^\/api\/v1\/admin\/operations\/(rendering|qa|audit|certification|readiness|automation|settings)$/.test(url.pathname)) {
      requireSameOrigin(req, config); const user = await auth.requireRole(req, ['admin']); return send(res, 201, await adminOperations.save(url.pathname.split('/').at(-1), null, await body(req), user));
    }
    if (/^\/api\/v1\/admin\/operations\/(rendering|qa|audit|certification|readiness|automation|settings)\/[^/]+$/.test(url.pathname)) {
      const parts = url.pathname.split('/'); const kind = parts.at(-2); const id = parts.at(-1);
      if (req.method === 'PATCH') { requireSameOrigin(req, config); const user = await auth.requireRole(req, ['admin']); return send(res, 200, await adminOperations.save(kind, id, await body(req), user)); }
      if (req.method === 'DELETE') { requireSameOrigin(req, config); await auth.requireRole(req, ['admin']); return send(res, 200, await adminOperations.remove(kind, id)); }
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/admin/campaigns') { requireSameOrigin(req,config); await auth.requireRole(req,['admin']); return send(res,201,await campaigns.save(null,await body(req))); }
    if (/^\/api\/v1\/admin\/campaigns\/[^/]+$/.test(url.pathname)){const id=url.pathname.split('/').at(-1);if(req.method==='PATCH'){requireSameOrigin(req,config);await auth.requireRole(req,['admin']);return send(res,200,await campaigns.save(id,await body(req)));}if(req.method==='DELETE'){requireSameOrigin(req,config);await auth.requireRole(req,['admin']);return send(res,200,await campaigns.remove(id));}}
    if (req.method === 'POST' && url.pathname === '/api/v1/admin/imports/base44/catalogue/dry-run') {
      requireSameOrigin(req, config); await auth.requireRole(req, ['admin']);
      return send(res, 200, await importEntities({ snapshot: snapshotFromExports((await body(req, 25 * 1024 * 1024)).exports), execute: false, pool }));
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/admin/imports/base44/catalogue/execute') {
      requireSameOrigin(req, config); await auth.requireRole(req, ['admin']);
      return send(res, 200, await importEntities({ snapshot: snapshotFromExports((await body(req, 25 * 1024 * 1024)).exports), execute: true, pool }));
    }
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
    if (req.method === 'GET' && url.pathname === '/api/v1/admin/recruiting/performer-accounts') {
      await auth.requireRole(req, ['admin']); return send(res, 200, await recruiting.listAssignablePerformerAccounts());
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
    // Import validation intentionally raises a plain domain error so the same
    // validator can be used by the CLI and the HTTP endpoint.  It is a client
    // correctable input error, never an internal server failure.  Keeping this
    // mapping here also ensures we don't expose database/provider errors.
    const importValidationError = error?.code === 'IMPORT_INVALID';
    const status = error instanceof HttpError ? error.status : importValidationError ? 422 : 500;
    const message = status === 500 ? 'Internal server error.' : error.message;
    if (status === 500) console.error(JSON.stringify({ event: 'request_failed', code: error?.code || 'INTERNAL_ERROR', name: error?.name || 'Error' }));
    send(res, status, { error: { code: error.code || 'INTERNAL_ERROR', message } });
  }
});

// Docker networking is the only caller in production. The API has no host
// port mapping, so binding all container interfaces does not expose it.
server.listen(config.port, '0.0.0.0', () => console.log(`FLESHLAB API listening on internal port ${config.port}`));
