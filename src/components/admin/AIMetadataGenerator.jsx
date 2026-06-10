import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

/**
 * AIMetadataGenerator
 * Calls generateVideoTextFromIdea (no video_id required) and returns populated metadata.
 * 
 * Props:
 *   onApply(fields) — called with { title, description, tags, categories, seo_title, seo_description }
 *   currentTitle    — passed as context hint
 */
export default function AIMetadataGenerator({ onApply, currentTitle = "" }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setWarnings([]);
    setLastResult(null);

    const res = await base44.functions.invoke("generateVideoTextFromIdea", {
      raw_idea: prompt.trim(),
      current_title: currentTitle || undefined,
    });

    setLoading(false);

    const data = res.data;

    if (!data?.success) {
      setError(data?.error || "AI generation failed. Please try again.");
      return;
    }

    setLastResult(data);

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
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />}
      </button>

      {open && (
        <div className="p-4 space-y-3 bg-card">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Prompt / scene notes</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "Filipino twink, bedroom scene, amateur, blowjob, xHamster style"'
              className="min-h-[72px] text-sm"
              disabled={loading}
            />
          </div>

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
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {lastResult && !error && (
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
        </div>
      )}
    </div>
  );
}