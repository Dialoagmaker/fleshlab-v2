import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

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
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        // No token here — this is a public endpoint and doesn't need auth.
        // Passing the stale token with interceptResponses:true can trigger
        // log-user-in-app retry loops on 401.
        interceptResponses: false
      });
      
      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
        
        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
        setAuthChecked(true); // ensure ProtectedRoute never spins forever
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setAuthChecked(true); // ensure ProtectedRoute never spins forever
    }
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
        // Token confirmed valid — now set it on the entity client for authenticated calls
        base44.auth.setToken(storedToken);
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        // Invalid/expired token — clear from localStorage, leave client anonymous
        localStorage.removeItem('base44_access_token');
        localStorage.removeItem('token');
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