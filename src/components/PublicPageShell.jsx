import TubeHeader from "@/components/tube/TubeHeader";
import TubeFooter from "@/components/tube/TubeFooter";
import { useEffect } from "react";

const PRODUCTION_DOMAIN = 'https://fleshlab.online';

// Immediately redirect base44.app traffic to production equivalent
// This runs synchronously before render — Googlebot executes this as a soft 301
function redirectIfStaging() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (host.includes('base44.app')) {
    // Map path to production: lowercase, strip any hash
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    const target = PRODUCTION_DOMAIN + path;
    window.location.replace(target);
    return true;
  }
  return false;
}

// Run immediately (module-level, before any React render)
const IS_STAGING_REDIRECT = redirectIfStaging();

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
  
  // Apply noindex + canonical for staging fallback (if redirect didn't fire yet)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = window.location.hostname;
    if (host.includes('base44.app')) {
      // Force noindex,nofollow on staging
      ['robots', 'googlebot'].forEach(name => {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', name); document.head.appendChild(meta); }
        meta.setAttribute('content', 'noindex,nofollow');
      });
      // Set canonical to production equivalent
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
      canonical.href = PRODUCTION_DOMAIN + path;
    }
  }, []);

  // If staging redirect is in progress, render nothing
  if (IS_STAGING_REDIRECT) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      {/* SEO robots meta for public pages */}
      {!noIndex && typeof document !== 'undefined' && (() => {
        const host = window.location.hostname;
        const isStaging = host.includes('base44.app');
        let meta = document.querySelector('meta[name="robots"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'robots');
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', isStaging ? 'noindex,nofollow' : 'index,follow');
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