import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, AlertCircle, RefreshCw, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

/**
 * AIMetadataGenerator
 * Calls generateVideoTextFromIdea and returns populated metadata.
 *
 * Props:
 *   onApply(fields)         — called with { title, description, tags, categories, seo_title, seo_description }
 *   currentTitle            — passed as context hint
 *   currentDescription      — passed as context hint
 *   currentTags             — passed as context hint
 *   currentCategories       — passed as context hint
 *   brand                   — brand/studio name hint
 *   accessTier              — access tier hint
 *   performerInfo           — performer name/info hint
 */
export default function AIMetadataGenerator({
  onApply,
  currentTitle = "",
  currentDescription = "",
  currentTags = [],
  currentCategories = [],
  brand = "",
  accessTier = "",
  performerInfo = "",
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setWarnings([]);
    setLastResult(null);

    const payload = {
      raw_idea: prompt.trim(),
      current_title: currentTitle || undefined,
      current_description: currentDescription || undefined,
      tags: currentTags?.length ? currentTags : undefined,
      categories: currentCategories?.length ? currentCategories : undefined,
      brand: brand || undefined,
      access_tier: accessTier || undefined,
      performer_info: performerInfo || undefined,
      // Bust any potential LLM-side caching by including a nonce
      _nonce: `${Date.now()}_${generationCount}`,
    };

    const res = await base44.functions.invoke("generateVideoTextFromIdea", payload);

    setLoading(false);

    const data = res.data;

    if (!data?.success) {
      setError(data?.error || "AI generation failed. Please try again.");
      return;
    }

    setLastResult(data);
    setGenerationCount(c => c + 1);

    const allWarnings = [
      ...(data.warnings || []),
      ...(data.taxonomy_warnings || []),
    ];
    setWarnings(allWarnings);

    onApply({
      title: data.title || "",
      description: data.description || "",
      tags: data.tags || [],
      categories: data.suggested_categories || [],
      seo_title: data.seo_title || "",
      seo_description: data.seo_description || "",
    });
  };

  const hasResult = lastResult && !error;

  return (
    <div className="border border-primary/30 rounded-lg overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="w-4 h-4" />
          Generate Metadata with AI
          {generationCount > 0 && (
            <Badge variant="outline" className="text-xs border-primary/30 text-primary ml-1">
              {generationCount}×
            </Badge>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />}
      </button>

      {open && (
        <div className="p-4 space-y-3 bg-card">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Scene notes / prompt
              <span className="text-yellow-400 ml-1">(be specific — the AI uses these verbatim)</span>
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "pinoy muscle twink, wanks on hotel floor, gets handjob from a stranger with open hotel room door"'
              className="min-h-[80px] text-sm"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Include: performer type · setting/location · exact acts · scenario details. The more specific, the better.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Generating…
                </>
              ) : hasResult ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate
                </>
              )}
            </Button>

            {hasResult && (
              <button
                type="button"
                onClick={() => setShowDebug(d => !d)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bug className="w-3 h-3" />
                {showDebug ? "Hide" : "Debug"}
              </button>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {hasResult && (
            <div className="text-xs text-green-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              Metadata applied — review and edit fields below before uploading
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <Badge key={i} variant="outline" className="text-xs text-yellow-400 border-yellow-400/30 block w-fit">
                  ⚠ {w}
                </Badge>
              ))}
            </div>
          )}

          {/* Debug panel */}
          {showDebug && lastResult?.debug && (
            <div className="bg-secondary/50 rounded-md p-3 space-y-1.5 text-xs font-mono">
              <p className="text-muted-foreground font-sans font-medium mb-2">Debug info</p>
              <div className="grid gap-1">
                <DebugRow label="scene_notes_received" value={lastResult.debug.input_scene_notes_received} />
                <DebugRow label="current_title_sent" value={lastResult.debug.current_title_received || "—"} />
                <DebugRow label="brand_sent" value={lastResult.debug.brand_received || "—"} />
                <DebugRow label="performer_info_sent" value={lastResult.debug.performer_info_received || "—"} />
                <DebugRow label="access_tier_sent" value={lastResult.debug.access_tier_received || "—"} />
                <DebugRow label="tags_sent" value={(lastResult.debug.tags_received || []).join(', ') || "—"} />
                <DebugRow label="categories_sent" value={(lastResult.debug.categories_received || []).join(', ') || "—"} />
                <DebugRow label="generated_title" value={lastResult.debug.generated_title} />
                <DebugRow label="generated_tags" value={(lastResult.debug.generated_tags || []).join(', ')} />
                <DebugRow label="model_used" value={lastResult.debug.model_used} />
                <DebugRow label="cached_result" value={String(lastResult.debug.cached_result)} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DebugRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground shrink-0 w-44">{label}:</span>
      <span className="text-foreground break-all">{value}</span>
    </div>
  );
}