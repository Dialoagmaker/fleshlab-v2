import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { setAnalyticsUserId, clearAnalyticsUserId, trackLogout } from '@/lib/analytics';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // CRITICAL: Initialize as NOT loading - public pages must render immediately
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false); // FALSE - don't block render
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Auth check runs in background - never blocks render
    checkAppState();
  }, []);

  const checkAppState = async () => {
    console.log('AUTH_CHECK_START', { path: window.location.pathname });
    
    try {
      const resp = await fetch('/api/v1/auth/me', { credentials: 'include' });

      if (!resp.ok) {
        // 401/403 - treat as anonymous, don't break app
        console.log('AUTH_CHECK_401_ANONYMOUS', { status: resp.status });
        setUser(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
        clearAnalyticsUserId();
        return;
      }

      const currentUser = await resp.json();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthChecked(true);
      setAnalyticsUserId(currentUser.id);
      console.log('AUTH_CHECK_SUCCESS', { role: currentUser.role, email: currentUser.email });
    } catch (error) {
      console.log('AUTH_CHECK_ERROR_ANONYMOUS', error?.message || error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      clearAnalyticsUserId();
    }
  };

  const logout = (shouldRedirect = true) => {
    trackLogout();
    clearAnalyticsUserId();
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    const current = window.location.pathname;
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
      authError,
      authChecked,
      logout,
      navigateToLogin,
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
