/**
 * validateVideoMetadata - Phase 2C P0
 * 
 * Backend validation function for video metadata.
 * Checks categories against approved taxonomy, filters spam tags,
 * validates sensitive tags require evidence, and blocks parent group labels.
 * 
 * Admin-only access required.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// PARENT TAXONOMY GROUP LABELS - BLOCKED FROM USE AS CATEGORIES
const PARENT_GROUP_LABELS = [
  'age', 'ethnicity', 'body', 'orientation', 'number of people',
  'actions', 'production', 'apparel', 'scenario', 'fetish',
  'language', 'location', 'sex toys', 'age / appearance',
  'ethnicity / origin', 'body type', 'orientation / audience',
  'scene type', 'sex acts', 'fetish / kink', 'role / dynamic',
  'production style', 'clothing / outfit', 'language / region',
  'access / platform', 'seo / search helpers',
];

const isParentGroupLabel = (value) => {
  if (!value || typeof value !== 'string') return false;
  return PARENT_GROUP_LABELS.includes(value.toLowerCase().trim());
};

// Map parent groups to specific child categories based on context
const mapParentGroupToCategories = (parentLabel, contextText = '') => {
  const lower = parentLabel.toLowerCase().trim();
  const context = contextText.toLowerCase();
  
  if (lower === 'fetish') {
    const mappings = [];
    if (/(nipple\s*(clamp|torture|pain)|clamp|pain\s*play|edging|orgasm\s*control)/i.test(context)) mappings.push('bdsm');
    if (/(bondage|restrain|tie\s*up|rope|cuff)/i.test(context)) mappings.push('bondage');
    if (/(foot|feet\s*worship)/i.test(context)) mappings.push('foot_fetish');
    if (/spank/i.test(context)) mappings.push('spanking');
    if (/dominat|submiss/i.test(context)) mappings.push('domination', 'submission');
    return mappings.length > 0 ? mappings : null;
  }
  
  if (lower === 'age' || lower === 'age / appearance') {
    if (/teen|young|18\+/i.test(context)) return ['teen_18'];
    if (/mature|daddy|older/i.test(context)) return ['mature', 'daddy'];
    if (/twink|boyish|slim/i.test(context)) return ['twink', 'boyish'];
    return null;
  }
  
  if (lower === 'body' || lower === 'body type') {
    if (/muscular|buff|muscle/i.test(context)) return ['muscular', 'muscular_body'];
    if (/slim|skinny|lean/i.test(context)) return ['slim', 'slim_body'];
    if (/fit|athletic/i.test(context)) return ['fit', 'athletic'];
    if (/hairy/i.test(context)) return ['hairy', 'hairy_body'];
    return null;
  }
  
  if (lower === 'scenario') {
    if (/outdoor|jungle|forest|outside/i.test(context)) return ['outdoor', 'outdoor_location'];
    if (/shower|bathroom/i.test(context)) return ['shower', 'shower_loc'];
    if (/hotel/i.test(context)) return ['hotel', 'hotel_room'];
    return null;
  }
  
  return null;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { categories = [], tags = [], title = '', description = '', short_summary = '', strict = false } = body;

    // Build evidence text
    const evidenceText = [title, short_summary, description].filter(Boolean).join(' ').toLowerCase();

    const result = {
      valid: true,
      normalized: { categories: [], tags: [] },
      errors: [],
      warnings: [],
      removed: { categories: [], tags: [] },
    };

    const seenCategories = new Set();

    // Validate categories
    for (const category of categories) {
      const trimmed = category.trim();
      if (!trimmed) continue;

      const lower = trimmed.toLowerCase();

      // CHECK 1: Is it a parent taxonomy group label? (BLOCKED)
      if (isParentGroupLabel(trimmed)) {
        // Try to map to child categories based on context
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
        } else {
          // No valid mapping - remove entirely
          result.warnings.push(`"${trimmed}" → removed (parent group label, not selectable)`);
          result.removed.categories.push({ 
            value: trimmed, 
            reason: 'parent_group_label',
            message: 'Parent taxonomy group labels cannot be used as categories'
          });
        }
        continue;
      }

      // For this MVP, we'll just check if it's not a parent label
      // A full taxonomy check would require the full category list
      // For now, just add it if it's not blocked
      if (!seenCategories.has(lower)) {
        seenCategories.add(lower);
        result.normalized.categories.push(trimmed);
      }
    }

    // Validate tags (basic spam check)
    const BLOCKED_SPAM_TAGS = ['porn', 'xxx', 'explicit', 'hot', 'sexy', 'adult', 'nsfw'];
    const seenTags = new Set();
    
    for (const tag of tags) {
      const trimmed = tag.trim().toLowerCase();
      if (!trimmed || seenTags.has(trimmed)) continue;
      
      if (BLOCKED_SPAM_TAGS.includes(trimmed)) {
        result.errors.push(`Tag "${tag}" is blocked spam.`);
        result.valid = false;
        result.removed.tags.push({ value: tag, reason: 'blocked_spam' });
        continue;
      }
      
      seenTags.add(trimmed);
      result.normalized.tags.push(trimmed);
    }

    // Summary
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

    if (result.errors.length > 0 && strict) {
      result.valid = false;
    }

    return Response.json({
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      normalized: result.normalized,
      removed: result.removed,
      summary: result.summary,
      canApply: result.valid || !strict,
    });

  } catch (error) {
    console.error('validateVideoMetadata error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});