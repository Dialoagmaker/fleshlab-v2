import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SEOMeta from "@/components/SEOMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users as UsersIcon, Search, ChevronRight, Crown, Loader2,
  AlertCircle, DollarSign, ShoppingCart, CheckCircle2, Clock, Trash2,
  UserPlus
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const FILTERS = [
  { key: "all",               label: "All Users" },
  { key: "active_sub",        label: "Active Subscribers" },
  { key: "ppv_buyers",        label: "PPV Buyers" },
  { key: "guest_productions", label: "Guest Productions" },
  { key: "failed_payments",   label: "Failed Payments" },
  { key: "pending_payments",  label: "Pending Payments" },
  { key: "admins",            label: "Admins Only" },
  { key: "linked_performers", label: "Linked Performers" },
];

const STATUS_COLORS = {
  completed:        "bg-green-500/10 text-green-400 border-green-500/20",
  pending:          "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  failed:           "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled:        "bg-muted text-muted-foreground border-border",
  refunded:         "bg-blue-500/10 text-blue-400 border-blue-500/20",
  underpaid:        "bg-orange-500/10 text-orange-400 border-orange-500/20",
  currency_mismatch:"bg-orange-500/10 text-orange-400 border-orange-500/20",
  payment_review:   "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function StatusBadge({ status }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  const cls = STATUS_COLORS[status] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function buildFilters(activeFilter) {
  const f = {};
  if (activeFilter === "active_sub")        f.has_active_subscription = true;
  if (activeFilter === "ppv_buyers")        f.has_payments = true;
  if (activeFilter === "guest_productions") f.has_guest_productions = true;
  if (activeFilter === "failed_payments")   f.has_failed_payments = true;
  if (activeFilter === "pending_payments")  f.has_payments = true;
  if (activeFilter === "admins")            f.role = "admin";
  if (activeFilter === "linked_performers") f.linked_performer = true;
  return f;
}

export default function Users() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const queryClient = useQueryClient();
  const LIMIT = 50;

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users", page, search, activeFilter],
    queryFn: () => base44.functions.invoke("adminUserService", {
      action: "list_users",
      page,
      limit: LIMIT,
      search,
      filters: buildFilters(activeFilter),
    }).then(r => r.data),
    keepPreviousData: true,
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const duplicateMap = data?.duplicate_map || {};
  const duplicateGroupsCount = data?.duplicate_groups_count || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleDelete = async (userId) => {
    setDeletingId(userId);
    setConfirmId(null);
    await base44.entities.User.delete(userId);
    queryClient.invalidateQueries(["admin-users"]);
    setDeletingId(null);
  };

  return (
    <>
      <SEOMeta title="Users — FLESHLAB Admin" description="" canonical="/admin/users" noIndex={true} />
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UsersIcon className="w-6 h-6 text-primary" />
              Users &amp; Customers
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {total > 0 ? `${total} total users` : "Registered user accounts"}
              {duplicateGroupsCount > 0 && (
                <span className="ml-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">
                  <UserPlus className="w-3 h-3" />
                  {duplicateGroupsCount} possible duplicate{duplicateGroupsCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, user ID, or invoice ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setActiveFilter(f.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                activeFilter === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-6 text-destructive">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error.message || "Failed to load users"}</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <UsersIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground text-sm">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Registered</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Performer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Sub</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lifetime Spend</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Purchases</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(u => (
                    <tr key={u.user_id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{u.full_name || <span className="text-muted-foreground italic">No name</span>}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                          <p className="text-[10px] text-muted-foreground/50 font-mono">{u.user_id.slice(0, 12)}…</p>
                          {duplicateMap[u.user_id] && duplicateMap[u.user_id].length > 0 && (
                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium">
                              <UserPlus className="w-2.5 h-2.5" />
                              Possible duplicate
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {u.created_date ? new Date(u.created_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {u.role === "admin"
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-medium"><Crown className="w-3 h-3" />Admin</span>
                          : <span className="text-muted-foreground text-xs">User</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {u.linked_performer
                          ? <Link to={`/admin/performers/${u.linked_performer.id}`} className="text-primary hover:underline text-xs">{u.linked_performer.display_name}</Link>
                          : <span className="text-muted-foreground text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.active_subscription_count > 0
                          ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                          : <span className="text-muted-foreground text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.lifetime_spend_usd > 0
                          ? <span className="font-semibold text-foreground">${u.lifetime_spend_usd.toFixed(2)}</span>
                          : <span className="text-muted-foreground text-xs">$0.00</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                        {u.payment_count || 0}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.last_payment_status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {u.last_payment_date ? new Date(u.last_payment_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/users/${u.user_id}`}
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                          >
                            View <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                          {confirmId === u.user_id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(u.user_id)}
                                className="text-[10px] px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold"
                              >
                                {deletingId === u.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="text-[10px] px-2 py-0.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded font-bold"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmId(u.user_id)}
                              className="text-muted-foreground hover:text-red-400 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Page {page} of {totalPages} ({total} total)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}