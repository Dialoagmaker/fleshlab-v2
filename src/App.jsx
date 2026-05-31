import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Dashboard from './pages/admin/Dashboard';
import ComingSoon from './pages/ComingSoon';

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
      {/* Public routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/videos" element={<ComingSoon title="Video Library" />} />
        <Route path="/videos/:slug" element={<ComingSoon title="Video" />} />
        <Route path="/performers" element={<ComingSoon title="Performers" />} />
        <Route path="/performers/:slug" element={<ComingSoon title="Performer Profile" />} />
        <Route path="/brands" element={<ComingSoon title="Brands" />} />
        <Route path="/brands/:slug" element={<ComingSoon title="Brand" />} />
        <Route path="/fanclub" element={<ComingSoon title="Fanclub" />} />
        <Route path="/fanclub/:slug" element={<ComingSoon title="Performer Fanclub" />} />
        <Route path="/news" element={<ComingSoon title="News" />} />
        <Route path="/news/:slug" element={<ComingSoon title="Article" />} />
        <Route path="/search" element={<ComingSoon title="Search" />} />
        <Route path="/guest-production" element={<ComingSoon title="Guest Production" />} />
      </Route>
      {/* Admin routes */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/videos" element={<ComingSoon title="Video Management" />} />
        <Route path="/admin/videos/:id" element={<ComingSoon title="Edit Video" />} />
        <Route path="/admin/performers" element={<ComingSoon title="Performer Management" />} />
        <Route path="/admin/performers/:id" element={<ComingSoon title="Edit Performer" />} />
        <Route path="/admin/brands" element={<ComingSoon title="Brand Management" />} />
        <Route path="/admin/news" element={<ComingSoon title="News Management" />} />
        <Route path="/admin/seo" element={<ComingSoon title="SEO Management" />} />
        <Route path="/admin/migration" element={<ComingSoon title="Migration Tools" />} />
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