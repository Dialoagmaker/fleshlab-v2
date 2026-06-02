import { useEffect } from "react";
import { canonicalUrl, getRobotsDirective } from "@/lib/seoConfig";

/**
 * SEO Meta Component
 * Dynamically updates document metadata for SEO, Open Graph, Twitter Cards, and JSON-LD
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
  useEffect(() => {
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

    // Canonical URL — always points to production domain, never staging/Base44
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

    // Robots — explicit noindex for admin/protected, otherwise environment-based
    const robotsDirective = noIndex ? 'noindex,nofollow' : getRobotsDirective();
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
    const ogTags = {
      'og:title': title,
      'og:description': description,
      'og:type': ogType,
      'og:url': canonicalUrl(window.location.pathname),
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
    if (jsonLd) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }

    // Cleanup function (optional - keeps metadata persistent across navigation)
    return () => {
      // Metadata persists for SPA navigation
    };
  }, [title, description, canonical, ogImage, ogType, twitterCard, jsonLd]);

  return null; // This component doesn't render anything visible
}