import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PageNotFound from './lib/PageNotFound';
import { trackPageView, getRouteCategory } from './lib/analytics';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { useAuthRedirect } from './hooks/useAuthRedirect';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import SEOMeta from './components/SEOMeta';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminWallets from './pages/admin/Wallets';
import AdminPaymentProviders from './pages/admin/PaymentProviders';
import TrackingTest from './pages/admin/TrackingTest';
import LiveActivity from './pages/admin/LiveActivity';
// Add page imports here
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import AdminGuard from './components/AdminGuard';
import Home from './pages/Home';
import Dashboard from './pages/admin/Dashboard';
import Videos from './pages/admin/Videos';
import VideoEdit from './pages/admin/VideoEdit';
import Performers from './pages/admin/Performers';
import PerformerEdit from './pages/admin/PerformerEdit';
import PerformerLayout from './components/performer/PerformerLayout';
import PerformerDetailWrapper from './pages/admin/PerformerDetailWrapper';
import Brands from './pages/admin/Brands';
import BrandEdit from './pages/admin/BrandEdit';
import VideoPerformerMatch from './pages/admin/VideoPerformerMatch';
import VideoMetadataCompletion from './pages/admin/VideoMetadataCompletion';
import MissingPerformerAssignments from './pages/admin/MissingPerformerAssignments';
import Applications from './pages/admin/Applications';
import VideoUploadTest from './pages/admin/VideoUploadTest';
import DraftReview from './pages/admin/DraftReview';
import UnlinkedPerformers from './pages/admin/UnlinkedPerformers';
import MonthlyCloseout from './pages/admin/MonthlyCloseout';
import Earnings from './pages/admin/Earnings';
import ContentReview from './pages/admin/ContentReview';
import PerformerSubmissionsReview from './pages/admin/PerformerSubmissionsReview';
import PromoKitDetail from './pages/admin/PromoKitDetail';
import PerformerSupport from './pages/admin/PerformerSupport';
import PayoutRequests from './pages/admin/PayoutRequests';
import DuplicateVideos from './pages/admin/DuplicateVideos';
import LegacyAssetInventory from './pages/admin/LegacyAssetInventory';
import AssetRepairQueue from './pages/admin/AssetRepairQueue';
import AITextGenerator from './pages/admin/AITextGenerator';
import AdminUsers from './pages/admin/Users';
import AdminUserDetail from './pages/admin/UserDetail';
import FunnelAnalytics from './pages/admin/FunnelAnalytics';
import GrowthDashboard from './pages/admin/GrowthDashboard';
import ExecutiveDashboard from './pages/admin/ExecutiveDashboard';
import AdminPayments from './pages/admin/Payments';
import AdminRevenueDashboard from './pages/admin/RevenueDashboard';
import MonthlyPayoutSummary from './pages/admin/MonthlyPayoutSummary';
import MonthlyCloseoutPreview from './pages/admin/MonthlyCloseoutPreview';
import PayoutCloseouts from './pages/admin/PayoutCloseouts';
import ComingSoon from './pages/ComingSoon';
import PerformerRouteHandler from './components/PerformerRouteHandler';
import PerformerGuard from './components/PerformerGuard';
import PerformerLoginPage from './pages/performer/PerformerLoginPage';
import PerformerDashboard from './pages/performer/PerformerDashboard';
import PerformerLogin from './pages/performer/PerformerLogin';

import Account from './pages/Account';
import ClientDashboardGuard from './components/ClientDashboardGuard';
// Public pages
import PublicVideos from './pages/Videos';
import VideoDetail from './pages/VideoDetail';
import PublicPerformers from './pages/Performers';
import PerformerDetail from './pages/PerformerDetail';
import PublicBrands from './pages/Brands';
import BrandDetail from './pages/BrandDetail';
import PublicNews from './pages/News';
import NewsDetail from './pages/NewsDetail';
import BecomePerformer from './pages/BecomePerformer';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import LegacyVideoRedirect from './pages/LegacyVideoRedirect';
import LegacyActorRedirect from './pages/LegacyActorRedirect';
import LegacyArticleRedirect from './pages/LegacyArticleRedirect';
import LegacyPerformerSlug from './pages/LegacyPerformerSlug';
import GhostRoute from './pages/GhostRoute';
import SignContract from './pages/SignContract';
import ApplicationUpload from './pages/ApplicationUpload';
import HowItWorks from './pages/HowItWorks';
import FAQ from './pages/FAQ';
import Fanclub from './pages/Fanclub';
import GuestProduction from './pages/GuestProduction';
import FanProductions from './pages/FanProductions';
import FanProductionRequest from './pages/FanProductionRequest';
import ClientDashboard from './pages/ClientDashboard';
import Onboarding from './pages/Onboarding';
import PhilippinesRecruitment from './pages/PhilippinesRecruitment';
import Live from './pages/Live';
import LiveFitmaster from './pages/LiveFitmaster';
import GoRedirect from './pages/GoRedirect';

