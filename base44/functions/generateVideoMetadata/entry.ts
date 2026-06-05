import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PARENT_GROUP_LABELS = [
  'age', 'ethnicity', 'body', 'orientation', 'number of people',
  'actions', 'production', 'apparel', 'scenario', 'fetish',
  'language', 'location', 'sex toys',
];

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
        prompt: `FLESHLAB adult SEO copywriter. Context:\n${ctx}\n\nJSON only: {"title":"6-10 words","description":"4-5 sentences explicit","short_teaser":"1 sentence","seo_title":"45-60 chars end | FLESHLAB","seo_description":"120-155 chars","categories":["2-4"],"tags":["8-15"],"ppv_price":6.99}`,
        response_json_schema: { type: 'object', properties: { title: {type:'string'}, description: {type:'string'}, short_teaser: {type:'string'}, seo_title: {type:'string'}, seo_description: {type:'string'}, categories: {type:'array',items:{type:'string'}}, tags: {type:'array',items:{type:'string'}}, ppv_price: {type:'number'} }, required: ['title','description','short_teaser','seo_title','seo_description','categories','tags','ppv_price'] }
      });
    }

    step = 'normalize_taxonomy';
    const catVal = normalizeCategories(draft.categories || [], `${draft.title||''} ${draft.description||''}`.toLowerCase());
    draft.categories = catVal.normalized;

    if (draft.seo_title) draft.seo_title = fixTypos(draft.seo_title);
    if (draft.seo_description) draft.seo_description = fixTypos(draft.seo_description);
    if (draft.title) draft.title = fixTypos(draft.title);
    if (draft.description) draft.description = fixTypos(draft.description);
    if (draft.seo_title && !draft.seo_title.includes('FLESHLAB')) draft.seo_title = draft.seo_title.replace(/\s*\|.*$/,'').trim() + ' | FLESHLAB';

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
      taxonomy_warnings: catVal.warnings, 
      taxonomy_removed: catVal.removed,
      warnings: [...warnings, ...catVal.warnings],
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