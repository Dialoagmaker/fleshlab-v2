# Public Page Black Screen Fix - Intermittent 401 Handler

## Problem
Opening `/guest-production` (and other public pages) sometimes showed a black/blank page with browser console showing:
```
GET /entities/User/me 401 Unauthorized
```

This occurred when:
- Logged-out users visited public pages
- Users with expired/invalid tokens in localStorage
- Race condition during auth initialization

## Root Cause
The `AuthContext.checkAppState()` function was making a fetch call to `/entities/User/me` that could throw unhandled promise rejections when the token was invalid (401). While there was a try/catch, the promise chain wasn't properly handling all error cases, leading to unhandled rejections that could break the render cycle.

## Solution

### 1. AuthContext.jsx - Defensive Promise Chain
**File**: `lib/AuthContext.jsx`

Changed from async/await to `.then()` chain to ensure all errors are caught:

```javascript
const checkAppState = async () => {
  const storedToken = appParams.token || localStorage.getItem('base44_access_token');
  
  if (!storedToken) {
    // No token - treat as anonymous immediately
    setUser(null);
    setIsAuthenticated(false);
    setIsLoadingAuth(false);
    setAuthChecked(true);
    return;
  }

  // Use .then() chain to prevent unhandled rejections
  fetch(`/api/apps/${appParams.appId}/entities/User/me`, {
    headers: {
      'Authorization': `Bearer ${storedToken}`,
      'X-App-Id': appParams.appId,
    },
  })
  .then(resp => {
    if (resp.ok) {
      return resp.json();
    } else {
      throw new Error('Token invalid: ' + resp.status);
    }
  })
  .then(currentUser => {
    // Valid user - update state
    base44.auth.setToken(storedToken);
    localStorage.setItem('base44_access_token', storedToken);
    setUser(currentUser);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
    setAuthChecked(true);
  })
  .catch(error => {
    // ANY error (401, network, JSON parse) - treat as anonymous
    console.warn('AUTH_ERROR - treating as anonymous', error?.message || error);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('base44_access_token');
    setIsLoadingAuth(false);
    setAuthChecked(true);
  });
};
```

**Key improvements:**
- No async/await that could throw before catch
- Explicit error handling for 401/403 responses
- Always calls `setIsLoadingAuth(false)` and `setAuthChecked(true)` to unblock render
- Treats all errors as "anonymous user" rather than crashing

### 2. GlobalErrorBoundary.jsx - Enhanced Logging
**File**: `components/GlobalErrorBoundary`

Added logging for auth-related errors to help debug future issues:

```javascript
componentDidCatch(error, info) {
  console.error('[GlobalErrorBoundary] Caught render error:', error, info?.componentStack);
  // Also log to help debug auth-related crashes
  if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
    console.warn('[GlobalErrorBoundary] Auth error caught - public page should still render');
  }
}
```

### 3. main.jsx - Already Has Suppression
**File**: `main.jsx` (already existed)

The app already had unhandled rejection suppression:

```javascript
window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event?.reason?.message || event?.reason || '');
  const url = String(event?.reason?.config?.url || event?.reason?.request?.responseURL || '');
  if (url.includes('User/me') || msg.includes('User/me') || msg.includes('401')) {
    event.preventDefault();
  }
});
```

## Testing Checklist

### Logged-out Users (Incognito)
- [ ] Open `/guest-production` in incognito window
- [ ] Page should render immediately (no black screen)
- [ ] SEO content visible
- [ ] CTA buttons work
- [ ] No console errors about 401

### Users with Expired Tokens
- [ ] Clear localStorage or let token expire
- [ ] Visit `/guest-production` directly
- [ ] Should treat as anonymous user
- [ ] No redirect loop
- [ ] No black screen

### Logged-in Users
- [ ] Normal login flow still works
- [ ] `/guest-production` renders with user data
- [ ] CTA buttons scroll to application form
- [ ] Checkout flow still functional

### Other Public Pages
Test all public routes:
- [ ] `/`
- [ ] `/videos`
- [ ] `/performers`
- [ ] `/news`
- [ ] `/fanclub`
- [ ] `/fan-productions`
- [ ] `/become-performer`
- [ ] `/gay-performer-recruitment-philippines`
- [ ] `/how-it-works`
- [ ] `/faq`

## Acceptance Criteria
✅ Logged-out first load of `/guest-production` always renders
✅ 401 Unauthorized from optional user lookup does not break render
✅ Public pages do not require authentication
✅ No black screen on refresh, hard refresh, direct URL entry, or incognito
✅ Existing logged-in checkout/application flow still works
✅ No console errors that break the app

## Files Changed
1. `lib/AuthContext.jsx` - Rewrote checkAppState with defensive promise chain
2. `components/GlobalErrorBoundary` - Added auth error logging
3. `main.jsx` - Already had suppression (no changes needed)

## Notes
- Public pages MUST NOT depend on successful auth checks
- Auth state is optional for public content
- 401 errors should result in `user = null`, not a crash
- The fix ensures auth check always completes (loading → false) even on error