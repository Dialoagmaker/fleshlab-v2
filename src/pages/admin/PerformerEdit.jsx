import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [videoCount, setVideoCount] = useState(0);

  const { data: performer } = useQuery({
    queryKey: ["performer", id],
    queryFn: () => base44.entities.Performer.get(id),
    enabled: !isNew,
  });

  const { data: videoPerformers = [] } = useQuery({
    queryKey: ["video-performers-performer", id],
    queryFn: () => base44.entities.VideoPerformer.filter({ performer_id: id }),
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (performer) setForm({ ...EMPTY_FORM, ...performer });
  }, [performer]);

  useEffect(() => {
    if (videoPerformers && videoPerformers.length > 0) {
      setVideoCount(videoPerformers.length);
    } else {
      setVideoCount(0);
    }
  }, [videoPerformers]);

  const save = useMutation({
    mutationFn: (data) => isNew ? base44.entities.Performer.create(data) : base44.entities.Performer.update(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-performers"] });
      if (isNew) navigate(`/admin/performers/${result.id}`);
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      for (const vp of videoPerformers) {
        await base44.entities.VideoPerformer.delete(vp.id);
      }
      await base44.entities.Performer.delete(id);
      return { videoCount: videoPerformers.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-performers"] });
      queryClient.invalidateQueries({ queryKey: ["video-performers-performer", id] });
      setDeleteDialogOpen(false);
      setConfirmText("");
      toast.success(
        result.videoCount > 0
          ? `Performer deleted. Removed ${result.videoCount} video credit(s).`
          : "Performer deleted successfully."
      );
      navigate("/admin/performers");
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
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
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{isNew ? "Create Performer" : "Edit Performer Details"}</h1>
        {!isNew && (
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
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
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
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
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">SEO</h2>
          <div className="space-y-2">
            <Label>Meta Title</Label>
            <Input value={form.meta_title || ""} onChange={e => set("meta_title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Meta Description</Label>
            <Textarea value={form.meta_description || ""} onChange={e => set("meta_description", e.target.value)} rows={3} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={save.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {save.isPending ? "Saving…" : isNew ? "Create Performer" : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(`/admin/performers/${id}`)}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDeleteDialogOpen(false);
          setConfirmText("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Performer</AlertDialogTitle>
            <AlertDialogDescription>
              {videoCount > 0 ? (
                <>
                  <p className="mb-3">
                    <strong>{performer?.display_name}</strong> is linked to{" "}
                    <span className="font-bold text-foreground">{videoCount}</span> video(s).
                  </p>
                  <p className="text-destructive font-semibold">
                    Deleting will remove performer credits from those videos, but the videos will remain published.
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    This action will also remove all profile images, bio, and metadata. This cannot be undone.
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-3">
                    Are you sure you want to delete <strong>{performer?.display_name}</strong>?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This will permanently remove all profile data, images, and metadata. This cannot be undone.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-delete-edit" className="text-sm font-semibold">
              Type {videoCount > 0 ? '"DELETE"' : `"${performer?.display_name}"`} to confirm:
            </Label>
            <Input
              id="confirm-delete-edit"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-2 font-mono"
              placeholder={videoCount > 0 ? "DELETE" : performer?.display_name}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const requiredText = videoCount > 0 ? "DELETE" : performer?.display_name;
                if (confirmText !== requiredText) {
                  toast.error(`Please type "${requiredText}" to confirm.`);
                  return;
                }
                remove.mutate();
              }}
              disabled={remove.isPending || confirmText !== (videoCount > 0 ? "DELETE" : performer?.display_name)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remove.isPending ? "Deleting..." : "Delete Performer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}