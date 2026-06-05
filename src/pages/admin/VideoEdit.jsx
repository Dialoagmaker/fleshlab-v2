import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X, Save, Trash2, RefreshCw, Sparkles } from "lucide-react";
import AICopyHelper from "@/components/admin/AICopyHelper";
import VideoIdentificationPanel from "@/components/admin/VideoIdentificationPanel";
import PerformerMultiSelect from "@/components/admin/PerformerMultiSelect";
import VideoStatsSection from "@/components/admin/video/VideoStatsSection";
import VideoDealsSection from "@/components/admin/video/VideoDealsSection";
import DurationInput from "@/components/admin/DurationInput";
import { normalizeMetadata, BLOCKED_SPAM_TAGS, SENSITIVE_CATEGORIES } from "@/lib/videoMetadataGuardrails";
import { checkPublishReadiness } from "@/lib/publishReadinessGuardrails";
import { validateVideoAssetUrls } from "@/lib/validateVideoAssets";
import { getGroupedCategories, validateVideoCategories, searchCategories } from "@/lib/videoTaxonomy";
import CategorySelector from "@/components/admin/CategorySelector";
import PublishReadinessChecklist from "@/components/admin/PublishReadinessChecklist";
import PublishingDebugPanel from "@/components/admin/PublishingDebugPanel";

const EMPTY_FORM = {
  title: "", slug: "", description: "", short_summary: "", brand_id: "",
  categories: [], tags: [], status: "draft", access_tier: "free",
  release_date: "", duration_seconds: "",
  source_video_url: "", primary_thumbnail_url: "", cover_image_url: "",
  trailer_url: "", preview_gif_url: "",
  meta_title: "", meta_description: "",
  featured: false, is_exclusive: false,
  ppv_enabled: false, download_price: "", production_cost: "",
  xhamster_video_url: "", xhamster_video_title: "",
};

const URL_FIELDS = ["source_video_url", "primary_thumbnail_url", "cover_image_url", "trailer_url", "preview_gif_url"];

function isValidUrl(val) {
  return !val || /^https?:\/\/.+/.test(val.trim());
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}



