import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const STATUS_COLORS = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  inactive: "bg-muted text-muted-foreground border-border",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default function Performers() {
  const [search, setSearch] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, performer: null, videoCount: 0 });
  const [confirmText, setConfirmText] = useState("");

  const { data: performers = [], isLoading } = useQuery({
    queryKey: ["admin-performers"],
    queryFn: () => base44.entities.Performer.list("display_name", 200),
  });

  const { data: videoPerformers = [] } = useQuery({
    queryKey: ["video-performers-all"],
    queryFn: () => base44.entities.VideoPerformer.list(),
  });

  const filtered = performers.filter(p =>
    p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({ performerId, performerName }) => {
      // Delete all VideoPerformer records for this performer
      const relatedVideoPerformers = videoPerformers.filter(vp => vp.performer_id === performerId);
      for (const vp of relatedVideoPerformers) {
        await base44.entities.VideoPerformer.delete(vp.id);
      }
      // Delete the performer
      await base44.entities.Performer.delete(performerId);
      return { videoCount: relatedVideoPerformers.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-performers"] });
      queryClient.invalidateQueries({ queryKey: ["video-performers-all"] });
      setDeleteDialog({ open: false, performer: null, videoCount: 0 });
      setConfirmText("");
      toast.success(
        result.videoCount > 0
          ? `Performer deleted. Removed ${result.videoCount} video credit(s).`
          : "Performer deleted successfully."
      );
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const handleDeleteClick = async (performer) => {
    const relatedVideoPerformers = videoPerformers.filter(vp => vp.performer_id === performer.id);
    setDeleteDialog({
      open: true,
      performer,
      videoCount: relatedVideoPerformers.length,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteDialog.performer) return;
    const requiredText = deleteDialog.videoCount > 0 ? "DELETE" : deleteDialog.performer.display_name;
    if (confirmText !== requiredText) {
      toast.error(`Please type "${requiredText}" to confirm.`);
      return;
    }
    deleteMutation.mutate({
      performerId: deleteDialog.performer.id,
      performerName: deleteDialog.performer.display_name,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {performers.length} total{performers.length >= 200 && <span className="ml-2 text-xs text-yellow-400">(showing first 200 records)</span>}
          </p>
        </div>
        <Link to="/admin/performers/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Performer
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search performers…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          {search ? "No performers match your search." : "No performers yet."}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-muted-foreground font-medium px-4 py-3">Performer</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3 hidden sm:table-cell">Slug</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3">Status</th>
                <th className="text-right text-muted-foreground font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                        {p.profile_image_url ? (
                          <img src={p.profile_image_url} alt={p.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {p.display_name?.[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{p.display_name}</div>
                        {p.nationality && <div className="text-xs text-muted-foreground">{p.nationality}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs text-muted-foreground">{p.slug}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[p.status] || STATUS_COLORS.active}`}>
                      {p.status || "active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/performers/${p.id}`} className="p-1.5 text-muted-foreground hover:text-primary transition-colors inline-block">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(p)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => {
        if (!open) {
          setDeleteDialog({ open: false, performer: null, videoCount: 0 });
          setConfirmText("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Performer</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.videoCount > 0 ? (
                <>
                  <p className="mb-3">
                    <strong>{deleteDialog.performer?.display_name}</strong> is linked to{" "}
                    <span className="font-bold text-foreground">{deleteDialog.videoCount}</span> video(s).
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
                    Are you sure you want to delete <strong>{deleteDialog.performer?.display_name}</strong>?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This will permanently remove all profile data, images, and metadata. This cannot be undone.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-delete" className="text-sm font-semibold">
              Type {deleteDialog.videoCount > 0 ? '"DELETE"' : `"${deleteDialog.performer?.display_name}"`} to confirm:
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-2 font-mono"
              placeholder={deleteDialog.videoCount > 0 ? "DELETE" : deleteDialog.performer?.display_name}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending || confirmText !== (deleteDialog.videoCount > 0 ? "DELETE" : deleteDialog.performer?.display_name)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Performer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}