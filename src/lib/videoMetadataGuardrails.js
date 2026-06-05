/**
 * Video Metadata Guardrails - Phase 2C P0
 * 
 * Central validation and normalization utility for all video metadata entry points.
 * Prevents invalid categories, spam tags, unsupported sensitive tags, and duplicates.
 */

// ============================================================================
// A. APPROVED_VIDEO_CATEGORIES (Phase 2A Taxonomy)
// ============================================================================

export const APPROVED_VIDEO_CATEGORIES = [
  'Asian',
  'Filipino',
  'Pinoy',
  'Twink',
  'Solo',
  'Outdoor',
  'Shower',
  'Mirror',
  'Dildo Play',
  'Nipple Play',
  'Blowjob',
  'Oral',
  'Anal',
  'Bareback',
  'Creampie',
  'Cumshot',
  'Rimming',
  'Handjob',
  'BDSM',
  'Daddy/Twink',
  'Age Gap',
  'Studio Production',
  'Amateur',
  'Amateur Production',
  'Home Amateur',
  'Raw',
  'Homemade',
];

// Create case-insensitive lookup map with alias support
const APPROVED_CATEGORIES_MAP = new Map(
  APPROVED_VIDEO_CATEGORIES.map(cat => [cat.toLowerCase(), cat])
);

// Alias mapping for Amateur variants - all map to canonical "Amateur"
const CATEGORY_ALIASES = {
  'amateur': 'Amateur',
  'amateur production': 'Amateur',
  'home amateur': 'Amateur',
  'raw': 'Amateur',
  'homemade': 'Amateur',
};

// ============================================================================
// B. BLOCKED_SPAM_TAGS
// ============================================================================

export const BLOCKED_SPAM_TAGS = [
  // Generic SEO spam
  'porn',
  'gay porn',
  'twink porn',
  'hardcore porn',
  'xxx',
  'explicit',
  'hot',
  'sexy',
  'amateur porn',
  'gay sex',
  'adult',
  'nsfw',
  'viral',
  'trending',
  // Fake categories
  'studio originals',
  'asian twinks',
  'fanclub exclusives',
  'new performers',
  'group',
  'pov',
  // Access tiers (not categories/tags)
  'fanclub',
  'ppv',
  'exclusive',
  'free',
];

// ============================================================================
// C. SENSITIVE_METADATA_RULES
// ============================================================================

export const SENSITIVE_TERMS = {
  'blowjob': ['blow', 'suck', 'sucking', 'oral', 'throat', 'deep throat', 'deepthroat'],
  'oral': ['blow', 'suck', 'sucking', 'oral', 'throat', 'deep throat', 'deepthroat'],
  'anal': ['anal', 'ass', 'backdoor', 'hole', 'fucking', 'fuck', 'penetration'],
  'bareback': ['anal', 'fucking', 'fuck', 'bare', 'raw', 'without condom', 'unprotected', 'no condom'],
  'group': ['group', 'threesome', 'foursome', 'multiple', 'gang', 'party'],
  'facial': ['facial', 'cum on face', 'money shot', 'face cum'],
  'cumshot': ['cumshot', 'cum shot', 'ejaculat', 'climax', 'finish', 'load'],
  'hardcore': ['hardcore', 'rough', 'intense', 'aggressive'],
  'bdsm': ['bdsm', 'bondage', 'rope', 'tie', 'restrain', 'dominat', 'submiss'],
  'fetish': ['fetish', 'kink', 'fantasy'],
  'nipple play': ['nipple', 'clamp', 'tease', 'pinch'],
};

export const SENSITIVE_CATEGORIES = [
  'Blowjob',
  'Oral',
  'Anal',
  'Bareback',
  'Creampie',
  'Cumshot',
  'Rimming',
  'BDSM',
  'Nipple Play',
  'Dildo Play',
];

// ============================================================================
// D. normalizeMetadata()
// ============================================================================

/**
 * Validates and normalizes video metadata.
 * 
 * @param {Object} metadata - The metadata to validate
 * @param {string[]} metadata.categories - Array of category names
 * @param {string[]} metadata.tags - Array of tag names
 * @param {string} [metadata.title] - Video title (for evidence checking)
 * @param {string} [metadata.description] - Video description (for evidence checking)
 * @param {string} [metadata.short_summary] - Short summary (for evidence checking)
 * @param {boolean} [metadata.strict] - If true, reject invalid values. If false, warn and filter.
 * @returns {Object} Validation result with normalized values and errors/warnings
 */
