/**
 * generateVideoTextFromIdea - Standalone AI Text Generator
 * 
 * Admin tool for generating FLESHLAB video titles and descriptions
 * from rough ideas, scene notes, or content concepts.
 * 
 * Uses the V1 core prompt VERBATIM - no softening, no rewriting.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// V1 CORE PROMPT - VERBATIM (DO NOT MODIFY, SOFTEN, OR REWRITE)
const V1_CORE_PROMPT = `You are an expert adult SEO copywriter for FLESHLAB Studios — a premium gay adult studio with verified 18+ Asian twink and Filipino male performers.

The production concept is:
{{CONTEXT_BLOCK}}

━━━ STEP 1 — IDENTIFY THE CORE ELEMENTS ━━━
Before writing, extract from the input:
- Core sexual act/scene (e.g. solo jerk-off, blowjob, shower wank, outdoor masturbation)
- Setting/location if mentioned (e.g. jungle, outdoors, Philippines, bedroom)
- Performer type if mentioned (Filipino, Asian, twink, etc.)

━━━ STEP 2 — GENERATE METADATA ━━━

TITLE RULES (6-10 words):
✅ Keeps the EXACT same act as identified in Step 1 — no scene escalation
✅ If there's a unique setting (jungle, outdoor, beach, Philippines), lead with it — that's the click trigger
✅ Uses explicit gay male language for the act
✅ Adds performer type ("Filipino twink", "Asian boy") if not present
✅ Reads like a top-performing xHamster title — specific, visual, punchy
❌ No generic intros like "Watch as...", "This is...", "FLESHLAB presents..."

DESCRIPTION RULES (4-5 sentences):
1. HOOK with the USP — if there's a unique setting, open with it. Make it feel rare and real ("Real Philippine jungle", "Miles from anyone", "Only the sound of..."). Create a risk/adventure element if applicable.
2. EXPLICIT SCENE — describe the specific act in graphic detail using explicit gay terminology matching the act.
3. PHYSICAL DETAILS — body, cock, cum, reaction, moans — vivid and specific.
4. TENSION/FANTASY — ask or imply: "Could he be discovered?", "How long until he gives in?", "No one around for miles..." — this fuels fantasy.
5. BRAND CLOSE — naturally include 1-2 FLESHLAB keywords ("FLESHLAB exclusive", "FLESHLAB Studios", "Asian twink", "Filipino performer", "slim Asian boy", "Asian gay").

SEO TITLE (under 60 chars):
- Include performer name or key act
- Optimized for search results preview
- Compelling but accurate

SEO DESCRIPTION (120-158 chars):
- Include primary keyword
- Soft call-to-action
- Accurate summary of scene

TAGS (6-10 tags):
- Lowercase
- Specific to the act, performer type, setting
- Mix of broad and long-tail

SUGGESTED CATEGORIES (2-4 categories):
- Use ONLY approved selectable child categories from the FLESHLAB taxonomy
- NEVER output parent taxonomy group labels as categories

❌ BLOCKED PARENT GROUP LABELS (NEVER USE THESE):
Age, Ethnicity, Body, Orientation, Number Of People, Actions, Production, Apparel, Scenario, Fetish, Language, Location, Sex Toys, "Age / Appearance", "Ethnicity / Origin", "Body Type", "Orientation / Audience", "Scene Type", "Sex Acts", "Fetish / Kink", "Role / Dynamic", "Production Style", "Clothing / Outfit", "Language / Region"

✅ USE SPECIFIC CHILD CATEGORIES INSTEAD:
- For fetish content: Use "BDSM", "Bondage", "Spanking", "Nipple Play", "Foot Fetish" (only if scene context supports it)
- For age: Use "Teen 18+", "Mature", "Daddy", "Twink", "Boyish" (based on actual appearance)
- For body: Use "Muscular", "Slim", "Fit", "Athletic", "Hairy" (based on actual body type)
- For scenario: Use "Outdoor", "Shower", "Hotel", "Bedroom" (based on actual location)
- For actions: Use "Solo", "Blowjob", "Oral", "Anal", "Handjob", "Masturbation", "Nipple Play" (based on actual acts)
- For ethnicity: Use "Asian", "Filipino", "Pinoy", "Caucasian", "Latino" (based on actual performer)

❌ NEVER OUTPUT "Fetish" AS A CATEGORY — use the specific child category (BDSM, Bondage, etc.) if context supports it.

SUGGESTED KEYWORDS (8-12 keywords):
- Long-tail search terms
- Lowercase
- Include variations of act + performer + setting

━━━ WHAT TO AVOID ━━━
❌ "Don't miss this..."
❌ "HD studio quality" / "premium production" as filler
❌ "lustful fantasies" / "exclusive experience" / "invites you to indulge"
❌ Clichés that appear in thousands of other videos
❌ Changing the scene type (solo stays solo, outdoor stays outdoor)
❌ Adding acts not mentioned in the input
❌ Performer type escalation

Reply ONLY in this exact JSON format:
{
  "title": "The punchy xHamster-optimized title",
  "description": "The USP-led, graphic, curiosity-driven description (4-5 sentences)",
  "seo_title": "SEO page title under 60 characters",
  "seo_description": "Meta description 120-158 characters with soft CTA",
  "tags": ["tag1", "tag2", "tag3", ...],
  "suggested_categories": ["category1", "category2", ...],
  "suggested_keywords": ["keyword1", "keyword2", ...]
}`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin only
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { 
      raw_idea,
      current_title,
      current_description,
      brand,
      categories,
      tags,
      performer_info,
      access_tier
    } = await req.json();
    
    // Validate input
    if (!raw_idea || !raw_idea.trim()) {
      return Response.json({ 
        error: 'Raw idea or scene notes are required',
        warnings: ['Please enter some scene notes or a rough idea']
      }, { status: 400 });
    }

    // Build the CONTEXT_BLOCK that replaces {{CONTEXT_BLOCK}} in the prompt template
    // scene_notes is the primary driver — always first and clearly labeled
    const contextLines = [];
    contextLines.push(`SCENE NOTES (primary input — use verbatim details to generate): "${raw_idea.trim()}"`);
    if (current_title?.trim()) contextLines.push(`Current working title (optional reference): "${current_title.trim()}"`);
    if (current_description?.trim()) contextLines.push(`Existing description (optional reference): "${current_description.trim()}"`);
    if (brand?.trim()) contextLines.push(`Brand / Studio: ${brand.trim()}`);
    if (performer_info?.trim()) contextLines.push(`Performer info: ${performer_info.trim()}`);
    if (categories && categories.length > 0) contextLines.push(`Existing categories: ${categories.join(', ')}`);
    if (tags && tags.length > 0) contextLines.push(`Existing tags: ${tags.join(', ')}`);
    if (access_tier) contextLines.push(`Access tier: ${access_tier}`);
    // Anti-caching nonce — ensures the LLM doesn't reuse a cached response
    contextLines.push(`[Generation nonce: ${Date.now()}]`);

    const contextBlock = contextLines.join('\n');

    // Replace {{CONTEXT_BLOCK}} in the V1 prompt template
    const prompt = V1_CORE_PROMPT.replace('{{CONTEXT_BLOCK}}', contextBlock) + `

━━━ CRITICAL INSTRUCTIONS ━━━
1. The SCENE NOTES above are your PRIMARY and MANDATORY input.
2. Extract EVERY concrete detail from the scene notes: performer type, setting, acts, scenario.
3. The title and description MUST directly reflect the specific scene described — not a generic variant.
4. If scene notes mention hotel floor, the output MUST reference hotel floor.
5. If scene notes mention a stranger, the output MUST reference the stranger encounter.
6. If scene notes mention muscle twink, the output MUST reference muscular build.
7. Each generation must be UNIQUE — do not reuse phrasing from any previous generation.
8. Do NOT invent acts or performers not mentioned in the scene notes.
9. Return JSON only — no explanation, no preamble.`;

    // Call Kimi via OpenRouter for adult-video marketing copy
    const openRouterApiKey = Deno.env.get('KIMI_API_KEY');
    const configuredModel = Deno.env.get('KIMI_MODEL') || 'moonshotai/kimi-k2';
    const openRouterModel = configuredModel.includes('/') ? configuredModel : 'moonshotai/kimi-k2';
    if (!openRouterApiKey) {
      return Response.json({ error: 'KIMI_API_KEY is not configured' }, { status: 500 });
    }

    const kimiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('APP_BASE_URL') || 'https://fleshlab.online',
        'X-Title': 'FLESHLAB Studios'
      },
      body: JSON.stringify({
        model: openRouterModel,
        temperature: 0.9,
        messages: [
          {
            role: 'system',
            content: 'You write explicit, accurate, commercial gay adult video metadata for verified 18+ performers. Return valid JSON only.'
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!kimiRes.ok) {
      const errorText = await kimiRes.text();
      return Response.json({ error: `Kimi generation failed: ${kimiRes.status} ${errorText}` }, { status: 502 });
    }

    const kimiData = await kimiRes.json();
    const rawContent = kimiData?.choices?.[0]?.message?.content || '';
    const jsonText = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const response = JSON.parse(jsonText);

    // Validate response
    const warnings = [];
    
    if (!response.title || !response.title.trim()) {
      warnings.push('Generated title is empty');
    }
    if (!response.description || !response.description.trim()) {
      warnings.push('Generated description is empty');
    }
    if (response.title && response.title.length > 120) {
      warnings.push(`Title too long (${response.title.length} chars, max 120)`);
    }
    if (response.description && response.description.length > 2000) {
      warnings.push(`Description too long (${response.description.length} chars, max 2000)`);
    }

    // Check for banned filler phrases - AUTO-CORRECT
    const bannedPhrases = [
      { pattern: "don't want to miss", replacement: "experience raw desire" },
      { pattern: "won't want to miss", replacement: "experience raw desire" },
      { pattern: "don't miss", replacement: "experience" },
      { pattern: "watch as", replacement: "see" },
      { pattern: "this is", replacement: "featuring" },
      { pattern: "invites you", replacement: "delivers" },
      { pattern: "lustful fantasies", replacement: "intense desires" },
      { pattern: "exclusive experience", replacement: "exclusive scene" },
      { pattern: "premium production", replacement: "professional production" },
      { pattern: "hd quality", replacement: "high definition" }
    ];
    
    let correctedTitle = response.title || '';
    let correctedDescription = response.description || '';
    
    bannedPhrases.forEach(({ pattern, replacement }) => {
      const regex = new RegExp(pattern, 'gi');
      if (regex.test(correctedDescription)) {
        warnings.push(`Auto-corrected banned phrase: "${pattern}" → "${replacement}"`);
        correctedDescription = correctedDescription.replace(regex, replacement);
      }
      if (regex.test(correctedTitle)) {
        warnings.push(`Auto-corrected banned phrase in title: "${pattern}"`);
        correctedTitle = correctedTitle.replace(regex, replacement);
      }
    });
    
    // Update response with corrected values
    response.title = correctedTitle;
    response.description = correctedDescription;

    // Check for parent taxonomy group labels in CATEGORIES only (CRITICAL)
    // NOTE: "fetish" is allowed as a TAG, but never as a CATEGORY
    const PARENT_GROUP_LABELS = [
      'age', 'ethnicity', 'body', 'orientation', 'number of people',
      'actions', 'production', 'apparel', 'scenario', 'fetish',
      'language', 'location', 'sex toys', 'age / appearance',
      'ethnicity / origin', 'body type', 'orientation / audience',
      'scene type', 'sex acts', 'fetish / kink', 'role / dynamic',
      'production style', 'clothing / outfit', 'language / region',
    ];
    
    const taxonomyWarnings = [];
    const taxonomyRemoved = [];
    const tagNotes = [];
    
    // Validate CATEGORIES - block all parent labels
    if (response.suggested_categories && Array.isArray(response.suggested_categories)) {
      const cleanedCategories = [];
      
      for (const cat of response.suggested_categories) {
        const lowerCat = cat.toLowerCase().trim();
        
        // Check if it's a parent group label
        if (PARENT_GROUP_LABELS.includes(lowerCat)) {
          taxonomyWarnings.push(`"${cat}" → removed from categories (parent taxonomy group label)`);
          taxonomyRemoved.push({ value: cat, reason: 'parent_group_label', applied_as: 'none' });
          continue;
        }
        
        cleanedCategories.push(cat);
      }
      
      // Replace with cleaned categories
      response.suggested_categories = cleanedCategories;
    }
    
    // Validate TAGS - allow "fetish" but prefer specific terms
    if (response.tags && Array.isArray(response.tags)) {
      const genericTags = ['fetish', 'bdsm', 'kink'];
      const specificContextTags = [
        'nipple torture', 'nipple clamps', 'nipple play', 'clamps',
        'edging', 'pain play', 'bondage', 'domination', 'rope',
        'spanking', 'humiliation', 'role play'
      ];
      
      const hasGenericFetish = response.tags.some(t => t.toLowerCase().trim() === 'fetish');
      const hasSpecificTags = response.tags.some(t => 
        specificContextTags.some(specific => t.toLowerCase().includes(specific))
      );
      
      if (hasGenericFetish && hasSpecificTags) {
        tagNotes.push('Generic "fetish" tag kept for search, but specific tags preferred');
      }
      
      // Auto-add missing categories for sensitive tags
      const tagToCategoryMap = {
        'bareback': 'Bareback',
        'anal': 'Anal',
        'blowjob': 'Blowjob',
        'oral': 'Oral',
        'creampie': 'Creampie',
        'cumshot': 'Cumshot',
        'rimming': 'Rimming',
        'bdsm': 'BDSM',
        'bondage': 'Bondage',
        'nipple': 'Nipple Play',
        'dildo': 'Dildo Play'
      };
      
      const currentCategories = response.suggested_categories || [];
      const addedCategories = [];
      
      for (const [tagKeyword, categoryName] of Object.entries(tagToCategoryMap)) {
        const hasTag = response.tags.some(t => t.toLowerCase().includes(tagKeyword));
        const hasCategory = currentCategories.some(c => c.toLowerCase() === categoryName.toLowerCase());
        
        if (hasTag && !hasCategory) {
          currentCategories.push(categoryName);
          addedCategories.push(categoryName);
          taxonomyWarnings.push(`Auto-added "${categoryName}" to categories (matching tag "${tagKeyword}")`);
        }
      }
      
      if (addedCategories.length > 0) {
        response.suggested_categories = currentCategories;
      }
    }

    return Response.json({
      success: true,
      title: response.title || '',
      description: response.description || '',
      seo_title: response.seo_title || '',
      seo_description: response.seo_description || '',
      tags: response.tags || [],
      suggested_categories: response.suggested_categories || [],
      suggested_keywords: response.suggested_keywords || [],
      raw_response: response,
      warnings,
      taxonomy_warnings: taxonomyWarnings,
      taxonomy_removed: taxonomyRemoved,
      tag_notes: tagNotes,
      debug: {
        input_scene_notes_received: raw_idea?.trim() || '',
        current_title_received: current_title?.trim() || null,
        current_description_received: current_description?.trim() || null,
        performer_info_received: performer_info?.trim() || null,
        brand_received: brand?.trim() || null,
        access_tier_received: access_tier || null,
        tags_received: tags || [],
        categories_received: categories || [],
        generated_title: response.title || '',
        generated_tags: response.tags || [],
        model_used: openRouterModel,
        provider_used: 'openrouter_kimi',
        cached_result: false,
        context_block_built: contextBlock,
      },
    });

  } catch (error) {
    console.error('generateVideoTextFromIdea error:', error);
    return Response.json({ 
      error: error.message,
      warnings: ['AI generation failed']
    }, { status: 500 });
  }
});