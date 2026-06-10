import { useEffect } from "react";
import { canonicalUrl, getRobotsDirective, isProduction } from "@/lib/seoConfig";

/**
 * SEO Meta Component
 * Dynamically updates document metadata for SEO, Open Graph, Twitter Cards, and JSON-LD
 * 
 * HOSTNAME GUARD: Non-production hosts (base44.app, staging, localhost) are automatically noindex,nofollow
 * while canonical URLs still point to production domain (https://fleshlab.online).
 */
export default function SEOMeta({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  twitterSite = "@fleshlabasia",
  jsonLd,
  noIndex = false  // Explicit noindex for admin/protected pages
}) {
  // CRITICAL: Inject robots meta synchronously BEFORE useEffect to prevent Google from seeing noindex
  // This runs during initial render, ensuring raw HTML has correct robots directive
  // HOSTNAME GUARD: Non-production hosts are ALWAYS noindex regardless of noIndex prop
  if (typeof document !== 'undefined') {
    const isProd = isProduction();
    const robotsDirective = (!isProd || noIndex) ? 'noindex,nofollow' : 'index,follow';
    ['robots', 'googlebot'].forEach(name => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', robotsDirective);
    });
  }

  useEffect(() => {
    // Preserve existing google-site-verification meta tag (don't remove it!)
    const verificationTag = document.querySelector('meta[name="google-site-verification"]');
    const verificationContent = verificationTag?.getAttribute('content');

    // Document Title
    if (title) {
      document.title = title;
    }

    // Meta Description
    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description.substring(0, 160));
      }
    }

    // Restore verification tag if it was removed
    if (verificationContent && !document.querySelector('meta[name="google-site-verification"]')) {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'google-site-verification');
      meta.setAttribute('content', verificationContent);
      document.head.appendChild(meta);
    }

    // Canonical URL — always points to production domain, never staging/Base44
    // CRITICAL: strip query params — canonicals must never contain ?param=value
    if (canonical) {
      const productionCanonical = canonicalUrl(canonical);
      const linkCanonical = document.querySelector('link[rel="canonical"]');
      if (linkCanonical) {
        linkCanonical.setAttribute('href', productionCanonical);
      } else {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = productionCanonical;
        document.head.appendChild(link);
      }
    }

    // Robots — re-apply in useEffect for dynamic navigation (already set synchronously above)
    // HOSTNAME GUARD: Non-production hosts are ALWAYS noindex
    const isProd = isProduction();
    const robotsDirective = (!isProd || noIndex) ? 'noindex,nofollow' : 'index,follow';
    ['robots', 'googlebot'].forEach(name => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', robotsDirective);
    });

    // Open Graph Tags
    // HOSTNAME GUARD: og:url always points to production, never base44.app/staging
    const ogTags = {
      'og:title': title,
      'og:description': description,
      'og:type': ogType,
      // og:url: ALWAYS production canonical (canonicalUrl strips current hostname)
      'og:url': canonical ? canonicalUrl(canonical) : canonicalUrl(window.location.pathname),
    };
    
    if (ogImage) {
      ogTags['og:image'] = ogImage;
    }

    Object.entries(ogTags).forEach(([property, content]) => {
      if (!content) return;
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });

    // Twitter Cards
    const twitterTags = {
      'twitter:card': twitterCard,
      'twitter:title': title,
      'twitter:description': description,
      'twitter:site': twitterSite,
    };
    
    if (ogImage) {
      twitterTags['twitter:image'] = ogImage;
    }

    Object.entries(twitterTags).forEach(([name, content]) => {
      if (!content) return;
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });

    // JSON-LD Structured Data
    // Supports single object OR array of schema objects (e.g. [Person, BreadcrumbList])
    // Uses a single script tag with an array when multiple schemas are provided.
    // HOSTNAME GUARD: JSON-LD is still emitted on non-production for testing, but pages are noindex
    if (jsonLd) {
      let script = document.querySelector('script[data-page-jsonld]');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-page-jsonld', 'true');
        document.head.appendChild(script);
      }
      // If array: wrap in JSON-LD array; if single object: output as-is
      script.textContent = JSON.stringify(Array.isArray(jsonLd) ? jsonLd : jsonLd);
    }

    // Cleanup function (optional - keeps metadata persistent across navigation)
    return () => {
      // Metadata persists for SPA navigation
    };
  }, [title, description, canonical, ogImage, ogType, twitterCard, jsonLd]);
  // Note: isProduction is NOT in dependency array because it's checked synchronously on each render

  return null; // This component doesn't render anything visible
}