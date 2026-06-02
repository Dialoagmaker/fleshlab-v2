import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, functionsVersion, appBaseUrl } = appParams;

// CRITICAL: The Base44 SDK reads 'base44_access_token' from localStorage internally
// when createClient() is called — independent of the 'token' param we pass.
// If a stale token exists, the SDK auto-calls entities/User/me, gets 401, and
// enters its log-user-in-app retry loop causing 429 errors and a black page for
// anonymous visitors.
//
// Fix: clear localStorage BEFORE createClient() runs. appParams.js evaluates first
// (it is imported above), so appParams.token already captured the stored value.
// AuthContext.checkUserAuth() validates appParams.token via raw fetch and calls
// base44.auth.setToken() + restores localStorage ONLY if the token is confirmed valid.
try {
  // Clear stored tokens BEFORE createClient() so the SDK cannot auto-call User/me
  // with a stale token. appParams.token already captured the value above.
  localStorage.removeItem('base44_access_token');
  localStorage.removeItem('token');
} catch (_) {
  // Ignore: localStorage may throw in restricted iframe/private contexts
}

export const base44 = createClient({
  appId,
  token: null,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});