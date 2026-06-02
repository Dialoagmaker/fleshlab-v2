import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { useAuthRedirect } from './hooks/useAuthRedirect';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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
import ContentReview from './pages/admin/ContentReview';
import PromoKitDetail from './pages/admin/PromoKitDetail';
import PerformerSupport from './pages/admin/PerformerSupport';
import ComingSoon from './pages/ComingSoon';
import PerformerRouteHandler from './components/PerformerRouteHandler';
import PerformerLoginPage from './pages/performer/PerformerLoginPage';
import PerformerGuard from './components/PerformerGuard';
import PerformerDashboard from './pages/performer/PerformerDashboard';
import PerformerLogin from './pages/performer/PerformerLogin';
import PerformerLoginPage from './pages/performer/PerformerLoginPage';

import Account from './pages/Account';
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
import HowItWorks from './pages/HowItWorks';
import FAQ from './pages/FAQ';
import Fanclub from './pages/Fanclub';
import GuestProduction from './pages/GuestProduction';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import DMCA from './pages/DMCA';
import Compliance2257 from './pages/Compliance2257';
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
                <Route path="/admin/content-review" element={<ContentReview />} />
                <Route path="/admin/promo-kit/:video_id" element={<PromoKitDetail />} />
                <Route path="/admin/performer-support" element={<PerformerSupport />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </>
    );
  }

  // Temporary manual public route dispatch until React Router is rebuilt cleanly.

  // Static public pages
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

  if (path === "/fanclub") {
    return (
      <PublicPageShell>
        <Fanclub />
      </PublicPageShell>
    );
  }

  if (path === "/guest-production") {
    return (
      <PublicPageShell>
        <GuestProduction />
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

  // Dynamic public routes (detail pages)
  if (path.startsWith("/videos/")) {
    return (
      <PublicPageShell>
        <VideoDetail />
      </PublicPageShell>
    );
  }

  if (path.startsWith("/performers/")) {
    return (
      <PublicPageShell>
        <PerformerDetail />
      </PublicPageShell>
    );
  }

  if (path.startsWith("/brands/")) {
    return (
      <PublicPageShell>
        <BrandDetail />
      </PublicPageShell>
    );
  }

  if (path.startsWith("/news/")) {
    return (
      <PublicPageShell>
        <NewsDetail />
      </PublicPageShell>
    );
  }

  if (path.startsWith("/fanclub/")) {
    return (
      <PublicPageShell>
        <ComingSoon title="Performer Fanclub" />
      </PublicPageShell>
    );
  }

  return (
    <>
      <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/performer/login" element={<PerformerLoginPage />} />
      {/* Performer login - dedicated route */}
      <Route path="/performer/login" element={<PerformerLoginPage />} />
      <Route path="/performerlogin" element={<Navigate to="/performer/login" replace />} />
      {/* Performer login route */}
      <Route path="/performer/login" element={<PerformerLoginPage />} />
      {/* V1 → V2 static path compatibility redirects */}
      <Route path="/Videos" element={<Navigate to="/videos" replace />} />
      <Route path="/Actors" element={<Navigate to="/performers" replace />} />
      <Route path="/News" element={<Navigate to="/news" replace />} />
      <Route path="/NewsCenter" element={<Navigate to="/news" replace />} />
      <Route path="/Brands" element={<Navigate to="/brands" replace />} />
      <Route path="/BecomePerformer" element={<Navigate to="/become-performer" replace />} />
      <Route path="/HowItWorks" element={<Navigate to="/how-it-works" replace />} />
      <Route path="/Home" element={<Navigate to="/" replace />} />
      {/* V1 query-param legacy routes — lookup entity and redirect to clean V2 URL */}
      <Route path="/VideoDetail" element={<LegacyVideoRedirect />} />
      <Route path="/ActorDetail" element={<LegacyActorRedirect />} />
      <Route path="/ArticleReader" element={<LegacyArticleRedirect />} />
      {/* Public routes — dynamic detail pages handled manually above */}
      <Route element={<Layout />}>
        <Route path="/brands" element={<PublicBrands />} />
        <Route path="/search" element={<ComingSoon title="Search" />} />
        {/* V1 root performer slugs — MUST be last so static paths above win */}
        <Route path="/:slug" element={<LegacyPerformerSlug />} />
      </Route>
      {/* Protected routes for non-admin roles */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/account" element={<Account />} />
        {/* Performer dashboard - protected by PerformerRouteHandler */}
        <Route path="/performer/dashboard" element={
          <PerformerRouteHandler>
            <PerformerDashboard />
          </PerformerRouteHandler>
        } />
        {/* Legacy performer login redirect */}
        <Route path="/performerlogin" element={<Navigate to="/performer/login" replace />} />
      </Route>
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