import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

const EMPTY_FORM = {
  display_name: "", slug: "", bio: "", nationality: "",
  profile_image_url: "", cover_image_url: "", status: "active",
  featured: false, verified: false, date_of_birth: "",
  meta_title: "", meta_description: "",
};

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isValidUrl(val) {
  return !val || /^https?:\/\/.+/.test(val.trim());
}

export default function PerformerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const { data: performer } = useQuery({
    queryKey: ["performer", id],
    queryFn: () => base44.entities.Performer.get(id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (performer) setForm({ ...EMPTY_FORM, ...performer });
  }, [performer]);

  const save = useMutation({
    mutationFn: (data) => isNew ? base44.entities.Performer.create(data) : base44.entities.Performer.update(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-performers"] });
      if (isNew) navigate(`/admin/performers/${result.id}`);
    },
  });

  const remove = useMutation({
    mutationFn: () => base44.entities.Performer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-performers"] });
      navigate("/admin/performers");
    },
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleNameChange = (display_name) => {
    setForm(f => ({ ...f, display_name, slug: isNew ? slugify(display_name) : f.slug }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.display_name.trim()) errs.display_name = "Display name is required.";
    if (!form.slug.trim()) errs.slug = "Slug is required.";
    if (!form.status) errs.status = "Status is required.";
    if (!isValidUrl(form.profile_image_url)) errs.profile_image_url = "Must be a valid http/https URL.";
    if (!isValidUrl(form.cover_image_url)) errs.cover_image_url = "Must be a valid http/https URL.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    save.mutate(form);
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link to="/admin/performers" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{isNew ? "New Performer" : "Edit Performer"}</h1>
        </div>
        {!isNew && (
          <button
            onClick={() => { if (confirm("Delete this performer?")) remove.mutate(); }}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          <div className="space-y-2">
            <Label>Display Name *</Label>
            <Input value={form.display_name} onChange={e => handleNameChange(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Slug *</Label>
            <Input value={form.slug} onChange={e => set("slug", e.target.value)} className={`font-mono text-sm ${errors.slug ? "border-destructive" : ""}`} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
            {!form.slug && form.display_name && <p className="text-xs text-muted-foreground">Slug will be auto-generated. You can override it.</p>}
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={form.bio || ""} onChange={e => set("bio", e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nationality</Label>
              <Input value={form.nationality || ""} onChange={e => set("nationality", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth || ""} onChange={e => set("date_of_birth", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-foreground">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.verified} onChange={e => set("verified", e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-foreground">Verified</span>
            </label>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Images</h2>
          {[
            { field: "profile_image_url", label: "Profile Image URL" },
            { field: "cover_image_url", label: "Cover Image URL" },
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
            {save.isPending ? "Saving…" : isNew ? "Create Performer" : "Save Changes"}
          </Button>
          <Link to="/admin/performers">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}