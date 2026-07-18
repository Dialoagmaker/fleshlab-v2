import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Eye, ImagePlus, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";

const emptyArticle = { title: "", slug: "", excerpt: "", content: "", cover_image_url: "", category: "behindTheScenes", status: "draft", tagsText: "", meta_title: "", meta_description: "" };
const categories = [
  ["studioUpdates", "Platform Updates"],
  ["behindTheScenes", "Studio News"],
  ["creatorStories", "Creator Announcements"],
  ["production", "New Releases"],
  ["fanclub", "Community Updates"],
  ["pressRelease", "Press Releases"],
  ["partnerships", "Partnerships"],
  ["events", "Events"],
];

function slugify(value) {
  return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toForm(article) {
  return { ...emptyArticle, ...article, tagsText: (article.tags || []).join(", ") };
}

function toPayload(form) {
  const tags = form.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean);
  return {
    title: form.title,
    slug: form.slug || slugify(form.title),
    excerpt: form.excerpt,
    content: form.content,
    cover_image_url: form.cover_image_url,
    category: form.category,
    status: form.status,
    tags,
    meta_title: form.meta_title,
    meta_description: form.meta_description,
    ...(form.status === "published" && !form.published_at ? { published_at: new Date().toISOString() } : {}),
  };
}

export default function AdminNews() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyArticle);
  const [search, setSearch] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: articles = [], isLoading } = useQuery({ queryKey: ["admin-news"], queryFn: () => base44.entities.NewsArticle.list("-created_date", 200) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-news"] });
  const saveArticle = useMutation({ mutationFn: (payload) => editing?.id ? base44.entities.NewsArticle.update(editing.id, payload) : base44.entities.NewsArticle.create(payload), onSuccess: () => { setEditing(null); setForm(emptyArticle); invalidate(); } });
  const deleteArticle = useMutation({ mutationFn: (id) => base44.entities.NewsArticle.delete(id), onSuccess: invalidate });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return articles;
    return articles.filter((item) => [item.title, item.slug, item.excerpt, ...(item.tags || [])].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [articles, search]);

  const startEdit = (article) => { setEditing(article); setForm(toForm(article)); };
  const update = (key, value) => setForm((current) => ({ ...current, [key]: key === "title" && !editing ? value : value, ...(key === "title" && !editing ? { slug: slugify(value) } : {}) }));
  const uploadCoverImage = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update("cover_image_url", file_url);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-2xl font-bold">News</h1><p className="mt-1 text-sm text-muted-foreground">Create and publish public News Center articles.</p></div>
        <Link to="/news" className="text-sm text-primary">Preview News Center</Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{editing ? "Edit news" : "Create news"}</h2>{editing && <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setForm(emptyArticle); }}><X className="mr-1 h-4 w-4" />Cancel</Button>}</div>
          <div className="space-y-3">
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Title" />
            <Input value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} placeholder="slug" />
            <div className="grid gap-3 sm:grid-cols-2"><select value={form.category} onChange={(e) => update("category", e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={form.status} onChange={(e) => update("status", e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
            <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
              <div className="flex gap-2"><Input value={form.cover_image_url} onChange={(e) => update("cover_image_url", e.target.value)} placeholder="Cover image URL" /><label className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-muted"><input type="file" accept="image/*" className="hidden" onChange={(e) => uploadCoverImage(e.target.files?.[0])} />{uploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}Upload</label></div>
              {form.cover_image_url && <img src={form.cover_image_url} alt="News cover preview" className="aspect-video w-full rounded-md object-cover" />}
            </div>
            <Textarea value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} placeholder="Short excerpt" className="min-h-20" />
            <Textarea value={form.content} onChange={(e) => update("content", e.target.value)} placeholder="Article content" className="min-h-52" />
            <Input value={form.tagsText} onChange={(e) => update("tagsText", e.target.value)} placeholder="Tags, separated by commas" />
            <Input value={form.meta_title} onChange={(e) => update("meta_title", e.target.value)} placeholder="SEO title" />
            <Textarea value={form.meta_description} onChange={(e) => update("meta_description", e.target.value)} placeholder="SEO description" className="min-h-16" />
            <Button disabled={!form.title || !form.slug || saveArticle.isPending} onClick={() => saveArticle.mutate(toPayload(form))} className="w-full"><Save className="mr-2 h-4 w-4" />{editing ? "Save changes" : "Create news"}</Button>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">News articles</h2><div className="flex gap-2"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search news" className="w-56" /><Button variant="outline" onClick={() => { setEditing(null); setForm(emptyArticle); }}><Plus className="mr-1 h-4 w-4" />New</Button></div></div>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b bg-muted/40"><th className="p-3 text-left">Title</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Category</th><th className="p-3 text-left">Published</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{isLoading ? <tr><td className="p-6 text-muted-foreground" colSpan="5">Loading…</td></tr> : filtered.map((article) => <tr key={article.id} className="border-b"><td className="p-3"><p className="font-medium">{article.title}</p><p className="text-xs text-muted-foreground">/news/{article.slug}</p></td><td className="p-3"><Badge variant={article.status === "published" ? "default" : "secondary"}>{article.status || "draft"}</Badge></td><td className="p-3 text-muted-foreground">{categories.find(([value]) => value === article.category)?.[1] || article.category || "Studio News"}</td><td className="p-3 text-muted-foreground">{article.published_at ? new Date(article.published_at).toLocaleDateString() : "—"}</td><td className="p-3"><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" asChild><Link to={`/news/${article.slug}`}><Eye className="h-4 w-4" /></Link></Button><Button size="icon" variant="ghost" onClick={() => startEdit(article)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => deleteArticle.mutate(article.id)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}{!isLoading && filtered.length === 0 && <tr><td className="p-6 text-muted-foreground" colSpan="5">No news found.</td></tr>}</tbody></table>
          </div>
        </section>
      </div>
    </div>
  );
}