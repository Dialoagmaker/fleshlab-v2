import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

// APPROVED CATEGORIES - Canonical list (Phase 2A)
const APPROVED_CATEGORIES = [
  'Asian', 'Filipino', 'Pinoy', 'Twink', 'Solo', 'Outdoor', 'Shower',
  'Mirror', 'Dildo Play', 'Nipple Play', 'Blowjob', 'Oral', 'Anal',
  'Bareback', 'Creampie', 'Cumshot', 'Rimming', 'Handjob', 'BDSM',
  'Daddy/Twink', 'Age Gap', 'Studio Production', 'Amateur',
  'Amateur Production', 'Home Amateur', 'Raw', 'Homemade',
];

const APPROVED_CATEGORIES_MAP = new Map(
  APPROVED_CATEGORIES.map(cat => [cat.toLowerCase(), cat])
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Allow service-role calls (fire-and-forget from updateVideoProcessingResult) as well as admin users
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { video_id } = await req.json();
    if (!video_id) {
      return Response.json({ error: 'Missing video_id' }, { status: 400 });
    }

    // Fetch video
    const video = await base44.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Fetch performers
    const credits = await base44.entities.VideoPerformer.filter({ video_id });
    let performerNames = [];
    if (credits.length > 0) {
      const performers = await Promise.all(
        credits.map(c => base44.entities.Performer.get(c.performer_id).catch(() => null))
      );
      performerNames = performers.filter(Boolean).map(p => p.display_name);
    }

    // Fetch brand
    let brandName = '';
    if (video.brand_id) {
      const brand = await base44.entities.Brand.get(video.brand_id).catch(() => null);
      brandName = brand?.name || '';
    }

    // Fetch thumbnail URL (prefer existing VideoAsset, fallback to video field)
    let thumbnailUrl = video.primary_thumbnail_url || null;
    const thumbnailAssets = await base44.entities.VideoAsset.filter({ video_id, asset_type: 'thumbnail' });
    if (thumbnailAssets.length > 0 && thumbnailAssets[0].cdn_url) {
      thumbnailUrl = thumbnailAssets[0].cdn_url;
    }

    const contextBlock = [
      `Working title: ${video.title || 'Untitled'}`,
      video.description && `Existing description: ${video.description}`,
      performerNames.length && `Performers: ${performerNames.join(', ')}`,
      brandName && `Studio/Brand: ${brandName}`,
      video.categories?.length && `Categories: ${video.categories.join(', ')}`,
      video.tags?.length && `Existing tags: ${video.tags.join(', ')}`,
    ].filter(Boolean).join('\n');

    const draft = await base44.integrations.Core.InvokeLLM({
      ...(thumbnailUrl ? { file_urls: [thumbnailUrl] } : {}),
      model: thumbnailUrl ? 'gemini_3_flash' : undefined,
      prompt: `You are an expert adult SEO copywriter for FLESHLAB Studios — a premium gay adult studio with verified 18+ Asian twink and Filipino male performers.${thumbnailUrl ? ' Analyze the provided thumbnail/frame carefully for: performers visible, setting/location, acts depicted, physical details.' : ''}

Production context:
${contextBlock}

Generate a complete metadata package. Reply ONLY in this exact JSON:
{
  "title": "6-10 word punchy xHamster-optimized title",
  "description": "4-5 sentence explicit USP-led description",
  "short_teaser": "1 sentence punchy teaser for listings",
  "seo_title": "SEO meta title (45-60 chars) using priority: [Ethnicity/Nationality] + [Performer Type] + [Main Scene Action] + [Context if applicable] + ' | FLESHLAB'. Example: 'Filipino Twink Jerk Off Outdoors | FLESHLAB'",
  "seo_description": "Meta description 120-155 chars. Pattern: [Performer name or type] + [scene hook/location context] + [main action keyword] + [style/category] + [CTA mentioning FLESHLAB once]. Spell all words correctly — especially 'masturbation', 'Filipino', 'outdoor'. No typos.",
  "categories": ["2-4 broad category names, e.g. Asian, Filipino, Solo, Twink"],
  "tags": ["8-15 lowercase specific tags"],
  "ppv_price": 6.99
}

SEO TITLE RULES:
- Always end with ' | FLESHLAB'
- Lead with the most specific identity signals: nationality (Filipino, Thai, Asian) before generic terms
- Include scene type or action: Jerk Off, Solo Masturbation, Blowjob, Rimming, Bareback, Shower, Outdoor
- Include location/context if relevant: Outdoors, Shower, Public, Hotel
- Avoid generic titles like "Outdoor Solo Masturbation | FLESHLAB" — be specific
- Keep between 45-60 characters
- Do NOT start with "Watch" or "Stream"

SEO DESCRIPTION RULES:
- 120-155 characters
- Mention performer name (if known) or performer type (Filipino twink, Asian boy)
- Mention the scene context/location naturally (province, outdoors, shower, etc.)
- Include 1-2 action keywords naturally
- End with a soft CTA: "Stream on FLESHLAB" or "Watch on FLESHLAB" — only once
- No typos: spell "masturbation", "Filipino", "outdoor" correctly
- Do not repeat "watch" or "stream" more than once
- Do not start with "Watch"

PPV price rules: 0-5min = 4.99, 5-10min = 6.99, 10-20min = 9.99, 20+min = 14.99. Duration: ${video.duration_seconds ? Math.round(video.duration_seconds / 60) + ' minutes' : 'unknown — use 6.99'}.

AVOID: generic intros, typos, "Don't miss", "HD studio quality", clichés, keyword stuffing, duplicate phrases.`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          short_teaser: { type: 'string' },
          seo_title: { type: 'string' },
          seo_description: { type: 'string' },
          categories: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } },
          ppv_price: { type: 'number' }
        },
        required: ['title', 'description', 'short_teaser', 'seo_title', 'seo_description', 'categories', 'tags', 'ppv_price']
      }
    });

    // ============================================================================
    // TAXONOMY VALIDATION - Block parent group labels, normalize categories
    // ============================================================================
    
    const isParentGroupLabel = (value) => {
      if (!value || typeof value !== 'string') return false;
      return PARENT_GROUP_LABELS.includes(value.toLowerCase().trim());
    };
    
    const normalizeCategories = (categories, contextText = '') => {
      if (!Array.isArray(categories)) return { normalized: [], warnings: [], removed: [] };
      
      const normalized = [];
      const warnings = [];
      const removed = [];
      const seen = new Set();
      
      for (const cat of categories) {
        const trimmed = cat.trim();
        const lower = trimmed.toLowerCase();
        
        // Block parent group labels
        if (isParentGroupLabel(trimmed)) {
          warnings.push(`"${trimmed}" → removed (parent taxonomy group label, not selectable)`);
          removed.push({ value: trimmed, reason: 'parent_group_label' });
          continue;
        }
        
        // Check approved list
        const canonical = APPROVED_CATEGORIES_MAP.get(lower);
        if (canonical) {
          if (!seen.has(lower)) {
            seen.add(lower);
            normalized.push(canonical);
          }
        } else {
          warnings.push(`"${trimmed}" → removed (not in approved taxonomy)`);
          removed.push({ value: trimmed, reason: 'not_in_taxonomy' });
        }
      }
      
      return { normalized, warnings, removed };
    };
    
    // Validate and normalize AI-generated categories
    const contextText = `${draft.title || ''} ${draft.description || ''}`.toLowerCase();
    const categoryValidation = normalizeCategories(draft.categories || [], contextText);
    
    // Apply warnings to response for admin review
    if (categoryValidation.warnings.length > 0) {
      console.log('Category normalization warnings:', categoryValidation.warnings);
    }
    
    // Replace with normalized categories
    draft.categories = categoryValidation.normalized;
    
    // SEO validator — fix known typos and enforce structural rules
    const TYPO_MAP = {
      'masturabtion': 'masturbation',
      'masterbation': 'masturbation',
      'masterbating': 'masturbating',
      'masturabting': 'masturbating',
      'filipinoo': 'Filipino',
      'twinkk': 'twink',
      'outcoor': 'outdoor',
      'outdooor': 'outdoor',
    };
    const fixTypos = (str) => {
      if (!str) return str;
      let out = str;
      for (const [bad, good] of Object.entries(TYPO_MAP)) {
        out = out.replace(new RegExp(bad, 'gi'), (m) => m[0] === m[0].toUpperCase() ? good.charAt(0).toUpperCase() + good.slice(1) : good);
      }
      return out.replace(/  +/g, ' ').trim();
    };

    if (draft.seo_title) {
      draft.seo_title = fixTypos(draft.seo_title);
      // Ensure ends with | FLESHLAB
      if (!draft.seo_title.includes('FLESHLAB')) {
        draft.seo_title = draft.seo_title.replace(/\s*\|.*$/, '').trim() + ' | FLESHLAB';
      }
      // Trim to 70 chars max
      if (draft.seo_title.length > 70) {
        const [content] = draft.seo_title.split(' | FLESHLAB');
        draft.seo_title = content.substring(0, 55).trim() + ' | FLESHLAB';
      }
    }
    if (draft.seo_description) {
      draft.seo_description = fixTypos(draft.seo_description);
      // Trim to 160 chars max
      if (draft.seo_description.length > 160) {
        draft.seo_description = draft.seo_description.substring(0, 157).trim() + '…';
      }
    }
    if (draft.title) draft.title = fixTypos(draft.title);
    if (draft.description) draft.description = fixTypos(draft.description);

    // Auto-apply generated metadata directly to video fields (only if currently empty)
    const autoApplyFields = {};
    if (!video.description && draft.description) autoApplyFields.description = draft.description;
    if (!video.short_summary && draft.short_teaser) autoApplyFields.short_summary = draft.short_teaser;
    if (!video.meta_title && draft.seo_title) autoApplyFields.meta_title = draft.seo_title;
    if (!video.meta_description && draft.seo_description) autoApplyFields.meta_description = draft.seo_description;
    if ((!video.tags || video.tags.length === 0) && draft.tags?.length) autoApplyFields.tags = draft.tags;
    // Only apply normalized categories (parent group labels already removed)
    if ((!video.categories || video.categories.length === 0) && draft.categories?.length) {
      autoApplyFields.categories = draft.categories;
    }

    // Store draft as JSON string on video and apply empty fields
    await base44.entities.Video.update(video_id, {
      ai_metadata_draft: JSON.stringify({
        ...draft,
        taxonomy_warnings: categoryValidation.warnings,
        taxonomy_removed: categoryValidation.removed,
      }),
      ai_metadata_generated_at: new Date().toISOString(),
      processing_status: 'draft_ready',
      ...autoApplyFields,
    });

    return Response.json({ 
      status: 'ok', 
      draft,
      taxonomy_warnings: categoryValidation.warnings,
      taxonomy_removed: categoryValidation.removed,
    });

  } catch (error) {
    console.error('generateVideoMetadata error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});