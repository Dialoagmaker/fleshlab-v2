import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
import BecomePerformer from './pages/BecomePerformer';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import LegacyVideoRedirect from './pages/LegacyVideoRedirect';
import LegacyActorRedirect from './pages/LegacyActorRedirect';
import LegacyArticleRedirect from './pages/LegacyArticleRedirect';
import LegacyPerformerSlug from './pages/LegacyPerformerSlug';
import HowItWorks from './pages/HowItWorks';
import FAQ from './pages/FAQ';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
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
      {/* Public routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/videos" element={<PublicVideos />} />
        <Route path="/videos/:slug" element={<VideoDetail />} />
        <Route path="/performers" element={<PublicPerformers />} />
        <Route path="/performers/:slug" element={<PerformerDetail />} />
        <Route path="/brands" element={<PublicBrands />} />
        <Route path="/brands/:slug" element={<BrandDetail />} />
        <Route path="/fanclub" element={<ComingSoon title="Fanclub" />} />
        <Route path="/fanclub/:slug" element={<ComingSoon title="Performer Fanclub" />} />
        <Route path="/news" element={<PublicNews />} />
        <Route path="/news/:slug" element={<NewsDetail />} />
        <Route path="/search" element={<ComingSoon title="Search" />} />
        <Route path="/guest-production" element={<ComingSoon title="Guest Production" />} />
        <Route path="/become-performer" element={<BecomePerformer />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/faq" element={<FAQ />} />
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
      {/* V1 root performer slugs: /jameson-official → /performers/jameson-official */}
      <Route path="/:slug" element={<LegacyPerformerSlug />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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