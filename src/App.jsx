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
import Brands from './pages/admin/Brands';
import BrandEdit from './pages/admin/BrandEdit';
import ComingSoon from './pages/ComingSoon';
// Public pages
import PublicVideos from './pages/Videos';
import VideoDetail from './pages/VideoDetail';
import PublicPerformers from './pages/Performers';
import PerformerDetail from './pages/PerformerDetail';
import PublicBrands from './pages/Brands';
import BrandDetail from './pages/BrandDetail';
import PublicNews from './pages/News';
import NewsDetail from './pages/NewsDetail';

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
      </Route>
      {/* Protected placeholder routes for non-admin roles */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/account" element={<ComingSoon title="My Account" />} />
        <Route path="/performer/dashboard" element={<ComingSoon title="Performer Dashboard" />} />
      </Route>
      {/* Admin routes — auth + admin role required */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/videos" element={<Videos />} />
            <Route path="/admin/videos/:id" element={<VideoEdit />} />
            <Route path="/admin/performers" element={<Performers />} />
            <Route path="/admin/performers/:id" element={<PerformerEdit />} />
            <Route path="/admin/brands" element={<Brands />} />
            <Route path="/admin/brands/:id" element={<BrandEdit />} />
            <Route path="/admin/news" element={<ComingSoon title="News Management" />} />
            <Route path="/admin/seo" element={<ComingSoon title="SEO Management" />} />
            <Route path="/admin/migration" element={<ComingSoon title="Migration Tools" />} />
          </Route>
        </Route>
      </Route>
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
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App