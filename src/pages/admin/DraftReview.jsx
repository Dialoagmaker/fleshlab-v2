import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  RefreshCw, Edit2, Trash2, CheckCircle2, Clock, ChevronDown, ChevronUp,
  Sparkles, Database, AlertTriangle, ChevronRight
} from "lucide-react";

// ── Backfill Panel ──────────────────────────────────────────────────────────

function BackfillPanel() {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState('missing_only');
  const [overwrite, setOverwrite] = useState(false);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('backfillVideoMetadata', {
        mode,
        overwrite_existing: overwrite,
      });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
      >
        <Database className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-semibold text-foreground">Backfill Existing Videos</span>
        <span className="text-xs text-muted-foreground ml-1">— generate AI metadata for videos uploaded before this pipeline</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-auto" /> : <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />}
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="space-y-1 min-w-[200px]">
              <p className="text-xs text-muted-foreground">Mode</p>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="missing_only">Missing AI Draft Only</SelectItem>
                  <SelectItem value="all">All Videos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Options</p>
              <label className="flex items-center gap-2 cursor-pointer h-8 px-1">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={e => setOverwrite(e.target.checked)}
                  className="w-3.5 h-3.5 accent-primary"
                />
                <span className="text-xs text-foreground">Overwrite existing drafts</span>
              </label>
            </div>

            <div className="mt-auto">
              <Button
                size="sm"
                disabled={running}
                onClick={run}
                className="gap-2 h-8"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
                {running ? 'Running… (up to 25 videos)' : 'Run Backfill'}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Max 25 videos per run · Only writes <code className="bg-muted px-1 rounded">ai_metadata_draft</code> · Never touches live title/description/tags/covers
          </p>

          {/* Results */}
          {result && !result.error && (
            <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-foreground">{result.processed}</span>
                  <span className="text-xs text-muted-foreground">processed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground">{result.skipped}</span>
                  <span className="text-xs text-muted-foreground">skipped (already had draft)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground">{result.failed}</span>
                  <span className="text-xs text-muted-foreground">failed</span>
                </div>
                {result.skipped_due_to_cap > 0 && (
                  <div className="flex items-center gap-1.5 text-yellow-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-xs">{result.skipped_due_to_cap} more videos not processed (cap reached — run again)</span>
                  </div>
                )}
              </div>

              {result.errors?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-destructive font-medium">Errors:</p>
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-xs bg-destructive/10 border border-destructive/20 rounded px-3 py-1.5 flex gap-3">
                      <span className="text-muted-foreground font-mono shrink-0">{e.video_id?.slice(0, 8)}…</span>
                      <span className="text-foreground/80 truncate">{e.title}</span>
                      <span className="text-destructive ml-auto shrink-0">{e.error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {result?.error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
              Error: {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Draft Card ──────────────────────────────────────────────────────────────

function ppvLabel(price) {
  return price ? `$${price.toFixed(2)} PPV` : null;
}

function DraftCard({ video, onApplyDraft, onRegenerate, onDelete, applyingId, regenId }) {
  const [expanded, setExpanded] = useState(false);

  let draft = null;
  try { draft = video.ai_metadata_draft ? JSON.parse(video.ai_metadata_draft) : null; } catch {}

  const isApplying = applyingId === video.id;
  const isRegen = regenId === video.id;
  const isBackfilled = draft?._source === 'backfill';

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Top row */}
      <div className="flex gap-4 p-4">
        <div className="w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {video.primary_thumbnail_url ? (
            <img src={video.primary_thumbnail_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No thumb</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-mono text-muted-foreground truncate max-w-[160px]">{video.slug}</span>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {video.processing_status || 'draft_ready'}
            </Badge>
            {isBackfilled && (
              <Badge variant="outline" className="text-[10px] shrink-0 text-blue-400 border-blue-500/30">
                Backfilled AI Draft
              </Badge>
            )}
            {draft?.ppv_price && (
              <Badge variant="outline" className="text-[10px] shrink-0 text-yellow-400 border-yellow-500/30">
                {ppvLabel(draft.ppv_price)}
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Current</p>
            <p className="text-sm text-foreground font-medium leading-snug truncate">{video.title}</p>
          </div>
          {draft?.title && draft.title !== video.title && (
            <div className="space-y-0.5 mt-2">
              <p className="text-xs text-primary uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Draft
              </p>
              <p className="text-sm text-foreground/80 leading-snug line-clamp-2">{draft.title}</p>
            </div>
          )}
        </div>
      </div>

      {/* Expanded draft */}
      {expanded && draft && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          {draft.description && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Current Description</p>
                <p className="text-xs text-foreground/70 leading-relaxed line-clamp-4">{video.description || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-primary uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Description
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-4">{draft.description}</p>
              </div>
            </div>
          )}

          {draft.short_teaser && (
            <div>
              <p className="text-xs text-primary uppercase tracking-wide mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Short Teaser
              </p>
              <p className="text-xs text-foreground/80 italic">{draft.short_teaser}</p>
            </div>
          )}

          {(draft.seo_title || draft.seo_description) && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">SEO</p>
              {draft.seo_title && <p className="text-xs font-medium text-foreground">{draft.seo_title}</p>}
              {draft.seo_description && <p className="text-xs text-foreground/70">{draft.seo_description}</p>}
            </div>
          )}

          <div className="flex gap-4 flex-wrap">
            {draft.categories?.length > 0 && (
              <div>
                <p className="text-xs text-primary uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Categories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {draft.categories.map(c => (
                    <span key={c} className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {draft.tags?.length > 0 && (
              <div>
                <p className="text-xs text-primary uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {draft.tags.map(t => (
                    <span key={t} className="text-xs bg-muted border border-border rounded-full px-2 py-0.5">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-border bg-muted/10 px-4 py-3 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mr-auto"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Hide Draft' : 'Show Full Draft'}
        </button>

        <Button size="sm" variant="outline" disabled={isRegen} onClick={() => onRegenerate(video.id)} className="gap-1.5 text-xs h-7">
          <RefreshCw className={`w-3 h-3 ${isRegen ? 'animate-spin' : ''}`} />
          {isRegen ? 'Generating…' : 'Regenerate'}
        </Button>

        <Link to={`/admin/videos/${video.id}`}>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
            <Edit2 className="w-3 h-3" /> Edit
          </Button>
        </Link>

        {draft && (
          <Button size="sm" disabled={isApplying} onClick={() => onApplyDraft(video.id, draft)} className="gap-1.5 text-xs h-7">
            <CheckCircle2 className={`w-3 h-3 ${isApplying ? 'animate-spin' : ''}`} />
            {isApplying ? 'Applying…' : 'Apply AI Draft'}
          </Button>
        )}

        <button
          type="button"
          onClick={() => { if (window.confirm('Delete this video?')) onDelete(video.id); }}
          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function DraftReview() {
  const queryClient = useQueryClient();
  const [applyingId, setApplyingId] = useState(null);
  const [regenId, setRegenId] = useState(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['draft-review-videos'],
    queryFn: () => base44.entities.Video.filter({ processing_status: 'draft_ready' }, '-ai_metadata_generated_at', 50),
    refetchInterval: 15000,
  });

  const { data: pendingVideos = [] } = useQuery({
    queryKey: ['metadata-pending-videos'],
    queryFn: () => base44.entities.Video.filter({ processing_status: 'metadata_pending' }, '-updated_date', 20),
    refetchInterval: 10000,
  });

  const applyDraft = async (videoId, draft) => {
    setApplyingId(videoId);
    try {
      await base44.entities.Video.update(videoId, {
        title: draft.title,
        description: draft.description,
        short_summary: draft.short_teaser,
        categories: draft.categories || [],
        tags: draft.tags || [],
        meta_title: draft.seo_title,
        meta_description: draft.seo_description,
        ...(draft.ppv_price ? { download_price: draft.ppv_price } : {}),
      });
      queryClient.invalidateQueries({ queryKey: ['draft-review-videos'] });
    } finally {
      setApplyingId(null);
    }
  };

  const regenerate = async (videoId) => {
    setRegenId(videoId);
    try {
      await base44.functions.invoke('generateVideoMetadata', { video_id: videoId });
      queryClient.invalidateQueries({ queryKey: ['draft-review-videos'] });
    } finally {
      setRegenId(null);
    }
  };

  const deleteVideo = useMutation({
    mutationFn: (videoId) => base44.entities.Video.delete(videoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['draft-review-videos'] }),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Draft Review</h1>
          <p className="text-sm text-muted-foreground mt-0.5">AI-generated metadata ready for review. Apply, edit, then publish.</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {pendingVideos.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1">
              <Clock className="w-3 h-3 animate-pulse" />
              {pendingVideos.length} generating…
            </div>
          )}
          <div className="text-xs text-muted-foreground bg-muted border border-border rounded-full px-3 py-1">
            {videos.length} ready
          </div>
        </div>
      </div>

      {/* Backfill Panel */}
      <BackfillPanel />

      {isLoading && (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading draft queue…</div>
      )}

      {!isLoading && videos.length === 0 && pendingVideos.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No drafts waiting for review.</p>
          <p className="text-xs text-muted-foreground mt-1">Upload a video or use Backfill to generate AI metadata for existing videos.</p>
        </div>
      )}

      {/* Generating */}
      {pendingVideos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Generating Metadata</p>
          {pendingVideos.map(v => (
            <div key={v.id} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
              <Clock className="w-4 h-4 text-yellow-400 animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{v.title}</p>
                <p className="text-xs text-muted-foreground">AI metadata generation in progress…</p>
              </div>
              <Link to={`/admin/videos/${v.id}`}>
                <Button size="sm" variant="outline" className="text-xs h-7">View</Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Ready */}
      {videos.length > 0 && (
        <div className="space-y-3">
          {videos.map(video => (
            <DraftCard
              key={video.id}
              video={video}
              onApplyDraft={applyDraft}
              onRegenerate={regenerate}
              onDelete={(id) => deleteVideo.mutate(id)}
              applyingId={applyingId}
              regenId={regenId}
            />
          ))}
        </div>
      )}
    </div>
  );
}