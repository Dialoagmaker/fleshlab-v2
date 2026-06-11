import { useEffect } from "react";
import { canonicalUrl, isProduction } from "@/lib/seoConfig";

export default function SEOMeta({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  twitterSite = "@fleshlabasia",
  jsonLd,
  noIndex = false
}) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', description.substring(0, 160));
    }

    if (canonical) {
      const href = canonicalUrl(canonical);
      let link = document.querySelector('link[rel="canonical"]');
      if (link) {
        link.setAttribute('href', href);
      } else {
        link = document.createElement('link');
        link.rel = 'canonical';
        link.href = href;
        document.head.appendChild(link);
      }
    }

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

    const ogTags = {
      'og:title': title,
      'og:description': description,
      'og:type': ogType,
      'og:url': canonical ? canonicalUrl(canonical) : canonicalUrl(window.location.pathname),
    };
    if (ogImage) ogTags['og:image'] = ogImage;

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

    const twitterTags = {
      'twitter:card': twitterCard,
      'twitter:title': title,
      'twitter:description': description,
      'twitter:site': twitterSite,
    };
    if (ogImage) twitterTags['twitter:image'] = ogImage;

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

    if (jsonLd) {
      let script = document.querySelector('script[data-page-jsonld]');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-page-jsonld', 'true');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(Array.isArray(jsonLd) ? jsonLd : jsonLd);
    }
  }, [title, description, canonical, ogImage, ogType, twitterCard, jsonLd, noIndex]);

  return null;
}