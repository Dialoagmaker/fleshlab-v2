import { HttpError } from './errors.js';

export const portalNames = new Set(['public', 'admin', 'performer', 'earn', 'unknown']);

function hostname(value = '') {
  return String(value).split(',')[0].trim().split(':')[0].toLowerCase();
}

export function portalForRequest(req, config = {}) {
  const host = hostname(req?.headers?.host || req?.headers?.['x-forwarded-host']);
  const configured = new Map([
    [hostname(new URL(config.adminOrigin || 'https://admin.fleshlab.online').hostname), 'admin'],
    [hostname(new URL(config.performerOrigin || 'https://performer.fleshlab.online').hostname), 'performer'],
    [hostname(new URL(config.earnOrigin || 'https://earn.fleshlab.online').hostname), 'earn'],
    [hostname(new URL(config.publicOrigin || 'https://fleshlab.online').hostname), 'public']
  ]);
  return configured.get(host) || (host === 'localhost' || host === '127.0.0.1' ? 'unknown' : 'unknown');
}

export function portalOrigin(config, portal) {
  return {
    admin: config.adminOrigin,
    performer: config.performerOrigin,
    earn: config.earnOrigin,
    public: config.publicOrigin
  }[portal] || null;
}

export function assertPortal(req, config, expected) {
  const actual = portalForRequest(req, config);
  if (actual !== expected) throw new HttpError(403, 'PORTAL_NOT_ALLOWED', `This endpoint is only available on the ${expected} portal.`);
  return actual;
}

export function assertAdminApiHost(req, config) {
  const path = String(req?.url || '').split('?')[0];
  if (path === '/api/v3/admin' || path.startsWith('/api/v3/admin/') || path === '/api/v1/admin' || path.startsWith('/api/v1/admin/') || path === '/api/v1/dashboard/admin') {
    assertPortal(req, config, 'admin');
  }
}
