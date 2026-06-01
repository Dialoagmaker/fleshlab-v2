import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X, Save, Trash2, RefreshCw } from "lucide-react";
import AICopyHelper from "@/components/admin/AICopyHelper";
import VideoIdentificationPanel from "@/components/admin/VideoIdentificationPanel";
import PerformerMultiSelect from "@/components/admin/PerformerMultiSelect";
import VideoStatsSection from "@/components/admin/video/VideoStatsSection";
import VideoDealsSection from "@/components/admin/video/VideoDealsSection";

const EMPTY_FORM = {
  title: "", slug: "", description: "", short_summary: "", brand_id: "",
  categories: [], tags: [], status: "draft", access_tier: "free",
  release_date: "", duration_seconds: "",
  source_video_url: "", primary_thumbnail_url: "", cover_image_url: "",
  trailer_url: "", preview_gif_url: "",
  meta_title: "", meta_description: "",
  featured: false, is_exclusive: false,
  ppv_enabled: false, download_price: "", production_cost: "",
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
  
  // Extract performer IDs from VideoPerformer junction records
  useEffect(() => {
    if (videoCredits && videoCredits.length > 0) {
      const performerIds = videoCredits.map(c => c.performer_id);
      setSelectedPerformerIds(performerIds);
    } else {
      setSelectedPerformerIds([]);
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

  const { data: video } = useQuery({
    queryKey: ["video", id],
    queryFn: () => base44.entities.Video.get(id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (video) setForm({ ...EMPTY_FORM, ...video });
  }, [video]);

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

  const retrigger = useMutation({
    mutationFn: () => base44.functions.invoke('retriggerVideoProcessing', { video_id: id }),
    onSuccess: (res) => setRetriggerStatus({ ok: true, msg: res.data?.message || 'Job accepted by processor.' }),
    onError: (err) => setRetriggerStatus({ ok: false, msg: err.message || 'Failed to trigger processor.' }),
  });

  // Mutations for VideoPerformer junction records
  const syncPerformers = useMutation({
    mutationFn: async ({ videoId, newPerformerIds, oldPerformerIds }) => {
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
        await base44.entities.VideoPerformer.create({ 
          video_id: videoId, 
          performer_id: performerId,
          order: 0 
        });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required.";
    if (!form.slug.trim()) errs.slug = "Slug is required.";
    if (!form.status) errs.status = "Status is required.";
    URL_FIELDS.forEach(f => {
      if (!isValidUrl(form[f])) errs[f] = "Must be a valid http/https URL.";
    });
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const data = { ...form };
    if (data.duration_seconds) data.duration_seconds = parseInt(data.duration_seconds, 10);
    else delete data.duration_seconds;
    
    // Save video first, then sync performers
    if (isNew) {
      save.mutate(data, {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
          // Sync performers after video is created
          if (selectedPerformerIds.length > 0) {
            syncPerformers.mutate({ 
              videoId: result.id, 
              newPerformerIds: selectedPerformerIds, 
              oldPerformerIds: [] 
            });
          }
          navigate(`/admin/videos/${result.id}`);
        },
      });
    } else {
      save.mutate(data, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
          // Sync performers after video is updated
          if (!isNew) {
            syncPerformers.mutate({ 
              videoId: id, 
              newPerformerIds: selectedPerformerIds, 
              oldPerformerIds: videoCredits.map(c => c.performer_id) 
            });
          }
        },
      });
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
        <section className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
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
              disabled={checkAssets.isPending}
              onClick={() => { setCheckStatus(null); checkAssets.mutate(); }}
              className="gap-2 text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${checkAssets.isPending ? 'animate-spin' : ''}`} />
              {checkAssets.isPending ? 'Suche…' : 'Assets prüfen & anwenden'}
            </Button>
          </div>
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
              Select one or more performers appearing in this video. Use the search to find performers by name or nationality.
            </p>
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
              <Label>Duration (seconds)</Label>
              <Input type="number" value={form.duration_seconds || ""} onChange={e => set("duration_seconds", e.target.value)} />
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

        {/* Categories and Tags */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Categories and Tags</h2>
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.categories.map(c => (
                <span key={c} className="flex items-center gap-1 bg-muted border border-border text-xs rounded-full px-3 py-1">
                  {c}
                  <button type="button" onClick={() => set("categories", form.categories.filter(x => x !== c))} className="text-muted-foreground hover:text-destructive ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={categoryInput} onChange={e => setCategoryInput(e.target.value)} placeholder="Add category…"
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addChip("categories", categoryInput, setCategoryInput); } }} />
              <Button type="button" variant="outline" onClick={() => addChip("categories", categoryInput, setCategoryInput)}>Add</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
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

        <div className="flex items-center gap-3 pb-8">
          <Button type="submit" disabled={save.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {save.isPending ? "Saving…" : isNew ? "Create Video" : "Save Changes"}
          </Button>
          <Link to="/admin/videos">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}