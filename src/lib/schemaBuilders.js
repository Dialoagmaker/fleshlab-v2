/**
 * JSON-LD Schema Builders for FLESHLAB
 * Critical: Only use validated public URLs
 */

import { canonicalUrl } from './seoConfig';
import { isPublicImageUrl, isPublicPreviewUrl } from './seoValidation';

export const schemaBuilders = {
  // Organization (site-wide)
  organization: () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FLESHLAB Asia",
    "url": canonicalUrl('/'),
    "logo": canonicalUrl('/logo.png'),
    "description": "Premium Asian gay studio featuring verified 18+ performers and original productions"
  }),
  
  // WebSite (homepage) — SearchAction ONLY if /search exists and works publicly
  webSite: (searchExists = false) => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "FLESHLAB Asia",
    "url": canonicalUrl('/'),
    ...(searchExists && {
      "potentialAction": {
        "@type": "SearchAction",
        "target": canonicalUrl('/search?q={search_term_string}'),
        "query-input": "required name=search_term_string"
      }
    })
  }),
  
  // CollectionPage (/videos)
  collectionPage: (videoCount, videos) => {
    const safeVideos = videos
      .map(video => schemaBuilders.videoObject(video))
      .filter(Boolean); // Remove null schemas
    
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Asian Twink Videos & Studio Trailers",
      "description": "Browse public trailers and previews from FLESHLAB's Asian gay studio library",
      "url": canonicalUrl('/videos'),
      "numberOfItems": videoCount,
      "itemListElement": safeVideos.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": item
      }))
    };
  },
  
  // VideoObject (individual video) — CRITICAL: validated public URLs only
  videoObject: (video, performerName = null) => {
    // Resolve thumbnail — prefer primary, fallback to cover
    const thumbnailCandidate = video.primary_thumbnail_url || video.cover_image_url || video.thumbnailUrl || video.poster_url;
    const safeThumbnail = isPublicImageUrl(thumbnailCandidate) ? thumbnailCandidate : null;

    // If no safe thumbnail, omit schema entirely — thumbnailUrl is mandatory per Google spec
    if (!safeThumbnail) {
      return null;
    }

    // Resolve uploadDate — mandatory per Google spec; skip VideoObject if missing
    const uploadDateRaw = video.release_date || video.published_at || video.created_date;
    if (!uploadDateRaw) {
      return null;
    }
    let uploadDate;
    try {
      const d = new Date(uploadDateRaw);
      if (isNaN(d.getTime())) return null;
      // If source already has time+timezone info (contains 'T' or '+' or 'Z'), normalize to ISO with +08:00
      // Otherwise treat as midnight Taiwan time (+08:00)
      if (/[TZ+]/.test(uploadDateRaw) && uploadDateRaw.length > 10) {
        // Shift to +08:00 representation
        const offsetMs = 8 * 60 * 60 * 1000;
        const local = new Date(d.getTime() + offsetMs);
        const pad = n => String(n).padStart(2, '0');
        uploadDate = `${local.getUTCFullYear()}-${pad(local.getUTCMonth()+1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}+08:00`;
      } else {
        // Date-only string — use midnight Taiwan time
        uploadDate = `${uploadDateRaw.substring(0, 10)}T00:00:00+08:00`;
      }
    } catch {
      return null;
    }

    // Resolve description
    const description = (
      video.meta_description ||
      video.seo_description ||
      video.short_summary ||
      video.description ||
      (performerName ? `${video.title} — exclusive scene featuring ${performerName} on FLESHLAB Studios.` : `${video.title} — premium adult scene on FLESHLAB Studios.`)
    )?.substring(0, 300) || undefined;

    // ISO 8601 duration
    let duration;
    if (video.duration_seconds && video.duration_seconds > 0) {
      const h = Math.floor(video.duration_seconds / 3600);
      const m = Math.floor((video.duration_seconds % 3600) / 60);
      const s = video.duration_seconds % 60;
      duration = `PT${h > 0 ? h + 'H' : ''}${m > 0 ? m + 'M' : ''}${s > 0 ? s + 'S' : ''}` || undefined;
    }

    // Safe trailer as contentUrl (public preview only — never full source)
    const safeTrailer = isPublicPreviewUrl(video.trailer_url) ? video.trailer_url : null;

    // Canonical video page URL
    const videoUrl = video.slug ? `https://fleshlab.online/videos/${video.slug}` : undefined;

    const schema = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": video.title,
      "description": description,
      "thumbnailUrl": safeThumbnail,
      "uploadDate": uploadDate,
      "url": videoUrl,
      "publisher": {
        "@type": "Organization",
        "name": "FLESHLAB Studios",
        "url": "https://fleshlab.online"
      },
    };

    if (duration) schema.duration = duration;
    if (safeTrailer) schema.contentUrl = safeTrailer;
    if (videoUrl) schema.embedUrl = videoUrl; // canonical page as embedUrl fallback

    if (video.performers?.length > 0) {
      schema.actor = video.performers.map(p => ({
        "@type": "Person",
        "name": p.display_name,
        ...(p.slug && { "url": `https://fleshlab.online/performers/${p.slug}` }),
      }));
    }

    return schema;
  },
  
  // Person (performer profile) — public data only
  person: (performer) => {
    const safeImage = isPublicImageUrl(performer.profile_image_url) 
      ? performer.profile_image_url 
      : undefined;
    
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": performer.display_name,
      "url": canonicalUrl(`/performers/${performer.slug}`),
      "image": safeImage,
      "description": performer.bio?.substring(0, 200),
      "nationality": performer.nationality,
      // Only public social links
      "sameAs": performer.social_links?.filter(link => link.url && !link.isPrivate).map(link => link.url)
    };
  },
  
  // Article (news)
  article: (article) => {
    const safeImage = isPublicImageUrl(article.cover_image_url) 
      ? article.cover_image_url 
      : undefined;
    
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": article.excerpt?.substring(0, 200),
      "image": safeImage,
      "datePublished": article.published_at,
      "dateModified": article.updated_at,
      "author": {
        "@type": "Organization",
        "name": "FLESHLAB Studio"
      },
      "publisher": {
        "@type": "Organization",
        "name": "FLESHLAB Asia",
        "logo": {
          "@type": "ImageObject",
          "url": canonicalUrl('/logo.png')
        }
      }
    };
  },
  
  // BlogPosting (news article variant)
  blogPosting: (article) => {
    const safeImage = isPublicImageUrl(article.cover_image_url) 
      ? article.cover_image_url 
      : undefined;
    
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": article.title,
      "description": article.excerpt?.substring(0, 200),
      "image": safeImage,
      "datePublished": article.published_at,
      "dateModified": article.updated_at,
      "wordCount": article.content?.split(' ').length || 0,
      "articleBody": article.content?.substring(0, 500)
    };
  },
  
  // BreadcrumbList (all pages)
  breadcrumbList: (items) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": canonicalUrl(item.path)
    }))
  }),
  
  // ItemList (category/tag pages)
  itemList: (items, itemType = 'VideoObject') => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": itemType,
        "name": item.title || item.display_name,
        "url": canonicalUrl(item.url)
      }
    }))
  }),
  
  // Video Sitemap Entry helper
  videoSitemapEntry: (video, canonicalUrlFn, escapeXmlFn) => {
    const safeThumbnail = isPublicImageUrl(video.primary_thumbnail_url) 
      ? video.primary_thumbnail_url 
      : null;
    const safeTrailer = isPublicPreviewUrl(video.trailer_url) 
      ? video.trailer_url 
      : null;
    
    // Skip if no valid thumbnail
    if (!safeThumbnail) return null;
    
    return {
      loc: canonicalUrlFn(`/videos/${video.slug}`),
      'video:video': {
        'video:thumbnail_loc': safeThumbnail,
        'video:title': escapeXmlFn(video.title),
        'video:description': escapeXmlFn(video.short_summary || ''),
        'video:player_loc': safeTrailer ? canonicalUrlFn(`/videos/${video.slug}`) : undefined,
        'video:duration': video.duration_seconds || undefined,
        'video:publication_date': video.release_date ? new Date(video.release_date).toISOString() : undefined,
        'video:family_friendly': 'no',
        'video:requires_subscription': 'yes',
        'video:uploader': 'FLESHLAB Asia',
        'video:live': 'no'
      }
    };
  },
  
  // Image Sitemap Entry helper
  imageSitemapEntry: (imageUrl, pageUrl, title, caption, canonicalUrlFn, escapeXmlFn) => {
    // Validate image URL is public
    if (!isPublicImageUrl(imageUrl)) {
      console.warn('[SEO] Skipping image sitemap - not public:', imageUrl);
      return null;
    }
    
    return {
      loc: pageUrl,
      'image:image': {
        'image:loc': imageUrl,
        'image:title': escapeXmlFn(title),
        'image:caption': escapeXmlFn(caption?.substring(0, 200) || '')
      }
    };
  }
};