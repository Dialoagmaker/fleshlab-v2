import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Plus, LogOut, Wallet as WalletIcon, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { getDashboardPath } from "@/lib/roleResolver";
import SEOMeta from "@/components/SEOMeta";

import DashboardNav from "@/components/clientDashboard/DashboardNav";
import OverviewTab from "@/components/clientDashboard/OverviewTab";
import FanProductionsTab from "@/components/clientDashboard/FanProductionsTab";
import VideosTab from "@/components/clientDashboard/VideosTab";
import FanclubTab from "@/components/clientDashboard/FanclubTab";
import PaymentsTab from "@/components/clientDashboard/PaymentsTab";
import MessagesTab from "@/components/clientDashboard/MessagesTab";
import ProfileTab from "@/components/clientDashboard/ProfileTab";
import VerificationTab from "@/components/clientDashboard/VerificationTab";
import SecurityTab from "@/components/clientDashboard/SecurityTab";
import WalletTab from "@/components/clientDashboard/WalletTab";

function getInitialTab() {
  const params = new URLSearchParams(window.location.search);
  return params.get("tab") || "overview";
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoadingAuth, authChecked, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // ADMIN GUARD: Redirect admin/super_admin to admin dashboard
  useEffect(() => {
    if (authChecked && isAuthenticated && user) {
      console.log("[ClientDashboardGuard]", {
        email: user.email,
        role: user.role,
        performer_profile_id: user.performer_profile_id,
        performer_id: user.performer_id,
      });
      
      const isAdmin = user.role === "admin" || user.role === "super_admin";
      const resolvedPath = getDashboardPath(user);
      
      console.log("[ClientDashboardGuard]", {
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
  }, [authChecked, isAuthenticated, user, navigate]);

  // Logout handler - reuses existing auth logout with redirect
  const handleLogout = () => {
    logout(true); // redirects to /login with return URL preserved
  };

  // Data state
  const [requests, setRequests] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    if (!authChecked || isLoadingAuth) return;
    if (!isAuthenticated) {
      window.location.href = "/login?next=" + encodeURIComponent("/client/dashboard");
      return;
    }
    loadData();
  }, [authChecked, isLoadingAuth, isAuthenticated]);

  // Sync tab to URL param
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.replaceState(null, "", url.toString());
  }, [activeTab]);

  const loadData = async () => {
    // Load all three in parallel, fail gracefully per source
    const userId = user?.id;
    const userEmail = user?.email;

    // Fan Production requests
    base44.entities.GuestProductionApplication.filter({ request_type: "fan_production" })
      .then((all) => {
        const mine = all.filter((r) => r.applicant_user_id === userId || r.email === userEmail);
        mine.sort((a, b) => new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date));
        setRequests(mine);
      })
      .catch(() => setRequests([]))
      .finally(() => setLoadingRequests(false));

    // Subscriptions
    base44.entities.Subscription.filter({ user_id: userId })
      .then((subs) => setSubscriptions(subs || []))
      .catch(() => setSubscriptions([]))
      .finally(() => setLoadingSubscriptions(false));

    // Payments
    base44.entities.Payment.filter({ user_id: userId })
      .then((pmts) => {
        const sorted = (pmts || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        setPayments(sorted);
      })
      .catch(() => setPayments([]))
      .finally(() => setLoadingPayments(false));
  };

  if (!authChecked || isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const displayName = user?.full_name && user.full_name !== user.email ? user.full_name : null;
  const loading = loadingRequests || loadingSubscriptions || loadingPayments;

  const tabProps = {
    requests,
    subscriptions,
    payments,
    user,
    loading,
    loadingRequests,
    setActiveTab,
  };

  return (
    <>
      <SEOMeta title="Client Dashboard | FLESHLAB" noIndex={true} />
      <div className="min-h-screen bg-[#080808] text-white">

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <div className="border-b border-white/6 bg-[#0a0505]">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-600/20 border border-rose-600/30 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <span className="text-rose-400 text-xs font-black uppercase tracking-widest">FLESHLAB Account</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">Client Dashboard</h1>
                <p className="text-white/35 text-sm mt-1">
                  {displayName ? `Welcome back, ${displayName}. ` : "Welcome back. "}
                  Manage your Fan Production requests, video purchases, Fanclub access, payments and account details.
                </p>
              </div>
              <div className="shrink-0">
              <Button
                onClick={() => window.location.href = "/fan-productions/request"}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold gap-2 rounded-xl h-auto py-2.5 px-5 text-sm shadow-lg shadow-rose-700/20"
              >
                <Plus className="w-4 h-4" />
                New Fan Production Request
              </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY ────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Nav */}
            <DashboardNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

            {/* Tab content */}
            <div className="flex-1 min-w-0">
              {activeTab === "overview"         && <OverviewTab {...tabProps} />}
              {activeTab === "fan-productions"  && <FanProductionsTab requests={requests} loading={loadingRequests} />}
              {activeTab === "videos"           && <VideosTab />}
              {activeTab === "fanclub"          && <FanclubTab subscriptions={subscriptions} loading={loadingSubscriptions} />}
              {activeTab === "payments"         && <PaymentsTab payments={payments} loading={loadingPayments} />}
              {activeTab === "messages"         && <MessagesTab />}
              {activeTab === "profile"          && <ProfileTab user={user} requests={requests} />}
              {activeTab === "verification"     && <VerificationTab requests={requests} />}
              {activeTab === "security"         && <SecurityTab user={user} />}
              {activeTab === "wallet"          && <WalletTab />}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}