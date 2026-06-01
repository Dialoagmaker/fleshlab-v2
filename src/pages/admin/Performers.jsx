import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const PAGE_SIZE = 50;

const STATUS_COLORS = {
  active:   "bg-green-500/10 text-green-400 border-green-500/20",
  inactive: "bg-muted text-muted-foreground border-border",
  pending:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default function Performers() {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage]             = useState(0);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, performer: null, videoCount: 0 });
  const [confirmText, setConfirmText]   = useState("");

  // Build filter object for server-side filtering
  const filterObj = statusFilter !== "all" ? { status: statusFilter } : {};

  const { data: performers = [], isLoading } = useQuery({
    queryKey: ["admin-performers", statusFilter],
    // Load up to 500 server-side filtered by status; text search is applied client-side within this set.
    // This avoids the old 200-hard-limit truncation while keeping server-side status filtering.
    queryFn: () => {
      if (statusFilter !== "all") {
        return base44.entities.Performer.filter({ status: statusFilter }, "display_name", 500);
      }
      return base44.entities.Performer.list("display_name", 500);
    },
    staleTime: 30_000,
  });

  // Client-side text search (across the full server-filtered set, not just first 200)
  const searched = performers.filter(p =>
    !search ||
    p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination over search results
  const totalPages   = Math.ceil(searched.length / PAGE_SIZE);
  const paged        = searched.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalCount   = performers.length;

  // Reset to page 0 when search/filter changes
  const handleSearch = (v) => { setSearch(v); setPage(0); };
  const handleStatus = (v) => { setStatusFilter(v); setPage(0); };

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({ performerId }) => {
      // Fetch only this performer's credits at delete time — not all VideoPerformers
      const relatedVPs = await base44.entities.VideoPerformer.filter({ performer_id: performerId });
      for (const vp of relatedVPs) {
        await base44.entities.VideoPerformer.delete(vp.id);
      }
      await base44.entities.Performer.delete(performerId);
      return { videoCount: relatedVPs.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-performers"] });
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
    // Fetch credit count fresh at click time — no unbounded preload needed
    const relatedVPs = await base44.entities.VideoPerformer.filter({ performer_id: performer.id });
    setDeleteDialog({ open: true, performer, videoCount: relatedVPs.length });
  };

  const handleConfirmDelete = () => {
    if (!deleteDialog.performer) return;
    const requiredText = deleteDialog.videoCount > 0 ? "DELETE" : deleteDialog.performer.display_name;
    if (confirmText !== requiredText) {
      toast.error(`Please type "${requiredText}" to confirm.`);
      return;
    }
    deleteMutation.mutate({ performerId: deleteDialog.performer.id });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading ? "Loading…" : (
              <>
                {searched.length} result{searched.length !== 1 ? "s" : ""}
                {statusFilter !== "all" && ` (${statusFilter})`}
                {search && ` matching "${search}"`}
                {totalCount !== searched.length && ` · ${totalCount} total`}
              </>
            )}
          </p>
        </div>
        <Link to="/admin/performers/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Performer
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search performers…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
      ) : paged.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          {search || statusFilter !== "all" ? "No performers match your filters." : "No performers yet."}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-muted-foreground font-medium px-4 py-3">Performer</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3 hidden sm:table-cell">Slug</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3">Status</th>
                {/* Badge columns prepared for Phase 1 Performer entity extension */}
                <th className="text-right text-muted-foreground font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(p => (
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[p.status] || STATUS_COLORS.active}`}>
                        {p.status || "active"}
                      </span>
                      {/* Phase 1 badge placeholders — rendered only if fields exist after entity extension */}
                      {p.kyc_status && p.kyc_status !== "approved" && (
                        <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-orange-500/10 text-orange-400 border-orange-500/20">
                          KYC: {p.kyc_status}
                        </span>
                      )}
                      {p.account_status && p.account_status !== "active" && (
                        <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-destructive/10 text-destructive border-destructive/20">
                          {p.account_status}
                        </span>
                      )}
                      {p.compliance_locked && (
                        <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-red-900/30 text-red-300 border-red-500/30">
                          Locked
                        </span>
                      )}
                      {p.outstanding_balance_usd > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                          Owes ${p.outstanding_balance_usd.toFixed(2)}
                        </span>
                      )}
                    </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page + 1} of {totalPages} · {searched.length} performers
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
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
              disabled={
                deleteMutation.isPending ||
                confirmText !== (deleteDialog.videoCount > 0 ? "DELETE" : deleteDialog.performer?.display_name)
              }
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