export default function VideoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [form, setForm] = useState(EMPTY_FORM);
  const [categoryInput, setCategoryInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});
  const [selectedPerformerIds, setSelectedPerformerIds] = useState([]);
  const [leadPerformerIds, setLeadPerformerIds] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [showChecklist, setShowChecklist] = useState(false);

  // Load taxonomy groups
  const taxonomyGroups = getGroupedCategories();

  // Resolve performer names + brand name for AI helper context
  const { data: allPerformers = [] } = useQuery({
    queryKey: ["performers-lookup"],
    queryFn: () => base44.entities.Performer.filter({ status: "active" }, "display_name", 200),
  });
  const { data: allBrands = [] } = useQuery({
    queryKey: ["brands-lookup"],
    queryFn: () => base44.entities.Brand.filter({ status: "active" }, "name", 100),
  });
  const { data: videoCredits = [] } = useQuery({
    queryKey: ["video-performers", id],
    queryFn: () => base44.entities.VideoPerformer.filter({ video_id: id }),
    enabled: !isNew,
  });
  
  // Extract performer IDs and lead performer flags from VideoPerformer junction records
  useEffect(() => {
    if (videoCredits && videoCredits.length > 0) {
      const performerIds = videoCredits.map(c => c.performer_id);
      const leadIds = videoCredits.filter(c => c.lead_performer).map(c => c.performer_id);
      setSelectedPerformerIds(performerIds);
      setLeadPerformerIds(leadIds);
    } else {
      setSelectedPerformerIds([]);
      setLeadPerformerIds([]);
    }
  }, [videoCredits]);
  
  const creditedPerformerNames = videoCredits
    .map(c => allPerformers.find(p => p.id === c.performer_id)?.display_name)
    .filter(Boolean);
  const brandName = allBrands.find(b => b.id === form.brand_id)?.name || "";

  const { data: brands = [] } = useQuery({
    queryKey: ["brands-lookup"],
    queryFn: () => base44.entities.Brand.filter({ status: "active" }, "name", 100),
  });

  const { data: video, refetch: refetchVideo } = useQuery({
    queryKey: ["video", id],
    queryFn: () => base44.entities.Video.get(id),
    enabled: !isNew,
    staleTime: 0,  // Always consider stale, force refetch
    cacheTime: 0,  // Don't cache
  });

  const { data: sourceAssets = [] } = useQuery({
    queryKey: ["video-source-asset", id],
    queryFn: () => base44.entities.VideoAsset.filter({ video_id: id, asset_type: 'source' }),
    enabled: !isNew,
  });

  useEffect(() => {
    if (video) {
      // If video has no duration but the source VideoAsset does, use that
      const sourceDuration = sourceAssets?.[0]?.duration_seconds;
      const duration = video.duration_seconds || sourceDuration || "";
      setForm({ ...EMPTY_FORM, ...video, duration_seconds: duration });
    }
  }, [video, sourceAssets]);

  // Force refetch video data on component mount to ensure fresh URLs
  useEffect(() => {
    if (!isNew && id) {
      queryClient.invalidateQueries({ queryKey: ["video", id] });
    }
  }, [id, isNew, queryClient]);

  const save = useMutation({
    mutationFn: (data) => isNew ? base44.entities.Video.create(data) : base44.entities.Video.update(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      if (isNew) navigate(`/admin/videos/${result.id}`);
    },
  });

  const remove = useMutation({
    mutationFn: () => base44.entities.Video.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      navigate("/admin/videos");
    },
  });

  const [retriggerStatus, setRetriggerStatus] = useState(null);
  const [checkStatus, setCheckStatus] = useState(null);
  const [metaGenStatus, setMetaGenStatus] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);
  const [thumbnailValidation, setThumbnailValidation] = useState(null);

  const checkAssets = useMutation({
    mutationFn: () => base44.functions.invoke('checkAndApplyVideoAssets', { video_id: id }),
    onSuccess: (res) => {
      const d = res.data;
      if (d?.status === 'applied') {
        setCheckStatus({ ok: true, msg: `✓ Assets gefunden: ${d.thumbnail_url ? 'Thumbnail' : ''} ${d.preview_url ? '+ Preview' : ''}`.trim() });
        queryClient.invalidateQueries({ queryKey: ['video', id] });
      } else {
        setCheckStatus({ ok: false, msg: 'Noch keine Assets im CDN gefunden. Processor läuft evtl. noch.' });
      }
    },
    onError: (err) => setCheckStatus({ ok: false, msg: err.message }),
  });

  const validateAndFixAssets = useMutation({
    mutationFn: () => base44.functions.invoke('validateAndFixVideoAssets', { video_id: id }),
    onSuccess: (res) => {
      const d = res.data;
      console.log('🔍 Asset Validation Results:', d);
      
      if (d?.can_publish) {
        setCheckStatus({ ok: true, msg: '✓ All assets valid - ready to publish' });
      } else if (d?.regen_status === 'pending') {
        setCheckStatus({ ok: false, msg: 'Asset regeneration triggered - check back in 2-3 minutes' });
      } else {
        const issues = [];
        if (d?.source_video?.status !== 'accessible') issues.push('Source video');
        if (d?.thumbnail?.status !== 'accessible') issues.push('Thumbnail');
        if (d?.preview?.status !== 'accessible') issues.push('Preview');
        setCheckStatus({ ok: false, msg: `Invalid assets: ${issues.join(', ')}` });
      }
      
      queryClient.invalidateQueries({ queryKey: ['video', id] });
    },
    onError: (err) => {
      console.error('❌ Asset validation failed:', err);
      setCheckStatus({ ok: false, msg: err.message });
    },
  });

  const repairSourceUrl = useMutation({
    mutationFn: () => base44.functions.invoke('repairSourceVideoUrl', { video_id: id }),
    onSuccess: (res) => {
      const d = res.data;
      if (d?.success) {
        setCheckStatus({ ok: true, msg: `✓ Source URL repaired: ${d.http_status} ${d.content_type}` });
        queryClient.invalidateQueries({ queryKey: ['video', id] });
        // Auto-refresh video data
        setTimeout(() => refetchVideo(), 500);
      } else {
        setCheckStatus({ ok: false, msg: d?.message || 'Failed to repair source URL' });
      }
    },
    onError: (err) => {
      console.error('❌ Source URL repair failed:', err);
      setCheckStatus({ ok: false, msg: err.message });
    },
  });

  const runDiagnostic = useMutation({
    mutationFn: async () => {
      const video = await base44.entities.Video.get(id);
      const results = {
        video_id: id,
        raw_urls: {
          thumbnail: video.primary_thumbnail_url,
          preview: video.trailer_url,
          source: video.source_video_url,
        },
        url_tests: {},
      };

      // Test each URL
      for (const [name, url] of Object.entries(results.raw_urls)) {
        if (!url) {
          results.url_tests[name] = { status: 'missing', error: 'URL is null/empty' };
          continue;
        }
        try {
          const response = await fetch(url, { method: 'HEAD' });
          results.url_tests[name] = {
            status: response.ok ? 'accessible' : 'error',
            http_status: response.status,
            error: response.ok ? null : `HTTP ${response.status}`,
          };
        } catch (err) {
          results.url_tests[name] = {
            status: 'error',
            error: err.message || 'Network error',
          };
        }
      }

      return results;
    },
    onSuccess: (data) => {
      setDiagnostic(data);
      console.log('🔍 Diagnostic Results:', data);
    },
    onError: (err) => {
      setDiagnostic({ error: err.message });
      console.error('Diagnostic failed:', err);
    },
  });

  const validateThumbnail = useMutation({
    mutationFn: () => base44.functions.invoke('validateThumbnailImage', { video_id: id }),
    onSuccess: (res) => {
      const d = res.data;
      setThumbnailValidation(d);
      console.log('🔍 Thumbnail Validation Results:', d);
      
      if (d.validation_status === 'failed') {
        setCheckStatus({ 
          ok: false, 
          msg: `Thumbnail corrupt: ${d.error}`,
          details: d 
        });
      } else if (d.validation_status === 'success') {
        setCheckStatus({ 
          ok: true, 
          msg: `Thumbnail valid: ${d.width}x${d.height} ${d.content_type}`,
          details: d 
        });
      }
    },
    onError: (err) => {
      console.error('❌ Thumbnail validation failed:', err);
      setThumbnailValidation({ error: err.message });
      setCheckStatus({ ok: false, msg: err.message });
    },
  });

  const clearCorruptThumbnail = useMutation({
    mutationFn: async () => {
      // Clear the corrupt thumbnail URL
      await base44.entities.Video.update(id, { primary_thumbnail_url: '' });
      return { success: true, message: 'Corrupt thumbnail cleared' };
    },
    onSuccess: () => {
      setCheckStatus({ ok: true, msg: '✓ Corrupt thumbnail URL cleared - regenerate now' });
      queryClient.invalidateQueries({ queryKey: ['video', id] });
      // Auto-trigger regeneration
      setTimeout(() => {
        retrigger.mutate();
      }, 500);
    },
    onError: (err) => {
      setCheckStatus({ ok: false, msg: err.message });
    },
  });

  const regenerateThumbnail = useMutation({
    mutationFn: () => base44.functions.invoke('retriggerVideoProcessing', { 
      video_id: id,
      regenerate_only: 'thumbnail'
    }),
    onSuccess: (res) => {
      setCheckStatus({ ok: true, msg: '✓ Thumbnail regeneration triggered - check back in 30s' });
      queryClient.invalidateQueries({ queryKey: ['video', id] });
    },
    onError: (err) => {
      setCheckStatus({ ok: false, msg: err.message });
    },
  });

  const retrigger = useMutation({
    mutationFn: () => base44.functions.invoke('retriggerVideoProcessing', { video_id: id }),
    onSuccess: (res) => setRetriggerStatus({ ok: true, msg: res.data?.message || 'Job accepted by processor.' }),
    onError: (err) => setRetriggerStatus({ ok: false, msg: err.message || 'Failed to trigger processor.' }),
  });

  // Mutations for VideoPerformer junction records
  const syncPerformers = useMutation({
    mutationFn: async ({ videoId, newPerformerIds, oldPerformerIds, newLeadIds, oldLeadIds }) => {
      const toAdd = newPerformerIds.filter(id => !oldPerformerIds.includes(id));
      const toRemove = oldPerformerIds.filter(id => !newPerformerIds.includes(id));
      
      // Remove deselected performers
      for (const performerId of toRemove) {
        const credit = videoCredits.find(c => c.performer_id === performerId);
        if (credit) {
          await base44.entities.VideoPerformer.delete(credit.id);
        }
      }
      
      // Add new performers
      for (const performerId of toAdd) {
        const isLead = newLeadIds.includes(performerId);
        await base44.entities.VideoPerformer.create({ 
          video_id: videoId, 
          performer_id: performerId,
          order: 0,
          lead_performer: isLead
        });
      }
      
      // Update lead_performer flag for existing performers
      for (const performerId of newPerformerIds) {
        const credit = videoCredits.find(c => c.performer_id === performerId);
        if (credit) {
          const shouldBeLead = newLeadIds.includes(performerId);
          if (credit.lead_performer !== shouldBeLead) {
            await base44.entities.VideoPerformer.update(performerId, {
              lead_performer: shouldBeLead
            });
          }
        }
      }
      
      return { added: toAdd.length, removed: toRemove.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-performers", id] });
    },
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleTitleChange = (title) => {
    setForm(f => ({ ...f, title, slug: isNew ? slugify(title) : f.slug }));
  };

  const addChip = (list, input, setInput) => {
    const val = input.trim();
    if (!val || form[list].includes(val)) return;
    set(list, [...form[list], val]);
    setInput("");
  };

  // Calculate publish readiness for UI (outside handleSubmit so it's available for render)
  const publishCheck = checkPublishReadiness(form, { videoPerformers: selectedPerformerIds });
  
  // Validate categories separately for cleanup helper
  const categoryValidation = validateVideoCategories(form.categories || []);

  // Build asset validation state from diagnostic results
  const assetValidation = {
    source: diagnostic?.url_tests?.source || { status: 'missing', httpStatus: null },
    thumbnail: diagnostic?.url_tests?.thumbnail || { status: 'missing', httpStatus: null },
    preview: diagnostic?.url_tests?.preview || { status: 'missing', httpStatus: null },
  };

  // Separate save handlers for Draft vs Publish
  const handleSaveDraft = () => {
    // Draft save - minimal validation
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required for draft.";
    if (!form.slug.trim()) errs.slug = "Slug is required.";
    
    // Validate metadata (categories/tags)
    const validation = normalizeMetadata({
      categories: form.categories,
      tags: form.tags,
      title: form.title,
      description: form.description,
      short_summary: form.short_summary,
      strict: false, // Don't block on warnings for draft
    });
    
    if (!validation.valid && validation.errors.length > 0) {
      errs.metadata = validation.errors.join(' ');
      errs.categories = validation.removed.categories;
      errs.tags = validation.removed.tags;
    }
    
    if (Object.keys(errs).length > 0) { 
      setErrors(errs); 
      console.error('❌ Save Draft blocked:', errs);
      return; 
    }
    
    setErrors({});
    const data = { 
      ...form, 
      status: 'draft', // Force draft status
      categories: validation.normalized.categories,
      tags: validation.normalized.tags,
    };
    if (data.duration_seconds) data.duration_seconds = parseInt(data.duration_seconds, 10);
    else delete data.duration_seconds;
    
    console.log('💾 Saving Draft...', data);
    save.mutate(data, {
      onSuccess: () => {
        console.log('✅ Draft saved successfully');
        queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
        queryClient.invalidateQueries({ queryKey: ["video", id] });
        // Sync performers
        if (!isNew) {
          syncPerformers.mutate({ 
            videoId: id, 
            newPerformerIds: selectedPerformerIds, 
            oldPerformerIds: videoCredits.map(c => c.performer_id),
            newLeadIds: leadPerformerIds,
            oldLeadIds: videoCredits.filter(c => c.lead_performer).map(c => c.performer_id)
          });
        }
      },
      onError: (err) => {
        console.error('❌ Draft save failed:', err);
        setErrors({ submit: err.message });
      }
    });
  };

  const handlePublish = () => {
    // Publish - strict validation
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required.";
    if (!form.slug.trim()) errs.slug = "Slug is required.";
    if (!form.status) errs.status = "Status is required.";
    URL_FIELDS.forEach(f => {
      if (!isValidUrl(form[f])) errs[f] = `Must be a valid http/https URL (${f}).`;
    });
    
    // Validate metadata
    const validation = normalizeMetadata({
      categories: form.categories,
      tags: form.tags,
      title: form.title,
      description: form.description,
      short_summary: form.short_summary,
      strict: true,
    });
    
    if (!validation.valid) {
      errs.metadata = validation.errors.join(' ');
      errs.categories = validation.removed.categories;
      errs.tags = validation.removed.tags;
    }
    
    // CRITICAL: Check publish readiness
    if (!publishCheck.canPublish) {
      errs.publish = 'Cannot publish - missing required items.';
      errs.publishDetails = publishCheck;
      console.error('❌ Publish blocked by publishCheck:', publishCheck.errors);
    }
    
    if (Object.keys(errs).length > 0) { 
      setErrors(errs); 
      console.error('❌ Publish blocked:', errs);
      return; 
    }
    
    setErrors({});
    const data = { 
      ...form, 
      status: 'published', // Force published status
      categories: validation.normalized.categories,
      tags: validation.normalized.tags,
    };
    if (data.duration_seconds) data.duration_seconds = parseInt(data.duration_seconds, 10);
    else delete data.duration_seconds;
    
    console.log('🚀 Publishing...', data);
    save.mutate(data, {
      onSuccess: () => {
        console.log('✅ Published successfully');
        queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
        queryClient.invalidateQueries({ queryKey: ["video", id] });
        // Sync performers
        if (!isNew) {
          syncPerformers.mutate({ 
            videoId: id, 
            newPerformerIds: selectedPerformerIds, 
            oldPerformerIds: videoCredits.map(c => c.performer_id),
            newLeadIds: leadPerformerIds,
            oldLeadIds: videoCredits.filter(c => c.lead_performer).map(c => c.performer_id)
          });
        }
        // Force reload to show published status
        setTimeout(() => {
          refetchVideo();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 500);
      },
      onError: (err) => {
        console.error('❌ Publish failed:', err);
        setErrors({ submit: err.message });
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Route to appropriate handler based on status
    if (form.status === 'published') {
      handlePublish();
    } else {
      handleSaveDraft();
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-3">
        <Link to="/admin/videos" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{isNew ? "New Video" : "Edit Video"}</h1>
          {!isNew && <p className="text-xs text-muted-foreground mt-0.5">ID: {id}</p>}
        </div>
        {!isNew && (
          <button
            onClick={() => { if (window.confirm("Delete this video?")) remove.mutate(); }}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Video Identification Panel - Top of page */}
      {!isNew && video && (
        <VideoIdentificationPanel
          video={video}
          brands={brands}
          onClearThumbnail={() => {
            if (window.confirm('Thumbnail-URL entfernen?')) {
              base44.entities.Video.update(id, { primary_thumbnail_url: '' }).then(() =>
                queryClient.invalidateQueries({ queryKey: ['video', id] })
              );
            }
          }}
          onClearPreview={() => {
            if (window.confirm('Preview/Trailer-URL entfernen?')) {
              base44.entities.Video.update(id, { trailer_url: '' }).then(() =>
                queryClient.invalidateQueries({ queryKey: ['video', id] })
              );
            }
          }}
        />
      )}

      {/* Retrigger Assets */}
      {!isNew && (
        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Thumbnail &amp; Preview</p>
              <p className="text-xs text-muted-foreground mt-0.5">Lässt den Processor Thumbnail und Preview-Video neu erstellen.</p>
              {retriggerStatus && (
                <p className={`text-xs mt-1 ${retriggerStatus.ok ? 'text-green-400' : 'text-destructive'}`}>{retriggerStatus.msg}</p>
              )}
              {checkStatus && (
                <p className={`text-xs mt-1 ${checkStatus.ok ? 'text-green-400' : 'text-yellow-400'}`}>{checkStatus.msg}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                disabled={retrigger.isPending}
                onClick={() => { setRetriggerStatus(null); setCheckStatus(null); retrigger.mutate(); }}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${retrigger.isPending ? 'animate-spin' : ''}`} />
                {retrigger.isPending ? 'Wird gesendet…' : 'Assets neu erstellen'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setCheckStatus(null); validateAndFixAssets.mutate(); }}
                disabled={validateAndFixAssets.isPending}
                className="gap-2 text-xs"
              >
                <RefreshCw className={`w-3 h-3 ${validateAndFixAssets.isPending ? 'animate-spin' : ''}`} />
                {validateAndFixAssets.isPending ? 'Checking...' : 'Validate & Fix Assets'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setCheckStatus(null); refetchVideo(); }}
                className="gap-2 text-xs"
              >
                <RefreshCw className="w-3 h-3" />
                Seite aktualisieren
              </Button>
            </div>
          </div>

          {/* Diagnostic Panel */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-foreground">🔍 Asset Diagnostic</p>
              <div className="flex gap-2 flex-wrap">
                {thumbnailValidation?.validation_status === 'failed' && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Corrupt thumbnail URL will be deleted. Regenerate now?')) {
                        clearCorruptThumbnail.mutate();
                      }
                    }}
                    disabled={clearCorruptThumbnail.isPending}
                    className="text-xs h-7 bg-destructive hover:bg-destructive/90"
                  >
                    🗑️ Clear Corrupt Thumbnail
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => regenerateThumbnail.mutate()}
                  disabled={regenerateThumbnail.isPending}
                  className="text-xs h-7"
                >
                  {regenerateThumbnail.isPending ? 'Regenerating...' : '🔄 Regenerate Thumbnail'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => validateThumbnail.mutate()}
                  disabled={validateThumbnail.isPending}
                  className="text-xs h-7"
                >
                  {validateThumbnail.isPending ? 'Validating...' : '🖼️ Validate Thumbnail'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => repairSourceUrl.mutate()}
                  disabled={repairSourceUrl.isPending}
                  className="text-xs h-7"
                >
                  {repairSourceUrl.isPending ? 'Repairing...' : 'Repair Source URL'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => runDiagnostic.mutate()}
                  disabled={runDiagnostic.isPending}
                  className="text-xs h-7"
                >
                  {runDiagnostic.isPending ? 'Checking...' : 'Run Test'}
                </Button>
              </div>
            </div>
            {thumbnailValidation && (
              <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-2 font-mono">
                <div className={thumbnailValidation.validation_status === 'success' ? 'text-green-600' : 'text-destructive'}>
                  <strong>Thumbnail Validation:</strong> {thumbnailValidation.validation_status}
                </div>
                {thumbnailValidation.magic_header && (
                  <div className={thumbnailValidation.magic_header === 'FF D8' ? 'text-green-600' : 'text-destructive'}>
                    Magic Header: {thumbnailValidation.magic_header} {thumbnailValidation.magic_header === 'FF D8' ? '✅ Valid JPEG' : '❌ NOT JPEG - ' + (thumbnailValidation.actual_format || 'Unknown')}
                  </div>
                )}
                {thumbnailValidation.content_type && (
                  <div>Content-Type: {thumbnailValidation.content_type}</div>
                )}
                {thumbnailValidation.http_status && (
                  <div>HTTP Status: {thumbnailValidation.http_status}</div>
                )}
                {thumbnailValidation.content_length && (
                  <div>File Size: {thumbnailValidation.content_length} bytes</div>
                )}
                {thumbnailValidation.width && thumbnailValidation.height && (
                  <div>Dimensions: {thumbnailValidation.width}x{thumbnailValidation.height}</div>
                )}
                {thumbnailValidation.recommendation && (
                  <div className={thumbnailValidation.validation_status === 'failed' ? 'text-destructive font-semibold' : 'text-yellow-600'}>
                    <strong>Recommendation:</strong> {thumbnailValidation.recommendation}
                  </div>
                )}
                {thumbnailValidation.sample_content && (
                  <div className="text-[9px] break-all bg-black/10 p-1 rounded">
                    Sample: {thumbnailValidation.sample_content.substring(0, 100)}...
                  </div>
                )}
                {thumbnailValidation.validation_status === 'failed' && (
                  <div className="bg-destructive/20 border border-destructive/30 rounded p-2 mt-2">
                    <p className="font-semibold text-destructive mb-1">⚠️ CORRUPT FILE DETECTED</p>
                    <p className="text-[10px]">This URL contains an HTML error page, not a real image.</p>
                    <p className="text-[10px] mt-1">Action required:</p>
                    <ol className="list-decimal list-inside text-[10px] space-y-0.5">
                      <li>Click "Clear Corrupt Thumbnail" to delete this URL</li>
                      <li>Click "Regenerate Thumbnail" to create a new one from source video</li>
                      <li>Wait 30 seconds, then validate again</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
            {diagnostic && (
              <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-2 font-mono">
                {diagnostic.error && (
                  <div className="text-destructive">❌ Error: {diagnostic.error}</div>
                )}
                {diagnostic.url_tests && (
                  <>
                    <div className={diagnostic.url_tests.thumbnail?.status === 'accessible' ? 'text-green-600' : 'text-destructive'}>
                      Thumbnail: {diagnostic.url_tests.thumbnail?.status || 'missing'} 
                      {diagnostic.url_tests.thumbnail?.http_status && ` (${diagnostic.url_tests.thumbnail.http_status})`}
                      {diagnostic.url_tests.thumbnail?.error && ` - ${diagnostic.url_tests.thumbnail.error}`}
                    </div>
                    <div className={diagnostic.url_tests.preview?.status === 'accessible' ? 'text-green-600' : 'text-destructive'}>
                      Preview: {diagnostic.url_tests.preview?.status || 'missing'}
                      {diagnostic.url_tests.preview?.http_status && ` (${diagnostic.url_tests.preview.http_status})`}
                      {diagnostic.url_tests.preview?.error && ` - ${diagnostic.url_tests.preview.error}`}
                    </div>
                    <div className={diagnostic.url_tests.source?.status === 'accessible' ? 'text-green-600' : 'text-destructive'}>
                      Source: {diagnostic.url_tests.source?.status || 'missing'}
                      {diagnostic.url_tests.source?.http_status && ` (${diagnostic.url_tests.source.http_status})`}
                      {diagnostic.url_tests.source?.error && ` - ${diagnostic.url_tests.source.error}`}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Auto-Generate Metadata */}
      {!isNew && (
        <section className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">AI Metadaten generieren</p>
            <p className="text-xs text-muted-foreground mt-0.5">Generiert Title, Description, SEO, Tags & Kategorien automatisch und speichert sie direkt auf dem Video.</p>
            {metaGenStatus && (
              <p className={`text-xs mt-1 ${metaGenStatus.ok ? 'text-green-400' : 'text-destructive'}`}>{metaGenStatus.msg}</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!id || id === 'new'}
            onClick={async () => {
              setMetaGenStatus({ ok: true, msg: 'Generiere Metadaten…' });
              try {
                await base44.functions.invoke('generateVideoMetadata', { video_id: id });
                queryClient.invalidateQueries({ queryKey: ['video', id] });
                setMetaGenStatus({ ok: true, msg: '✓ Metadaten generiert und gespeichert. Seite neu laden zum Anzeigen.' });
              } catch (e) {
                setMetaGenStatus({ ok: false, msg: e.message || 'Fehler beim Generieren.' });
              }
            }}
            className="gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            Jetzt generieren
          </Button>
        </section>
      )}

      <AICopyHelper
        form={form}
        performerNames={creditedPerformerNames}
        brandName={brandName}
        thumbnailUrl={form.primary_thumbnail_url || null}
        onApply={(field, value) => {
          set(field, value);
          if (errors[field]) setErrors(ex => ({ ...ex, [field]: undefined }));
        }}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Performer Assignment - Before Core section */}
        {!isNew && (
          <section className="bg-card border border-border rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-foreground">Performer Assignment</h2>
            <p className="text-xs text-muted-foreground">
              Select one or more performers appearing in this video. Mark one as the lead performer if applicable.
            </p>
            <div className="space-y-3">
              {selectedPerformerIds.map(performerId => {
                const performer = allPerformers.find(p => p.id === performerId);
                if (!performer) return null;
                const isLead = leadPerformerIds.includes(performerId);
                return (
                  <div key={performerId} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                        {performer.profile_image_url ? (
                          <img src={performer.profile_image_url} alt={performer.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            {performer.display_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{performer.display_name}</p>
                        <p className="text-xs text-muted-foreground">{performer.nationality || "Performer"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isLead}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setLeadPerformerIds([performerId]); // Only one lead at a time
                            } else {
                              setLeadPerformerIds([]);
                            }
                          }}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm text-foreground">Lead Performer</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectedPerformerIds(selectedPerformerIds.filter(id => id !== performerId))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {selectedPerformerIds.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No performers assigned yet.</p>
              )}
            </div>
            <PerformerMultiSelect
              selectedPerformerIds={selectedPerformerIds}
              onPerformersChange={setSelectedPerformerIds}
              allPerformers={allPerformers}
            />
          </section>
        )}
        {isNew && (
          <p className="text-xs text-muted-foreground px-1">Performer credits can be added after saving the video.</p>
        )}

        {/* Core */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Core</h2>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => handleTitleChange(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Slug *</Label>
            <Input value={form.slug} onChange={e => set("slug", e.target.value)} className={`font-mono text-sm ${errors.slug ? "border-destructive" : ""}`} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
            {!form.slug && form.title && <p className="text-xs text-muted-foreground">Slug will be auto-generated. You can override it.</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ""} onChange={e => set("description", e.target.value)} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Short Teaser / Summary</Label>
            <Input value={form.short_summary || ""} onChange={e => set("short_summary", e.target.value)} placeholder="One-line hook shown in listings…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Access Tier</Label>
              <Select value={form.access_tier} onValueChange={v => set("access_tier", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="fanclub">Fanclub</SelectItem>
                  <SelectItem value="ppv">PPV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Release Date</Label>
              <Input type="date" value={form.release_date || ""} onChange={e => set("release_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Duration (MM:SS)</Label>
              <DurationInput
                value={form.duration_seconds}
                onChange={(secs) => set("duration_seconds", secs)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Brand</Label>
            <Select value={form.brand_id || ""} onValueChange={v => set("brand_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select brand…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-foreground">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_exclusive} onChange={e => set("is_exclusive", e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-foreground">Exclusive</span>
            </label>
          </div>
        </section>

        {/* Media URLs */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Media Asset URLs</h2>
          <p className="text-xs text-muted-foreground">Paste CDN/R2 URLs directly. No processing.</p>
          {[
            { field: "source_video_url", label: "Source Video URL (R2/CDN)" },
            { field: "primary_thumbnail_url", label: "Thumbnail URL" },
            { field: "cover_image_url", label: "Cover Image URL" },
            { field: "trailer_url", label: "Trailer URL" },
            { field: "preview_gif_url", label: "Preview GIF URL" },
          ].map(({ field, label }) => (
            <div key={field} className="space-y-2">
              <Label>{label}</Label>
              <Input
                value={form[field] || ""}
                onChange={e => { set(field, e.target.value); if (errors[field]) setErrors(ex => ({ ...ex, [field]: undefined })); }}
                placeholder="https://…"
                className={`font-mono text-xs ${errors[field] ? "border-destructive" : ""}`}
              />
              {errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}
            </div>
          ))}
        </section>

        {/* External Platform URLs */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">External Platform URLs</h2>
          <p className="text-xs text-muted-foreground">xHamster platform links (stammdaten).</p>
          <div className="space-y-2">
            <Label>xHamster Video URL</Label>
            <Input
              value={form.xhamster_video_url || ""}
              onChange={e => set("xhamster_video_url", e.target.value)}
              placeholder="https://xhamster.com/videos/..."
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label>xHamster Video Title</Label>
            <Input
              value={form.xhamster_video_title || ""}
              onChange={e => set("xhamster_video_title", e.target.value)}
              placeholder="Title on xHamster..."
            />
          </div>
        </section>

        {/* Categories and Tags */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Categories and Tags</h2>
          
          {/* Categories - Approved Taxonomy Only */}
          <div className="space-y-3">
            <Label>Categories (Approved Taxonomy Only)</Label>
            <p className="text-xs text-muted-foreground">
              Select from {taxonomyGroups.reduce((sum, g) => sum + g.categories.length, 0)} approved categories. Free text entry disabled.
            </p>
            
            {/* Selected category pills */}
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {form.categories.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">No categories selected</span>
              ) : (
                form.categories.map(catId => {
                  const allCats = taxonomyGroups.flatMap(g => g.categories);
                  const cat = allCats.find(c => c.id === catId);
                  return (
                    <span key={catId} className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary text-xs rounded-full px-3 py-1">
                      {cat?.label || catId}
                      <button
                        type="button"
                        onClick={() => set("categories", form.categories.filter(x => x !== catId))}
                        className="text-primary/70 hover:text-destructive ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>
            
            {/* Category selector with search */}
            <CategorySelector
              taxonomyGroups={taxonomyGroups}
              selectedCategories={form.categories}
              onCategoryChange={(catId) => {
                if (!form.categories.includes(catId)) {
                  set("categories", [...form.categories, catId]);
                } else {
                  set("categories", form.categories.filter(x => x !== catId));
                }
              }}
              searchQuery={categorySearch}
              onSearchChange={setCategorySearch}
            />
            
            {/* Warning if too many categories */}
            {form.categories.length > 8 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 text-xs text-yellow-600">
                ⚠️ Use tags for details. Categories should stay broad (max 8 recommended).
              </div>
            )}
            
            {errors.categories && errors.categories.length > 0 && (
              <div className="text-xs text-destructive mt-1">
                <p>Removed categories:</p>
                <ul className="list-disc list-inside">
                  {errors.categories.map((c, i) => (
                    <li key={i}>"{c.value}" - {c.reason.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <p className="text-xs text-muted-foreground">Spam patterns and sensitive terms without evidence will be blocked.</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1 bg-muted border border-border text-xs rounded-full px-3 py-1">
                  {t}
                  <button type="button" onClick={() => set("tags", form.tags.filter(x => x !== t))} className="text-muted-foreground hover:text-destructive ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag…"
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addChip("tags", tagInput, setTagInput); } }} />
              <Button type="button" variant="outline" onClick={() => addChip("tags", tagInput, setTagInput)}>Add</Button>
            </div>
            {errors.tags && errors.tags.length > 0 && (
              <div className="text-xs text-destructive mt-1">
                <p>Removed tags:</p>
                <ul className="list-disc list-inside">
                  {errors.tags.map((t, i) => (
                    <li key={i}>"{t.value}" - {t.reason.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Commercial metadata — admin-only, no checkout/payment logic */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Commercial Metadata</h2>
            <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full px-2 py-0.5">Admin only · Dormant</span>
          </div>
          <p className="text-xs text-muted-foreground">Stored for future activation. No checkout, payment, or download delivery is connected.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Download Price (USD)</Label>
              <Input type="number" step="0.01" value={form.download_price || ""} onChange={e => set("download_price", e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Production Cost USD (internal)</Label>
              <Input type="number" step="0.01" value={form.production_cost || ""} onChange={e => set("production_cost", e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ppv_enabled || false} onChange={e => set("ppv_enabled", e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm text-foreground">PPV Enabled (metadata flag only)</span>
          </label>
        </section>

        {/* Platform Stats Section */}
        {!isNew && <VideoStatsSection videoId={id} />}

        {/* Commercial Deals Section */}
        {!isNew && <VideoDealsSection videoId={id} />}

        {/* SEO */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">SEO</h2>
          <div className="space-y-2">
            <Label>Meta Title</Label>
            <Input value={form.meta_title || ""} onChange={e => set("meta_title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Meta Description</Label>
            <Textarea value={form.meta_description || ""} onChange={e => set("meta_description", e.target.value)} rows={3} />
          </div>
        </section>

        {/* Publishing Checklist - Before Save/Publish Buttons */}
        {!isNew && (
          <PublishReadinessChecklist
            video={video}
            form={form}
            selectedPerformerIds={selectedPerformerIds}
            assetValidation={assetValidation}
            onCleanInvalidCategories={() => {
              const validation = validateVideoCategories(form.categories || []);
              if (!validation.valid) {
                set("categories", validation.normalized || []);
                setErrors(ex => ({ ...ex, categories: undefined, metadata: undefined }));
              }
            }}
          />
        )}

        {/* Publishing Debug Panel - Shows exact blocking reasons */}
        {!isNew && (
          <PublishingDebugPanel
            video={video}
            form={form}
            selectedPerformerIds={selectedPerformerIds}
            publishCheck={publishCheck}
            categoryValidation={categoryValidation}
          />
        )}

        {/* Save/Publish Actions */}
        <div className="flex items-center gap-3 pb-8">
          {/* Save Draft - always available, bypasses publish checks */}
          <Button 
            type="button" 
            variant="outline"
            onClick={handleSaveDraft}
            disabled={save.isPending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </Button>

          {/* Publish - requires all checks to pass */}
          <Button 
            type="button" 
            onClick={handlePublish}
            disabled={save.isPending || !publishCheck.canPublish}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Save className="w-4 h-4" />
            {save.isPending ? "Saving…" : publishCheck.canPublish ? "Publish Video" : `Cannot Publish (${publishCheck.errors.length} issues)`}
          </Button>

          <Link to="/admin/videos">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>

          {/* Publish blocked warning - always show if status is published */}
          {form.status === 'published' && !publishCheck.canPublish && (
            <div className="ml-auto text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 max-w-lg">
              <p className="font-semibold mb-1">❌ Publish Blocked - {publishCheck.errors.length} Critical Issue(s):</p>
              <ul className="list-disc list-inside space-y-0.5 max-h-48 overflow-y-auto">
                {publishCheck.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              {publishCheck.warnings && publishCheck.warnings.length > 0 && (
                <>
                  <p className="font-semibold mt-2 mb-1">⚠️ Warnings ({publishCheck.warnings.length}):</p>
                  <ul className="list-disc list-inside space-y-0.5 text-yellow-600">
                    {publishCheck.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}