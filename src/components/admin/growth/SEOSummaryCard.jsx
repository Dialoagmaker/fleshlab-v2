import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function fmt(n) {
  if (n === undefined || n === null) return "—";
  return typeof n === 'number' ? n.toLocaleString() : n;
}

function fmtPct(n) {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

export function SEOSummaryCard({ gscData }) {
  if (!gscData?.success) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            SEO Summary (GSC)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No GSC data available</p>
        </CardContent>
      </Card>
    );
  }

  const { summary } = gscData;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          SEO Summary (Last 28 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Clicks</p>
            <p className="text-2xl font-bold">{fmt(summary.clicks || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Impressions</p>
            <p className="text-2xl font-bold">{fmt(summary.impressions || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">CTR</p>
            <p className="text-2xl font-bold">{fmtPct(summary.ctr)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Position</p>
            <p className="text-2xl font-bold">{fmt(summary.average_position)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TopSEOQueries({ gscData }) {
  if (!gscData?.success || !gscData.top_queries?.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            Top Search Queries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No query data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Top Search Queries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {gscData.top_queries.slice(0, 10).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
              <span className="text-foreground truncate flex-1">{item.query}</span>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="font-medium">{fmt(item.clicks)}</span>
                <span className="text-xs">{fmtPct(item.ctr)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TopSEOPages({ gscData }) {
  if (!gscData?.success || !gscData.top_pages?.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Top SEO Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No page data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          Top SEO Pages (by Clicks)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {gscData.top_pages.slice(0, 10).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
              <span className="text-foreground truncate flex-1" title={item.page}>{item.page.split('/').pop() || '/'}</span>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="font-medium">{fmt(item.clicks)}</span>
                <span className="text-xs">{fmt(item.impressions)} imp</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}