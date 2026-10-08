import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ChevronDown, ChevronUp, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { normalizeMetadata } from "@/lib/videoMetadataGuardrails";

// ---------------------------------------------------------------------------
// FLESHLAB Architecture — Single LLM Call
// No multi-stage orchestration. One prompt. One JSON response.
// ---------------------------------------------------------------------------

const FIELD_MAP = [
  { key: "title",           label: "Title",           formField: "title" },
  { key: "description",     label: "Description",     formField: "description" },
  { key: "seo_title",       label: "SEO Title",       formField: "meta_title" },
  { key: "seo_description", label: "SEO Description", formField: "meta_description" },
];

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

function DraftPanel({ draft, onApply, form }) {
  if (!draft) return null;

  const handleApplyAll = async () => {
    // Phase 2C P0: Validate AI output before applying
    const validation = normalizeMetadata({
      categories: draft.suggested_categories || [],
      tags: draft.tags || [],
      title: draft.title || (form?.title || ''),
      description: draft.description || '',
      short_summary: draft.short_teaser || '',
      strict: false, // Auto-fix what we can
    });
    
    if (!validation.valid && validation.errors.length > 0) {
      const confirmApply = window.confirm(
        `AI metadata has ${validation.errors.length} issues:\n\n${validation.errors.slice(0, 3).join('\n')}${validation.errors.length > 3 ? '\n...' : ''}\n\nApply cleaned version? (Invalid items will be removed)`
      );
      if (!confirmApply) return;
    }
    
    // Apply normalized values
    FIELD_MAP.forEach(({ key, formField }) => {
      if (draft[key]) onApply(formField, draft[key]);
    });
    if (draft.tags?.length) onApply("tags", validation.normalized.tags || draft.tags);
    if (draft.suggested_categories?.length) onApply("categories", validation.normalized.categories || draft.suggested_categories);
    
    if (validation.removed?.categories?.length || validation.removed?.tags?.length) {
      console.warn('AI metadata cleanup:', {
        removed_categories: validation.removed.categories,
        removed_tags: validation.removed.tags,
      });
    }
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Review generated metadata — apply fields individually or all at once</p>
        <Button type="button" variant="outline" size="sm" onClick={handleApplyAll} className="gap-1.5 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" /> Apply All
        </Button>
      </div>
      
      {FIELD_MAP.map(({ key, label }) => (
        <StringDraftField key={key} label={label} value={draft[key]}
          onApply={v => {
            const mapping = FIELD_MAP.find(m => m.key === key);
            onApply(mapping.formField, v);
          }} />
      ))}
      
      <ArrayDraftField label="Tags" items={draft.tags}
        onApply={v => onApply("tags", v)} />
      
      <ArrayDraftField label="Suggested Categories" items={draft.suggested_categories}
        onApply={v => onApply("categories", v)} />
      
      {draft.suggested_keywords?.length > 0 && (
        <div className="bg-muted/40 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
            Suggested Keywords <span className="normal-case font-normal">(reference only — not auto-applied)</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {draft.suggested_keywords.map(k => (
              <span key={k} className="text-xs bg-muted border border-border rounded-full px-2 py-0.5 font-mono">{k}</span>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground italic">⚠ Review before saving. AI drafts are suggestions only. This does not publish or modify any live content.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component — FLESHLAB Single-Call Architecture
// ---------------------------------------------------------------------------

export default function AICopyHelper({ form, performerNames, brandName, thumbnailUrl, onApply }) {
  const [open, setOpen]     = useState(false);
  const [notes, setNotes]   = useState("");
  const [rawTitle, setRawTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft]   = useState(null);
  const [error, setError]   = useState("");
  const [autoTriggered, setAutoTriggered] = useState(false);

  const handleGenerate = async () => {
    setError("");
    setDraft(null);
    setLoading(true);
    
    try {
      const result = await base44.functions.invoke('generateExplicitVideoText', {
        title:      rawTitle || form.title,
        notes,
        performerNames,
        brandName,
        categories: form.categories,
        tags:       form.tags,
        thumbnail_url: thumbnailUrl || null,
      });
      
      setDraft(result.data || result);
    } catch (e) {
      setError("Generation failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate when panel opens (once per session)
  const handleToggleOpen = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && !autoTriggered && !draft && (form.title || thumbnailUrl)) {
      setAutoTriggered(true);
      setTimeout(handleGenerate, 100);
    }
  };

  return (
    <section className="bg-card border border-primary/20 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={handleToggleOpen}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1">
          <span className="text-sm font-semibold text-foreground">AI Metadata Generator</span>
          <span className="text-xs text-muted-foreground ml-3">Single-call FLESHLAB architecture · Admin review required</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5 border-t border-border">

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

          {/* Action */}
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Full Metadata Package</>}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Results */}
          {draft && <DraftPanel draft={draft} onApply={onApply} form={form} />}

        </div>
      )}
    </section>
  );
}