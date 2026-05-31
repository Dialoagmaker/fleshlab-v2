import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ChevronDown, ChevronUp, CheckCircle2, Loader2, Search } from "lucide-react";

// ---------------------------------------------------------------------------
// No-escalation rule (enforced in every prompt):
// Do not introduce, infer, or escalate explicit content beyond what is
// explicitly provided in the context block. Marketing copy only.
// ---------------------------------------------------------------------------

const NO_ESCALATION = `STRICT RULE: Do not introduce, infer, or escalate explicit content beyond what is provided in the input context. Generate professional marketing copy only. Never auto-publish or modify live data.`;

function buildContext({ rawTitle, notes, performerNames, brandName, categories, tags }) {
  return [
    rawTitle    && `Raw title / working title: ${rawTitle}`,
    notes       && `Admin notes: ${notes}`,
    performerNames?.length && `Performers: ${performerNames.join(", ")}`,
    brandName   && `Studio/Brand: ${brandName}`,
    categories?.length && `Categories: ${categories.join(", ")}`,
    tags?.length && `Existing tags: ${tags.join(", ")}`,
  ].filter(Boolean).join("\n");
}

// Stage 1 — Scene analysis: extract factual signals from raw input.
// Stage 2 — Creative copy: generate title + description + short_summary.
// Stage 3 — Metadata package: SEO + taxonomy + keywords derived from Stage 2.
//
// For the standalone "SEO Package" action we skip Stages 1–2 and run only
// Stage 3 using the already-finalised title + description from the form.

async function runFullPackage(context) {
  // ── Stage 1: Scene analysis ─────────────────────────────────────────────
  const stage1 = await base44.integrations.Core.InvokeLLM({
    model: "claude_sonnet_4_6",
    prompt: `${NO_ESCALATION}

You are an internal production analyst for an adult content studio. Analyse the following production context and extract a structured scene summary. Output JSON only — no markdown, no commentary.

Context:
${context}`,
    response_json_schema: {
      type: "object",
      properties: {
        scene_type:    { type: "string", description: "One-phrase scene type, e.g. 'solo outdoor'" },
        tone:          { type: "string", description: "Tone descriptor, e.g. 'sultry and slow-building'" },
        key_elements:  { type: "array", items: { type: "string" }, description: "3-6 notable scene elements" },
        audience_hook: { type: "string", description: "Primary hook for marketing, 1 sentence" }
      }
    }
  });

  const sceneBlock = [
    stage1.scene_type    && `Scene type: ${stage1.scene_type}`,
    stage1.tone          && `Tone: ${stage1.tone}`,
    stage1.key_elements?.length && `Key elements: ${stage1.key_elements.join(", ")}`,
    stage1.audience_hook && `Audience hook: ${stage1.audience_hook}`,
  ].filter(Boolean).join("\n");

  // ── Stage 2: Creative copy ───────────────────────────────────────────────
  const stage2 = await base44.integrations.Core.InvokeLLM({
    model: "claude_sonnet_4_6",
    prompt: `${NO_ESCALATION}

You are a senior copywriter for an adult content studio. Using the production context and scene analysis below, write compelling video listing copy. Output JSON only.

Production context:
${context}

Scene analysis:
${sceneBlock}`,
    response_json_schema: {
      type: "object",
      properties: {
        title:         { type: "string", description: "Compelling video title, 6-10 words, capitalised correctly" },
        description:   { type: "string", description: "2-3 sentence marketing description, evocative and professional" },
        short_summary: { type: "string", description: "Single-sentence teaser, under 100 characters" }
      }
    }
  });

  // ── Stage 3: SEO + taxonomy metadata ────────────────────────────────────
  const stage3 = await base44.integrations.Core.InvokeLLM({
    prompt: `${NO_ESCALATION}

You are an SEO specialist for an adult content platform. Using the copy and context below, generate the metadata package. Output JSON only.

Title: ${stage2.title}
Description: ${stage2.description}
Scene analysis: ${sceneBlock}
Production context: ${context}`,
    response_json_schema: {
      type: "object",
      properties: {
        seo_title:            { type: "string",  description: "SEO page title, under 60 characters, includes performer or key term" },
        seo_description:      { type: "string",  description: "Meta description, 120-158 characters, includes a soft CTA" },
        tags:                 { type: "array",   items: { type: "string" }, description: "6-10 specific searchable tags, lowercase" },
        suggested_categories: { type: "array",   items: { type: "string" }, description: "2-4 broad category names matching your taxonomy" },
        suggested_keywords:   { type: "array",   items: { type: "string" }, description: "8-12 long-tail search keywords, lowercase" }
      }
    }
  });

  return { ...stage2, ...stage3 };
}

