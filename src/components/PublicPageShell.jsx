import TubeHeader from "@/components/tube/TubeHeader";
import TubeFooter from "@/components/tube/TubeFooter";
import { useEffect } from "react";

export default function PublicPageShell({ children, noIndex }) {
  // Ensure immediate first paint - children always render (even if loading internally)
  // CRITICAL: Suppress any unhandled 401 errors from auth checks on public pages
  useEffect(() => {
    const handleUnauthError = (event) => {
      const msg = String(event?.reason?.message || event?.reason || '');
      const url = String(event?.reason?.config?.url || event?.reason?.request?.responseURL || '');
      if (url.includes('User/me') || msg.includes('401') || msg.includes('Unauthorized')) {
        event.preventDefault();
        console.debug('[PublicPageShell] Suppressed 401 on public page');
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnauthError);
    return () => window.removeEventListener('unhandledrejection', handleUnauthError);
  }, []);
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      {/* SEO robots meta for public pages */}
      {!noIndex && typeof document !== 'undefined' && (() => {
        let meta = document.querySelector('meta[name="robots"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'robots');
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', 'index,follow');
      })()}
      
      {/* Header - visible on first paint */}
      <TubeHeader />
      
      {/* Main content area - always rendered, never blocked */}
      <main className="w-full">
        {children}
      </main>
      
      {/* Footer */}
      <TubeFooter />
    </div>
  );
}