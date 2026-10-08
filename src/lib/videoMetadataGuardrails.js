/**
 * Video Metadata Guardrails - Phase 2C P0
 * 
 * Central validation and normalization utility for all video metadata entry points.
 * Prevents invalid categories, spam tags, unsupported sensitive tags, and duplicates.
 * 
 * CRITICAL: Parent taxonomy group labels (e.g. "Fetish", "Age", "Body") are BLOCKED.
 * Only approved child categories from the taxonomy may be used.
 */

import { 
  getAllCategories, 
  validateVideoCategories,
  isParentGroupLabel,
  mapParentGroupToCategories
} from './videoTaxonomy.js';

// ============================================================================
// A. BLOCKED_SPAM_TAGS
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
// B. SENSITIVE_METADATA_RULES
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
// C. normalizeMetadata()
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

    // CHECK 1: Is it a parent taxonomy group label? (BLOCKED)
    if (isParentGroupLabel(trimmed)) {
      result.warnings.push(`"${trimmed}" → removed (parent group label, not a selectable category)`);
      result.removed.categories.push({ 
        value: trimmed, 
        reason: 'parent_group_label',
        message: 'Parent taxonomy group labels cannot be used as categories'
      });
      continue;
    }

    // CHECK 2: Is it an access tier? (BLOCKED)
    if (['fanclub', 'ppv', 'exclusive', 'free'].includes(lower)) {
      result.errors.push(`"${trimmed}" is an access tier, not a category. Use the Access Type selector instead.`);
      result.valid = false;
      result.removed.categories.push({ value: trimmed, reason: 'access_tier_not_category' });
      if (strict) continue;
    }

    // CHECK 3: Is it a sort label? (BLOCKED)
    if (['newest', 'views', 'longest', 'trending'].includes(lower)) {
      result.errors.push(`"${trimmed}" is a sort option, not a category.`);
      result.valid = false;
      result.removed.categories.push({ value: trimmed, reason: 'sort_label_not_category' });
      if (strict) continue;
    }

    // CHECK 4: Is it blocked spam? (BLOCKED)
    if (BLOCKED_SPAM_TAGS.includes(lower)) {
      result.errors.push(`"${trimmed}" is blocked spam/SEO keyword.`);
      result.valid = false;
      result.removed.categories.push({ value: trimmed, reason: 'blocked_spam' });
      if (strict) continue;
    }

    // CHECK 5: Validate against approved taxonomy
    const validation = validateVideoCategories([trimmed]);
    
    if (!validation.valid || validation.removed.length > 0) {
      // Try to map parent group to specific categories based on context
      if (isParentGroupLabel(trimmed)) {
        const mapped = mapParentGroupToCategories(trimmed, evidenceText);
        if (mapped && mapped.length > 0) {
          result.warnings.push(`"${trimmed}" → mapped to: ${mapped.join(', ')}`);
          result.removed.categories.push({ 
            value: trimmed, 
            reason: 'parent_group_mapped',
            mapped_to: mapped
          });
          // Add mapped categories
          for (const mappedCat of mapped) {
            if (!seenCategories.has(mappedCat.toLowerCase())) {
              seenCategories.add(mappedCat.toLowerCase());
              result.normalized.categories.push(mappedCat);
            }
          }
          continue;
        }
      }
      
      // Not mappable - remove
      result.warnings.push(`"${trimmed}" → removed (${validation.removed[0]?.reason || 'not in taxonomy'})`);
      result.removed.categories.push({ 
        value: trimmed, 
        reason: validation.removed[0]?.reason || 'unknown_category'
      });
      if (strict) continue;
    }

    // CHECK 6: Check for duplicates (case-insensitive)
    if (seenCategories.has(lower)) {
      result.warnings.push(`Duplicate category "${trimmed}" (case-insensitive).`);
      continue;
    }

    // CHECK 7: Check sensitive category evidence
    const matchingCat = getAllCategories().find(c => 
      c.label.toLowerCase() === lower || c.id.toLowerCase() === lower
    );
    
    if (matchingCat && SENSITIVE_CATEGORIES.some(sc => sc.toLowerCase() === matchingCat.label.toLowerCase())) {
      const sensitiveKey = matchingCat.label.toLowerCase();
      const evidenceKeywords = SENSITIVE_TERMS[sensitiveKey];
      const hasEvidence = evidenceKeywords && evidenceKeywords.some(kw => evidenceText.includes(kw));
      
      if (!hasEvidence) {
        result.warnings.push(`"${matchingCat.label}" - no supporting evidence in title/description`);
        result.removed.categories.push({ 
          value: trimmed, 
          reason: 'sensitive_no_evidence', 
          category: matchingCat.label 
        });
        if (strict) continue;
      }
    }

    // Category is valid - add it
    seenCategories.add(lower);
    result.normalized.categories.push(matchingCat?.id || trimmed);
  }

  // ============================================================================
  // Validate Tags
  // ============================================================================

  const seenTags = new Set();

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();

    // CHECK 1: Is it blocked spam?
    if (BLOCKED_SPAM_TAGS.includes(lower)) {
      result.errors.push(`Tag "${trimmed}" is blocked spam/SEO keyword.`);
      result.valid = false;
      result.removed.tags.push({ value: trimmed, reason: 'blocked_spam' });
      if (strict) continue;
    }

    // CHECK 2: Check for duplicates (case-insensitive)
    if (seenTags.has(lower)) {
      result.warnings.push(`Duplicate tag "${trimmed}" (case-insensitive).`);
      continue;
    }

    // CHECK 3: Check sensitive tag evidence
    if (SENSITIVE_TERMS[lower]) {
      const evidenceKeywords = SENSITIVE_TERMS[lower];
      const hasEvidence = evidenceKeywords.some(kw => evidenceText.includes(kw));
      
      if (!hasEvidence) {
        result.warnings.push(`Sensitive tag "${trimmed}" - no supporting evidence in title/description`);
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