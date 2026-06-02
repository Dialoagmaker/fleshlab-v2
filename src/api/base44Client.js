import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, functionsVersion, appBaseUrl } = appParams;

// IMPORTANT: Client is intentionally created WITHOUT a token.
// Passing the stored localStorage token here causes stale-token 401 spam on public entity calls
// (Video.list, Brand.list, etc.) before auth validation has completed, which triggers the
// Base44 SDK interceptor retry loop and log-user-in-app 429 errors.
//
// Instead: AuthContext.checkUserAuth() reads the stored token, validates it via
// base44.auth.setToken() + base44.auth.me(), and only sets it on the client if valid.
// Public routes get anonymous entity access. Private routes get authenticated access
// only after ProtectedRoute confirms auth state.
export const base44 = createClient({
  appId,
  token: null,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});