import GayTwinkPerformerRecruitment from './pages/GayTwinkPerformerRecruitment';
import ChaturbateRecruitment from './pages/ChaturbateRecruitment';
import GayOnlyfansAlternative from './pages/GayOnlyfansAlternative';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import DMCA from './pages/DMCA';
import Compliance2257 from './pages/Compliance2257';
import Imprint from './pages/Imprint';
import CookiePolicy from './pages/CookiePolicy';
import PublicPageShell from './components/PublicPageShell';

const AuthenticatedApp = () => {
  useAuthRedirect();
  const { authError, isAuthenticated, user } = useAuth();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    
    // Also watch for hash changes and direct URL manipulation
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== path) {
        setPath(window.location.pathname);
      }
    });
    
    // Use a simpler approach: check on every click
    const handleClick = () => {
      setTimeout(() => {
        if (window.location.pathname !== path) {
          setPath(window.location.pathname);
        }
      }, 0);
    };
    
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick);
    };
  }, [path]);

  // Track page views for GA4 on route changes
  useEffect(() => {
    if (path) {
      const category = getRouteCategory(path);
      trackPageView(path, document.title, category);
    }
  }, [path]);



  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // CRITICAL: Admin routes must NOT be handled by public dispatch
  // Let React Router handle all /admin routes with ProtectedRoute + AdminGuard
  if (path.startsWith("/admin")) {
    return (
      <>
        <Routes>
          {/* Admin routes — auth + admin role required */}
          <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
            <Route element={<AdminGuard />}>
              <Route element={<AdminLayout />}>
                {/* /admin redirects to /admin/dashboard */}
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/videos" element={<Videos />} />
                <Route path="/admin/videos/:id" element={<VideoEdit />} />
                <Route path="/admin/video-performer-match" element={<VideoPerformerMatch />} />
                <Route path="/admin/video-metadata-completion" element={<VideoMetadataCompletion />} />
                <Route path="/admin/video-upload" element={<VideoUploadTest />} />
                <Route path="/admin/draft-review" element={<DraftReview />} />
                <Route path="/admin/missing-performer-assignments" element={<MissingPerformerAssignments />} />
                <Route path="/admin/applications" element={<Applications />} />
                <Route path="/admin/performers" element={<Performers />} />
                <Route path="/admin/performers/new" element={<PerformerEdit />} />
                <Route path="/admin/unlinked-performers" element={<UnlinkedPerformers />} />
                {/* Performer OS 6-tab shell — single route, tabs are internal UI state */}
                <Route path="/admin/performers/:id" element={
                  <PerformerLayout>
                    <PerformerDetailWrapper />
                  </PerformerLayout>
                } />
                <Route path="/admin/brands" element={<Brands />} />
                <Route path="/admin/brands/:id" element={<BrandEdit />} />
                <Route path="/admin/news" element={<ComingSoon title="News Management" />} />
                <Route path="/admin/seo" element={<ComingSoon title="SEO Management" />} />
                <Route path="/admin/migration" element={<ComingSoon title="Migration Tools" />} />
                <Route path="/admin/monthly-closeout" element={<MonthlyCloseout />} />
                <Route path="/admin/earnings" element={<Earnings />} />
                <Route path="/admin/content-review" element={<ContentReview />} />
                <Route path="/admin/performer-submissions" element={<PerformerSubmissionsReview />} />
                <Route path="/admin/promo-kit/:video_id" element={<PromoKitDetail />} />
                <Route path="/admin/performer-support" element={<PerformerSupport />} />
                <Route path="/admin/payout-requests" element={<PayoutRequests />} />
                <Route path="/admin/duplicate-videos" element={<DuplicateVideos />} />
                <Route path="/admin/legacy-assets" element={<LegacyAssetInventory />} />
                <Route path="/admin/asset-repair-queue" element={<AssetRepairQueue />} />
                <Route path="/admin/asset-repair-queue" element={<AssetRepairQueue />} />
                <Route path="/admin/ai-text-generator" element={<AITextGenerator />} />
                <Route path="/admin/growth" element={<GrowthDashboard />} />
                <Route path="/admin/executive-dashboard" element={<ExecutiveDashboard />} />
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/revenue" element={<AdminRevenueDashboard />} />
                <Route path="/admin/monthly-payout-summary" element={<MonthlyPayoutSummary />} />
                <Route path="/admin/monthly-closeout-preview" element={<MonthlyCloseoutPreview />} />
                <Route path="/admin/payout-closeouts" element={<PayoutCloseouts />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/users/:id" element={<AdminUserDetail />} />
                <Route path="/admin/funnel" element={<FunnelAnalytics />} />
                <Route path="/admin/wallets" element={<AdminWallets />} />
                <Route path="/admin/payment-providers" element={<AdminPaymentProviders />} />
                <Route path="/admin/tracking-test" element={<TrackingTest />} />
                <Route path="/admin/live-activity" element={<LiveActivity />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </>
    );
  }

  // Temporary manual public route dispatch until React Router is rebuilt cleanly.

  // Static public pages - MUST be before auth checks
  if (path === "/robots.txt") {
    // Static file served from public/robots.txt
    // No need to handle - Vite serves static files from public/ folder automatically
    return null;
  }

  if (path === "/performerlogin") {
    return (
      <PublicPageShell noIndex={true}>
        <PerformerLoginPage />
      </PublicPageShell>
    );
  }

  if (path === "/performer/login") {
    return <Navigate to="/performerlogin" replace />;
  }

  // Legacy URL redirects (301 to canonical lowercase)
  if (path === "/Videos") return <Navigate to="/videos" replace />;
  if (path === "/Home") return <Navigate to="/" replace />;
  if (path === "/Actors") return <Navigate to="/performers" replace />;
  if (path === "/Gay-Performer-Recruitment") return <Navigate to="/gay-performer-recruitment-philippines" replace />;
  if (path === "/Gay-Adult-Content-Creator") return <Navigate to="/become-performer" replace />;
  if (path === "/Remote-Adult-Content-Creator") return <Navigate to="/become-performer" replace />;
  if (path === "/Imprint") return <Navigate to="/imprint" replace />;
  if (path === "/guest-productions") return <Navigate to="/guest-production" replace />;
  if (path === "/NewsCenter") return <Navigate to="/news" replace />;
  if (path === "/Brands") return <Navigate to="/brands" replace />;
  if (path === "/HowItWorks") return <Navigate to="/how-it-works" replace />;
  
  if (path === "/guest-production") {
    return (
      <PublicPageShell>
        <GuestProduction />
      </PublicPageShell>
    );
  }

  if (path === "/") {
    return (
      <PublicPageShell>
        <Home />
      </PublicPageShell>
    );
  }

  if (path === "/videos") {
    return (
      <PublicPageShell>
        <PublicVideos />
      </PublicPageShell>
    );
  }

  if (path === "/performers") {
    return (
      <PublicPageShell>
        <PublicPerformers />
      </PublicPageShell>
    );
  }

  if (path === "/news") {
    return (
      <PublicPageShell>
        <PublicNews />
      </PublicPageShell>
    );
  }

  if (path === "/become-performer") {
    return (
      <PublicPageShell>
        <BecomePerformer />
      </PublicPageShell>
    );
  }

  if (path === "/how-it-works") {
    return (
      <PublicPageShell>
        <HowItWorks />
      </PublicPageShell>
    );
  }

  if (path === "/faq") {
    return (
      <PublicPageShell>
        <FAQ />
      </PublicPageShell>
    );
  }

  if (path === "/terms") {
    return (
      <PublicPageShell>
        <Terms />
      </PublicPageShell>
    );
  }

  if (path === "/privacy") {
    return (
      <PublicPageShell>
        <Privacy />
      </PublicPageShell>
    );
  }

  if (path === "/dmca") {
    return (
      <PublicPageShell>
        <DMCA />
      </PublicPageShell>
    );
  }

  if (path === "/2257") {
    return (
      <PublicPageShell>
        <Compliance2257 />
      </PublicPageShell>
    );
  }

  if (path === "/imprint") {
    return (
      <PublicPageShell>
        <Imprint />
      </PublicPageShell>
    );
  }

  if (path === "/cookie-policy") {
    return (
      <PublicPageShell>
        <CookiePolicy />
      </PublicPageShell>
    );
  }

  if (path === "/gay-onlyfans-alternative") {
    return (
      <PublicPageShell>
        <GayOnlyfansAlternative />
      </PublicPageShell>
    );
  }

  if (path === "/brands") {
    return (
      <PublicPageShell>
        <PublicBrands />
      </PublicPageShell>
    );
  }

  if (path === "/sign-contract") {
    return (
      <PublicPageShell noIndex={true}>
        <SignContract />
      </PublicPageShell>
    );
  }

  if (path === "/application-upload") {
    return (
      <PublicPageShell noIndex={true}>
        <ApplicationUpload />
      </PublicPageShell>
    );
  }

  // Dynamic public routes — now handled by React Router <Routes> below
  // so useParams() works correctly and slug is always available

  // Ghost routes — V1/old tool paths that must NOT fall into /:slug wildcard
  // These are dead paths; render noindex 404 immediately.
  const GHOST_PATHS = [
    '/AdminSmartThumbnails', '/AuthGateway', '/PerformerVideoStats',
    '/AdminVideos', '/AdminApplications', '/PerformerDashboard',
    '/SEOAuditPhase1Report', '/AdminSEOReport', '/AdminPerformers',
  ];
  if (GHOST_PATHS.includes(path)) {
    return <GhostRoute />;
  }

  return (
    <>
      <Routes>
      {/* Auth routes — noindex to prevent indexing */}
      <Route path="/login" element={<><SEOMeta title="Log In" description="Log in to your FLESHLAB account" canonical="/login" noIndex={true} /><Login /></>} />
      <Route path="/register" element={<><SEOMeta title="Create Account" description="Create your FLESHLAB account" canonical="/register" noIndex={true} /><Register /></>} />
      <Route path="/forgot-password" element={<><SEOMeta title="Reset Password" description="Reset your FLESHLAB password" canonical="/forgot-password" noIndex={true} /><ForgotPassword /></>} />
      <Route path="/reset-password" element={<><SEOMeta title="Set New Password" description="Set your new FLESHLAB password" canonical="/reset-password" noIndex={true} /><ResetPassword /></>} />
      <Route path="/performer/login" element={<PerformerLoginPage />} />
      <Route path="/performerlogin" element={<Navigate to="/performer/login" replace />} />
      {/* V1 → V2 static path compatibility - handled by manual dispatch above for immediate render */}
      {/* These routes are now handled in the manual dispatch section to prevent black screen */}
      {/* V1 query-param legacy routes — lookup entity and redirect to clean V2 URL */}
      <Route path="/VideoDetail" element={<LegacyVideoRedirect />} />
      <Route path="/ActorDetail" element={<LegacyActorRedirect />} />
      <Route path="/ArticleReader" element={<LegacyArticleRedirect />} />
      {/* Legacy uppercase/mixed-case URL redirects → canonical lowercase */}
      <Route path="/Videos" element={<Navigate to="/videos" replace />} />
      <Route path="/Home" element={<Navigate to="/" replace />} />
      <Route path="/Actors" element={<Navigate to="/performers" replace />} />
      <Route path="/Gay-Performer-Recruitment" element={<Navigate to="/become-performer" replace />} />
      <Route path="/Remote-Adult-Content-Creator" element={<Navigate to="/become-performer" replace />} />
      <Route path="/guest-productions" element={<Navigate to="/guest-production" replace />} />
      {/* Ghost routes — V1/old tool paths blocked before /:slug wildcard */}
      <Route path="/AdminSmartThumbnails" element={<GhostRoute />} />
      <Route path="/AuthGateway" element={<GhostRoute />} />
      <Route path="/PerformerVideoStats" element={<GhostRoute />} />
      <Route path="/AdminVideos" element={<GhostRoute />} />
      <Route path="/AdminApplications" element={<GhostRoute />} />
      <Route path="/PerformerDashboard" element={<GhostRoute />} />
      <Route path="/SEOAuditPhase1Report" element={<GhostRoute />} />
      <Route path="/AdminSEOReport" element={<GhostRoute />} />
      <Route path="/AdminPerformers" element={<GhostRoute />} />
      {/* Dynamic detail pages — use PublicPageShell + React Router so useParams() works */}
      <Route path="/videos/:slug" element={<PublicPageShell><VideoDetail /></PublicPageShell>} />
      <Route path="/performers/:slug" element={<PublicPageShell><PerformerDetail /></PublicPageShell>} />
      <Route path="/news/:slug" element={<PublicPageShell><NewsDetail /></PublicPageShell>} />
      <Route path="/brands/:slug" element={<PublicPageShell><BrandDetail /></PublicPageShell>} />
      <Route path="/fan-productions" element={<PublicPageShell><FanProductions /></PublicPageShell>} />
      <Route path="/fan-productions/request" element={<PublicPageShell noIndex={true}><FanProductionRequest /></PublicPageShell>} />
      {/* FleshPay Wallet — redirect to the single client dashboard wallet tab */}
      <Route path="/wallet" element={<Navigate to="/client/dashboard?tab=wallet" replace />} />
      <Route path="/client/dashboard" element={
        <PublicPageShell noIndex={true}>
          <ClientDashboardGuard>
            <ClientDashboard />
          </ClientDashboardGuard>
        </PublicPageShell>
      } />
      <Route path="/fanclub/:slug" element={<PublicPageShell><ComingSoon title="Performer Fanclub" /></PublicPageShell>} />
      <Route path="/fanclub" element={<PublicPageShell><Fanclub /></PublicPageShell>} />
      {/* Onboarding — after registration, before dashboard */}
      <Route path="/onboarding" element={<PublicPageShell noIndex={true}><Onboarding /></PublicPageShell>} />
      <Route path="/gay-performer-recruitment-philippines" element={<PublicPageShell><PhilippinesRecruitment /></PublicPageShell>} />
      <Route path="/live" element={<PublicPageShell><Live /></PublicPageShell>} />
      <Route path="/live/fitmaster" element={<PublicPageShell><LiveFitmaster /></PublicPageShell>} />
      <Route path="/go/:slug" element={<GoRedirect />} />

      <Route path="/gay-twink-performer-recruitment" element={<PublicPageShell><GayTwinkPerformerRecruitment /></PublicPageShell>} />
      <Route path="/chaturbate-model-join-studio" element={<PublicPageShell><ChaturbateRecruitment /></PublicPageShell>} />
      <Route path="/gay-onlyfans-alternative" element={<PublicPageShell><GayOnlyfansAlternative /></PublicPageShell>} />
      {/* Public routes */}
      <Route element={<Layout />}>
        <Route path="/brands" element={<PublicBrands />} />
        <Route path="/search" element={<ComingSoon title="Search" />} />
        {/* V1 root performer slugs — MUST be last so static paths above win */}
        <Route path="/:slug" element={<LegacyPerformerSlug />} />
      </Route>
      {/* Protected routes for non-admin roles — noindex */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/account" element={<><SEOMeta title="Account Settings" description="Manage your account settings" canonical="/account" noIndex={true} /><Account /></>} />
      </Route>
      
      {/* Performer dashboard - uses PerformerRouteHandler (independent from Base44 auth) — noindex */}
      <Route path="/performer/dashboard" element={
        <><SEOMeta title="Performer Dashboard" description="Manage your performer profile" canonical="/performer/dashboard" noIndex={true} />
        <PerformerRouteHandler>
          <PerformerDashboard />
        </PerformerRouteHandler>
        </>
      } />
      {/* Admin routes are now handled by manual dispatch above to prevent public route interception */}
      {/* Wildcard route */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <GlobalErrorBoundary>
            <AuthenticatedApp />
          </GlobalErrorBoundary>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App