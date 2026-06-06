/**
 * cleanVideoSlugs - SEO Slug Cleanup Tool
 * 
 * Audits and cleans polluted video slugs in bulk.
 * Use with caution - backs up old slugs to legacy_slugs before updating.
 * 
 * Usage:
 * - Dry run mode: Returns proposed changes without applying
 * - Apply mode: Updates slugs and saves old slugs to legacy_slugs array
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// BANNED SEO TERMS - NEVER USE IN SLUGS, TITLES, TAGS, OR DESCRIPTIONS
const BANNED_TERMS = [
  "lesbian", "lesbian-porn", "lesbian-videos",
  "adult-toys", "adult-products", "adult-podcasts",
  "fleshlight", "fleshlight-reviews", "fleshlight-discount-code",
  "discount-code", "how-to-use-a-fleshlight",
  "niche-porn-categories", "male-sex-toys",
  "free-porn", "free-porn-adult-toys-best",
  "teen", "boy", "young-boy", "young-twink",
  "live-gay-cams", "gay-video", "twink-porn",
  "porn-tube", "premium-gay-videos"
];

function containsBannedTerms(text) {
  if (!text) return { hasBanned: false, found: [] };
  const lower = text.toLowerCase();
  const found = BANNED_TERMS.filter(term => lower.includes(term));
  return { hasBanned: found.length > 0, found };
}

function validateSlug(slug) {
  if (!slug) return { valid: false, issues: ['Slug is empty'] };
  const issues = [];
  const words = slug.split('-').filter(w => w.trim());
  
  if (words.length > 10) issues.push(`Too long: ${words.length} words (max 10)`);
  if (words.length < 3) issues.push(`Too short: ${words.length} words (min 3)`);
  
  const bannedCheck = containsBannedTerms(slug);
  if (bannedCheck.hasBanned) issues.push(`Banned terms: ${bannedCheck.found.join(', ')}`);
  
  const truncated = words.filter(w => w.length > 2 && !/^[a-z0-9]+$/.test(w));
  if (truncated.length > 0) issues.push(`Truncated words: ${truncated.join(', ')}`);
  
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1]) issues.push(`Duplicate word: ${words[i]}`);
  }
  
  return { valid: issues.length === 0, issues, wordCount: words.length };
}

function generateSlugFromText(text) {
  if (!text) return '';
  let slug = text.toLowerCase();
  BANNED_TERMS.forEach(term => {
    slug = slug.replace(new RegExp(term.replace(/-/g, '[-\\s]'), 'gi'), '');
  });
  slug = slug.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
  return slug;
}

function scoreSlugQuality(slug) {
  const validation = validateSlug(slug);
  if (!validation.valid) return { score: 0, issues: validation.issues };
  
  let score = 100;
  const words = slug.split('-');
  
  if (words.length < 4) score -= 10;
  if (words.length > 8) score -= 10;
  if (words.length > 10) score -= 20;
  
  return {
    score: Math.max(0, Math.min(100, score)),
    quality: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'
  };
}

function generateCleanSlug(title, performerNames = [], categories = [], tags = []) {
  // TARGET AUDIENCE SEO STRATEGY:
  // 1. Performer name first (discovery)
  // 2. Gay male identifiers (asian-twink, filipino, pinoy, cuban, etc.)
  // 3. Scene location/context (shower, outdoor, hotel, mirror, bathroom)
  // 4. Specific act (solo, cumshot, masturbation, jerk-off, oral, anal)
  // 5. Avoid generic/boring terms
  
  // SEO KEYWORD MAPPING - normalize to target audience terms
  const CATEGORY_MAP = {
    'asian': 'asian',
    'filipino': 'filipino',
    'pinoy': 'pinoy',
    'cuban': 'cuban',
    'latino': 'latino',
    'twink': 'twink',
    'muscular_body': 'muscular',
    'solo': 'solo',
    'solo_masturbation': 'masturbation',
    'blowjob': 'oral',
    'deepthroat': 'deepthroat',
    'anal': 'anal',
    'bareback': 'bareback',
    'shower': 'shower',
    'outdoor': 'outdoor',
    'hotel': 'hotel',
    'piercing': 'pierced',
    'cumshot': 'cumshot',
    'masturbation': 'masturbation',
    'jerk_off': 'jerk-off'
  };
  
  // ACT/SCENE DETECTION - extract from title/tags
  const ACT_KEYWORDS = {
    'cumshot': ['cumshot', 'cum', 'finish', 'explode', 'messy', 'load'],
    'masturbation': ['masturbat', 'jerk', 'stroke', 'solo', 'handjob'],
    'oral': ['oral', 'blowjob', 'deepthroat', 'suck', 'throat'],
    'anal': ['anal', 'bareback', 'creampie', 'internal'],
    'nipple-play': ['nipple', 'torture', 'pierc'],
    'dildo-play': ['dildo', 'toy', 'fleshlight'],
    'shower': ['shower', 'bathroom', 'water', 'lather'],
    'outdoor': ['outdoor', 'outside', 'nature'],
    'mirror': ['mirror', 'reflection'],
    'hotel': ['hotel', 'room', 'travel']
  };
  
  let slugParts = [];
  
  // 1. PERFORMER NAME (highest priority for discovery)
  if (performerNames && performerNames.length > 0) {
    const firstName = performerNames[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    // Clean up special characters but keep recognizable name
    slugParts.push(firstName);
  }
  
  // 2. GAY MALE IDENTIFIER from categories
  if (categories && categories.length > 0) {
    const gayIdentifiers = categories
      .map(cat => CATEGORY_MAP[cat.toLowerCase()] || null)
      .filter(Boolean);
    
    // Prioritize: ethnicity > body type > role
    const priority = ['filipino', 'pinoy', 'asian', 'cuban', 'latino', 'twink', 'muscular'];
    const sorted = gayIdentifiers.sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
    
    // Add top 1-2 identifiers
    if (sorted.length > 0) {
      slugParts.push(sorted[0]);
      if (sorted[1] && sorted[1] !== sorted[0]) {
        slugParts.push(sorted[1]);
      }
    }
  }
  
  // 3. SCENE LOCATION/CONTEXT from title and tags
  const titleLower = (title || '').toLowerCase();
  const tagsLower = (tags || []).map(t => t.toLowerCase());
  const allText = titleLower + ' ' + tagsLower.join(' ');
  
  const locations = ['shower', 'outdoor', 'hotel', 'mirror', 'bathroom', 'bedroom'];
  for (const loc of locations) {
    if (allText.includes(loc) && !slugParts.includes(loc)) {
      slugParts.push(loc);
      break; // Only one location
    }
  }
  
  // 4. SPECIFIC ACT from title/tags
  for (const [act, keywords] of Object.entries(ACT_KEYWORDS)) {
    const found = keywords.some(kw => allText.includes(kw));
    if (found && !slugParts.includes(act)) {
      slugParts.push(act);
      // Add 1-2 acts max
      if (slugParts.length >= 5) break;
    }
  }
  
  // 5. FALLBACK - if still too short, extract from cleaned title
  if (slugParts.length < 3 && title) {
    const cleaned = generateSlugFromText(title);
    const words = cleaned.split('-').filter(w => w.length > 3 && !BANNED_TERMS.some(b => w.includes(b)));
    for (const word of words) {
      if (!slugParts.includes(word) && slugParts.length < 6) {
        slugParts.push(word);
      }
    }
  }
  
  // Remove duplicates while preserving order
  const unique = [...new Set(slugParts)];
  
  // Join and validate length (target 4-8 words)
  let slug = unique.join('-').substring(0, 80).replace(/-+$/g, '');
  
  // Final cleanup - remove any remaining banned terms
  BANNED_TERMS.forEach(term => {
    slug = slug.replace(new RegExp(term.replace(/-/g, '[-\\s]'), 'gi'), '');
  });
  slug = slug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  
  return slug;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { mode = 'dry_run', video_ids = [] } = await req.json();
    
    if (!['dry_run', 'apply'].includes(mode)) {
      return Response.json({ error: 'Mode must be "dry_run" or "apply"' }, { status: 400 });
    }

    // Fetch published videos
    const query = video_ids.length > 0 
      ? { id: { $in: video_ids } }
      : { status: 'published' };
    
    const videos = await base44.asServiceRole.entities.Video.filter(query, '-published_at', 500);
    
    const results = {
      total: videos.length,
      cleaned: 0,
      skipped: 0,
      errors: 0,
      changes: []
    };

    for (const video of videos) {
      try {
        // Check current slug for banned terms
        const bannedCheck = containsBannedTerms(video.slug);
        
        if (!bannedCheck.hasBanned) {
          results.skipped++;
          continue; // Slug is clean, skip
        }
        
        // Get performer names for this video
        const performerCredits = await base44.entities.VideoPerformer.filter({ video_id: video.id });
        const performerNames = await Promise.all(
          performerCredits.map(async (credit) => {
            const performer = await base44.entities.Performer.get(credit.performer_id).catch(() => null);
            return performer ? performer.display_name : null;
          })
        );
        const names = performerNames.filter(Boolean);
        
        // Generate clean slug with performer names, categories, and tags
        const cleanSlug = generateCleanSlug(video.title, names, video.categories, video.tags);
        
        // Validate the new slug
        const validation = validateSlug(cleanSlug);
        
        if (!validation.valid) {
          results.errors++;
          results.changes.push({
            video_id: video.id,
            title: video.title,
            current_slug: video.slug,
            proposed_slug: cleanSlug,
            status: 'error',
            issues: validation.issues,
            banned_terms: bannedCheck.found
          });
          continue;
        }
        
        // Prepare change record
        const change = {
          video_id: video.id,
          title: video.title,
          current_slug: video.slug,
          proposed_slug: cleanSlug,
          performer_names: names,
          status: mode === 'apply' ? 'pending' : 'proposed',
          banned_terms: bannedCheck.found,
          slug_quality: scoreSlugQuality(cleanSlug)
        };
        
        // Apply if in apply mode
        if (mode === 'apply') {
          // Save old slug to legacy_slugs
          const legacySlugs = video.legacy_slugs || [];
          if (!legacySlugs.includes(video.slug)) {
            legacySlugs.push(video.slug);
          }
          
          // Update video
          await base44.entities.Video.update(video.id, {
            slug: cleanSlug,
            legacy_slugs: legacySlugs
          });
          
          change.status = 'completed';
          results.cleaned++;
        } else {
          results.changes.push(change);
        }
        
      } catch (error) {
        results.errors++;
        results.changes.push({
          video_id: video.id,
          title: video.title,
          current_slug: video.slug,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return Response.json({
      ok: true,
      mode,
      ...results
    });
    
  } catch (error) {
    console.error('cleanVideoSlugs error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});