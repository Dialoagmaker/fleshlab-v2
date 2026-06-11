import TubeHeader from "@/components/tube/TubeHeader";
import TubeFooter from "@/components/tube/TubeFooter";
import { useEffect, useState } from "react";

const PRODUCTION_DOMAIN = 'https://fleshlab.online';

// Path normalization: lowercase + handle known uppercase legacy routes
function normalizePath(pathname) {
  const lower = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  // Map known uppercase/legacy staging paths to correct production paths
  const MAP = {
    '/live': '/fanclub',
    '/actors': '/performers',
    '/newscenter': '/news',
    '/howitworks': '/how-it-works',
    '/gay-performer-recruitment': '/become-performer',
    '/remote-adult-content-creator': '/become-performer',
    '/guest-productions': '/guest-production',
  };
  return MAP[lower] || lower;
}

function isStaging() {
  return typeof window !== 'undefined' && window.location.hostname.includes('base44.app');
}

// Inject noindex + canonical into <head> synchronously
function injectStagingMeta() {
  if (typeof document === 'undefined') return;
  const path = normalizePath(window.location.pathname);
  const canonicalHref = PRODUCTION_DOMAIN + path;

  ['robots', 'googlebot'].forEach(name => {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex,nofollow');
  });

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalHref;
}

// Run synchronously at module load for initial page hit
if (isStaging()) {
  injectStagingMeta();
}

export default function PublicPageShell({ children, noIndex }) {
  const [redirecting, setRedirecting] = useState(false);

  // Suppress unhandled 401 errors on public pages
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

  // STAGING REDIRECT — runs on every render/navigation
  useEffect(() => {
    if (!isStaging()) return;

    // Inject meta immediately (covers SPA navigation)
    injectStagingMeta();

    // Redirect to production equivalent
    const path = normalizePath(window.location.pathname);
    const target = PRODUCTION_DOMAIN + path;
    setRedirecting(true);
    window.location.replace(target);
  }, []);

  // Block render while redirecting
  if (redirecting || isStaging()) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      <TubeHeader />
      <main className="w-full">
        {children}
      </main>
      <TubeFooter />
    </div>
  );
}