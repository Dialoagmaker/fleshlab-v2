class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Bracket notation keeps this optional deployment override out of the legacy
// snapshot's restricted TypeScript include set.
const apiBase = () => window['__FLESHLAB_API_BASE_URL__'] || '/api/v1';

export async function fleshlabRequest(path, options = {}) {
  const response = await fetch(`${apiBase()}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, payload?.error?.code || 'REQUEST_FAILED', payload?.error?.message || `Request failed (${response.status})`);
  return payload;
}

function entity(name) {
  const call = (method, suffix = '', payload) => fleshlabRequest(`/entities/${encodeURIComponent(name)}${suffix}`, { method, body: payload === undefined ? undefined : JSON.stringify(payload) });
  return {
    list: (query) => call('POST', '/query', query || {}),
    filter: (query) => call('POST', '/query', query || {}),
    get: (id) => call('GET', `/${encodeURIComponent(id)}`),
    create: (payload) => call('POST', '', payload),
    update: (id, payload) => call('PATCH', `/${encodeURIComponent(id)}`, payload),
    delete: (id) => call('DELETE', `/${encodeURIComponent(id)}`)
  };
}

export const base44 = {
  // Compatibility export name only. This object has no Base44 SDK, origin or fallback.
  entities: new Proxy({}, { get: (_, name) => entity(name) }),
  functions: { invoke: async (name, payload = {}) => ({ data: await fleshlabRequest(`/functions/${encodeURIComponent(name)}`, { method: 'POST', body: JSON.stringify(payload) }) }) },
  integrations: { Core: { InvokeLLM: () => Promise.reject(new ApiError(501, 'MIGRATION_NOT_IMPLEMENTED', 'AI integrations are not migrated to the Azure runtime.')) } },
  auth: {
    me: () => fleshlabRequest('/auth/me'),
    isAuthenticated: async () => { try { await fleshlabRequest('/auth/me'); return true; } catch { return false; } },
    loginViaEmailPassword: (email, password) => fleshlabRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (payload) => fleshlabRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    verifyOtp: (payload) => fleshlabRequest('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token: payload.token || payload.otpCode }) }),
    resendOtp: () => Promise.reject(new ApiError(501, 'MIGRATION_NOT_IMPLEMENTED', 'Verification resend requires the email delivery worker configuration.')),
    resetPasswordRequest: (email) => fleshlabRequest('/auth/password/reset-request', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (payload) => fleshlabRequest('/auth/password/reset', { method: 'POST', body: JSON.stringify(payload) }),
    updateMe: (payload) => fleshlabRequest('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }),
    logout: async (next = '/') => { await fleshlabRequest('/auth/logout', { method: 'POST' }).catch(() => {}); window.location.assign(next); },
    redirectToLogin: (from = window.location.pathname) => window.location.assign(`/login?from=${encodeURIComponent(from)}`),
    loginWithProvider: () => Promise.reject(new ApiError(501, 'MIGRATION_NOT_IMPLEMENTED', 'External identity provider login is not migrated.')),
    setToken: () => undefined
  }
};

export const dashboards = {
  profile: () => fleshlabRequest('/dashboard/profile'),
  updateProfile: (payload) => fleshlabRequest('/dashboard/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
  customer: () => fleshlabRequest('/dashboard/customer'),
  performer: () => fleshlabRequest('/dashboard/performer'),
  admin: () => fleshlabRequest('/dashboard/admin'),
  applications: (params = {}) => fleshlabRequest(`/admin/recruiting/applications?${new URLSearchParams(params)}`),
  application: (id) => fleshlabRequest(`/admin/recruiting/applications/${encodeURIComponent(id)}`),
  review: (id, payload) => fleshlabRequest(`/admin/recruiting/applications/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  approve: (id) => fleshlabRequest(`/admin/recruiting/applications/${encodeURIComponent(id)}/approve`, { method: 'POST', body: '{}' }),
  recordContract: (id, template_version) => fleshlabRequest(`/admin/recruiting/applications/${encodeURIComponent(id)}/contract`, { method: 'POST', body: JSON.stringify({ template_version }) }),
  performerAccounts: () => fleshlabRequest('/admin/recruiting/performer-accounts'),
  assignPerformer: (id, performer_user_id) => fleshlabRequest(`/admin/recruiting/applications/${encodeURIComponent(id)}/performer`, { method: 'POST', body: JSON.stringify({ performer_user_id }) })
};

// Catalogue imports are deliberately explicit admin actions. The browser only
// reads the four selected export files; it never sends them anywhere except the
// self-hosted, authenticated FLESHLAB import endpoints.
export const catalogueImports = {
  dryRun: (exports) => fleshlabRequest('/admin/imports/base44/catalogue/dry-run', { method: 'POST', body: JSON.stringify({ exports }) }),
  execute: (exports) => fleshlabRequest('/admin/imports/base44/catalogue/execute', { method: 'POST', body: JSON.stringify({ exports }) })
};

export const adminCatalogue = {
  snapshot: () => fleshlabRequest('/admin/catalogue')
};

export const adminDataExports = {
  get: (entity = 'all') => fleshlabRequest(`/admin/exports/${encodeURIComponent(entity)}`)
};
export const adminNews = {
  list: () => fleshlabRequest('/admin/news'),
  create: (payload) => fleshlabRequest('/admin/news', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => fleshlabRequest(`/admin/news/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id) => fleshlabRequest(`/admin/news/${encodeURIComponent(id)}`, { method: 'DELETE' })
};
export const adminDiscovery = {
  snapshot: () => fleshlabRequest('/admin/discovery')
};
export const adminCampaigns = { list:()=>fleshlabRequest('/admin/campaigns'), create:(payload)=>fleshlabRequest('/admin/campaigns',{method:'POST',body:JSON.stringify(payload)}), update:(id,payload)=>fleshlabRequest(`/admin/campaigns/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(payload)}), remove:(id)=>fleshlabRequest(`/admin/campaigns/${encodeURIComponent(id)}`,{method:'DELETE'}) };
export const adminMarketing = { snapshot:()=>fleshlabRequest('/admin/marketing') };
