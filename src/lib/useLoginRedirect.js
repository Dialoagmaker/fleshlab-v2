import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

/**
 * Get dashboard path based on user role
 * Priority: admin > performer > client > fallback
 */
function getDashboardPath(user) {
  if (!user) return '/login';
  
  // Admin has highest priority
  if (user.role === 'admin' || user.role === 'super_admin') {
    return '/admin/dashboard';
  }
  
  // Performer second
  if (user.role === 'performer' || user.performer_profile_id || user.performer_id) {
    return '/performer/dashboard';
  }
  
  // Client/Customer fallback
  return '/client/dashboard';
}

/**
 * Hook to handle post-login redirect based on user role
 */
export function useLoginRedirect() {
  const navigate = useNavigate();

  const redirectAfterLogin = async (nextUrl) => {
    try {
      const user = await base44.auth.me();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // If nextUrl provided and it's not a dashboard URL, use it
      if (nextUrl && !nextUrl.includes('/dashboard')) {
        window.location.href = nextUrl;
        return;
      }

      // Otherwise redirect based on role
      const dashboardPath = getDashboardPath(user);
      console.log('[LoginRedirect] User role:', user.role, '→ Redirecting to:', dashboardPath);
      window.location.href = dashboardPath;
    } catch (error) {
      console.error('[LoginRedirect] Error:', error);
      navigate('/login');
    }
  };

  return { redirectAfterLogin };
}

/**
 * Direct function for non-hook usage
 */
export async function redirectBasedOnRole(nextUrl) {
  try {
    const user = await base44.auth.me();
    
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (nextUrl && !nextUrl.includes('/dashboard')) {
      window.location.href = nextUrl;
      return;
    }

    const dashboardPath = getDashboardPath(user);
    console.log('[RoleRedirect] User:', user.email, 'Role:', user.role, '→', dashboardPath);
    window.location.href = dashboardPath;
  } catch (error) {
    console.error('[RoleRedirect] Error:', error);
    window.location.href = '/login';
  }
}