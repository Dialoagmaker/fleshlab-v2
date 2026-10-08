import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getDashboardPath } from "@/lib/roleResolver";

/**
 * ClientDashboardGuard - Protects Client Dashboard from admin access
 * 
 * Admin/super_admin users should NOT access client dashboard by default.
 * This guard redirects admins to their appropriate dashboard.
 */
export default function ClientDashboardGuard({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoadingAuth, authChecked } = useAuth();

  useEffect(() => {
    if (!authChecked || isLoadingAuth) return;
    
    if (!isAuthenticated) {
      // Not authenticated - redirect to login
      window.location.href = "/login?next=" + encodeURIComponent("/client/dashboard");
      return;
    }

    if (user) {
      console.log("[ClientDashboardGuard]", {
        email: user.email,
        role: user.role,
        performer_profile_id: user.performer_profile_id,
        performer_id: user.performer_id,
      });
      
      const isAdmin = user.role === "admin" || user.role === "super_admin";
      const resolvedPath = getDashboardPath(user);
      
      console.log("[ClientDashboardGuard]", {
        isAdmin,
        shouldRedirectToAdmin: isAdmin,
        redirectTarget: resolvedPath,
        currentPath: window.location.pathname,
      });
      
      // If admin is on client dashboard, redirect to admin dashboard
      if (isAdmin && resolvedPath !== "/client/dashboard") {
        console.log("[ClientDashboardGuard] Redirecting admin to", resolvedPath);
        navigate(resolvedPath, { replace: true });
      }
    }
  }, [authChecked, isLoadingAuth, isAuthenticated, user, navigate]);

  // Show loading state while checking auth
  if (!authChecked || isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated, return null (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Render children if not admin
  return children;
}