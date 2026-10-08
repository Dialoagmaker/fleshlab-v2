import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

/**
 * Handles routing for /performer/* paths
 * - If logged out → redirect to /performer/login?from=<current_path>
 * - If not performer → redirect to /account or /login
 * - If performer → allow rendering
 */
export default function PerformerRouteHandler({ children }) {
  const [checkComplete, setCheckComplete] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(null);
  const location = useLocation();

  useEffect(() => {
    checkPerformerAccess();
  }, []);

  const checkPerformerAccess = async () => {
    try {
      // Check for performer session token first (independent from Base44 auth)
      const performerToken = localStorage.getItem('performer_session_token');
      const performerData = localStorage.getItem('performer_data');
      
      if (performerToken && performerData) {
        // Valid performer session - allow access
        setCheckComplete(true);
        return;
      }
      
      // No performer session - check Base44 auth
      const isAuthenticated = await base44.auth.isAuthenticated();
      
      if (!isAuthenticated) {
        // Not logged in - redirect to performer login
        const fromParam = encodeURIComponent(location.pathname + location.search);
        setShouldRedirect(`/performer/login?from=${fromParam}`);
        setCheckComplete(true);
        return;
      }

      // User is logged in - check if performer
      const user = await base44.auth.me();
      
      const isPerformer = user?.role === 'performer' || user?.performer_profile_id || user?.performer_id;
      
      if (!isPerformer) {
        // Not a performer - redirect to account or login
        setShouldRedirect('/account');
        setCheckComplete(true);
        return;
      }

      // User is a performer - allow access
      setCheckComplete(true);
    } catch (error) {
      console.error('PerformerRouteHandler error:', error);
      setShouldRedirect('/login?from=' + encodeURIComponent(location.pathname + location.search));
      setCheckComplete(true);
    }
  };

  if (!checkComplete) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (shouldRedirect) {
    return <Navigate to={shouldRedirect} replace />;
  }

  return children;
}