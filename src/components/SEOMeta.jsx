import { useEffect } from "react";
import { canonicalUrl, isProduction } from "@/lib/seoConfig";
import {
  buildBreadcrumbListJsonLd,
  buildSeoMetadata,
  buildVideoObjectJsonLd,
  serializeJsonLd,
} from "@/lib/seoMetadata";

function setMetaTag({ selector, attribute, key, content }) {
  const matchingTags = [...document.head.querySelectorAll(selector)];
  const meta = matchingTags.shift() || document.createElement('meta');
  matchingTags.forEach(tag => tag.remove());

  if (!content) {
    meta.remove();
    return;
  }

  meta.setAttribute(attribute, key);
  meta.setAttribute('content', content);
  if (!meta.parentNode) document.head.appendChild(meta);
}

export default function SEOMeta({
  title,
  description,
  canonical,
  canonicalUrl: canonicalUrlProp,
  ogImage,
  imageUrl,
  ogType = "website",
  pageType,
  twitterCard = "summary_large_image",
  twitterSite = "@fleshlabasia",
  tags,
  publishedAt,
  modifiedAt,
  duration,
  breadcrumbs,
  videoObject,
  jsonLd,
  noIndex = false
}) {
  useEffect(() => {
    const routeCanonical = canonicalUrl(canonicalUrlProp || canonical || window.__FLESHLAB_CANONICAL__ || window.location.pathname);
    const routePath = routeCanonical ? new URL(routeCanonical).pathname : window.location.pathname;
    const initialRobots = document.querySelector('meta[name="robots"]')?.content || '';
    const metadata = buildSeoMetadata({
      title,
      description,
      canonicalUrl: routeCanonical,
      imageUrl: imageUrl || ogImage,
      ogType,
      pageType,
      twitterCard,
      twitterSite,
      tags,
      publishedAt,
      modifiedAt,
      duration,
      production: isProduction(),
      noindex: noIndex,
      initialRobots,
      pathname: routePath,
      search: window.location.search,
    });
    document.title = metadata.title || 'FLESHLAB';

    const canonicalLinks = [...document.head.querySelectorAll('link[rel="canonical"]')];
    const canonicalLink = canonicalLinks.shift() || document.createElement('link');
    canonicalLinks.forEach(link => link.remove());
    canonicalLink.rel = 'canonical';
    canonicalLink.href = metadata.canonical;
    window.__FLESHLAB_CANONICAL__ = metadata.canonical;
    if (!canonicalLink.parentNode) document.head.appendChild(canonicalLink);

    metadata.metaTags.forEach(({ attribute, key, content }) => {
      const selector = attribute === 'property' ? `meta[property="${key}"]` : `meta[name="${key}"]`;
      setMetaTag({ selector, attribute, key, content });
    });

    const pageSchemas = [];
    if (jsonLd) pageSchemas.push(...(Array.isArray(jsonLd) ? jsonLd : [jsonLd]));
    else {
      const videoSchema = videoObject || (pageType === 'VideoObject' ? {
        name: title,
        description,
        thumbnailUrl: imageUrl || ogImage,
        uploadDate: publishedAt,
        modifiedAt,
        duration,
      } : null);
      if (videoSchema) pageSchemas.push(buildVideoObjectJsonLd({
        ...videoSchema,
        id: videoSchema.id || `${metadata.canonical}#video`,
        url: videoSchema.url || metadata.canonical,
      }));
      if (breadcrumbs?.length) pageSchemas.push(buildBreadcrumbListJsonLd(breadcrumbs));
    }

    const validSchemas = pageSchemas.filter(Boolean);
    if (validSchemas.length) {
      let script = document.querySelector('script[data-page-jsonld]');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-page-jsonld', 'true');
        document.head.appendChild(script);
      }
      script.textContent = serializeJsonLd(validSchemas.length === 1 ? validSchemas[0] : validSchemas);
    } else {
      document.querySelector('script[data-page-jsonld]')?.remove();
    }
  }, [title, description, canonical, canonicalUrlProp, ogImage, imageUrl, ogType, pageType, twitterCard, twitterSite, tags, publishedAt, modifiedAt, duration, breadcrumbs, videoObject, jsonLd, noIndex]);

  return null;
}
