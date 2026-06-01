import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Search, Trash2, ChevronLeft, ChevronRight, AlertCircle, UserX } from "lucide-react";
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
import LinkUserModal from "@/components/performer/profile/LinkUserModal";

const PAGE_SIZE = 50;

const STATUS_COLORS = {
  active:   "bg-green-500/10 text-green-400 border-green-500/20",
  inactive: "bg-muted text-muted-foreground border-border",
  pending:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default function UnlinkedPerformers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [linkModalPerformer, setLinkModalPerformer] = useState(null);

  const queryClient = useQueryClient();

  // Fetch unlinked performers (user_id is null)
  const { data, isLoading } = useQuery({
    queryKey: ["unlinked-performers", search, page],
    queryFn: async () => {
      const allPerformers = await base44.asServiceRole.entities.Performer.filter({});
      const unlinked = allPerformers.filter(p => !p.user_id);
      
      // Apply search filter
      const filtered = search
        ? unlinked.filter(p => 
            p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.slug?.toLowerCase().includes(search.toLowerCase()) ||
            p.nationality?.toLowerCase().includes(search.toLowerCase())
          )
        : unlinked;

      // Paginate
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const paginated = filtered.slice(start, end);

      return {
        results: paginated,
        totalCount: filtered.length,
        hasMore: end < filtered.length
      };
    },
    staleTime: 10_000,
  });

  const results = data?.results || [];
  const totalCount = data?.totalCount || 0;
  const hasMore = data?.hasMore || false;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSearch = (v) => { setSearch(v); setPage(0); };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Unlinked Performers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading ? "Loading…" : (
              <>
                {totalCount} performer{totalCount !== 1 ? 's' : ''} without user accounts
              </>
            )}
          </p>
        </div>
        <Link to="/admin/performers">
          <Button variant="outline" className="gap-2">
            <Edit className="w-4 h-4" /> All Performers
          </Button>
        </Link>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-200 space-y-1">
          <p>
            <strong>Why link matters:</strong> Performers without linked user accounts cannot access their dashboard.
          </p>
          <p>
            Link a user account to enable performer access to earnings, compliance, and video stats.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search unlinked performers…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          {search ? "No unlinked performers match your search." : "All performers are linked to user accounts!"}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-muted-foreground font-medium px-4 py-3">Performer</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3 hidden sm:table-cell">Slug</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3">Status</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3">Contact Info</th>
                <th className="text-right text-muted-foreground font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map(p => (
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
                      {p.kyc_status && p.kyc_status !== "approved" && (
                        <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-orange-500/10 text-orange-400 border-orange-500/20">
                          KYC: {p.kyc_status}
                        </span>
                      )}
                      {p.compliance_locked && (
                        <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-red-900/30 text-red-300 border-red-500/30">
                          Locked
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {p.onlyfans_url && <div className="truncate max-w-[200px]">OF: {p.onlyfans_url}</div>}
                      {p.twitter_url && <div className="truncate max-w-[200px]">Twitter: {p.twitter_url}</div>}
                      {p.instagram_url && <div className="truncate max-w-[200px]">IG: {p.instagram_url}</div>}
                      {!p.onlyfans_url && !p.twitter_url && !p.instagram_url && (
                        <span className="text-muted-foreground/50">No contact info</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLinkModalPerformer(p)}
                        className="gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Link User
                      </Button>
                      <Link to={`/admin/performers/${p.id}`} className="p-1.5 text-muted-foreground hover:text-primary transition-colors inline-block">
                        <Edit className="w-4 h-4" />
                      </Link>
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
            Page {page + 1} of {totalPages} · {totalCount} unlinked performers
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
              disabled={page >= totalPages - 1 || !hasMore}
              onClick={() => setPage(p => p + 1)}
              className="gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Link User Modal */}
      {linkModalPerformer && (
        <LinkUserModal
          performerId={linkModalPerformer.id}
          currentUserId={null}
          onClose={() => setLinkModalPerformer(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["unlinked-performers", search, page] });
            setLinkModalPerformer(null);
            toast.success("Performer linked successfully");
          }}
        />
      )}
    </div>
  );
}