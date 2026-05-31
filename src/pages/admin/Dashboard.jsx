import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Video, Users, Tag, Newspaper, Link2, ArrowRight, Globe, Plus, Database } from "lucide-react";

const STAT_CONFIGS = [
  { label: "Videos", icon: Video, href: "/admin/videos", entity: "Video", color: "text-blue-400 bg-blue-400/10" },
  { label: "Performers", icon: Users, href: "/admin/performers", entity: "Performer", color: "text-purple-400 bg-purple-400/10" },
  { label: "Brands", icon: Tag, href: "/admin/brands", entity: "Brand", color: "text-yellow-400 bg-yellow-400/10" },
  { label: "News Articles", icon: Newspaper, href: "/admin/news", entity: "NewsArticle", color: "text-green-400 bg-green-400/10" },
];

const MIGRATION_ITEMS = ["Videos", "Performers", "Brands", "Video Assets", "SEO Pages", "News Articles", "Slug Redirects"];

const QUICK_ACTIONS = [
  { label: "Quick Match: Video to Performers", href: "/admin/video-performer-match", icon: Link2 },
  { label: "Manage Videos", href: "/admin/videos", icon: Video },
  { label: "Manage Performers", href: "/admin/performers", icon: Users },
  { label: "Manage Brands", href: "/admin/brands", icon: Tag },
  { label: "Run V1 Migration", href: "/admin/migration", icon: Database },
  { label: "View Public Site", href: "/", icon: Globe, external: true },
];

function StatCard({ label, icon: Icon, href, entity, color }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-stat", entity],
    queryFn: () => base44.entities[entity].list("-created_date", 500),
  });

  return (
    <Link to={href} className="group bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-3xl font-bold text-foreground mb-1">
        {isLoading ? "—" : data.length >= 500 ? "500+" : data.length}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">FLESHLAB V2 — Admin Console</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CONFIGS.map(cfg => (
          <StatCard key={cfg.entity} {...cfg} />
        ))}
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
  );
}