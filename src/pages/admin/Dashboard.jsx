import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import SEOMeta from "@/components/SEOMeta";
import {
  Video, Users, Tag, Newspaper, Link2, ArrowRight, Globe,
  Plus, Database, AlertCircle, RefreshCw, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString();
}

// ── Stat Card (reads from SystemStat) ────────────────────────────────────────

const STAT_CONFIGS = [
  { label: "Videos",        icon: Video,     href: "/admin/videos",     field: "total_videos",        color: "text-blue-400 bg-blue-400/10" },
  { label: "Performers",    icon: Users,     href: "/admin/performers", field: "total_performers",    color: "text-purple-400 bg-purple-400/10" },
  { label: "Brands",        icon: Tag,       href: "/admin/brands",     field: "total_brands",        color: "text-yellow-400 bg-yellow-400/10" },
  { label: "News Articles", icon: Newspaper, href: "/admin/news",       field: "total_news_articles", color: "text-green-400 bg-green-400/10" },
];

function StatCard({ label, icon: Icon, href, field, color, stat, isLoading }) {
  const value = stat?.[field];
  return (
    <Link to={href} className="group bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-3xl font-bold text-foreground mb-1">
        {isLoading ? "—" : fmt(value)}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

// ── Assignment Card (reads from SystemStat) ───────────────────────────────────

function AssignmentStatCard({ stat, isLoading }) {
  const missing = stat?.unassigned_video_count ?? null;
  const coverage = stat?.assignment_coverage_pct ?? null;
  const total = stat?.total_videos ?? null;
  const hasIssue = missing !== null && missing > 0;

  return (
    <Link to="/admin/missing-performer-assignments" className="group bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${hasIssue ? 'text-destructive bg-destructive/10' : 'text-green-500 bg-green-500/10'}`}>
          {hasIssue ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-3xl font-bold text-foreground mb-1">
        {isLoading ? "—" : fmt(missing)}
      </p>
      <p className="text-sm text-muted-foreground">Missing Assignments</p>
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Total: {fmt(total)}</span>
          <span className={`${hasIssue ? 'text-destructive' : 'text-green-500'} font-semibold`}>
            {coverage !== null ? `${coverage}% coverage` : "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Upload Video",                   href: "/admin/video-upload",                  icon: Plus },
  { label: "Review AI Drafts",               href: "/admin/draft-review",                  icon: Video },
  { label: "Quick Match: Video → Performer", href: "/admin/video-performer-match",          icon: Link2 },
  { label: "Missing Performer Assignments",  href: "/admin/missing-performer-assignments",  icon: AlertCircle },
  { label: "View Public Site",               href: "/",                                     icon: Globe, external: true },
];

const MIGRATION_ITEMS = ["Videos", "Performers", "Brands", "Video Assets", "SEO Pages", "News Articles", "Slug Redirects"];

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: statRecords = [], isLoading } = useQuery({
    queryKey: ["system-stat"],
    queryFn: () => base44.entities.SystemStat.list("-last_refreshed_at", 1),
  });

  const stat = statRecords[0] || null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await base44.functions.invoke("systemStatsService", { action: "refresh_dashboard_stats" });
      queryClient.invalidateQueries({ queryKey: ["system-stat"] });
    } finally {
      setRefreshing(false);
    }
  };

  const lastRefreshed = stat?.last_refreshed_at
    ? new Date(stat.last_refreshed_at).toLocaleString()
    : null;

  return (
    <>
      {/* Admin page — explicitly noindex,nofollow even though behind login */}
      <SEOMeta
        title="Dashboard — FLESHLAB Admin"
        description="FLESHLAB V2 admin dashboard and console."
        canonical="/admin"
        noIndex={true}
      />
      <div className="space-y-8 max-w-5xl">
        <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">FLESHLAB V2 — Admin Console</p>
          {lastRefreshed && (
            <p className="text-xs text-muted-foreground mt-1">Stats last updated: {lastRefreshed}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh Stats"}
        </Button>
      </div>

      {/* No stats yet */}
      {!isLoading && !stat && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-5 py-4 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-200">
            Dashboard stats not yet calculated.{" "}
            <button onClick={handleRefresh} className="underline hover:no-underline font-medium">
              Run first refresh
            </button>{" "}
            to populate counters.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {STAT_CONFIGS.map(cfg => (
          <StatCard key={cfg.field} {...cfg} stat={stat} isLoading={isLoading} />
        ))}
        <AssignmentStatCard stat={stat} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Quick Actions
          </h2>
          <div className="space-y-1">
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  to={action.href}
                  target={action.external ? "_blank" : undefined}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm text-foreground">{action.label}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Migration Status */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            V1 Migration Status
          </h2>
          <div className="space-y-2">
            {MIGRATION_ITEMS.map(item => (
              <div key={item} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{item}</span>
                <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                  Pending
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link
              to="/admin/migration"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Go to Migration Tools <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}