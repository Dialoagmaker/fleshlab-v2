import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    // Make ZERO API calls on startup.
    // Any auth API call (including the public-settings check) triggers the Base44 SDK’s
    // internal interceptor which calls entities/User/me on 401 — crashing public pages.
    //
    // Auth is now fully lazy:
    //   • Public pages: render immediately, anonymous entity calls, no auth dependency.
    //   • Private pages: ProtectedRoute.useEffect calls checkUserAuth() when first rendered.
    //
    // This is the ONLY way to guarantee zero User/me calls on public routes.
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
    setAuthChecked(false); // false → ProtectedRoute will call checkUserAuth() when needed
    setIsAuthenticated(false);
    setAuthError(null);
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const storedToken = appParams.token;
      if (!storedToken) {
        // No stored token — anonymous visitor, skip auth check entirely
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
        return;
      }

      // Validate the token via a raw fetch — intentionally NOT using base44.auth.setToken()
      // before validation. setToken() propagates to the entity client (Video.list, etc.),
      // so calling it with a stale token would cause 401s on concurrent public entity calls
      // and trigger the SDK interceptor's log-user-in-app retry loop → 429.
      // Only set the token on the client AFTER confirming it is valid.
      const resp = await fetch(
        `/api/apps/${appParams.appId}/entities/User/me`,
        {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'X-App-Id': appParams.appId,
          }
        }
      );

      if (resp.ok) {
        const currentUser = await resp.json();
        // Token confirmed valid — set on SDK client AND restore to localStorage
        // (base44Client.js cleared it at init time to prevent SDK auto-auth with stale token)
        base44.auth.setToken(storedToken);
        localStorage.setItem('base44_access_token', storedToken);
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        // Invalid/expired — already cleared from localStorage in base44Client.js init
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      localStorage.removeItem('base44_access_token');
      localStorage.removeItem('token');
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    const current = window.location.pathname;
    // Never set from_url to /login (or any auth route) — prevents infinite nesting
    const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/performerlogin'];
    const isAuthRoute = authRoutes.some(r => current.startsWith(r));
    const fromUrl = isAuthRoute ? '/' : window.location.href;
    base44.auth.redirectToLogin(fromUrl);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};