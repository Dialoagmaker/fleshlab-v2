import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

/**
 * Auto-redirect hook for authenticated users
 * - Admins on "/" → /admin/dashboard
 * - Performers on "/" → /performer/dashboard
 */
export function useAuthRedirect() {
  const { user, isAuthenticated, isLoadingAuth, authChecked } = useAuth();

  useEffect(() => {
    if (authChecked && !isLoadingAuth && isAuthenticated && user) {
      const path = window.location.pathname;
      
      // Redirect admins from "/" to dashboard
      if (user.role === 'admin' && path === '/') {
        console.log('AUTO_REDIRECT_ADMIN_TO_DASHBOARD', { path, role: user.role });
        window.location.href = '/admin/dashboard';
      }
      
      // Redirect performers from "/" to dashboard
      if (user.role === 'performer' && path === '/') {
        console.log('AUTO_REDIRECT_PERFORMER_TO_DASHBOARD', { path, role: user.role });
        window.location.href = '/performer/dashboard';
      }
    }
  }, [authChecked, isLoadingAuth, isAuthenticated, user]);
}