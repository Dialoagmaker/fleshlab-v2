import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SEOMeta from "@/components/SEOMeta";
import PaymentsTab from "@/components/admin/users/PaymentsTab";
import SubscriptionsTab from "@/components/admin/users/SubscriptionsTab";
import PurchasesTab from "@/components/admin/users/PurchasesTab";
import GuestProductionsTab from "@/components/admin/users/GuestProductionsTab";
import UserTimeline from "@/components/admin/users/UserTimeline";
import CrmDashboard from "@/components/admin/users/crm/CrmDashboard";
import {
  ArrowLeft, Loader2, AlertCircle, Crown, Users,
  DollarSign, ShoppingCart, CreditCard, CheckCircle2, Calendar, FileText,
  UserPlus, Clock, ShieldCheck, Tag, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = [
  { key: "overview",          label: "Overview" },
  { key: "timeline",          label: "Timeline" },
  { key: "payments",          label: "Payments" },
  { key: "subscriptions",     label: "Subscriptions" },
  { key: "ppv",               label: "PPV Unlocks" },
  { key: "guest_productions", label: "Guest Productions" },
  { key: "audit",             label: "Audit / Notes" },
];

function SummaryCard({ icon: IconComp, label, value, color = "text-primary" }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-muted ${color}`}>
        <IconComp className="w-4 h-4" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function UserDetail() {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => base44.functions.invoke("adminUserService", { action: "get_user_detail", userId }).then(r => r.data),
  });

  const queryClient = useQueryClient();

  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ["admin-user-timeline", userId],
    queryFn: () => base44.functions.invoke("adminUserService", { action: "get_user_timeline", userId }).then(r => r.data),
    enabled: activeTab === "timeline" || activeTab === "overview",
  });

  const { data: financials } = useQuery({
    queryKey: ["admin-user-financials", userId],
    queryFn: () => base44.functions.invoke("adminUserService", { action: "get_user_financials", userId }).then(r => r.data),
    enabled: activeTab === "overview",
  });

  const { data: notesData } = useQuery({
    queryKey: ["admin-user-notes", userId],
    queryFn: () => base44.functions.invoke("adminUserService", { action: "get_user_notes", userId }).then(r => r.data),
    enabled: activeTab === "overview",
  });

  const [isSavingNote, setIsSavingNote] = useState(false);

  const handleAddNote = async (note) => {
    setIsSavingNote(true);
    try {
      await base44.functions.invoke("adminUserService", { action: "add_user_note", userId, note });
      queryClient.invalidateQueries({ queryKey: ["admin-user-notes", userId] });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    await base44.functions.invoke("adminUserService", { action: "delete_user_note", noteId });
    queryClient.invalidateQueries({ queryKey: ["admin-user-notes", userId] });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error || data?.error) return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <AlertCircle className="w-10 h-10 text-destructive" />
      <p className="text-foreground font-semibold">Failed to load user</p>
      <p className="text-muted-foreground text-sm">{error?.message || data?.error}</p>
      <Button variant="outline" onClick={() => navigate("/admin/users")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
      </Button>
    </div>
  );

  const user = data?.user;
  const performer = data?.linked_performer;
  const summary = data?.summary;

  return (
    <>
      <SEOMeta title={`User: ${user?.email || userId} — Admin`} description="" canonical={`/admin/users/${userId}`} noIndex={true} />
      <div className="space-y-6 max-w-6xl">

        {/* Back + Header */}
        <div>
          <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Users
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                {user?.full_name || user?.email || "User Detail"}
                {user?.role === "admin" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
                    <Crown className="w-3.5 h-3.5" />Admin
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
              <p className="text-xs text-muted-foreground/50 font-mono mt-0.5">{user?.user_id}</p>
            </div>
            {performer && (
              <Link
                to={`/admin/performers/${performer.id}`}
                className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/40 transition-colors"
              >
                {performer.profile_image_url
                  ? <img src={performer.profile_image_url} alt={performer.display_name} className="w-9 h-9 rounded-full object-cover border border-border" />
                  : <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"><Users className="w-4 h-4 text-muted-foreground" /></div>
                }
                <div>
                  <p className="text-xs text-muted-foreground">Linked Performer</p>
                  <p className="text-sm font-semibold text-foreground">{performer.display_name}</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <SummaryCard icon={DollarSign} label="Lifetime Spend" value={`$${summary.lifetime_spend_usd?.toFixed(2) ?? '0.00'}`} color="text-green-400" />
            <SummaryCard icon={CreditCard} label="Payments" value={summary.payment_count} />
            <SummaryCard icon={CheckCircle2} label="Active Subs" value={summary.active_subscription_count} color="text-purple-400" />
            <SummaryCard icon={ShoppingCart} label="PPV Purchases" value={summary.ppv_purchase_count} />
            <SummaryCard icon={FileText} label="Guest Apps" value={summary.guest_production_count} />
            <SummaryCard icon={Calendar} label="Last Payment" value={summary.last_payment_date ? new Date(summary.last_payment_date).toLocaleDateString() : '—'} />
          </div>
        )}

        {/* Possible duplicate alert */}
        {user?.possible_duplicates && user.possible_duplicates.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-400">Possible Duplicate Account</h3>
            </div>
            <p className="text-xs text-amber-400/70 mb-3">
              This user may have multiple accounts. Do not merge automatically — review before taking action.
            </p>
            <div className="space-y-2">
              {user.possible_duplicates.map((dup, i) => (
                <div key={i} className="flex items-center justify-between bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{dup.full_name || 'No name'}</p>
                    <p className="text-xs text-muted-foreground">{dup.email}</p>
                    <p className="text-[10px] text-muted-foreground/50">
                      Registered {dup.created_date ? new Date(dup.created_date).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <Link
                    to={`/admin/users/${dup.user_id}`}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    View User →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User meta */}
        <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Email</p>
            <p className="font-medium text-foreground">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
            <p className="font-medium text-foreground">{user?.full_name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Role</p>
            <p className="font-medium text-foreground capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Registered</p>
            <p className="font-medium text-foreground">{user?.created_date ? new Date(user.created_date).toLocaleString() : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              <ShieldCheck className="w-3 h-3 inline mr-1" />
              Email Verified
            </p>
            <p className={`font-medium text-sm ${user?.email_verified ? 'text-green-400' : 'text-amber-400'}`}>
              {user?.email_verified ? 'Verified' : 'Not Verified'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              <Clock className="w-3 h-3 inline mr-1" />
              Last Login
            </p>
            <p className="font-medium text-foreground text-sm">
              {user?.last_login ? new Date(user.last_login).toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              <Tag className="w-3 h-3 inline mr-1" />
              Signup Source
            </p>
            <p className="font-medium text-foreground text-sm capitalize">
              {user?.signup_source || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              <XCircle className="w-3 h-3 inline mr-1" />
              Failed Checkouts
            </p>
            <p className={`font-medium text-sm ${(user?.failed_checkout_count || 0) > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
              {user?.failed_checkout_count || 0}
            </p>
          </div>
        </div>

        {/* Last checkout intent */}
        {user?.last_checkout_intent && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Last Checkout Intent
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium text-foreground capitalize">{user.last_checkout_intent.payment_type?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-medium text-foreground">${user.last_checkout_intent.amount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className={`font-medium capitalize ${user.last_checkout_intent.status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>
                  {user.last_checkout_intent.status?.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Provider</p>
                <p className="font-medium text-foreground capitalize">{user.last_checkout_intent.provider}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "overview" && (
            <CrmDashboard
              events={timelineData?.events || []}
              summary={summary}
              user={user}
              financials={financials}
              notes={notesData?.notes || []}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              isSavingNote={isSavingNote}
            />
          )}
          {activeTab === "timeline" && <UserTimeline events={timelineData?.events || []} isLoading={timelineLoading} user={user} summary={summary} />}
          {activeTab === "payments" && <PaymentsTab userId={userId} />}
          {activeTab === "subscriptions" && <SubscriptionsTab userId={userId} />}
          {activeTab === "ppv" && <PurchasesTab userId={userId} />}
          {activeTab === "guest_productions" && <GuestProductionsTab userId={userId} />}
          {activeTab === "audit" && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Audit log and admin notes will be available in a future update.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}