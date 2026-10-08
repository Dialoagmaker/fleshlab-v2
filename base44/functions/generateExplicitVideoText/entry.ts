/**
 * generateExplicitVideoText - AI Video Metadata Generator
 * 
 * Generates SEO-optimized titles, descriptions, and metadata for adult video content.
 * Uses the V1 core prompt VERBATIM - no softening, no rewriting.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// V1 Core Prompt - VERBATIM (DO NOT MODIFY)
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

function buildPrompt({ title, notes, performerNames, brandName, categories, tags, thumbnailUrl }) {
  const contextLines = [
    `Working title: ${title}`,
    notes && `Admin notes: ${notes}`,
    performerNames?.length && `Performers: ${performerNames.join(", ")}`,
    brandName && `Studio/Brand: ${brandName}`,
    categories?.length && `Categories: ${categories.join(", ")}`,
    tags?.length && `Existing tags: ${tags.join(", ")}`,
  ].filter(Boolean).join("\n");

  return `
${V1_CORE_PROMPT}

ADDITIONAL CONTEXT:
${contextLines}
${thumbnailUrl ? `\nThumbnail analysis: Analyze the provided thumbnail for visual context.` : ''}
`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.user_type !== 'performer')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, notes, performerNames, brandName, categories, tags, thumbnail_url } = await req.json();
    
    if (!title || !title.trim()) {
      return Response.json({ error: 'Title or scene notes are required' }, { status: 400 });
    }

    // Build prompt using V1 core prompt verbatim
    const prompt = buildPrompt({
      title,
      notes,
      performerNames,
      brandName,
      categories,
      tags,
      thumbnailUrl: thumbnail_url
    });

    const response = await base44.integrations.Core.InvokeLLM({
      ...(thumbnail_url ? { file_urls: [thumbnail_url] } : {}),
      model: thumbnail_url ? 'gemini_3_flash' : 'claude_opus_4_8',
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

    return Response.json(response);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});