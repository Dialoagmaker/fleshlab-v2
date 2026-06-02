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
    if (!authChecked || isLoadingAuth || !isAuthenticated || !user) {
      return;
    }

    const path = window.location.pathname;
    
    // Redirect admins from "/" to dashboard
    if (user.role === 'admin' && path === '/') {
      console.log('AUTO_REDIRECT_ADMIN', { role: user.role });
      window.location.href = '/admin/dashboard';
    }
    
    // Redirect performers from "/" to dashboard
    if (user.role === 'performer' && path === '/') {
      console.log('AUTO_REDIRECT_PERFORMER', { role: user.role });
      window.location.href = '/performer/dashboard';
    }
    
    // Redirect clients from "/" to account page
    if (user.role === 'client' && path === '/') {
      console.log('AUTO_REDIRECT_CLIENT', { role: user.role });
      window.location.href = '/account';
    }
    
    // Redirect non-performers away from /performer/* routes
    if (path.startsWith('/performer/') && path !== '/performer/login') {
      if (user.role !== 'performer' && !user.performer_profile_id && !user.performer_id) {
        console.log('PERFORMER_ROUTE_DENIED', { role: user.role, path });
        window.location.href = '/login?from=' + encodeURIComponent(path);
      }
    }
  }, [authChecked, isLoadingAuth, isAuthenticated, user]);
}