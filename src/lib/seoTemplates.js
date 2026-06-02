/**
 * SEO Template Functions for FLESHLAB
 * Consistent meta tags across all public pages
 */

import { SEO_KEYWORDS, COMPLIANCE_WORDING } from './seoKeywords';

export const seoTemplates = {
  // Homepage — premium positioning (no hard adult keywords)
  home: {
    title: "FLESHLAB Asia | Premium Asian Gay Studio Originals & Twink Trailers",
    description: "Explore FLESHLAB Asia, a premium gay Asian studio featuring verified 18+ performers, public trailers, exclusive previews, and original studio productions.",
    h1: "Premium Asian Gay Studio Originals",
    intro: `FLESHLAB Asia is a premium adult studio featuring verified Asian gay performers and exclusive productions. Browse public trailers from Filipino, Thai, Korean, Japanese, and other Asian twink performers. All content features consenting 18+ adults with full scenes available via fanclub or subscription.`
  },
  
  // Videos listing — moderate adult keywords
  videos: {
    title: "Asian Twink Videos & Gay Asian Trailers | FLESHLAB",
    description: "Browse public trailers and previews from FLESHLAB's Asian gay studio library. Discover Filipino, Thai, Korean, Japanese, and other Asian twink performers. All videos feature verified 18+ performers.",
    h1: "Asian Twink Videos & Studio Trailers",
    intro: `Browse our collection of Asian gay video previews and free trailers from verified 18+ performers. Our studio library features exclusive productions with Filipino, Thai, Korean, Japanese, and other Asian twink talent. Watch public previews and unlock full scenes via fanclub or subscription.`
  },
  
  // Category pages — stronger adult keywords (selective use)
  categoryAdult: (categoryName, keywords) => ({
    title: `${categoryName} | Asian Gay Videos & Trailers | FLESHLAB`,
    description: `Explore ${categoryName.toLowerCase()} from FLESHLAB. ${keywords.slice(0, 3).join(', ')}. Public trailers, verified 18+ performers, exclusive studio releases.`,
    h1: categoryName,
    intro: `Our ${categoryName.toLowerCase()} collection features adult studio productions with verified Asian gay performers. Watch free public trailers and previews. Full scenes available for fanclub members or via subscription. All performers are 18+ adults.`
  }),
  
  // Individual video — balanced (title + adult intent)
  videoDetail: (videoTitle, performerNames, hasTrailer) => ({
    title: `${videoTitle} | Asian Gay Studio Trailer | FLESHLAB`,
    description: `Watch the public trailer for ${videoTitle}, a FLESHLAB Asian gay studio release featuring ${performerNames}. ${hasTrailer ? 'Free preview available.' : 'Public preview.'} Unlock full scene with fanclub or subscription. Verified 18+ performers.`,
    h1: videoTitle
  }),
  
  // Performers listing
  performers: {
    title: "Asian Gay Performers & Twink Profiles | FLESHLAB",
    description: "Meet FLESHLAB's verified 18+ Asian gay performers. Explore profiles, public trailers, and exclusive content from Filipino, Thai, Korean, Japanese, and other Asian twink talent.",
    h1: "Asian Gay Performers & Twink Profiles",
    intro: `Browse profiles of verified Asian gay performers. Each profile includes public trailers, bio, and exclusive studio releases. All performers are 18+ adults with fanclub access available.`
  },
  
  // Individual performer
  performerDetail: (performerName, nationality, videoCount) => ({
    title: `${performerName} | Asian Gay Performer Profile & Videos | FLESHLAB`,
    description: `Explore ${performerName}'s profile on FLESHLAB, including ${nationality || 'Asian'} gay studio releases, public trailers, and exclusive content. ${videoCount} videos available. Verified 18+ performer.`,
    h1: performerName
  }),
  
  // News listing
  news: {
    title: "FLESHLAB Studio Journal | Asian Gay Studio News & Performer Stories",
    description: "Read FLESHLAB Studio Journal updates, performer stories, production notes, behind-the-scenes posts, and Asian gay studio news.",
    h1: "Studio Journal"
  },
  
  // Individual article
  articleDetail: (articleTitle, excerpt) => ({
    title: `${articleTitle} | FLESHLAB Studio Journal`,
    description: `${excerpt.substring(0, 155)}${excerpt.length > 155 ? '...' : ''}`,
    h1: articleTitle
  }),
  
  // Fanclub landing
  fanclub: {
    title: "Asian Twink Fanclub | Exclusive Gay Asian Content | FLESHLAB",
    description: "Join FLESHLAB fanclub for exclusive Asian gay content, full-length videos, behind-the-scenes access, and direct performer engagement. Verified 18+ studio productions.",
    h1: "Join the Inner Circle"
  }
};

// Open Graph / Twitter Card defaults
export const socialMediaTemplates = {
  default: {
    twitterCard: 'summary_large_image',
    ogType: 'website'
  },
  
  video: {
    twitterCard: 'player',
    ogType: 'video.other',
    playerWidth: 1280,
    playerHeight: 720
  },
  
  article: {
    twitterCard: 'summary_large_image',
    ogType: 'article'
  },
  
  profile: {
    twitterCard: 'summary_large_image',
    ogType: 'profile'
  }
};