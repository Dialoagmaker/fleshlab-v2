import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Clock, TrendingUp, DollarSign, Calendar, Star, Video } from "lucide-react";

const StatItem = ({ icon: Icon, label, value, subtext, color = "text-primary" }) => {
  if (!Icon) return null;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
      <div className={`p-2 rounded-md bg-muted ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Career Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatItem
            icon={Film}
            label="Total Productions"
            value={stats.total_productions}
            color="text-blue-500"
          />
          <StatItem
            icon={Video}
            label="Published"
            value={stats.published_videos}
            color="text-green-500"
          />
          <StatItem
            icon={Film}
            label="Draft"
            value={stats.draft_videos}
            color="text-yellow-500"
          />
          <StatItem
            icon={Clock}
            label="Total Runtime"
            value={`${stats.total_runtime_minutes} min`}
            color="text-purple-500"
          />
          <StatItem
            icon={Calendar}
            label="Latest Release"
            value={stats.latest_release_date 
              ? new Date(stats.latest_release_date).toLocaleDateString()
              : "N/A"
            }
            color="text-orange-500"
          />
          <StatItem
            icon={TrendingUp}
            label="Active Promos"
            value={stats.active_promotions}
            color="text-pink-500"
          />
          <StatItem
            icon={DollarSign}
            label="Lifetime Revenue"
            value={`$${stats.lifetime_revenue_usd.toFixed(2)}`}
            color="text-green-500"
          />
          <StatItem
            icon={Star}
            label="Lead Roles"
            value={`${stats.lead_percentage}%`}
            subtext={`${stats.lead_roles} videos`}
            color="text-yellow-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}