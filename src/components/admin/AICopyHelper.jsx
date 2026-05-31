import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, ChevronDown, ChevronUp, CheckCircle2, Loader2 } from "lucide-react";

/**
 * AICopyHelper — Admin-only draft assistant for Video edit.
 * Reads context from the form, generates title/description/SEO/tags.
 * Admin must review and explicitly apply each field. Nothing is auto-saved.
 */
export default function AICopyHelper({ form, performerNames, brandName, onApply }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setError("");
    setDraft(null);
    setLoading(true);
    try {
      const contextBlock = [
        notes && `Scene notes: ${notes}`,
        performerNames.length && `Performers: ${performerNames.join(", ")}`,
        brandName && `Studio/Brand: ${brandName}`,
        form.categories?.length && `Categories: ${form.categories.join(", ")}`,
        form.tags?.length && `Tags: ${form.tags.join(", ")}`,
      ].filter(Boolean).join("\n");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a copywriter for an adult content studio. Based on the production context below, generate professional marketing copy for a video listing.\n\nContext:\n${contextBlock}\n\nRespond with a JSON object only. No markdown.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Compelling video title, 5-10 words" },
            description: { type: "string", description: "2-3 sentence marketing description" },
            short_summary: { type: "string", description: "1 sentence teaser under 100 chars" },
            meta_title: { type: "string", description: "SEO meta title, under 60 chars" },
            meta_description: { type: "string", description: "SEO meta description, under 160 chars" },
            tags: { type: "array", items: { type: "string" }, description: "5-8 relevant tags" }
          }
        }
      });
      setDraft(result);
    } catch (e) {
      setError("Generation failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyField = (field, value) => {
    onApply(field, value);
  };

  const applyAll = () => {
    if (!draft) return;
    ["title", "description", "short_summary", "meta_title", "meta_description"].forEach(f => {
      if (draft[f]) onApply(f, draft[f]);
    });
    if (draft.tags?.length) onApply("tags", draft.tags);
  };

  return (
    <section className="bg-card border border-primary/20 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1">
          <span className="text-sm font-semibold text-foreground">AI Copy Draft Helper</span>
          <span className="text-xs text-muted-foreground ml-3">Generate title, description, and SEO fields for review</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5 border-t border-border">
          <div className="mt-5 space-y-2">
            <Label>Scene notes / rough context</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. 'Outdoor shoot, poolside setting, solo performance, slow build…'"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Auto-includes: performers ({performerNames.join(", ") || "none"}), brand ({brandName || "none"}), categories, tags.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Generating…" : "Generate Draft"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {draft && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Review draft — apply fields individually or all at once</p>
                <Button type="button" variant="outline" size="sm" onClick={applyAll} className="gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Apply All
                </Button>
              </div>
              {[
                { key: "title", label: "Title" },
                { key: "short_summary", label: "Short Teaser" },
                { key: "description", label: "Description" },
                { key: "meta_title", label: "Meta Title" },
                { key: "meta_description", label: "Meta Description" },
              ].map(({ key, label }) => draft[key] && (
                <div key={key} className="bg-muted/40 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                      <p className="text-sm text-foreground mt-1">{draft[key]}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => applyField(key, draft[key])}
                      className="text-xs text-primary hover:underline whitespace-nowrap flex-shrink-0 mt-1"
                    >
                      Apply →
                    </button>
                  </div>
                </div>
              ))}
              {draft.tags?.length > 0 && (
                <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {draft.tags.map(t => (
                          <span key={t} className="text-xs bg-muted border border-border rounded-full px-2 py-0.5">{t}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => applyField("tags", draft.tags)}
                      className="text-xs text-primary hover:underline whitespace-nowrap flex-shrink-0 mt-1"
                    >
                      Apply →
                    </button>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground italic">⚠ Review before saving. AI drafts are suggestions only. This does not publish or modify any live content.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}