async function runSeoPackage({ form, performerNames, brandName }) {
  const context = buildContext({
    rawTitle:      form.title,
    notes:         form.description,
    performerNames,
    brandName,
    categories:    form.categories,
    tags:          form.tags,
  });

  return await base44.integrations.Core.InvokeLLM({
    prompt: `${NO_ESCALATION}

You are an SEO specialist for an adult content platform. Using the finalised video copy and context below, generate a focused SEO metadata package. Do NOT change or suggest changes to the title or description. Output JSON only.

Title (final): ${form.title || "(none)"}
Description (final): ${form.description || "(none)"}
Additional context: ${context}`,
    response_json_schema: {
      type: "object",
      properties: {
        seo_title:            { type: "string", description: "SEO page title, under 60 characters" },
        seo_description:      { type: "string", description: "Meta description, 120-158 characters, soft CTA" },
        tags:                 { type: "array",  items: { type: "string" }, description: "6-10 searchable tags, lowercase" },
        suggested_categories: { type: "array",  items: { type: "string" }, description: "2-4 broad category names" },
        suggested_keywords:   { type: "array",  items: { type: "string" }, description: "8-12 long-tail keywords, lowercase" }
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Shared render helpers
// ---------------------------------------------------------------------------

const FIELD_MAP = [
  { key: "title",           label: "Title",           formField: "title" },
  { key: "short_summary",   label: "Short Teaser",    formField: "short_summary" },
  { key: "description",     label: "Description",     formField: "description" },
  { key: "seo_title",       label: "SEO Title",       formField: "meta_title" },
  { key: "seo_description", label: "SEO Description", formField: "meta_description" },
];

function ArrayDraftField({ label, items, onApply }) {
  if (!items?.length) return null;
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{label}</p>
          <div className="flex flex-wrap gap-1.5">
            {items.map(t => (
              <span key={t} className="text-xs bg-muted border border-border rounded-full px-2 py-0.5">{t}</span>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => onApply(items)}
          className="text-xs text-primary hover:underline whitespace-nowrap flex-shrink-0 mt-0.5">
          Apply →
        </button>
      </div>
    </div>
  );
}

function StringDraftField({ label, value, onApply }) {
  if (!value) return null;
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-sm text-foreground mt-1">{value}</p>
        </div>
        <button type="button" onClick={() => onApply(value)}
          className="text-xs text-primary hover:underline whitespace-nowrap flex-shrink-0 mt-1">
          Apply →
        </button>
      </div>
    </div>
  );
}

function DraftPanel({ draft, onApply, applyKeys, title }) {
  if (!draft) return null;
  const handleApplyAll = () => {
    applyKeys.forEach(key => {
      const mapping = FIELD_MAP.find(m => m.key === key);
      if (mapping && draft[key]) onApply(mapping.formField, draft[key]);
    });
    if (applyKeys.includes("tags") && draft.tags?.length) onApply("tags", draft.tags);
    if (applyKeys.includes("suggested_categories") && draft.suggested_categories?.length) onApply("categories", draft.suggested_categories);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <Button type="button" variant="outline" size="sm" onClick={handleApplyAll} className="gap-1.5 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" /> Apply All
        </Button>
      </div>
      {applyKeys.filter(k => !["tags","suggested_categories","suggested_keywords"].includes(k)).map(key => {
        const mapping = FIELD_MAP.find(m => m.key === key);
        return mapping && (
          <StringDraftField key={key} label={mapping.label} value={draft[key]}
            onApply={v => onApply(mapping.formField, v)} />
        );
      })}
      <ArrayDraftField label="Tags" items={draft.tags}
        onApply={v => onApply("tags", v)} />
      <ArrayDraftField label="Suggested Categories" items={draft.suggested_categories}
        onApply={v => onApply("categories", v)} />
      {draft.suggested_keywords?.length > 0 && (
        <div className="bg-muted/40 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Suggested Keywords <span className="normal-case font-normal">(reference only)</span></p>
          <div className="flex flex-wrap gap-1.5">
            {draft.suggested_keywords.map(k => (
              <span key={k} className="text-xs bg-muted border border-border rounded-full px-2 py-0.5 font-mono">{k}</span>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground italic">⚠ Review before saving. Drafts do not auto-publish or affect live content.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const FULL_KEYS = ["title", "short_summary", "description", "seo_title", "seo_description", "tags", "suggested_categories", "suggested_keywords"];
const SEO_KEYS  = ["seo_title", "seo_description", "tags", "suggested_categories", "suggested_keywords"];

export default function AICopyHelper({ form, performerNames, brandName, onApply }) {
  const [open, setOpen]       = useState(false);
  const [notes, setNotes]     = useState("");
  const [rawTitle, setRawTitle] = useState("");
  const [loading, setLoading] = useState(null); // null | "full" | "seo"
  const [stage, setStage]     = useState(null); // 1 | 2 | 3
  const [fullDraft, setFullDraft] = useState(null);
  const [seoDraft, setSeoDraft]   = useState(null);
  const [error, setError]     = useState("");

  const handleFull = async () => {
    setError(""); setFullDraft(null); setLoading("full");
    try {
      const context = buildContext({
        rawTitle:      rawTitle || form.title,
        notes,
        performerNames,
        brandName,
        categories:    form.categories,
        tags:          form.tags,
      });
      setStage(1);
      const result = await runFullPackage(context);
      setFullDraft(result);
    } catch (e) {
      setError("Full generation failed. Check connection and try again.");
    } finally {
      setLoading(null); setStage(null);
    }
  };

  const handleSeo = async () => {
    setError(""); setSeoDraft(null); setLoading("seo");
    try {
      const result = await runSeoPackage({ form, performerNames, brandName });
      setSeoDraft(result);
    } catch (e) {
      setError("SEO generation failed. Check connection and try again.");
    } finally {
      setLoading(null);
    }
  };

  const stageLabel = stage === 1 ? "Analysing scene…" : stage === 2 ? "Writing copy…" : "Building metadata…";

  return (
    <section className="bg-card border border-primary/20 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1">
          <span className="text-sm font-semibold text-foreground">AI Metadata Generator</span>
          <span className="text-xs text-muted-foreground ml-3">3-stage pipeline · Admin review required · No auto-publish</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-6 border-t border-border">

          {/* Inputs */}
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label>Raw title / working title</Label>
              <Input
                value={rawTitle}
                onChange={e => setRawTitle(e.target.value)}
                placeholder={form.title || "e.g. 'Poolside Afternoon'"}
              />
              <p className="text-xs text-muted-foreground">Leave blank to use the current form title.</p>
            </div>
            <div className="space-y-2">
              <Label>Admin notes / scene context</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. 'Outdoor shoot, poolside, solo, slow build, golden hour lighting…'"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Auto-includes: performers ({performerNames.join(", ") || "none"}) · brand ({brandName || "none"}) · categories · tags
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={handleFull} disabled={!!loading} className="gap-2">
              {loading === "full"
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {stageLabel}</>
                : <><Sparkles className="w-4 h-4" /> Generate Full Package</>
              }
            </Button>
            <Button type="button" variant="outline" onClick={handleSeo} disabled={!!loading} className="gap-2">
              {loading === "seo"
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating SEO…</>
                : <><Search className="w-4 h-4" /> Generate SEO Package</>
              }
            </Button>
          </div>

          {loading === "full" && stage && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex gap-1">
                {[1,2,3].map(s => (
                  <div key={s} className={`w-6 h-1 rounded-full transition-colors ${s <= stage ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>
              <span>Stage {stage}/3 · {stageLabel}</span>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Full Package Results */}
          {fullDraft && (
            <div className="space-y-3 border-t border-border pt-5">
              <DraftPanel
                draft={fullDraft}
                onApply={onApply}
                applyKeys={FULL_KEYS}
                title="Full Package — review and apply"
              />
            </div>
          )}

          {/* SEO Package Results */}
          {seoDraft && (
            <div className="space-y-3 border-t border-border pt-5">
              <DraftPanel
                draft={seoDraft}
                onApply={onApply}
                applyKeys={SEO_KEYS}
                title="SEO Package — review and apply (title & description unchanged)"
              />
            </div>
          )}

        </div>
      )}
    </section>
  );
}