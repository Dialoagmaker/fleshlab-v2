import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Plus, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { getDashboardPath } from "@/lib/roleResolver";
import SEOMeta from "@/components/SEOMeta";

import DashboardNav from "@/components/clientDashboard/DashboardNav";
import ClientDashboardSidebar from "@/components/clientDashboard/ClientDashboardSidebar";
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
import FlashPayHeaderBalance from "@/components/clientDashboard/FlashPayHeaderBalance";

function getInitialTab() {
  const params = new URLSearchParams(window.location.search);
  return params.get("tab") || "overview";
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoadingAuth, authChecked, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [showNotifications, setShowNotifications] = useState(false);

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
  const notificationPreview = [
    { title: "New releases are waiting", body: "Fresh productions have landed in the FLESHLAB library.", href: "/videos" },
    ...(requests.length ? [{ title: "Fan Production update", body: "Your latest request has new status information.", href: "#" }] : []),
    ...(payments.length ? [{ title: "Payment confirmation", body: "Your recent payment activity is available in your account.", href: "#" }] : []),
  ].slice(0, 4);

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
      <div className="min-h-screen bg-[#080808] text-white flex">

        <ClientDashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

        <div className="flex-1 min-w-0">
          {/* ── ENTERTAINMENT TOP BAR ─────────────────────────────── */}
          <div className="sticky top-0 z-20 border-b border-white/10 bg-[#05070a]/82 px-4 py-4 backdrop-blur-2xl lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-[#f0183d]/12 text-[#f0183d] sm:flex"><Sparkles className="h-5 w-5" /></div>
                <div>
                  <h1 className="text-base font-black tracking-[-0.03em] text-white lg:text-lg">{displayName ? `Welcome back, ${displayName.split(" ")[0]}` : "Welcome back"}</h1>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/34">Ready for another session?</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FlashPayHeaderBalance />
                <a href="/videos" className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-white/56 transition hover:border-white/20 hover:text-white md:flex"><Search className="h-4 w-4" /> Discover</a>
                <div className="relative">
                  <button onClick={() => setShowNotifications((value) => !value)} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/64 transition hover:border-[#f0183d]/40 hover:text-white">
                    <Bell className="h-4 w-4" />
                    {notificationPreview.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#f0183d]" />}
                  </button>
                  {showNotifications && <div className="absolute right-0 top-12 w-80 rounded-3xl border border-white/10 bg-[#080b0e] p-3 shadow-2xl shadow-black/50"><p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#f0183d]">Notifications</p>{notificationPreview.map((item) => <a key={item.title} href={item.href} className="block rounded-2xl p-3 hover:bg-white/[0.06]"><div className="text-sm font-black text-white">{item.title}</div><div className="mt-1 text-xs leading-5 text-white/45">{item.body}</div></a>)}</div>}
                </div>
                <Button onClick={() => window.location.href = "/fan-productions/request"} className="shrink-0 gap-2 rounded-full bg-[#f0183d] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white hover:bg-[#ff3152]">
                  <Plus className="h-4 w-4" /> Create
                </Button>
              </div>
            </div>
          </div>

          {/* ── MOBILE NAV ──────────────────────────────────────────── */}
          <div className="px-4 pt-4 lg:hidden">
            <DashboardNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
          </div>

          {/* ── BODY ────────────────────────────────────────────────── */}
          <div className="px-4 lg:px-8 py-6">
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
              {activeTab === "wallet"          && <WalletTab setActiveTab={setActiveTab} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}