import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Clock, TrendingUp, DollarSign, Calendar, Star, Video, BarChart2, Globe } from "lucide-react";

const StatItem = ({ icon: Icon, label, value, subtext, color = "text-primary" }) => {
  if (!Icon) return null;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
      <div className={`p-2 rounded-md bg-muted ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </div>
    </div>
  );
};

export default function CareerStatisticsCard({ stats }) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Career Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading statistics...</p>
        </CardContent>
      </Card>
    );
  }

  const revenueSharePct = stats.revenue_share_pct || 40;

  // Unified earnings — backend now returns the correct totals
  const lifetimeGross = stats.lifetime_revenue_usd || 0;
  const lifetimePerformer = stats.lifetime_performer_earnings || (lifetimeGross * (revenueSharePct / 100));

  // Platform stats — new fields from backend
  const platformRows = stats.platform_stat_rows_total ?? null;
  const externalRows = stats.external_only_stat_rows ?? null;
  const videoPlatformGross = stats.video_platform_gross ?? null;
  const videoPlatformShare = stats.video_platform_share ?? null;

  const hasPlatformData = platformRows !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Career Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* ── FLESHLAB Productions ──────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            FLESHLAB Productions
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatItem
              icon={Film}
              label="FLESHLAB Productions"
              value={stats.total_productions}
              color="text-blue-500"
            />
            <StatItem
              icon={Video}
              label="Published Productions"
              value={stats.published_videos}
              color="text-green-500"
            />
            <StatItem
              icon={Film}
              label="Draft / Other Productions"
              value={stats.draft_videos}
              color="text-yellow-500"
            />
            <StatItem
              icon={Clock}
              label="FLESHLAB Runtime"
              value={`${stats.total_runtime_minutes} min`}
              subtext="Internal videos only"
              color="text-purple-500"
            />
          </div>
        </div>

        {/* ── Platform Stats Summary ────────────────────────────── */}
        {hasPlatformData && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Platform Stats (All Sources)
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatItem
                icon={BarChart2}
                label="Platform Stat Rows"
                value={platformRows}
                subtext="All platforms"
                color="text-cyan-500"
              />
              <StatItem
                icon={Globe}
                label="External Platform Entries"
                value={externalRows}
                subtext="Not linked to a FLESHLAB video"
                color="text-teal-500"
              />
              <StatItem
                icon={DollarSign}
                label="Video Platform Gross"
                value={`$${videoPlatformGross.toFixed(2)}`}
                subtext="All stat rows"
                color="text-emerald-500"
              />
              <StatItem
                icon={DollarSign}
                label={`Video Platform Share (${revenueSharePct}%)`}
                value={`$${videoPlatformShare.toFixed(2)}`}
                subtext="Your estimated share"
                color="text-green-500"
              />
            </div>
          </div>
        )}

        {/* ── Earnings ─────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Lifetime Earnings
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatItem
              icon={DollarSign}
              label={`Total Earnings (${revenueSharePct}%)`}
              value={`$${lifetimePerformer.toFixed(2)}`}
              subtext="Includes pending & estimated"
              color="text-green-500"
            />
            <StatItem
              icon={TrendingUp}
              label="Total Gross"
              value={`$${lifetimeGross.toFixed(2)}`}
              subtext="All sources combined"
              color="text-blue-500"
            />
            <StatItem
              icon={Calendar}
              label="Latest Release"
              value={stats.latest_release_date
                ? new Date(stats.latest_release_date).toLocaleDateString()
                : "N/A"}
              color="text-orange-500"
            />
            <StatItem
              icon={Star}
              label="Lead Roles"
              value={`${stats.lead_percentage}%`}
              subtext={`${stats.lead_roles} videos`}
              color="text-yellow-500"
            />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}