import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// BANNED SEO TERMS - NEVER GENERATE THESE
const BANNED_SEO_TERMS = [
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

const PARENT_GROUP_LABELS = [
  'age', 'ethnicity', 'body', 'orientation', 'number of people',
  'actions', 'production', 'apparel', 'scenario', 'fetish',
  'language', 'location', 'sex toys',
];

function containsBannedTerms(text) {
  if (!text) return { hasBanned: false, found: [] };
  const lower = text.toLowerCase();
  const found = BANNED_SEO_TERMS.filter(term => lower.includes(term));
  return { hasBanned: found.length > 0, found };
}

function validateSlug(slug) {
  if (!slug) return { valid: false, issues: ['Slug is empty'] };
  const issues = [];
  const words = slug.split('-').filter(w => w.trim());
  
  // Check length
  if (words.length > 10) issues.push(`Too long: ${words.length} words (max 10)`);
  if (words.length < 3) issues.push(`Too short: ${words.length} words (min 3)`);
  
  // Check for banned terms
  const bannedCheck = containsBannedTerms(slug);
  if (bannedCheck.hasBanned) issues.push(`Banned terms: ${bannedCheck.found.join(', ')}`);
  
  // Check for truncation (words cut off mid-way)
  const truncated = words.filter(w => w.length > 2 && !/^[a-z0-9]+$/.test(w));
  if (truncated.length > 0) issues.push(`Truncated words: ${truncated.join(', ')}`);
  
  // Check for duplicate consecutive words
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1]) issues.push(`Duplicate word: ${words[i]}`);
  }
  
  return { valid: issues.length === 0, issues, wordCount: words.length };
}

function sanitizeSlug(text) {
  if (!text) return '';
  // Remove banned terms
  let slug = text.toLowerCase();
  BANNED_SEO_TERMS.forEach(term => {
    slug = slug.replace(new RegExp(term.replace(/-/g, '[-\\s]'), 'gi'), '');
  });
  // Clean up
  slug = slug.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
  return slug;
}

const isParentGroupLabel = (v) => v && PARENT_GROUP_LABELS.includes(v.toLowerCase().trim());

function normalizeCategories(cats, ctx = '') {
  if (!Array.isArray(cats)) return { normalized: [], warnings: [], removed: [] };
  const normalized = [], warnings = [], removed = [], seen = new Set();
  for (const cat of cats) {
    const t = cat.trim(), l = t.toLowerCase();
    if (isParentGroupLabel(t)) {
      warnings.push(`"${t}" removed (parent group label)`);
      removed.push({ value: t, reason: 'parent_group_label' });
      continue;
    }
    if (!seen.has(l)) {
      seen.add(l);
      normalized.push(t);
    }
  }
  return { normalized, warnings, removed };
}

function fixTypos(str) {
  if (!str) return str;
  const TYPOS = { 'masturabtion': 'masturbation', 'filipinoo': 'Filipino', 'twinkk': 'twink', 'outcoor': 'outdoor' };
  let out = str;
  for (const [bad, good] of Object.entries(TYPOS)) out = out.replace(new RegExp(bad, 'gi'), good);
  return out.trim();
}

