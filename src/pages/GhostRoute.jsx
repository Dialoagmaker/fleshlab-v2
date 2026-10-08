import { useEffect } from 'react';

/**
 * GhostRoute
 * Used for V1/legacy paths that no longer exist and must NOT fall into /:slug.
 * Renders a noindex 404-style page and injects noindex meta immediately.
 * Does not redirect anywhere — just dead-ends cleanly.
 */
export default function GhostRoute() {
  useEffect(() => {
    // Inject noindex so crawlers never index this path
    ['robots', 'googlebot'].forEach(name => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'noindex,nofollow');
    });

    // Remove any canonical that might have been set
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.remove();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-light text-muted-foreground">404</h1>
        <p className="text-muted-foreground">This page no longer exists.</p>
        <a href="/" className="inline-block mt-4 text-sm text-primary underline">Go Home</a>
      </div>
    </div>
  );
}