import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function PerformerGuard({ fallback = <DefaultFallback /> }) {
  const [isPerformer, setIsPerformer] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkPerformerAccess();
  }, []);

  const checkPerformerAccess = async () => {
    try {
      // Check if user is authenticated
      const isAuthenticated = await base44.auth.isAuthenticated();
      
      if (!isAuthenticated) {
        setIsPerformer(false);
        setLoading(false);
        return;
      }

      // Get user data
      const user = await base44.auth.me();
      
      // Check if user has performer role OR linked performer profile
      const isPerformerRole = user?.role === 'performer';
      const hasLinkedPerformer = user?.performer_profile_id || user?.performer_id;
      
      if (isPerformerRole || hasLinkedPerformer) {
        setIsPerformer(true);
      } else {
        setIsPerformer(false);
      }
    } catch (error) {
      console.error('PerformerGuard error:', error);
      setIsPerformer(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return fallback;
  }

  if (isPerformer === false) {
    // Not a performer - redirect to login with from parameter
    const from = location.pathname + location.search;
    return <Navigate to={`/performer/login?from=${encodeURIComponent(from)}`} replace />;
  }

  // User is a performer - render child routes
  return <Outlet />;
}