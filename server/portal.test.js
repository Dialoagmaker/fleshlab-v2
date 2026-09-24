import test from 'node:test';
import assert from 'node:assert/strict';
import { assertAdminApiHost, assertPortal, portalForRequest } from './portal.js';
import { AuthService, requireSameOrigin } from './auth.js';
import { HttpError } from './errors.js';

const config = {
  publicOrigin: 'https://fleshlab.online',
  adminOrigin: 'https://admin.fleshlab.online',
  performerOrigin: 'https://performer.fleshlab.online',
  earnOrigin: 'https://earn.fleshlab.online',
  publicOrigins: ['https://fleshlab.online', 'https://admin.fleshlab.online', 'https://performer.fleshlab.online', 'https://earn.fleshlab.online']
};

const request = host => ({ headers: { host } });

test('portal resolution is host-specific', () => {
  assert.equal(portalForRequest(request('admin.fleshlab.online'), config), 'admin');
  assert.equal(portalForRequest(request('performer.fleshlab.online'), config), 'performer');
  assert.equal(portalForRequest(request('earn.fleshlab.online'), config), 'earn');
  assert.equal(portalForRequest(request('fleshlab.online'), config), 'public');
  assert.equal(portalForRequest(request('admin.fleshlab.online:443'), config), 'admin');
  assert.equal(portalForRequest(request('unknown.example'), config), 'unknown');
});

test('portal assertions deny cross-portal requests', () => {
  assert.doesNotThrow(() => assertPortal(request('performer.fleshlab.online'), config, 'performer'));
  assert.throws(() => assertPortal(request('earn.fleshlab.online'), config, 'performer'), error => error instanceof HttpError && error.status === 403 && error.code === 'PORTAL_NOT_ALLOWED');
});

test('admin API paths are host restricted while non-admin public paths are not', () => {
  assert.doesNotThrow(() => assertAdminApiHost({ url: '/api/v3/admin/system/health', headers: { host: 'admin.fleshlab.online' } }, config));
  assert.throws(() => assertAdminApiHost({ url: '/api/v3/admin/system/health', headers: { host: 'performer.fleshlab.online' } }, config), /only available on the admin portal/);
  assert.throws(() => assertAdminApiHost({ url: '/api/v1/dashboard/admin', headers: { host: 'earn.fleshlab.online' } }, config), /only available on the admin portal/);
  assert.doesNotThrow(() => assertAdminApiHost({ url: '/api/v3/public/homepage', headers: { host: 'fleshlab.online' } }, config));
});

test('portal configuration defines isolated production origins and host-only session policy', async () => {
  const source = await (await import('node:fs/promises')).readFile(new URL('./auth.js', import.meta.url), 'utf8');
  const configSource = await (await import('node:fs/promises')).readFile(new URL('./config.js', import.meta.url), 'utf8');
  assert.match(source, /fleshlab_session=/);
  assert.doesNotMatch(source, /Domain=\.fleshlab\.online/);
  assert.match(configSource, /ADMIN_ORIGIN/);
  assert.match(configSource, /PERFORMER_ORIGIN/);
  assert.match(configSource, /EARN_ORIGIN/);
});

test('portal frontend and edge configuration keep product bundles separated', async () => {
  const fs = await import('node:fs/promises');
  const performer = await fs.readFile(new URL('../v3/src/performer.jsx', import.meta.url), 'utf8');
  const nginx = await fs.readFile(new URL('../infra/nginx.conf', import.meta.url), 'utf8');
  const caddy = await fs.readFile(new URL('../infra/Caddyfile', import.meta.url), 'utf8');
  assert.doesNotMatch(performer, /\/api\/v3\/admin/);
  assert.doesNotMatch(performer, /Creator Submissions|Growth|System/);
  assert.match(nginx, /admin\.fleshlab\.online \/admin\/admin\.html/);
  assert.match(nginx, /performer\.fleshlab\.online \/performer\/performer\.html/);
  assert.match(nginx, /earn\.fleshlab\.online \/earn\/earn\.html/);
  assert.match(caddy, /\{\$ADMIN_HOST\}/);
  assert.match(caddy, /\{\$PERFORMER_HOST\}/);
  assert.match(caddy, /\{\$EARN_HOST\}/);
});

test('CSRF origin validation is bound to the active portal host', () => {
  assert.doesNotThrow(() => requireSameOrigin({ headers: { host: 'performer.fleshlab.online', origin: 'https://performer.fleshlab.online' } }, config));
  assert.throws(() => requireSameOrigin({ headers: { host: 'performer.fleshlab.online', origin: 'https://admin.fleshlab.online' } }, config), error => error instanceof HttpError && error.code === 'ORIGIN_REJECTED');
  assert.doesNotThrow(() => requireSameOrigin({ headers: { host: 'earn.fleshlab.online' } }, config));
});

test('portal login policy separates staff, contracted performers and external creators', async () => {
  const external = new AuthService({ query: async () => ({ rowCount: 0, rows: [] }) }, config);
  const linked = new AuthService({ query: async () => ({ rowCount: 1, rows: [{}] }) }, config);
  await assert.doesNotReject(() => external.assertPortalLogin({ id: 'u1', role: 'admin' }, 'admin'));
  await assert.rejects(() => external.assertPortalLogin({ id: 'u1', role: 'performer' }, 'admin'), /Admin Portal/);
  await assert.doesNotReject(() => external.assertPortalLogin({ id: 'u1', role: 'performer' }, 'earn'));
  await assert.rejects(() => linked.assertPortalLogin({ id: 'u1', role: 'performer' }, 'earn'), /Performer Portal/);
  await assert.doesNotReject(() => linked.assertPortalLogin({ id: 'u1', role: 'performer' }, 'performer'));
  await assert.rejects(() => external.assertPortalLogin({ id: 'u1', role: 'performer' }, 'performer'), /active contracted performer/);
});
