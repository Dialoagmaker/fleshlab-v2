import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    console.log('=== AUTH_CHECK ===', { path: window.location.pathname });
    
    const storedToken = appParams.token || localStorage.getItem('base44_access_token');
    
    if (!storedToken) {
      // No token - not authenticated, skip user fetch entirely
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      console.log('AUTH_NO_TOKEN - skipping user fetch');
      return;
    }

    // Token exists - verify it and get user data
    // CRITICAL: Use .then() chain to prevent any unhandled rejections
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
        // Token invalid (401, 403, etc) - clear it and treat as anonymous
        throw new Error('Token invalid: ' + resp.status);
      }
    })
    .then(currentUser => {
      // Valid user
      base44.auth.setToken(storedToken);
      localStorage.setItem('base44_access_token', storedToken);
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      console.log('AUTH_SUCCESS', { role: currentUser.role, email: currentUser.email });
    })
    .catch(error => {
      // Any error (network, 401, JSON parse, etc) - treat as anonymous
      console.warn('AUTH_ERROR - treating as anonymous', error?.message || error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('base44_access_token');
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });
  };

  const logout = (shouldRedirect = true) => {
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