import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import VideoAssetImage from "@/components/video/VideoAssetImage";
import { Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";

const filterLabels = ["All", "Uncategorized", "Missing thumbnail", "Missing description", "Missing performer", "Missing series", "Legacy catalogue", "TheFitmaster", "Published", "Draft"];
const seedCategories = ["the-bareback-hotel", "homemade", "solo", "first-times", "massage-sessions", "outdoor-escapes", "studio-archive", "fan-productions"];

function slugify(value) { return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function contains(video, word) { return [video.title, video.description, video.short_summary, ...(video.tags || []), ...(video.categories || [])].join(" ").toLowerCase().includes(word); }
async function recommend(video, categories, series) {
  const categorySlugs = categories.map((c) => c.slug).join(", ");
  const seriesSlugs = series.map((s) => s.slug).join(", ");
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Recommend a FLESHLAB content organization for this video using only stored text metadata. Do not infer sensitive attributes from images. Available category slugs: ${categorySlugs}. Available series slugs: ${seriesSlugs}. Video metadata: ${JSON.stringify({ title: video.title, description: video.description, tags: video.tags, legacy_categories: video.categories, production_type: video.production_type, location_type: video.location_type, performer_ids: video.performer_ids })}`,
    response_json_schema: {
      type: "object",
      properties: {
        category_slug: { type: "string" },
        series_slug: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        short_description: { type: "string" },
        reason: { type: "string" }
      }
    }
  });
  const category = categories.find((c) => c.slug === result.category_slug);
  const matchingSeries = series.find((s) => s.slug === result.series_slug);
  return { video, category, series: matchingSeries, tags: result.tags || [], reason: result.reason || "AI recommendation based on stored title, description, tags and location/production metadata only." };
}

export default function ContentOrganization() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkSeries, setBulkSeries] = useState("");
  const [recommendation, setRecommendation] = useState(null);

  const { data: categories = [] } = useQuery({ queryKey: ["org-categories"], queryFn: () => base44.entities.Category.list("display_order", 200) });
  const { data: series = [] } = useQuery({ queryKey: ["org-series"], queryFn: () => base44.entities.Series.list("display_order", 200) });
  const { data: videos = [] } = useQuery({ queryKey: ["org-videos"], queryFn: () => base44.entities.Video.list("-created_date", 500) });
  const { data: performers = [] } = useQuery({ queryKey: ["org-performers"], queryFn: () => base44.entities.Performer.list("display_name", 500) });

  const invalidate = () => ["org-categories", "org-series", "org-videos"].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  const createCategory = useMutation({ mutationFn: () => base44.entities.Category.create({ name: categoryName, slug: slugify(categoryName), short_description: "", display_order: categories.length + 1, active: true, featured: seedCategories.includes(slugify(categoryName)), visibility: "public" }), onSuccess: () => { setCategoryName(""); invalidate(); } });
  const createSeries = useMutation({ mutationFn: () => base44.entities.Series.create({ title: seriesTitle, slug: slugify(seriesTitle), display_order: series.length + 1, status: "active", featured: true }), onSuccess: () => { setSeriesTitle(""); invalidate(); } });
  const updateCategory = useMutation({ mutationFn: ({ id, data }) => base44.entities.Category.update(id, data), onSuccess: invalidate });
  const updateSeries = useMutation({ mutationFn: ({ id, data }) => base44.entities.Series.update(id, data), onSuccess: invalidate });
  const updateVideo = useMutation({ mutationFn: ({ id, data }) => base44.entities.Video.update(id, data), onSuccess: invalidate });
  const bulkUpdate = useMutation({ mutationFn: async () => Promise.all(selected.map((id) => base44.entities.Video.update(id, { ...(bulkCategory ? { primary_category: bulkCategory } : {}), ...(bulkSeries ? { series_id: bulkSeries, series_title: series.find((s) => s.id === bulkSeries)?.title } : {}) }))), onSuccess: () => { setSelected([]); invalidate(); toast.success("Bulk assignment saved"); } });

  const filtered = useMemo(() => videos.filter((video) => {
    const perfName = performers.find((p) => (video.performer_ids || []).includes(p.id))?.display_name || "";
    if (filter === "Uncategorized") return !video.primary_category && !(video.secondary_categories || []).length;
    if (filter === "Missing thumbnail") return !video.primary_thumbnail_url && !video.thumbnail && !video.cover_image_url;
    if (filter === "Missing description") return !video.description;
    if (filter === "Missing performer") return !(video.performer_ids || []).length && !video.performer_id;
    if (filter === "Missing series") return !video.series_id;
    if (filter === "Legacy catalogue") return !!video.v1_id || video.release_status === "archived";
    if (filter === "TheFitmaster") return perfName.toLowerCase().includes("fitmaster") || contains(video, "fitmaster");
    if (filter === "Published") return video.status === "published";
    if (filter === "Draft") return video.status !== "published";
    return true;
  }), [videos, filter, performers]);

  const confirmRecommendation = () => {
    if (!recommendation?.category) return;
    updateVideo.mutate({ id: recommendation.video.id, data: { primary_category: recommendation.category.id, series_id: recommendation.series?.id, series_title: recommendation.series?.title, tags: Array.from(new Set([...(recommendation.video.tags || []), ...recommendation.tags])) } });
    setRecommendation(null);
  };

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold">Content Organization</h1><p className="mt-1 text-sm text-muted-foreground">Manage categories, series, collection order and catalogue classification.</p></div><Link to="/videos" className="text-sm text-primary">Preview public library</Link></div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4"><h2 className="mb-3 font-semibold">Create category</h2><div className="flex gap-2"><Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Category name" /><Button disabled={!categoryName} onClick={() => createCategory.mutate()}>Create</Button></div></div>
        <div className="rounded-xl border bg-card p-4"><h2 className="mb-3 font-semibold">Create series</h2><div className="flex gap-2"><Input value={seriesTitle} onChange={(e) => setSeriesTitle(e.target.value)} placeholder="Series title" /><Button disabled={!seriesTitle} onClick={() => createSeries.mutate()}>Create</Button></div></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4"><h2 className="mb-3 font-semibold">Homepage category rows</h2><div className="space-y-2">{categories.map((cat) => <div key={cat.id} className="grid grid-cols-[54px_1fr_auto_auto] items-center gap-2 rounded-lg bg-muted/30 p-2"><Input type="number" value={cat.display_order || 0} onChange={(e) => updateCategory.mutate({ id: cat.id, data: { display_order: Number(e.target.value) } })} /><span>{cat.name}</span><button onClick={() => updateCategory.mutate({ id: cat.id, data: { active: !cat.active } })}><Badge variant={cat.active ? "default" : "secondary"}>{cat.active ? "active" : "hidden"}</Badge></button><Link to={`/watch/collections/${cat.slug}`}><Eye className="h-4 w-4" /></Link></div>)}</div></div>
        <div className="rounded-xl border bg-card p-4"><h2 className="mb-3 font-semibold">Series rows</h2><div className="space-y-2">{series.map((item) => <div key={item.id} className="grid grid-cols-[54px_1fr_auto_auto] items-center gap-2 rounded-lg bg-muted/30 p-2"><Input type="number" value={item.display_order || 0} onChange={(e) => updateSeries.mutate({ id: item.id, data: { display_order: Number(e.target.value) } })} /><span>{item.title}</span><button onClick={() => updateSeries.mutate({ id: item.id, data: { featured: !item.featured } })}><Badge variant={item.featured ? "default" : "secondary"}>{item.featured ? "row" : "off"}</Badge></button><Link to={`/watch/collections/${item.slug}`}><Eye className="h-4 w-4" /></Link></div>)}</div></div>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="flex flex-wrap gap-2">{filterLabels.map((label) => <button key={label} onClick={() => setFilter(label)} className={`rounded-full border px-3 py-1.5 text-xs ${filter === label ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{label}</button>)}</div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/30 p-3"><span className="text-sm text-muted-foreground">{selected.length} selected</span><select className="h-9 rounded-md border bg-background px-3 text-sm" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}><option value="">Bulk category…</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select><select className="h-9 rounded-md border bg-background px-3 text-sm" value={bulkSeries} onChange={(e) => setBulkSeries(e.target.value)}><option value="">Bulk series…</option>{series.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><Button disabled={!selected.length || (!bulkCategory && !bulkSeries)} onClick={() => bulkUpdate.mutate()}>Apply bulk</Button><Button variant="outline" disabled={!selected.length} onClick={() => Promise.all(selected.map((id) => base44.entities.Video.update(id, { primary_category: "", secondary_categories: [], series_id: "", series_title: "", episode_number: null }))).then(() => { setSelected([]); invalidate(); })}>Remove classification</Button></div>
        <div className="overflow-auto rounded-xl border"><table className="w-full min-w-[920px] text-sm"><thead><tr className="border-b bg-muted/30"><th className="p-3"></th><th className="p-3 text-left">Video</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Category</th><th className="p-3 text-left">Series</th><th className="p-3 text-left">Episode</th><th className="p-3 text-left">AI</th></tr></thead><tbody>{filtered.map((video) => <tr key={video.id} className="border-b"><td className="p-3"><input type="checkbox" checked={selected.includes(video.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, video.id] : selected.filter((id) => id !== video.id))} /></td><td className="p-3"><div className="flex items-center gap-3"><div className="h-12 w-20 overflow-hidden rounded bg-muted"><VideoAssetImage video={video} className="h-full w-full object-cover" /></div><div><p className="font-medium">{video.title}</p><p className="text-xs text-muted-foreground">{video.slug}</p></div></div></td><td className="p-3"><Badge variant={video.status === "published" ? "default" : "secondary"}>{video.status || "draft"}</Badge></td><td className="p-3"><select className="h-9 rounded-md border bg-background px-2" value={video.primary_category || ""} onChange={(e) => updateVideo.mutate({ id: video.id, data: { primary_category: e.target.value } })}><option value="">None</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></td><td className="p-3"><select className="h-9 rounded-md border bg-background px-2" value={video.series_id || ""} onChange={(e) => updateVideo.mutate({ id: video.id, data: { series_id: e.target.value, series_title: series.find((s) => s.id === e.target.value)?.title || "" } })}><option value="">None</option>{series.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></td><td className="p-3"><Input type="number" className="w-20" value={video.episode_number || ""} onChange={(e) => updateVideo.mutate({ id: video.id, data: { episode_number: Number(e.target.value) || null } })} /></td><td className="p-3"><Button size="sm" variant="outline" onClick={async () => { try { setRecommendation(await recommend(video, categories, series)); } catch (error) { toast.error(error.message || "AI recommendation failed"); } }}><Sparkles className="mr-1 h-3 w-3" />Recommend</Button></td></tr>)}</tbody></table></div>
      </div>

      {recommendation && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="max-w-lg rounded-2xl border bg-card p-6 shadow-xl"><p className="text-xs font-bold uppercase tracking-widest text-primary">AI-assisted recommendation</p><h2 className="mt-2 text-xl font-bold">{recommendation.category?.name || "No category"}</h2>{recommendation.series && <p className="mt-1 text-sm text-muted-foreground">Series: {recommendation.series.title}</p>}<p className="mt-4 text-sm leading-6 text-muted-foreground">{recommendation.reason}</p><div className="mt-6 flex gap-2"><Button onClick={confirmRecommendation}>Confirm</Button><Button variant="outline" onClick={() => setRecommendation(null)}>Change</Button><Button variant="ghost" onClick={() => setRecommendation(null)}>Ignore</Button></div></div></div>}
    </div>
  );
}