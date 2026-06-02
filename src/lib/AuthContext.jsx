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
    console.log("=== PATH DIAGNOSTIC AuthContext.jsx ===");
    console.log("WINDOW_LOCATION_HREF", window.location.href);
    console.log("WINDOW_LOCATION_PATHNAME", window.location.pathname);
    console.log('AUTH_CONTEXT_START', window.location.pathname);
    console.log("==============================");

    // Pathname guard: public routes never need auth BUT still check if user is logged in
    // Exit immediately — zero API calls, zero User/me, no auth blocking.
    const publicPaths = ['/', '/videos', '/news', '/performers', '/become-performer',
      '/fanclub', '/brands', '/how-it-works', '/faq', '/guest-production', '/search'];
    const isPublicRoute = publicPaths.some(p =>
      window.location.pathname === p || window.location.pathname.startsWith(p + '/')
    );

    if (isPublicRoute) {
      console.log('PUBLIC_ROUTE_CHECK_AUTH', window.location.pathname);
      // Still check if user is authenticated (for auto-redirect to dashboard)
      const storedToken = appParams.token || localStorage.getItem('base44_access_token');
      if (storedToken) {
        // Try to get user data
        fetch(`/api/apps/${appParams.appId}/entities/User/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'X-App-Id': appParams.appId,
          }
        }).then(async (resp) => {
          if (resp.ok) {
            const currentUser = await resp.json();
            base44.auth.setToken(storedToken);
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('base44_access_token');
          }
          setIsLoadingAuth(false);
          setAuthChecked(true);
          console.log('AUTH_CONTEXT_FINISH', 'public_with_auth_check');
        }).catch(() => {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoadingAuth(false);
          setAuthChecked(true);
          localStorage.removeItem('base44_access_token');
          console.log('AUTH_CONTEXT_FINISH', 'public_auth_failed');
        });
        return;
      } else {
        // No token - not authenticated
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setIsLoadingPublicSettings(false);
        setAuthChecked(true);
        setAuthError(null);
        console.log('AUTH_CONTEXT_FINISH', 'public_no_token');
        return;
      }
    }

    // Non-public routes: auth is lazy — ProtectedRoute triggers checkUserAuth when rendered.
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
    setAuthChecked(false);
    setIsAuthenticated(false);
    setAuthError(null);
    console.log('AUTH_CONTEXT_FINISH', 'deferred_to_protected_route');
  };

  const checkUserAuth = async () => {
    // Second guard: if somehow called on a public route, bail immediately
    const publicPaths = ['/', '/videos', '/news', '/performers', '/become-performer',
      '/fanclub', '/brands', '/how-it-works', '/faq', '/guest-production', '/search'];
    const isPublicRoute = publicPaths.some(p =>
      window.location.pathname === p || window.location.pathname.startsWith(p + '/')
    );
    if (isPublicRoute) {
      console.log('PUBLIC_ROUTE_SKIP_USER_ME', window.location.pathname);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }

    try {
      console.trace('USER_ME_CALL_TRACE', window.location.pathname);
      setIsLoadingAuth(true);
      const storedToken = appParams.token;
      if (!storedToken) {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
        return;
      }

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
        base44.auth.setToken(storedToken);
        localStorage.setItem('base44_access_token', storedToken);
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.warn('USER_ME_FAILED_SAFE', error?.status || error?.response?.status, error);
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