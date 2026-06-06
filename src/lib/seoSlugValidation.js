/**
 * SEO Slug Validation Utility
 * 
 * Validates and sanitizes slugs for FLESHLAB gay male adult content.
 * Prevents banned terms, spam, and compliance-risk keywords.
 */

// BANNED SEO TERMS - NEVER USE IN SLUGS, TITLES, TAGS, OR DESCRIPTIONS
export const BANNED_SEO_TERMS = [
  // Irrelevant/competitor keywords
  "lesbian", "lesbian-porn", "lesbian-videos",
  // Product/affiliate spam
  "adult-toys", "adult-products", "adult-podcasts",
  "fleshlight", "fleshlight-reviews", "fleshlight-discount-code",
  "discount-code", "how-to-use-a-fleshlight",
  "niche-porn-categories", "male-sex-toys",
  // Spam chains
  "free-porn", "free-porn-adult-toys-best",
  "porn-tube", "premium-gay-videos",
  "live-gay-cams", "gay-video", "twink-porn",
  // Compliance-risk terms (underage-sounding)
  "teen", "boy", "young-boy", "young-twink",
  // Generic clickbait prefixes
  "watch-this", "watch-him", "watch-asian", "watch-hot",
  "massive-load", "explosive-load", "huge-load"
];

// GOOD SEO KEYWORDS FOR FLESHLAB
export const PREFERRED_SEO_TERMS = [
  "filipino-twink", "asian-twink", "cuban-twink", "black-twink",
  "solo", "shower", "outdoor", "hotel", "mirror", "bedroom",
  "nipple-play", "nipple-torture", "masturbation", "jerk-off",
  "blowjob", "deepthroat", "bareback", "creampie",
  "cumshot", "facial", "oral", "anal",
  "fleshlab-exclusive", "studio", "fanclub",
  "amateur", "homemade", "pov", "webcam"
];

/**
 * Check if text contains any banned terms
 */
export function containsBannedTerms(text) {
  if (!text) return { hasBanned: false, found: [] };
  const lower = text.toLowerCase();
  const found = BANNED_SEO_TERMS.filter(term => {
    // Match whole words or hyphenated phrases
    const regex = new RegExp(`\\b${term.replace(/-/g, '[-\\s]')}\\b`, 'gi');
    return regex.test(lower);
  });
  return { hasBanned: found.length > 0, found };
}

/**
 * Validate slug against FLESHLAB SEO rules
 */
export function validateSlug(slug, existingSlugs = []) {
  const issues = [];
  
  if (!slug || typeof slug !== 'string') {
    return { valid: false, issues: ['Slug is empty or invalid'], slug: null };
  }
  
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, issues: ['Slug is empty after trimming'], slug: null };
  }
  
  // Check for banned terms
  const bannedCheck = containsBannedTerms(trimmed);
  if (bannedCheck.hasBanned) {
    issues.push(`Banned terms: ${bannedCheck.found.join(', ')}`);
  }
  
  // Check word count
  const words = trimmed.split('-').filter(w => w.trim());
  if (words.length > 10) {
    issues.push(`Too long: ${words.length} words (max 10, target 4-8)`);
  }
  if (words.length < 3) {
    issues.push(`Too short: ${words.length} words (min 3)`);
  }
  
  // Check for truncation (incomplete words)
  const truncated = words.filter(w => {
    // Flag if word looks cut off (ends mid-syllable pattern)
    return w.length > 10 && !/[aeiou]$/.test(w);
  });
  if (truncated.length > 0) {
    issues.push(`Possibly truncated: ${truncated.join(', ')}`);
  }
  
  // Check for duplicate consecutive words
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1]) {
      issues.push(`Duplicate consecutive word: ${words[i]}`);
    }
  }
  
  // Check for duplicate slug in database
  if (existingSlugs.includes(trimmed)) {
    issues.push('Duplicate slug already exists');
  }
  
  // Check for invalid characters
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed)) {
    issues.push('Invalid characters (only lowercase letters, numbers, hyphens)');
  }
  
  // Check if it looks like a database ID
  if (/^[0-9a-f]{24}$/.test(trimmed)) {
    issues.push('Slug looks like a database ID');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    slug: trimmed,
    wordCount: words.length
  };
}

/**
 * Generate a clean slug from text (title, description, etc.)
 */
export function generateSlugFromText(text) {
  if (!text) return '';
  
  // Remove banned terms first
  let cleaned = text.toLowerCase();
  BANNED_SEO_TERMS.forEach(term => {
    const regex = new RegExp(`\\b${term.replace(/-/g, '[-\\s]')}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  
  // Convert to slug format
  cleaned = cleaned
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
    .replace(/-+/g, '-');         // Collapse multiple hyphens
  
  return cleaned;
}

/**
 * Sanitize and validate a proposed slug
 */
export function sanitizeAndValidateSlug(proposedSlug, existingSlugs = []) {
  // Generate clean version
  const cleaned = generateSlugFromText(proposedSlug);
  
  // Validate
  const validation = validateSlug(cleaned, existingSlugs);
  
  return validation;
}

/**
 * Check text for compliance-risk terms (teen, boy, young, etc.)
 */
export function checkComplianceRisk(text) {
  if (!text) return { risky: false, found: [] };
  
  const complianceRisks = ['teen', 'boy', 'young', 'underage', 'minor', 'school'];
  const lower = text.toLowerCase();
  const found = complianceRisks.filter(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    return regex.test(lower);
  });
  
  return { risky: found.length > 0, found };
}

/**
 * Score slug quality for SEO
 */
export function scoreSlugQuality(slug) {
  const validation = validateSlug(slug);
  if (!validation.valid) return { score: 0, issues: validation.issues };
  
  let score = 100;
  const words = slug.split('-');
  
  // Prefer 4-8 words
  if (words.length < 4) score -= 10;
  if (words.length > 8) score -= 10;
  if (words.length > 10) score -= 20;
  
  // Bonus for performer names (capitalized words that got lowercased)
  // Bonus for specific content terms
  const goodTerms = PREFERRED_SEO_TERMS.filter(term => slug.includes(term));
  score += goodTerms.length * 5;
  
  // Penalty for generic terms
  const genericTerms = ['hot', 'sexy', 'amazing', 'incredible', 'watch', 'this'];
  const hasGeneric = genericTerms.some(term => slug.includes(term));
  if (hasGeneric) score -= 15;
  
  return {
    score: Math.max(0, Math.min(100, score)),
    quality: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
    goodTerms: goodTerms,
    hasGeneric
  };
}