export function normalizeMetadata(metadata, options = {}) {
  const {
    categories = [],
    tags = [],
    title = '',
    description = '',
    short_summary = '',
    strict = false,
  } = metadata;

  const result = {
    valid: true,
    normalized: {
      categories: [],
      tags: [],
    },
    errors: [],
    warnings: [],
    removed: {
      categories: [],
      tags: [],
    },
  };

  // Combine evidence text
  const evidenceText = `${title} ${description} ${short_summary}`.toLowerCase();

  // ============================================================================
  // Validate Categories
  // ============================================================================

  const seenCategories = new Set();

  for (const category of categories) {
    const trimmed = category.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();

    // Check if it's an access tier (should not be a category)
    if (['fanclub', 'ppv', 'exclusive', 'free'].includes(lower)) {
      result.errors.push(`"${trimmed}" is an access tier, not a category. Use the Access Type selector instead.`);
      result.valid = false;
      result.removed.categories.push({ value: trimmed, reason: 'access_tier_not_category' });
      if (strict) continue;
    }

    // Check if it's a sort label
    if (['newest', 'views', 'longest', 'trending'].includes(lower)) {
      result.errors.push(`"${trimmed}" is a sort option, not a category.`);
      result.valid = false;
      result.removed.categories.push({ value: trimmed, reason: 'sort_label_not_category' });
      if (strict) continue;
    }

    // Check if it's blocked spam
    if (BLOCKED_SPAM_TAGS.includes(lower)) {
      result.errors.push(`"${trimmed}" is blocked spam/SEO keyword.`);
      result.valid = false;
      result.removed.categories.push({ value: trimmed, reason: 'blocked_spam' });
      if (strict) continue;
    }

    // Check if it's in approved taxonomy (including aliases)
    let canonical = APPROVED_CATEGORIES_MAP.get(lower);
    
    // Check alias mapping if not found directly
    if (!canonical && CATEGORY_ALIASES[lower]) {
      canonical = CATEGORY_ALIASES[lower];
    }
    
    if (!canonical) {
      result.errors.push(`"${trimmed}" is not in the approved category taxonomy.`);
      result.valid = false;
      result.removed.categories.push({ value: trimmed, reason: 'unknown_category' });
      if (strict) continue;
    }

    // Check for duplicates (case-insensitive)
    if (seenCategories.has(lower)) {
      result.warnings.push(`Duplicate category "${trimmed}" (case-insensitive). Normalized to "${canonical}".`);
      continue;
    }

    // Check sensitive category evidence
    if (SENSITIVE_CATEGORIES.includes(canonical)) {
      const sensitiveKey = canonical.toLowerCase();
      const evidenceKeywords = SENSITIVE_TERMS[sensitiveKey];
      const hasEvidence = evidenceKeywords && evidenceKeywords.some(kw => evidenceText.includes(kw));
      
      if (!hasEvidence) {
        result.errors.push(`"${canonical}" requires evidence in title, description, or tags. No supporting keywords found.`);
        result.valid = false;
        result.removed.categories.push({ value: trimmed, reason: 'sensitive_no_evidence', category: canonical });
        if (strict) continue;
      }
    }

    // Category is valid
    seenCategories.add(lower);
    result.normalized.categories.push(canonical);
  }

  // ============================================================================
  // Validate Tags
  // ============================================================================

  const seenTags = new Set();

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();

    // Check if it's blocked spam
    if (BLOCKED_SPAM_TAGS.includes(lower)) {
      result.errors.push(`Tag "${trimmed}" is blocked spam/SEO keyword.`);
      result.valid = false;
      result.removed.tags.push({ value: trimmed, reason: 'blocked_spam' });
      if (strict) continue;
    }

    // Check for duplicates (case-insensitive)
    if (seenTags.has(lower)) {
      result.warnings.push(`Duplicate tag "${trimmed}" (case-insensitive).`);
      continue;
    }

    // Check sensitive tag evidence
    if (SENSITIVE_TERMS[lower]) {
      const evidenceKeywords = SENSITIVE_TERMS[lower];
      const hasEvidence = evidenceKeywords.some(kw => evidenceText.includes(kw));
      
      if (!hasEvidence) {
        result.errors.push(`Sensitive tag "${trimmed}" requires evidence in title or description. No supporting keywords found.`);
        result.valid = false;
        result.removed.tags.push({ value: trimmed, reason: 'sensitive_no_evidence' });
        if (strict) continue;
      }
    }

    // Tag is valid - normalize casing to lowercase
    seenTags.add(lower);
    result.normalized.tags.push(trimmed.toLowerCase());
  }

  // ============================================================================
  // Summary
  // ============================================================================

  if (result.errors.length > 0 && strict) {
    result.valid = false;
  }

  result.summary = {
    categories: {
      input: categories.length,
      output: result.normalized.categories.length,
      removed: result.removed.categories.length,
    },
    tags: {
      input: tags.length,
      output: result.normalized.tags.length,
      removed: result.removed.tags.length,
    },
    totalErrors: result.errors.length,
    totalWarnings: result.warnings.length,
  };

  return result;
}

/**
 * Quick validation helper - returns boolean and errors
 */
export function validateMetadata(metadata, options = {}) {
  const result = normalizeMetadata(metadata, options);
  return {
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
  };
}