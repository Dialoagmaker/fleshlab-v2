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
import { V3ContractService, contractSigningEnabled, renderPdf } from './v3-contracts.js';
import { V3ConsentService } from './v3-consent.js';
import { V3CompensationService } from './v3-compensation.js';
import { V3PublicService } from './v3-public.js';
import { V3ProductionService } from './v3-production.js';
import { V3SystemService, assertPermission, roleDefinitions } from './v3-system.js';
import { V3GrowthService } from './v3-growth.js';
import { V3SubmissionService } from './v3-submissions.js';

const config = loadConfig();
const pool = new Pool({ connectionString: config.databaseUrl || undefined });
const unavailableBlob = { issueWriteUrl: async () => { throw unavailable('Private upload storage'); }, verifyObject: async () => null, uploadStream: async () => { throw unavailable('Private upload storage'); } };
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
const v3Creators = new V3CreatorService(pool, createAzureBlob(config) || unavailableBlob);
const v3Commerce = new V3CommerceService(pool);
const v3Operations = new V3OperationsService(pool);
const v3Contracts = new V3ContractService(pool);
const v3Consent = new V3ConsentService(pool);
const v3Compensation = new V3CompensationService(pool);
const v3Public = new V3PublicService(pool);
const v3Production = new V3ProductionService(pool);
const v3System = new V3SystemService(pool, config, createAzureBlob(config) || null);
const v3Growth = new V3GrowthService(pool, config);
const v3Submissions = new V3SubmissionService(pool, createAzureBlob(config) || unavailableBlob, config);

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers });
  res.end(JSON.stringify(body));
}
function sendBinary(res, status, bytes, headers = {}) {
  res.writeHead(status, { 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff', ...headers });
  res.end(bytes);
}
function sendPrivateStream(res, media) {
  const safeName=String(media.file_name||'private-file').replace(/[^a-zA-Z0-9._-]/g,'_');
  const headers={ 'content-type': media.content_type || 'application/octet-stream', 'content-disposition': `inline; filename=\"${safeName}\"`, 'cache-control':'private, no-store, max-age=0', 'x-content-type-options':'nosniff', 'referrer-policy':'no-referrer' }; if(media.contentLength>0) headers['content-length']=media.contentLength;
  res.writeHead(200, headers);
  media.stream.on('error',()=>res.destroy()); media.stream.pipe(res);
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
    if (req.method === 'GET' && url.pathname === '/api/v3/earn/public') return send(res, 200, { base_rate_minor_per_minute: 100, currency: 'USD', minimum_runtime_seconds: 180, payout_processing_estimate: '1–5 business days', enabled: true });
    if (req.method === 'POST' && url.pathname === '/api/v3/earn/start') { requireSameOrigin(req, config); const input = await body(req); const started = await v3Submissions.start(input, req.socket.remoteAddress); const login = await auth.login({ email: input.email, password: input.password }, req.socket.remoteAddress, { userAgent: req.headers['user-agent'] }); return send(res, 201, { creator_id: started.creator_id, user: login.user }, { 'set-cookie': login.cookie }); }
    if (req.method === 'GET' && url.pathname === '/api/v3/public/homepage') return send(res, 200, await v3Public.homepage(), { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
    if (req.method === 'GET' && url.pathname === '/api/v3/public/catalogue') return send(res, 200, { videos: await v3Public.listVideos({ limit: 12 }), performers: await v3Public.performers({ limit: 12 }), brands: await v3Public.brands({ limit: 12 }) }, { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
    if (req.method === 'GET' && url.pathname === '/api/v3/public/videos') return send(res, 200, await v3Public.listVideos(Object.fromEntries(url.searchParams)), { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
    if (req.method === 'GET' && /^\/api\/v3\/public\/videos\/[^/]+$/.test(url.pathname)) return send(res, 200, await v3Public.video(decodeURIComponent(url.pathname.split('/').at(-1))), { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
    if (req.method === 'GET' && url.pathname === '/api/v3/public/performers') return send(res, 200, await v3Public.performers(Object.fromEntries(url.searchParams)), { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
    if (req.method === 'GET' && /^\/api\/v3\/public\/performers\/[^/]+$/.test(url.pathname)) return send(res, 200, await v3Public.performer(decodeURIComponent(url.pathname.split('/').at(-1))), { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
    if (req.method === 'GET' && url.pathname === '/api/v3/public/brands') return send(res, 200, await v3Public.brands(Object.fromEntries(url.searchParams)), { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
    if (req.method === 'GET' && /^\/api\/v3\/public\/brands\/[^/]+$/.test(url.pathname)) return send(res, 200, await v3Public.brand(decodeURIComponent(url.pathname.split('/').at(-1))), { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
    if (req.method === 'GET' && url.pathname === '/api/v3/public/collections') return send(res, 200, await v3Public.collections(), { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
    if (req.method === 'GET' && /^\/api\/v3\/public\/collections\/[^/]+$/.test(url.pathname)) return send(res, 200, await v3Public.collection(decodeURIComponent(url.pathname.split('/').at(-1))), { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
    if (req.method === 'GET' && /^\/api\/v3\/public\/media\/[^/]+$/.test(url.pathname)) return send(res, 200, await v3Public.media(url.pathname.split('/').at(-1)), { 'cache-control': 'public, max-age=300, stale-while-revalidate=600' });
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
      const result = await auth.login(await body(req), req.socket.remoteAddress, { userAgent: req.headers['user-agent'] });
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
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/catalogue/homepage') { const user=await auth.current(req); assertPermission(user,'catalogue.publish'); return send(res,200,await v3Public.adminHomepage()); }
    if (req.method === 'PATCH' && url.pathname === '/api/v3/admin/catalogue/homepage') { requireSameOrigin(req,config); const user=await auth.current(req); assertPermission(user,'catalogue.publish'); return send(res,200,await v3Public.updateHomepage(await body(req),user,req)); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/catalogue\/(brands|performers|videos)$/.test(url.pathname)) { await auth.requireRole(req,['staff','admin']); const type=url.pathname.split('/').at(-1); return send(res,200,await v3Catalogue.list(type==='brands'?'brands':type==='performers'?'performers':'videos',Object.fromEntries(url.searchParams))); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/catalogue\/(brand|performer|video)\/[^/]+$/.test(url.pathname)) { await auth.requireRole(req,['staff','admin']); const parts=url.pathname.split('/'); return send(res,200,await v3Catalogue.detail(parts.at(-2),parts.at(-1))); }
    if (req.method === 'PATCH' && /^\/api\/v3\/admin\/catalogue\/(brand|performer|video)\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); const parts=url.pathname.split('/'); return send(res,200,await v3Catalogue.update(parts.at(-2),parts.at(-1),await body(req),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/catalogue\/video\/[^/]+\/(publish|unpublish|archive)$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); const parts=url.pathname.split('/'); return send(res,200,await v3Catalogue.transition(parts.at(-2),parts.at(-1),user)); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/catalogue\/video\/[^/]+\/performers$/.test(url.pathname)) { await auth.requireRole(req,['staff','admin']); return send(res,200,{records:await v3Catalogue.relationships(url.pathname.split('/').at(-2))}); }
    if (req.method === 'PUT' && /^\/api\/v3\/admin\/catalogue\/video\/[^/]+\/performers$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,200,{records:await v3Catalogue.replaceRelationships(url.pathname.split('/').at(-2),(await body(req)).performer_ids,user)}); }
    if (req.method === 'PUT' && /^\/api\/v3\/admin\/catalogue\/video\/[^/]+\/media$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,200,{records:await v3Catalogue.assignMedia(url.pathname.split('/').at(-2),await body(req),user)}); }
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
    if (req.method === 'GET' && url.pathname === '/api/v3/creator/submissions/identity') { const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Submissions.identity(user)); }
    if (req.method === 'POST' && url.pathname === '/api/v3/creator/submissions/identity/upload') { requireSameOrigin(req,config); const user=await auth.requireRole(req,['performer']); return send(res,201,await v3Submissions.issueIdentityUpload(user,await body(req),req)); }
    if (req.method === 'PUT' && /^\/api\/v3\/creator\/submissions\/identity\/documents\/[^/]+\/upload$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Submissions.streamIdentityUpload(user,url.pathname.split('/').at(-2),req)); }
    if (req.method === 'POST' && /^\/api\/v3\/creator\/submissions\/identity\/documents\/[^/]+\/confirm$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Submissions.confirmIdentityUpload(user,url.pathname.split('/').at(-2),req)); }
    if (req.method === 'POST' && url.pathname === '/api/v3/creator/submissions/upload') { requireSameOrigin(req,config); const user=await auth.requireRole(req,['performer']); return send(res,201,await v3Submissions.issueVideoUpload(user,await body(req),req)); }
    if (req.method === 'PUT' && /^\/api\/v3\/creator\/submissions\/[^/]+\/upload$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Submissions.streamVideoUpload(user,url.pathname.split('/').at(-2),req)); }
    if (req.method === 'POST' && /^\/api\/v3\/creator\/submissions\/[^/]+\/confirm$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Submissions.confirmVideoUpload(user,url.pathname.split('/').at(-2),req)); }
    if (req.method === 'PUT' && /^\/api\/v3\/creator\/submissions\/[^/]+\/rights$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Submissions.rights(user,url.pathname.split('/').at(-2),await body(req),req)); }
    if (req.method === 'POST' && /^\/api\/v3\/creator\/submissions\/[^/]+\/submit$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Submissions.submit(user,url.pathname.split('/').at(-2),req)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/creator/submissions') { const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Submissions.listForCreator(user)); }
    if (req.method === 'GET' && /^\/api\/v3\/creator\/submissions\/[^/]+$/.test(url.pathname)) { const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Submissions.detailForCreator(user,url.pathname.split('/').at(-1))); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/creator-submissions') { await auth.requireRole(req,['admin']); return send(res,200,await v3Submissions.adminList(Object.fromEntries(url.searchParams))); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/creator-submissions\/[^/]+$/.test(url.pathname)) { await auth.requireRole(req,['admin']); return send(res,200,await v3Submissions.adminDetail(url.pathname.split('/').at(-1))); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/creator-submissions\/[^/]+\/assets\/[^/]+\/view$/.test(url.pathname)) { const user=await auth.requireRole(req,['admin']); return sendPrivateStream(res,await v3Submissions.streamAdminRead(user,url.pathname.split('/').at(-4),url.pathname.split('/').at(-2),url.searchParams.get('token'),req)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/creator-submissions\/[^/]+\/assets\/[^/]+\/view$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); const parts=url.pathname.split('/'); return send(res,200,await v3Submissions.issueAdminRead(user,parts.at(-4),parts.at(-2),req)); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/creator-submissions\/identity\/[^/]+\/view$/.test(url.pathname)) { const user=await auth.requireRole(req,['admin']); return sendPrivateStream(res,await v3Submissions.streamAdminIdentityRead(user,url.pathname.split('/').at(-2),url.searchParams.get('token'),req)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/creator-submissions\/identity\/[^/]+\/view$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,200,await v3Submissions.issueAdminIdentityRead(user,url.pathname.split('/').at(-2),req)); }
    if (req.method === 'PATCH' && /^\/api\/v3\/admin\/creator-submissions\/identity\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,200,await v3Submissions.reviewIdentity(url.pathname.split('/').at(-1),await body(req),user,req)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/creator-submissions\/[^/]+\/adjustments$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Submissions.addAdjustment(url.pathname.split('/').at(-2),await body(req),user,req)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/creator-submissions\/[^/]+\/review$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,200,await v3Submissions.review(url.pathname.split('/').at(-2),await body(req),user,req)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/creator/me') return send(res,200,await v3Creators.creatorForUser(await auth.current(req)));
    if (req.method === 'PATCH' && url.pathname === '/api/v3/creator/me') { requireSameOrigin(req,config); const user=await auth.current(req); const current=await v3Creators.creatorForUser(user); return send(res,200,await v3Creators.updateCreator(current.creator.id,await body(req),user,{self:true})); }
    if (req.method === 'PATCH' && url.pathname === '/api/v3/creator/profile') { requireSameOrigin(req,config); const user=await auth.requireRole(req,['performer']); const current=await v3Creators.creatorForUser(user); return send(res,200,await v3Creators.updateProfile(current.creator.id,await body(req),user,{self:true})); }
    if (req.method === 'PATCH' && url.pathname === '/api/v3/creator/settings') { requireSameOrigin(req,config); const user=await auth.requireRole(req,['performer']); const current=await v3Creators.creatorForUser(user); return send(res,200,await v3Creators.updateSettings(current.creator.id,await body(req),user)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/creator/actions') { const user=await auth.requireRole(req,['performer']); const current=await v3Creators.creatorForUser(user); return send(res,200,await v3Creators.actions(current.creator.id,user)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/creator/history') { const user=await auth.requireRole(req,['performer']); const current=await v3Creators.creatorForUser(user); return send(res,200,await v3Creators.historyForCreator(current.creator.id,user)); }
    if (req.method === 'POST' && url.pathname === '/api/v3/creator/documents/upload') { requireSameOrigin(req,config); const user=await auth.requireRole(req,['performer']); const current=await v3Creators.creatorForUser(user); return send(res,201,await v3Creators.issueDocumentUpload(current.creator.id,await body(req),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/creator\/documents\/[^/]+\/confirm$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['performer']); const current=await v3Creators.creatorForUser(user); return send(res,200,await v3Creators.confirmDocumentUpload(current.creator.id,url.pathname.split('/').at(-2),await body(req),user)); }
    if (req.method === 'GET' && /^\/api\/v3\/creator\/documents\/[^/]+\/download$/.test(url.pathname)) { const user=await auth.requireRole(req,['performer']); const current=await v3Creators.creatorForUser(user); return send(res,200,await v3Creators.documentDownload(current.creator.id,url.pathname.split('/').at(-2),user)); }
    if (url.pathname.startsWith('/api/v3/admin/commerce')) {
      const user = await auth.current(req);
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/commerce/overview') { assertPermission(user, 'commerce.read'); return send(res, 200, await v3Commerce.overview()); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/commerce/plans') { assertPermission(user, 'commerce.read'); return send(res, 200, await v3Commerce.plans(Object.fromEntries(url.searchParams))); }
      if (req.method === 'POST' && url.pathname === '/api/v3/admin/commerce/plans') { requireSameOrigin(req, config); assertPermission(user, 'commerce.pricing'); return send(res, 201, await v3Commerce.savePlan(null, await body(req), user, req)); }
      if (req.method === 'PATCH' && /^\/api\/v3\/admin\/commerce\/plans\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req, config); assertPermission(user, 'commerce.pricing'); return send(res, 200, await v3Commerce.savePlan(url.pathname.split('/').at(-1), await body(req), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/commerce/subscriptions') { assertPermission(user, 'commerce.read'); return send(res, 200, await v3Commerce.subscriptions(Object.fromEntries(url.searchParams))); }
      if (req.method === 'POST' && /^\/api\/v3\/admin\/commerce\/subscriptions\/[^/]+\/transition$/.test(url.pathname)) { requireSameOrigin(req, config); assertPermission(user, 'commerce.payments'); return send(res, 200, await v3Commerce.transitionSubscription(url.pathname.split('/').at(-2), (await body(req)).status, user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/commerce/payment-intents') { assertPermission(user, 'commerce.payments'); return send(res, 200, await v3Commerce.paymentIntents(Object.fromEntries(url.searchParams))); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/commerce/payments') { assertPermission(user, 'commerce.read'); return send(res, 200, await v3Commerce.payments(Object.fromEntries(url.searchParams))); }
      if (req.method === 'POST' && url.pathname === '/api/v3/admin/commerce/payments') { requireSameOrigin(req, config); assertPermission(user, 'commerce.payments'); return send(res, 201, await v3Commerce.recordPayment(await body(req), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/commerce/provider-events') { assertPermission(user, 'commerce.read'); return send(res, 200, await v3Commerce.providerEvents(Object.fromEntries(url.searchParams))); }
      if (req.method === 'POST' && url.pathname === '/api/v3/admin/commerce/provider-events') { requireSameOrigin(req, config); assertPermission(user, 'commerce.providers'); return send(res, 201, await v3Commerce.recordProviderEvent(await body(req), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/commerce/earnings') { assertPermission(user, 'commerce.read'); return send(res, 200, await v3Commerce.earnings(Object.fromEntries(url.searchParams))); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/commerce/settlements') { assertPermission(user, 'commerce.read'); return send(res, 200, await v3Commerce.settlements(Object.fromEntries(url.searchParams))); }
      if (req.method === 'POST' && /^\/api\/v3\/admin\/commerce\/settlements\/[^/]+\/calculate$/.test(url.pathname)) { requireSameOrigin(req, config); assertPermission(user, 'commerce.settlements'); return send(res, 200, await v3Commerce.calculateSettlement(url.pathname.split('/').at(-2), user, req)); }
      if (req.method === 'POST' && /^\/api\/v3\/admin\/commerce\/settlements\/[^/]+\/transition$/.test(url.pathname)) { requireSameOrigin(req, config); assertPermission(user, 'commerce.settlements'); return send(res, 200, await v3Commerce.transitionSettlement(url.pathname.split('/').at(-2), (await body(req)).status, user, req)); }
      if (req.method === 'POST' && url.pathname === '/api/v3/admin/commerce/earnings/adjustments') { requireSameOrigin(req, config); assertPermission(user, 'commerce.payments'); return send(res, 201, await v3Commerce.addAdjustment(await body(req), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/commerce/payouts') { assertPermission(user, 'commerce.read'); return send(res, 200, await v3Commerce.payouts(Object.fromEntries(url.searchParams))); }
      if (req.method === 'POST' && /^\/api\/v3\/admin\/commerce\/payouts\/[^/]+\/transition$/.test(url.pathname)) { requireSameOrigin(req, config); const input = await body(req); const permission = ['processing', 'paid'].includes(input.status) ? 'commerce.payouts.execute' : ['approved'].includes(input.status) ? 'commerce.payouts.approve' : 'commerce.payouts.review'; assertPermission(user, permission); return send(res, 200, await v3Commerce.transitionPayout(url.pathname.split('/').at(-2), input.status, user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/commerce/wallets') { assertPermission(user, 'commerce.read'); return send(res, 200, await v3Commerce.wallets(Object.fromEntries(url.searchParams))); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/commerce/reconciliation') { assertPermission(user, 'commerce.reconcile'); return send(res, 200, await v3Commerce.reconciliation(Object.fromEntries(url.searchParams))); }
      if (req.method === 'POST' && url.pathname === '/api/v3/admin/commerce/reconciliation') { requireSameOrigin(req, config); assertPermission(user, 'commerce.reconcile'); return send(res, 201, await v3Commerce.createReconciliation(await body(req), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/commerce/integrations') { assertPermission(user, 'commerce.read'); return send(res, 200, await v3Commerce.integrations()); }
    }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/compensation/overview') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Compensation.overview()); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/contracts/overview') { const user=await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Contracts.overview(user)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/contracts/templates') { const user=await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Contracts.templates(user)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/contracts/creators') { const user=await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Contracts.creators(url.searchParams.get('q') || '')); }
    if (req.method === 'POST' && url.pathname === '/api/v3/admin/contracts/preview') { requireSameOrigin(req,config); await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Contracts.preview(await body(req))); }
    if (req.method === 'POST' && url.pathname === '/api/v3/admin/contracts/preview/pdf') { requireSameOrigin(req,config); await auth.requireRole(req,['staff','admin']); const preview=await v3Contracts.preview(await body(req)); return sendBinary(res,200,renderPdf(preview.snapshot),{'content-type':'application/pdf','content-disposition':'inline; filename="fleshlab-template-preview.pdf"'}); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/contracts\/templates\/[^/]+$/.test(url.pathname)) { const user=await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Contracts.template(url.pathname.split('/').at(-1),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/contracts\/templates\/[^/]+\/versions$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Contracts.createVersion(url.pathname.split('/').at(-2),await body(req),user)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/contracts') { const user=await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Contracts.instances(user)); }
    if (req.method === 'POST' && url.pathname === '/api/v3/admin/contracts/assign') { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Contracts.assign(await body(req),user)); }
    if (req.method === 'POST' && url.pathname === '/api/v3/admin/contracts/import-legacy') { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Contracts.importLegacy(await body(req),user)); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/contracts\/[^/]+$/.test(url.pathname)) { const user=await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Contracts.instance(url.pathname.split('/').at(-1),user,{admin:true})); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/contracts\/[^/]+\/pdf$/.test(url.pathname)) { const user=await auth.requireRole(req,['staff','admin']); const result=await v3Contracts.pdf(url.pathname.split('/').at(-2),user,{admin:true}); return sendBinary(res,200,result.bytes,{'content-type':'application/pdf','content-disposition':`attachment; filename="${result.contract_number}.pdf"`}); }
    if (req.method === 'GET' && url.pathname === '/api/v3/creator/contracts') { const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Contracts.creatorInstances(user)); }
    if (req.method === 'GET' && /^\/api\/v3\/creator\/contracts\/[^/]+$/.test(url.pathname)) { const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Contracts.instance(url.pathname.split('/').at(-1),user)); }
    if (req.method === 'GET' && /^\/api\/v3\/creator\/contracts\/[^/]+\/pdf$/.test(url.pathname)) { const user=await auth.requireRole(req,['performer']); const result=await v3Contracts.pdf(url.pathname.split('/').at(-2),user); return sendBinary(res,200,result.bytes,{'content-type':'application/pdf','content-disposition':`inline; filename="${result.contract_number}.pdf"`}); }
    if (req.method === 'GET' && url.pathname === '/api/v3/creator/compensation') { const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Compensation.creatorStatement(user)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/creator/commerce') { const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Commerce.creatorOverview(user)); }
    if (req.method === 'POST' && url.pathname === '/api/v3/creator/commerce/payouts') { requireSameOrigin(req, config); const user=await auth.requireRole(req,['performer']); const current=await v3Commerce.creatorOverview(user); return send(res, 201, await v3Commerce.requestPayout(await body(req), user, current.creator.id, req)); }
    if (req.method === 'PATCH' && url.pathname === '/api/v3/creator/commerce/payout-profile') { requireSameOrigin(req, config); const user=await auth.requireRole(req,['performer']); const current=await v3Commerce.creatorOverview(user); return send(res, 200, await v3Commerce.updatePayoutProfile(await body(req), current.creator.id, user, req)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/creator/productions') { const user=await auth.requireRole(req,['performer']); return send(res,200,await v3Production.creatorProductions(user)); }
    if (req.method === 'GET' && /^\/api\/v3\/creator\/contracts\/[^/]+\/pdf$/.test(url.pathname)) { const user=await auth.requireRole(req,['performer']); const result=await v3Contracts.pdf(url.pathname.split('/').at(-2),user); return sendBinary(res,200,result.bytes,{'content-type':'application/pdf','content-disposition':`attachment; filename="${result.contract_number}.pdf"`}); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/production/overview') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Operations.production()); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/productions') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Production.list(Object.fromEntries(url.searchParams))); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/production/schedule') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Production.schedule(Object.fromEntries(url.searchParams))); }
    if (req.method === 'POST' && url.pathname === '/api/v3/admin/productions') { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Production.create(await body(req),user)); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/productions\/[^/]+$/.test(url.pathname)) { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Production.detail(url.pathname.split('/').at(-1))); }
    if (req.method === 'PATCH' && /^\/api\/v3\/admin\/productions\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,200,await v3Production.update(url.pathname.split('/').at(-1),await body(req),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/productions\/[^/]+\/transition$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,200,await v3Production.transition(url.pathname.split('/').at(-2),(await body(req)).status,user)); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/productions\/[^/]+\/readiness$/.test(url.pathname)) { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Production.readiness(url.pathname.split('/').at(-2))); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/productions\/[^/]+\/events$/.test(url.pathname)) { await auth.requireRole(req,['staff','admin']); return send(res,200,{records:(await v3Production.detail(url.pathname.split('/').at(-2))).events}); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/productions\/[^/]+\/shoots$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Production.shoot(url.pathname.split('/').at(-2),await body(req),user)); }
    if (req.method === 'PATCH' && /^\/api\/v3\/admin\/productions\/[^/]+\/shoots\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); const parts=url.pathname.split('/'); return send(res,200,await v3Production.updateShoot(parts.at(-3),parts.at(-1),await body(req),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/productions\/[^/]+\/scenes$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Production.scene(url.pathname.split('/').at(-2),await body(req),user)); }
    if (req.method === 'PATCH' && /^\/api\/v3\/admin\/productions\/[^/]+\/scenes\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); const parts=url.pathname.split('/'); return send(res,200,await v3Production.updateScene(parts.at(-3),parts.at(-1),await body(req),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/productions\/[^/]+\/participants$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Production.participant(url.pathname.split('/').at(-2),await body(req),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/productions\/[^/]+\/assets$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Production.asset(url.pathname.split('/').at(-2),await body(req),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/productions\/[^/]+\/qa$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Production.qa(url.pathname.split('/').at(-2),await body(req),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/productions\/[^/]+\/renders$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Production.render(url.pathname.split('/').at(-2),await body(req),user)); }
    if (req.method === 'PATCH' && /^\/api\/v3\/admin\/productions\/[^/]+\/renders\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); const parts=url.pathname.split('/'); return send(res,200,await v3Production.updateRender(parts.at(-3),parts.at(-1),await body(req),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/productions\/[^/]+\/milestones$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Production.milestone(url.pathname.split('/').at(-2),await body(req),user)); }
    if (req.method === 'POST' && /^\/api\/v3\/admin\/productions\/[^/]+\/catalogue-handoff$/.test(url.pathname)) { requireSameOrigin(req,config); const user=await auth.requireRole(req,['admin']); return send(res,201,await v3Production.handoff(url.pathname.split('/').at(-2),await body(req),user)); }
    if (req.method === 'GET' && url.pathname === '/api/v3/admin/production/consent-overview') { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Consent.overview()); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/production\/consent\/[^/]+$/.test(url.pathname)) { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Consent.production(url.pathname.split('/').at(-1))); }
    if (req.method === 'GET' && /^\/api\/v3\/admin\/production\/rights\/[^/]+$/.test(url.pathname)) { await auth.requireRole(req,['staff','admin']); return send(res,200,await v3Consent.rights(url.pathname.split('/').at(-1),url.searchParams.get('content_id'))); }
    if (url.pathname.startsWith('/api/v3/admin/growth')) {
      const user = await auth.current(req);
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/growth/overview') { assertPermission(user, 'growth.read'); return send(res, 200, await v3Growth.overview()); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/growth/campaigns') { assertPermission(user, 'growth.read'); return send(res, 200, await v3Growth.campaigns(Object.fromEntries(url.searchParams))); }
      if (req.method === 'POST' && url.pathname === '/api/v3/admin/growth/campaigns') { requireSameOrigin(req, config); assertPermission(user, 'growth.campaigns'); return send(res, 201, await v3Growth.saveCampaign(null, await body(req), user, req)); }
      if (/^\/api\/v3\/admin\/growth\/campaigns\/[^/]+$/.test(url.pathname)) { const id = url.pathname.split('/').at(-1); if (req.method === 'GET') { assertPermission(user, 'growth.read'); return send(res, 200, await v3Growth.campaign(id)); } if (req.method === 'PATCH') { requireSameOrigin(req, config); assertPermission(user, 'growth.campaigns'); return send(res, 200, await v3Growth.saveCampaign(id, await body(req), user, req)); } }
      if (/^\/api\/v3\/admin\/growth\/campaigns\/[^/]+\/status$/.test(url.pathname) && req.method === 'POST') { requireSameOrigin(req, config); assertPermission(user, 'growth.campaigns'); return send(res, 200, await v3Growth.transitionCampaign(url.pathname.split('/').at(-2), (await body(req)).status, user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/growth/attribution') { assertPermission(user, 'growth.read'); return send(res, 200, await v3Growth.attribution(Object.fromEntries(url.searchParams))); }
      if (req.method === 'POST' && url.pathname === '/api/v3/admin/growth/attribution/utm') { requireSameOrigin(req, config); assertPermission(user, 'growth.write'); return send(res, 200, await v3Growth.generateUtm(await body(req), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/growth/promo-assets') { assertPermission(user, 'growth.read'); return send(res, 200, await v3Growth.promoAssets(Object.fromEntries(url.searchParams))); }
      if (req.method === 'POST' && url.pathname === '/api/v3/admin/growth/promo-assets') { requireSameOrigin(req, config); assertPermission(user, 'growth.assets'); return send(res, 201, await v3Growth.savePromoAsset(null, await body(req), user, req)); }
      if (/^\/api\/v3\/admin\/growth\/promo-assets\/[^/]+$/.test(url.pathname) && req.method === 'PATCH') { requireSameOrigin(req, config); assertPermission(user, 'growth.assets'); return send(res, 200, await v3Growth.savePromoAsset(url.pathname.split('/').at(-1), await body(req), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/growth/promo-kits') { assertPermission(user, 'growth.read'); return send(res, 200, await v3Growth.kits(Object.fromEntries(url.searchParams))); }
      if (req.method === 'POST' && url.pathname === '/api/v3/admin/growth/promo-kits') { requireSameOrigin(req, config); assertPermission(user, 'growth.assets'); return send(res, 201, await v3Growth.saveKit(null, await body(req), user, req)); }
      if (/^\/api\/v3\/admin\/growth\/promo-kits\/[^/]+$/.test(url.pathname) && req.method === 'PATCH') { requireSameOrigin(req, config); assertPermission(user, 'growth.assets'); return send(res, 200, await v3Growth.saveKit(url.pathname.split('/').at(-1), await body(req), user, req)); }
      if (/^\/api\/v3\/admin\/growth\/promo-kits\/[^/]+\/assets$/.test(url.pathname) && req.method === 'POST') { requireSameOrigin(req, config); assertPermission(user, 'growth.assets'); return send(res, 201, await v3Growth.addKitAsset(url.pathname.split('/').at(-2), await body(req), user, req)); }
      if (/^\/api\/v3\/admin\/growth\/promo-kits\/[^/]+\/copies$/.test(url.pathname) && req.method === 'POST') { requireSameOrigin(req, config); assertPermission(user, 'growth.assets'); return send(res, 201, await v3Growth.addKitCopy(url.pathname.split('/').at(-2), await body(req), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/growth/distribution') { assertPermission(user, 'growth.read'); return send(res, 200, await v3Growth.distribution(Object.fromEntries(url.searchParams))); }
      if (req.method === 'POST' && url.pathname === '/api/v3/admin/growth/distribution') { requireSameOrigin(req, config); assertPermission(user, 'growth.write'); return send(res, 201, await v3Growth.saveDistribution(null, await body(req), user, req)); }
      if (/^\/api\/v3\/admin\/growth\/distribution\/[^/]+$/.test(url.pathname) && req.method === 'PATCH') { requireSameOrigin(req, config); assertPermission(user, 'growth.write'); return send(res, 200, await v3Growth.saveDistribution(url.pathname.split('/').at(-1), await body(req), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/growth/news') { assertPermission(user, 'growth.read'); return send(res, 200, await v3Growth.news(Object.fromEntries(url.searchParams))); }
      if (req.method === 'POST' && url.pathname === '/api/v3/admin/growth/news') { requireSameOrigin(req, config); assertPermission(user, 'growth.write'); return send(res, 201, await v3Growth.saveNews(null, await body(req), user, req)); }
      if (/^\/api\/v3\/admin\/growth\/news\/[^/]+$/.test(url.pathname) && req.method === 'PATCH') { requireSameOrigin(req, config); assertPermission(user, 'growth.write'); return send(res, 200, await v3Growth.saveNews(url.pathname.split('/').at(-1), await body(req), user, req)); }
      if (/^\/api\/v3\/admin\/growth\/news\/[^/]+\/publish$/.test(url.pathname) && req.method === 'POST') { requireSameOrigin(req, config); assertPermission(user, 'growth.publish'); return send(res, 200, await v3Growth.publishNews(url.pathname.split('/').at(-2), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/growth/analytics') { assertPermission(user, 'growth.read'); return send(res, 200, await v3Growth.analytics()); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/growth/funnels') { assertPermission(user, 'growth.read'); return send(res, 200, await v3Growth.funnels()); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/growth/integrations') { assertPermission(user, 'growth.read'); return send(res, 200, await v3Growth.integrations()); }
    }
    if (url.pathname.startsWith('/api/v3/admin/system')) {
      const user = await auth.current(req);
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/system/overview') { assertPermission(user, 'system.read'); return send(res, 200, await v3System.overview()); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/system/users') { assertPermission(user, 'system.users'); return send(res, 200, await v3System.users(Object.fromEntries(url.searchParams))); }
      if (req.method === 'GET' && /^\/api\/v3\/admin\/system\/users\/[^/]+$/.test(url.pathname)) { assertPermission(user, 'system.users'); return send(res, 200, await v3System.user(url.pathname.split('/').at(-1))); }
      if (req.method === 'PATCH' && /^\/api\/v3\/admin\/system\/users\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req, config); assertPermission(user, 'system.users'); return send(res, 200, await v3System.updateUser(url.pathname.split('/').at(-1), await body(req), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/system/roles') { assertPermission(user, 'system.roles'); return send(res, 200, { roles: roleDefinitions() }); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/system/sessions') { assertPermission(user, 'system.sessions'); return send(res, 200, await v3System.sessions({ includeExpired: url.searchParams.get('include_expired') === 'true' })); }
      if (req.method === 'POST' && /^\/api\/v3\/admin\/system\/sessions\/[^/]+\/revoke$/.test(url.pathname)) { requireSameOrigin(req, config); assertPermission(user, 'system.sessions'); return send(res, 200, await v3System.revokeSession(url.pathname.split('/').at(-2), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/system/settings') { assertPermission(user, 'system.settings'); return send(res, 200, { records: await v3System.settings() }); }
      if (req.method === 'PATCH' && /^\/api\/v3\/admin\/system\/settings\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req, config); assertPermission(user, 'system.settings'); return send(res, 200, await v3System.updateSetting(decodeURIComponent(url.pathname.split('/').at(-1)), await body(req), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/system/flags') { assertPermission(user, 'system.flags'); return send(res, 200, await v3System.flags(url.searchParams.get('environment') || 'all')); }
      if (req.method === 'PATCH' && /^\/api\/v3\/admin\/system\/flags\/[^/]+$/.test(url.pathname)) { requireSameOrigin(req, config); assertPermission(user, 'system.flags'); return send(res, 200, await v3System.updateFlag(decodeURIComponent(url.pathname.split('/').at(-1)), await body(req), user, req)); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/system/integrations') { assertPermission(user, 'system.integrations'); return send(res, 200, await v3System.integrations()); }
      if (req.method === 'POST' && /^\/api\/v3\/admin\/system\/integrations\/[^/]+\/check$/.test(url.pathname)) { requireSameOrigin(req, config); assertPermission(user, 'system.integrations'); return send(res, 200, await v3System.checkIntegration(url.pathname.split('/').at(-2), { actor: user, request: req })); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/system/health') { assertPermission(user, 'system.read'); return send(res, 200, await v3System.health()); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/system/migrations') { assertPermission(user, 'system.read'); return send(res, 200, await v3System.migrations()); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/system/audit') { assertPermission(user, 'system.audit'); return send(res, 200, await v3System.auditLog(Object.fromEntries(url.searchParams))); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/system/diagnostics') { assertPermission(user, 'system.diagnostics'); return send(res, 200, await v3System.diagnostics()); }
      if (req.method === 'GET' && url.pathname === '/api/v3/admin/system/backups') { assertPermission(user, 'system.backups'); return send(res, 200, await v3System.backups()); }
    }
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
    if (req.method === 'POST' && url.pathname === '/api/v1/recruiting/applications') { const result = await recruiting.createApplication(await body(req), req.headers['idempotency-key']); await v3Growth.syncApplicationAttribution(result.application?.id); return send(res, 201, result); }
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
    if (req.method === 'POST' && url.pathname === '/api/v1/functions/submitPerformerApplication') { const result = await recruiting.submitLegacy(await body(req)); await v3Growth.syncApplicationAttribution(result.application_id); return send(res, 201, result); }
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
