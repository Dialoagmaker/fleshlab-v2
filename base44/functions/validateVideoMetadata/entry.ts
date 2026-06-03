import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * validateVideoMetadata - Phase 2C P0
 * 
 * Backend validation function for video metadata.
 * Checks categories against approved taxonomy, filters spam tags,
 * and validates sensitive tags require evidence.
 * 
 * Admin-only access required.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { categories = [], tags = [], title = '', description = '', short_summary = '', strict = false } = body;

    // Approved taxonomy
    const APPROVED_CATEGORIES = [
      'Asian', 'Filipino', 'Pinoy', 'Twink', 'Solo', 'Outdoor', 'Shower', 'Mirror',
      'Dildo Play', 'Nipple Play', 'Blowjob', 'Oral', 'Anal', 'Bareback', 'Creampie',
      'Cumshot', 'Rimming', 'Handjob', 'BDSM', 'Daddy/Twink', 'Age Gap',
      'Studio Production',
    ];
    const approvedLower = APPROVED_CATEGORIES.map(c => c.toLowerCase());
    const approvedMap = new Map(APPROVED_CATEGORIES.map(c => [c.toLowerCase(), c]));

    // Blocked spam patterns
    const BLOCKED_SPAM = [
      'free porn', 'adult toys', 'best porn sites', 'adult movie downloads',
      'adult videos', 'x-rated videos', 'fleshlight reviews', 'buy fleshlight online',
      'best male masturbation devices', 'lube for fleshlights', 'best fleshlights',
      'gay twink', 'twinks cumshot', 'gay cum compilation', 'twink sex videos',
      'twink tube', 'amateur gay twinks', 'twink anal', 'best gay porn sites',
      'gay adult', 'teen gay', 'gay boy', 'asian gay', 'gay asian', 'top gay',
      'gay porn', 'twink websites', 'gay twink porn', 'cute asian guys',
      'young twink', 'asian twink fuck', 'asian gay boy', 'twink solo',
      'cute twink', 'twink cumshot', 'gay twinks', 'twink videos',
      'gay adult movies', 'twink cumshots', 'top gay porn',
      'sexy twink', 'intimate pleasure', 'hard cock',
      'solo jackoff', 'cum shot',
    ];

    // Sensitive terms requiring evidence
    const SENSITIVE_TERMS = {
      'blowjob': ['blow', 'suck', 'sucking', 'oral', 'throat', 'deep throat'],
      'oral': ['blow', 'suck', 'sucking', 'oral', 'throat', 'deep throat'],
      'bareback': ['anal', 'fucking', 'fuck', 'bare', 'raw', 'without condom', 'unprotected'],
      'creampie': ['creampie', 'cum inside', 'fill up', 'breeding', 'cum in'],
      'dildo play': ['dildo', 'toy', 'fleshlight', 'masturbator'],
      'shower': ['shower', 'wet', 'bathroom', 'water', 'steam'],
      'anal': ['anal', 'ass', 'backdoor', 'hole', 'fucking'],
      'rimming': ['rim', 'analingus', 'tongue'],
      'nipple play': ['nipple', 'clamp', 'tease'],
      'bondage': ['bondage', 'rope', 'tie', 'restrain', 'bdsm'],
      'solo': ['solo', 'masturbat', 'stroke', 'jerk', 'handjob'],
      'cumshot': ['cumshot', 'cum', 'ejaculat', 'climax'],
    };

    // Build evidence text
    const evidenceText = [title, short_summary, description].filter(Boolean).join(' ').toLowerCase();

    // Validation result structure
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      normalized: { categories: [], tags: [] },
      removed: { categories: [], tags: [] },
      summary: {},
    };

    // ============================================================================
    // Validate Categories
    // ============================================================================
    const seenCategories = new Set();
    
    for (const category of categories) {
      const trimmed = category.trim();
      const lower = trimmed.toLowerCase();
      
      // Check if in approved taxonomy
      if (!approvedLower.includes(lower)) {
        result.errors.push(`Category "${trimmed}" is not in approved taxonomy.`);
        result.valid = false;
        result.removed.categories.push({ value: trimmed, reason: 'not_in_taxonomy' });
        if (strict) continue;
      }
      
      // Check for duplicates (case-insensitive)
      if (seenCategories.has(lower)) {
        result.warnings.push(`Duplicate category "${trimmed}" (case-insensitive).`);
        continue;
      }
      
      // Normalize to canonical form
      const canonical = approvedMap.get(lower) || trimmed;
      seenCategories.add(lower);
      result.normalized.categories.push(canonical);
    }

    // ============================================================================
    // Validate Tags
    // ============================================================================
    const seenTags = new Set();
    
    for (const tag of tags) {
      const trimmed = tag.trim();
      const lower = trimmed.toLowerCase();
      
      // Check blocked spam
      if (BLOCKED_SPAM.some(spam => lower.includes(spam))) {
        result.errors.push(`Tag "${trimmed}" is blocked spam/SEO keyword.`);
        result.valid = false;
        result.removed.tags.push({ value: trimmed, reason: 'blocked_spam' });
        if (strict) continue;
      }
      
      // Warn on access tier confusion
      if (['fanclub', 'ppv', 'exclusive', 'free'].includes(lower)) {
        result.warnings.push(`Tag "${trimmed}" looks like an access tier. Consider removing.`);
      }
      
      // Check sensitive tags require evidence
      if (SENSITIVE_TERMS[lower]) {
        const keywords = SENSITIVE_TERMS[lower];
        const hasEvidence = keywords.some(kw => evidenceText.includes(kw));
        
        if (!hasEvidence) {
          result.errors.push(`Sensitive tag "${trimmed}" requires evidence in title or description. No supporting keywords found.`);
          result.valid = false;
          result.removed.tags.push({ value: trimmed, reason: 'sensitive_no_evidence' });
          if (strict) continue;
        }
      }
      
      // Check duplicates (case-insensitive)
      if (seenTags.has(lower)) {
        result.warnings.push(`Duplicate tag "${trimmed}" (case-insensitive).`);
        continue;
      }
      
      // Tag is valid (normalize to Title Case for consistency)
      seenTags.add(lower);
      result.normalized.tags.push(trimmed);
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

    return Response.json({
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      normalized: result.normalized,
      removed: result.removed,
      summary: result.summary,
      canApply: !strict || result.valid,
    });

  } catch (error) {
    console.error('validateVideoMetadata error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});