import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp } from "lucide-react";

function fmt(n) {
  if (n === undefined || n === null) return "—";
  return typeof n === 'number' ? n.toLocaleString() : n;
}

export function TopPagesCard({ pages = [], title }) {
  if (!pages?.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pages.slice(0, 10).map((page, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
              <span className="text-foreground truncate flex-1" title={page.page_path}>
                {page.page_path.split('/').pop() || '/'}
              </span>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="font-medium">{fmt(page.page_views)}</span>
                <span className="text-xs">{fmt(page.active_users)} users</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TrafficSourcesCard({ trafficSources = [] }) {
  if (!trafficSources?.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Traffic Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No traffic source data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Traffic Sources (by Channel)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {trafficSources.slice(0, 15).map((source, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{source.channel}</Badge>
                  <span className="text-muted-foreground truncate">{source.source} / {source.medium}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-xs">
                <span className="font-medium">{fmt(source.sessions)} sessions</span>
                <span>{fmt(source.page_views)} pv</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ExternalFunnelCard({ trafficSources = [] }) {
  const externalSources = trafficSources.filter(t => 
    t.source?.includes('xhamster') || 
    t.source?.includes('pornhub') || 
    t.source?.includes('twitter') || 
    t.source?.includes('t.co') ||
    t.medium === 'referral'
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-primary" />
          External Platform Traffic
        </CardTitle>
      </CardHeader>
      <CardContent>
        {externalSources.length === 0 ? (
          <p className="text-sm text-muted-foreground">No external platform traffic detected yet</p>
        ) : (
          <div className="space-y-2">
            {externalSources.map((source, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{source.channel}</Badge>
                    <span className="text-muted-foreground truncate">{source.source}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground text-xs">
                  <span className="font-medium">{fmt(source.sessions)} sessions</span>
                  <span>{fmt(source.page_views)} pv</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Traffic from xHamster, Pornhub, Twitter/X, and other external platforms
        </p>
      </CardContent>
    </Card>
  );
}