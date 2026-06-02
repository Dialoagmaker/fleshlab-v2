import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
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
import PerformerDashboard from './pages/performer/PerformerDashboard';
import PerformerLogin from './pages/performer/PerformerLogin';
// Public pages
import PublicVideos from './pages/Videos';
import VideoDetail from './pages/VideoDetail';
import PublicPerformers from './pages/Performers';
import PerformerDetail from './pages/PerformerDetail';
import PublicBrands from './pages/Brands';
import BrandDetail from './pages/BrandDetail';
import PublicNews from './pages/News';
import NewsDetail from './pages/NewsDetail';
import NewsDirectTest from './pages/NewsDirectTest';
import VideosDirectTest from './pages/VideosDirectTest';
import BecomePerformer from './pages/BecomePerformer';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import LegacyVideoRedirect from './pages/LegacyVideoRedirect';
import LegacyActorRedirect from './pages/LegacyActorRedirect';
import LegacyArticleRedirect from './pages/LegacyArticleRedirect';
import LegacyPerformerSlug from './pages/LegacyPerformerSlug';
import HowItWorks from './pages/HowItWorks';
import FAQ from './pages/FAQ';

// BUILD V7 — Router location probe
function RouterLocationProbe() {
  const location = useLocation();
  console.log("=== ROUTER_LOCATION_PROBE BUILD V7 ===");
  console.log("ROUTER_PATHNAME", location.pathname);
  console.log("ROUTER_SEARCH", location.search);
  console.log("ROUTER_HASH", location.hash);
  console.log("ROUTER_STATE", location.state);
  console.log("======================================");
  return (
    <div style={{ background: 'blue', color: 'white', padding: 12, position: 'fixed', top: 150, left: 0, zIndex: 9999999 }}>
      ROUTER LOCATION · BUILD V7 · {location.pathname}
    </div>
  );
}

const AuthenticatedApp = () => {
  console.log("=== APP_RENDER_START BUILD V7 ===");
  console.log("WINDOW_LOCATION_HREF", window.location.href);
  console.log("WINDOW_LOCATION_PATHNAME", window.location.pathname);
  console.log("ROUTE_TREE_PRINT:");
  console.log("  /news → NewsDirectTest");
  console.log("  /videos → VideosDirectTest");
  console.log("  /* → WildcardTest");
  console.log("=================================");
  const { authError } = useAuth();

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // BUILD V8 — Manual dispatcher: bypass React Router for public routes
  const path = window.location.pathname;

  if (path === "/news") {
    console.log("MANUAL_NEWS_DISPATCH_RENDER_BUILD_V8");
    return (
      <div style={{
        minHeight: "100vh",
        background: "#003333",
        color: "white",
        padding: "100px",
        fontSize: "36px",
        fontFamily: "Arial",
        position: "relative",
        zIndex: 999999
      }}>
        MANUAL NEWS DISPATCH IS VISIBLE · BUILD V8 · /news
      </div>
    );
  }

  if (path === "/videos") {
    console.log("MANUAL_VIDEOS_DISPATCH_RENDER_BUILD_V8");
    return (
      <div style={{
        minHeight: "100vh",
        background: "#330000",
        color: "white",
        padding: "100px",
        fontSize: "36px",
        fontFamily: "Arial",
        position: "relative",
        zIndex: 999999
      }}>
        MANUAL VIDEOS DISPATCH IS VISIBLE · BUILD V8 · /videos
      </div>
    );
  }

  return (
    <>
      <div style={{ background: 'yellow', color: 'black', padding: 12, position: 'fixed', top: 0, left: 0, zIndex: 9999999 }}>
        APP JSX IS ACTIVE · BUILD V7 · {window.location.pathname}
      </div>
      <div style={{ background: 'lime', color: 'black', padding: 12, position: 'fixed', top: 50, left: 0, zIndex: 9999999 }}>
        BEFORE ROUTES RENDER · BUILD V7
      </div>
      <RouterLocationProbe />
      <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
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
      {/* ISOLATION TEST BUILD V7 — direct component routes, no Layout/Outlet */}
      <Route path="/news" element={<NewsDirectTest />} />
      <Route path="/videos" element={<VideosDirectTest />} />
      {/* Public routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        {/* /videos moved to direct top-level route for isolation test */}
        <Route path="/videos/:slug" element={<VideoDetail />} />
        <Route path="/performers" element={<PublicPerformers />} />
        <Route path="/performers/:slug" element={<PerformerDetail />} />
        <Route path="/brands" element={<PublicBrands />} />
        <Route path="/brands/:slug" element={<BrandDetail />} />
        <Route path="/fanclub" element={<ComingSoon title="Fanclub" />} />
        <Route path="/fanclub/:slug" element={<ComingSoon title="Performer Fanclub" />} />
        {/* /news moved to direct top-level route for isolation test */}
        <Route path="/news/:slug" element={<NewsDetail />} />
        <Route path="/search" element={<ComingSoon title="Search" />} />
        <Route path="/guest-production" element={<ComingSoon title="Guest Production" />} />
        <Route path="/become-performer" element={<BecomePerformer />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/faq" element={<FAQ />} />
        {/* V1 root performer slugs — MUST be last inside Layout so static paths above win */}
        <Route path="/:slug" element={<LegacyPerformerSlug />} />
      </Route>
      {/* Protected routes for non-admin roles */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/account" element={<ComingSoon title="My Account" />} />
        <Route path="/performer/dashboard" element={<PerformerDashboard />} />
        <Route path="/performerlogin" element={<PerformerLogin />} />
      </Route>
      {/* Admin routes — auth + admin role required */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Dashboard />} />
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
      {/* WILDCARD TEST BUILD V7 — inside Routes block */}
      <Route
        path="*"
        element={
          <div style={{
            minHeight: "100vh",
            background: "#111",
            color: "yellow",
            padding: "100px",
            fontSize: "32px",
            position: "relative",
            zIndex: 999999
          }}>
            WILDCARD ROUTE MATCHED · BUILD V7 · {window.location.pathname}
            <div style={{ marginTop: '20px', fontSize: '16px', color: '#38b2ac' }}>
              If you see this, the /news or /videos route is missing or not matching.
            </div>
          </div>
        }
      />
    </Routes>
    <div style={{ background: 'orange', color: 'black', padding: 12, position: 'fixed', top: 100, left: 0, zIndex: 9999999 }}>
      AFTER ROUTES RENDER · BUILD V7
    </div>
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