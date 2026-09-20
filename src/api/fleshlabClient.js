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

async function request(path, options = {}) {
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
  const call = (method, suffix = '', payload) => request(`/entities/${encodeURIComponent(name)}${suffix}`, { method, body: payload === undefined ? undefined : JSON.stringify(payload) });
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
  functions: { invoke: async (name, payload = {}) => ({ data: await request(`/functions/${encodeURIComponent(name)}`, { method: 'POST', body: JSON.stringify(payload) }) }) },
  integrations: { Core: { InvokeLLM: () => Promise.reject(new ApiError(501, 'MIGRATION_NOT_IMPLEMENTED', 'AI integrations are not migrated to the Azure runtime.')) } },
  auth: {
    me: () => request('/auth/me'),
    isAuthenticated: async () => { try { await request('/auth/me'); return true; } catch { return false; } },
    loginViaEmailPassword: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    verifyOtp: (payload) => request('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token: payload.token || payload.otpCode }) }),
    resendOtp: () => Promise.reject(new ApiError(501, 'MIGRATION_NOT_IMPLEMENTED', 'Verification resend requires the email delivery worker configuration.')),
    resetPasswordRequest: (email) => request('/auth/password/reset-request', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (payload) => request('/auth/password/reset', { method: 'POST', body: JSON.stringify(payload) }),
    updateMe: (payload) => request('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }),
    logout: async (next = '/') => { await request('/auth/logout', { method: 'POST' }).catch(() => {}); window.location.assign(next); },
    redirectToLogin: (from = window.location.pathname) => window.location.assign(`/login?from=${encodeURIComponent(from)}`),
    loginWithProvider: () => Promise.reject(new ApiError(501, 'MIGRATION_NOT_IMPLEMENTED', 'External identity provider login is not migrated.')),
    setToken: () => undefined
  }
};
