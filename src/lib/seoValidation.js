/**
 * SEO Safety Validation Functions
 * Critical: Prevents exposure of private URLs in schema/sitemaps
 */

// Trusted public CDN domains for images
const PUBLIC_IMAGE_DOMAINS = [
  'pub-5ace3b335273433f8258995325cf09c1.r2.dev',
  'fleshlab.online',
  'cdn.fleshlab.online',
  'images.fleshlab.online'
];

// Trusted public preview/trailer domains
const PUBLIC_PREVIEW_DOMAINS = [
  'pub-5ace3b335273433f8258995325cf09c1.r2.dev',
  'cdn.fleshlab.online',
  'trailers.fleshlab.online'
];

// Patterns that indicate private/signed URLs
const PRIVATE_URL_PATTERNS = [
  /X-Amz-Algorithm/,
  /X-Amz-Credential/,
  /X-Amz-Signature/,
  /X-Amz-Security-Token/,
  /AWSAccessKeyId/,
  /token=/,
  /signed=/,
  /expires=/,
  /r2\.internal/,
  /private\./,
  /admin\./,
  /compliance\./
];

/**
 * Validate if an image URL is safe for public sitemap/OG tags
 * @param {string} imageUrl - The image URL to validate
 * @returns {boolean} - True if safe for public use
 */
export function isPublicImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return false;
  
  // Must be HTTPS
  if (!imageUrl.startsWith('https://')) return false;
  
  // Check for private URL patterns
  if (PRIVATE_URL_PATTERNS.some(pattern => pattern.test(imageUrl))) {
    console.warn('[SEO] Private image URL detected');
    return false;
  }
  
  // Must be from trusted public domain
  try {
    const url = new URL(imageUrl);
    const isPublic = PUBLIC_IMAGE_DOMAINS.some(domain => 
      url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );
    
    if (!isPublic) {
      console.warn('[SEO] Image from untrusted domain');
      return false;
    }
    
    return true;
  } catch (e) {
    console.warn('[SEO] Invalid image URL');
    return false;
  }
}

/**
 * Validate if a trailer/preview URL is safe for public schema/sitemap
 * @param {string} trailerUrl - The trailer URL to validate
 * @returns {boolean} - True if safe for public use
 */
export function isPublicPreviewUrl(trailerUrl) {
  if (!trailerUrl || typeof trailerUrl !== 'string') return false;
  
  // Must be HTTPS
  if (!trailerUrl.startsWith('https://')) return false;
  
  // Check for private URL patterns (especially signed URLs)
  if (PRIVATE_URL_PATTERNS.some(pattern => pattern.test(trailerUrl))) {
    console.warn('[SEO] Private trailer URL detected');
    return false;
  }
  
  // Must be from trusted public domain
  try {
    const url = new URL(trailerUrl);
    const isPublic = PUBLIC_PREVIEW_DOMAINS.some(domain => 
      url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );
    
    if (!isPublic) {
      console.warn('[SEO] Trailer from untrusted domain');
      return false;
    }
    
    return true;
  } catch (e) {
    console.warn('[SEO] Invalid trailer URL');
    return false;
  }
}

/**
 * QA helper: Validate if a route URL renders publicly
 * Use for QA testing, not heavy live sitemap blocking
 * @param {string} url - The full URL to test
 * @returns {Promise<boolean>} - True if renders with status 200
 */
export async function isPublicRouteUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'FLESHLAB-SEO-Bot/1.0'
      }
    });
    
    if (response.status !== 200) {
      console.warn('[SEO] Route returned non-200 status:', response.status);
      return false;
    }
    
    // Check robots header (should not be noindex)
    const robotsHeader = response.headers.get('X-Robots-Tag');
    if (robotsHeader && robotsHeader.includes('noindex')) {
      console.warn('[SEO] Route has noindex header');
      return false;
    }
    
    return true;
  } catch (e) {
    console.warn('[SEO] Failed to validate route');
    return false;
  }
}

/**
 * Sanitize video data for public schema/sitemap
 * @param {object} video - Video entity data
 * @returns {object} - Sanitized data with only public fields
 */
export function sanitizeVideoForPublic(video) {
  if (!video) return null;
  
  return {
    id: video.id,
    slug: video.slug,
    title: video.title,
    short_summary: video.short_summary,
    description: video.description?.substring(0, 500),
    primary_thumbnail_url: isPublicImageUrl(video.primary_thumbnail_url) 
      ? video.primary_thumbnail_url 
      : undefined,
    cover_image_url: isPublicImageUrl(video.cover_image_url) 
      ? video.cover_image_url 
      : undefined,
    trailer_url: isPublicPreviewUrl(video.trailer_url) 
      ? video.trailer_url 
      : undefined,
    duration_seconds: video.duration_seconds,
    release_date: video.release_date,
    created_date: video.created_date,
    categories: video.categories,
    tags: video.tags,
    featured: video.featured,
    is_exclusive: video.is_exclusive,
    access_tier: video.access_tier,
    // Performers (public data only)
    performers: video.performers?.map(p => ({
      display_name: p.display_name,
      slug: p.slug,
      profile_image_url: isPublicImageUrl(p.profile_image_url) ? p.profile_image_url : undefined
    })),
    // CRITICAL: Never expose these
    // source_video_url: OMITTED
    // cdn_url: OMITTED
    // r2_key: OMITTED
    // signed_playback_url: OMITTED
    // download_url: OMITTED
    // compliance data: OMITTED
    // internal notes: OMITTED
  };
}

/**
 * Sanitize performer data for public schema/sitemap
 * @param {object} performer - Performer entity data
 * @returns {object} - Sanitized data with only public fields
 */
export function sanitizePerformerForPublic(performer) {
  if (!performer) return null;
  
  return {
    id: performer.id,
    slug: performer.slug,
    display_name: performer.display_name,
    bio: performer.bio,
    nationality: performer.nationality,
    profile_image_url: isPublicImageUrl(performer.profile_image_url) 
      ? performer.profile_image_url 
      : undefined,
    cover_image_url: isPublicImageUrl(performer.cover_image_url) 
      ? performer.cover_image_url 
      : undefined,
    video_count: performer.video_count,
    verified: performer.verified,
    fanclub_enabled: performer.fanclub_enabled,
    featured: performer.featured,
    // CRITICAL: Never expose these
    // date_of_birth: OMITTED
    // user_id: OMITTED
    // internal_notes: OMITTED
    // compliance data: OMITTED
    // contract data: OMITTED
    // earnings data: OMITTED
  };
}

/**
 * Sanitize news article data for public schema/sitemap
 * @param {object} article - NewsArticle entity data
 * @returns {object} - Sanitized data with only public fields
 */
export function sanitizeArticleForPublic(article) {
  if (!article) return null;
  
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content?.substring(0, 2000),
    cover_image_url: isPublicImageUrl(article.cover_image_url) 
      ? article.cover_image_url 
      : undefined,
    published_at: article.published_at,
    updated_at: article.updated_at,
    status: article.status,
    // CRITICAL: Never expose these
    // author_id: OMITTED
    // internal_notes: OMITTED
    // admin_only fields: OMITTED
  };
}