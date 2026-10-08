import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import CreatorOSWorkspace from "@/components/creatorOS/CreatorOSWorkspace";

export default function PerformerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [performer, setPerformer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const token = localStorage.getItem("performer_session_token");
      const performerData = localStorage.getItem("performer_data");
      
      if (!token || !performerData) {
        navigate("/performer/login");
        return;
      }

      const performer = JSON.parse(performerData);

      // Load dashboard data
      const [dashboardRes, statsRes] = await Promise.all([
        base44.functions.invoke("performerDashboardService", {
          action: "get_dashboard_summary",
          performer_id: performer.id,
          performer_token: token
        }),
        base44.functions.invoke("performerDashboardService", {
          action: "get_career_statistics",
          performer_id: performer.id,
          performer_token: token
        })
      ]);

      if (dashboardRes.data.error) {
        setError(dashboardRes.data.error);
        setLoading(false);
        return;
      }

      setPerformer({
        performer: dashboardRes.data.performer,
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
          <p className="text-muted-foreground">Building your Creator OS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Determine specific error type and show appropriate message
    const isAccessError = error.toLowerCase().includes('access') || 
                          error.toLowerCase().includes('not active') ||
                          error.toLowerCase().includes('not found');
    
    const isContractError = error.toLowerCase().includes('contract');
    const isUserError = error.toLowerCase().includes('user') || 
                        error.toLowerCase().includes('linked');

    let title = "Dashboard Unavailable";
    let message = error;
    let actionText = "Contact Support";

    if (isAccessError) {
      title = "Access Restricted";
      actionText = "Contact FLESHLAB Support";
    }

    if (isContractError) {
      message = "Dashboard access is not available until your performer agreement is signed. Please complete the contract signing process or contact management.";
    } else if (isUserError) {
      message = "Your performer account is active, but no login user is linked yet. Please contact FLESHLAB support to complete your account setup.";
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
              <p className="text-muted-foreground leading-relaxed">{message}</p>
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Need help?</strong>
              </p>
              <p className="text-muted-foreground">
                📧 Email: <a href="mailto:support@fleshlab.studio" className="text-primary hover:underline">support@fleshlab.studio</a>
              </p>
              <p className="text-muted-foreground">
                💬 WhatsApp: +49 176 12345678
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/performer/login")}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                Back to Login
              </button>
              <a
                href="mailto:support@fleshlab.studio"
                className="flex-1 border border-border hover:bg-secondary px-4 py-2.5 rounded-lg font-medium text-center transition-colors"
              >
                {actionText}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CreatorOSWorkspace
      performer={performer?.performer}
      careerStats={performer?.career_stats}
      performerToken={localStorage.getItem("performer_session_token")}
    />
  );
}