import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardHeader from "@/components/performerDashboard/DashboardHeader";
import PerformerDashboardTabs from "@/components/performerDashboard/PerformerDashboardTabs";

export default function PerformerDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [performer, setPerformer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      // Load dashboard data
      const [dashboardRes, statsRes] = await Promise.all([
        base44.functions.invoke("performerDashboardService", {
          action: "get_dashboard_summary"
        }),
        base44.functions.invoke("performerDashboardService", {
          action: "get_career_statistics"
        })
      ]);

      if (dashboardRes.data.error) {
        setError(dashboardRes.data.error);
        setLoading(false);
        return;
      }

      setPerformer({
        ...dashboardRes.data,
        career_stats: statsRes.data.stats
      });
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Dashboard Unavailable</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Please contact management if you believe this is an error.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        performer={performer} 
        onLogout={() => logout()} 
      />
      <PerformerDashboardTabs performer={performer} />
    </div>
  );
}