Deno.serve(async (req) => {
  let step = 'init';
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ ok: false, error: 'Unauthorized', step: 'auth' }, { status: 403 });

    const { video_id, use_image_analysis = false } = await req.json();
    if (!video_id) return Response.json({ ok: false, error: 'Missing video_id', step: 'load_video' }, { status: 400 });

    step = 'load_video';
    const video = await base44.entities.Video.get(video_id);
    if (!video) return Response.json({ ok: false, error: 'Video not found', step: 'load_video', input_summary: { video_id } }, { status: 404 });

    const cats = Array.isArray(video.categories) ? video.categories : [];
    const tags = Array.isArray(video.tags) ? video.tags : [];

    step = 'build_prompt';
    const credits = await base44.entities.VideoPerformer.filter({ video_id });
    const perfNames = await Promise.all(credits.map(c => base44.entities.Performer.get(c.performer_id).catch(() => null)));
    const performerNames = perfNames.filter(Boolean).map(p => p.display_name);
    const brand = video.brand_id ? await base44.entities.Brand.get(video.brand_id).catch(() => null) : null;
    
    // Build text context (always available)
    const ctx = [
      `Title: ${video.title || ''}`,
      video.description && `Desc: ${video.description}`,
      performerNames.length && `Performers: ${performerNames.join(', ')}`,
      brand?.name && `Brand: ${brand.name}`,
      cats.length && `Categories: ${cats.join(', ')}`,
      tags.length && `Tags: ${tags.join(', ')}`,
      video.access_tier && `Access tier: ${video.access_tier}`,
    ].filter(Boolean).join('\n');

    step = 'invoke_llm';
    let draft;
    let mode = 'text_only';
    let warnings = [];
    
    // Try image analysis only if explicitly requested
    if (use_image_analysis) {
      const thumbAssets = await base44.entities.VideoAsset.filter({ video_id, asset_type: 'thumbnail' });
      const thumbUrl = thumbAssets[0]?.cdn_url || video.primary_thumbnail_url;
      
      if (thumbUrl) {
        try {
          draft = await base44.integrations.Core.InvokeLLM({
            file_urls: [thumbUrl],
            model: 'gemini_3_flash',
            prompt: `FLESHLAB adult SEO copywriter. Context:\n${ctx}\n\nJSON only: {"title":"6-10 words","description":"4-5 sentences explicit","short_teaser":"1 sentence","seo_title":"45-60 chars end | FLESHLAB","seo_description":"120-155 chars","categories":["2-4"],"tags":["8-15"],"ppv_price":6.99}`,
            response_json_schema: { type: 'object', properties: { title: {type:'string'}, description: {type:'string'}, short_teaser: {type:'string'}, seo_title: {type:'string'}, seo_description: {type:'string'}, categories: {type:'array',items:{type:'string'}}, tags: {type:'array',items:{type:'string'}}, ppv_price: {type:'number'} }, required: ['title','description','short_teaser','seo_title','seo_description','categories','tags','ppv_price'] }
          });
          mode = 'image_analysis';
        } catch (imgError) {
          // Image decode failed - fallback to text-only
          warnings.push('Thumbnail image could not be decoded; generated from text only.');
          mode = 'text_only_fallback';
        }
      }
    }
    
    // Text-only generation (default or fallback)
    if (!draft) {
      draft = await base44.integrations.Core.InvokeLLM({
        model: 'claude_opus_4_8',
        prompt: `FLESHLAB adult SEO copywriter. Context:\n${ctx}\n\nJSON only: {"title":"6-10 words","description":"4-5 sentences explicit","short_teaser":"1 sentence","seo_title":"45-60 chars end | FLESHLAB","seo_description":"120-155 chars","categories":["2-4"],"tags":["8-15"],"ppv_price":6.99}`,
        response_json_schema: { type: 'object', properties: { title: {type:'string'}, description: {type:'string'}, short_teaser: {type:'string'}, seo_title: {type:'string'}, seo_description: {type:'string'}, categories: {type:'array',items:{type:'string'}}, tags: {type:'array',items:{type:'string'}}, ppv_price: {type:'number'} }, required: ['title','description','short_teaser','seo_title','seo_description','categories','tags','ppv_price'] }
      });
    }

    step = 'validate_and_clean';
    // Check for banned terms in all generated fields
    const fieldsToCheck = ['title', 'description', 'seo_title', 'seo_description', 'short_teaser'];
    const bannedIssues = [];
    fieldsToCheck.forEach(field => {
      if (draft[field]) {
        const check = containsBannedTerms(draft[field]);
        if (check.hasBanned) {
          bannedIssues.push(`${field}: ${check.found.join(', ')}`);
          // Remove banned terms from the field
          let cleaned = draft[field];
          check.found.forEach(term => {
            cleaned = cleaned.replace(new RegExp(term.replace(/-/g, '[-\\s]'), 'gi'), '');
          });
          draft[field] = cleaned.trim();
        }
      }
    });
    
    // Validate and clean tags
    if (draft.tags && Array.isArray(draft.tags)) {
      draft.tags = draft.tags.filter(tag => {
        const check = containsBannedTerms(tag);
        if (check.hasBanned) {
          bannedIssues.push(`tag "${tag}": ${check.found.join(', ')}`);
          return false;
        }
        return true;
      });
    }
    
    // Validate categories
    const catVal = normalizeCategories(draft.categories || [], `${draft.title||''} ${draft.description||''}`.toLowerCase());
    draft.categories = catVal.normalized.filter(cat => {
      const check = containsBannedTerms(cat);
      if (check.hasBanned) {
        bannedIssues.push(`category "${cat}": ${check.found.join(', ')}`);
        return false;
      }
      return true;
    });

    // Fix typos
    if (draft.seo_title) draft.seo_title = fixTypos(draft.seo_title);
    if (draft.seo_description) draft.seo_description = fixTypos(draft.seo_description);
    if (draft.title) draft.title = fixTypos(draft.title);
    if (draft.description) draft.description = fixTypos(draft.description);
    if (draft.seo_title && !draft.seo_title.includes('FLESHLAB')) draft.seo_title = draft.seo_title.replace(/\s*\|.*$/,'').trim() + ' | FLESHLAB';
    
    // Generate clean slug from title
    if (draft.title) {
      const proposedSlug = sanitizeSlug(draft.title);
      const slugValidation = validateSlug(proposedSlug);
      if (!slugValidation.valid) {
        bannedIssues.push(`slug issues: ${slugValidation.issues.join('; ')}`);
      }
      draft.proposed_slug = proposedSlug;
    }

    step = 'save';
    const apply = {};
    if (!video.description && draft.description) apply.description = draft.description;
    if (!video.short_summary && draft.short_teaser) apply.short_summary = draft.short_teaser;
    if (!video.meta_title && draft.seo_title) apply.meta_title = draft.seo_title;
    if (!video.meta_description && draft.seo_description) apply.meta_description = draft.seo_description;
    if ((!video.tags || !video.tags.length) && draft.tags?.length) apply.tags = draft.tags;
    if ((!video.categories || !video.categories.length) && draft.categories?.length) apply.categories = draft.categories;

    await base44.entities.Video.update(video_id, {
      ai_metadata_draft: JSON.stringify({ ...draft, taxonomy_warnings: catVal.warnings, taxonomy_removed: catVal.removed, mode, image_warnings: warnings }),
      ai_metadata_generated_at: new Date().toISOString(),
      processing_status: 'draft_ready',
      ...apply,
    });

    return Response.json({ 
      ok: true, 
      mode,
      title: draft.title,
      description: draft.description,
      short_teaser: draft.short_teaser,
      seo_title: draft.seo_title,
      seo_description: draft.seo_description,
      categories: draft.categories,
      tags: draft.tags,
      ppv_price: draft.ppv_price,
      proposed_slug: draft.proposed_slug,
      taxonomy_warnings: catVal.warnings, 
      taxonomy_removed: catVal.removed,
      warnings: [...warnings, ...catVal.warnings, ...bannedIssues],
      banned_terms_removed: bannedIssues.length > 0,
      input_summary: {
        video_id,
        has_title: !!video.title,
        has_description: !!video.description,
        categories_count: cats.length,
        tags_count: tags.length
      }
    });
  } catch (e) {
    console.error('generateVideoMetadata error:', e);
    return Response.json({ ok: false, error: e.message, step, details: e.stack }, { status: 500 });
  }
});