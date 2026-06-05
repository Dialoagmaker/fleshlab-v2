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
- Broad category names for taxonomy
- Match common adult site categories

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

    // Build context for V2
    const contextLines = [];
    if (raw_idea?.trim()) contextLines.push(`Raw idea / notes: ${raw_idea.trim()}`);
    if (current_title?.trim()) contextLines.push(`Current title: ${current_title.trim()}`);
    if (current_description?.trim()) contextLines.push(`Existing description: ${current_description.trim()}`);
    if (brand?.trim()) contextLines.push(`Brand / Studio: ${brand.trim()}`);
    if (categories && categories.length > 0) contextLines.push(`Categories: ${categories.join(', ')}`);
    if (tags && tags.length > 0) contextLines.push(`Tags: ${tags.join(', ')}`);
    if (performer_info?.trim()) contextLines.push(`Performer info: ${performer_info.trim()}`);
    if (access_tier) contextLines.push(`Access tier: ${access_tier}`);

    const v2Context = contextLines.filter(Boolean).join('\n');

    // Build full prompt with V1 core + V2 context
    const prompt = `
${V1_CORE_PROMPT}

ADDITIONAL V2 CONTEXT:
${v2Context}

IMPORTANT:
Use the V1 prompt rules above as the source of truth.
Do not soften the language.
Do not use generic marketing filler.
Do not change the scene type.
Return JSON only.
`;

    // Call LLM with V1 prompt
    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '6-10 word punchy title' },
          description: { type: 'string', description: '4-5 sentence explicit description' },
          seo_title: { type: 'string', description: 'SEO title under 60 chars' },
          seo_description: { type: 'string', description: 'Meta description 120-158 chars' },
          tags: { type: 'array', items: { type: 'string' }, description: '6-10 searchable tags' },
          suggested_categories: { type: 'array', items: { type: 'string' }, description: '2-4 broad categories' },
          suggested_keywords: { type: 'array', items: { type: 'string' }, description: '8-12 long-tail keywords' }
        },
        required: ['title', 'description', 'seo_title', 'seo_description', 'tags', 'suggested_categories', 'suggested_keywords']
      }
    });

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

    // Check for banned filler phrases
    const bannedPhrases = [
      "don't miss",
      "watch as",
      "this is",
      "invites you",
      "lustful fantasies",
      "exclusive experience",
      "premium production",
      "hd quality"
    ];
    
    const lowerText = `${response.title} ${response.description}`.toLowerCase();
    bannedPhrases.forEach(phrase => {
      if (lowerText.includes(phrase)) {
        warnings.push(`Contains banned filler phrase: "${phrase}"`);
      }
    });

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
      warnings
    });

  } catch (error) {
    console.error('generateVideoTextFromIdea error:', error);
    return Response.json({ 
      error: error.message,
      warnings: ['AI generation failed']
    }, { status: 500 });
  }
});