import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Compass, Loader2, RefreshCw } from 'lucide-react';
import SEOMeta from '@/components/SEOMeta';
import { adminDiscovery } from '@/api/fleshlabClient';

const metricLabels = {
  review_queue: 'Recruitment review queue', applications_last_30_days: 'Applications · 30 days', stale_reviews: 'Reviews older than 7 days',
  active_performers: 'Active performers', published_videos: 'Published videos', videos_missing_description: 'Published videos without description', videos_missing_thumbnail: 'Published videos without thumbnail'
};

export default function Discovery() {
  const [data, setData] = useState(null); const [error, setError] = useState(null);
  const load = useCallback(() => { setError(null); adminDiscovery.snapshot().then(setData).catch(setError); }, []);
  useEffect(load, [load]);
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-700"><AlertTriangle className="mb-2 h-5 w-5" />{error.message}<button onClick={load} className="ml-3 font-bold underline">Retry</button></div>;
  if (!data) return <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading self-hosted discovery signals…</div>;
  return <div className="mx-auto max-w-7xl space-y-6">
    <SEOMeta title="Discovery — FLESHLAB Admin" canonical="/admin/discovery" noIndex />
    <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-border bg-card p-5"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-primary"><Compass className="h-4 w-4" />Self-hosted signals</p><h1 className="mt-2 text-3xl font-black">Discovery</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Recruitment and catalogue signals calculated from FLESHLAB PostgreSQL data. External traffic analytics are not shown until their own source is migrated.</p></div><button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"><RefreshCw className="h-4 w-4" />Refresh</button></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(metricLabels).map(([key,label]) => <article key={key} className="rounded-xl border border-border bg-card p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-black">{data.metrics[key] ?? 0}</p></article>)}</section>
    <section className="grid gap-5 lg:grid-cols-2"><article className="rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">Oldest open recruitment reviews</h2><div className="mt-4 space-y-3">{data.review_queue.length ? data.review_queue.map((row) => <div key={row.id} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0"><div><p className="font-medium">{row.full_name}</p><p className="text-xs text-muted-foreground">{row.country || 'Country not supplied'} · {row.status}</p></div><time className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</time></div>) : <p className="text-sm text-muted-foreground">No open self-hosted recruitment reviews.</p>}</div></article><article className="rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">Published library by brand</h2><div className="mt-4 space-y-3">{data.catalogue_by_brand.length ? data.catalogue_by_brand.map((row) => <div key={row.brand} className="flex items-center justify-between border-b border-border pb-3 last:border-0"><span className="font-medium">{row.brand}</span><span className="text-sm text-muted-foreground">{row.published_videos} published</span></div>) : <p className="text-sm text-muted-foreground">No active brands are currently available in the self-hosted catalogue.</p>}</div></article></section>
    <aside className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100"><strong>Not migrated:</strong> Google Analytics and Search Console connector data. This page deliberately does not substitute estimated traffic or SEO figures.</aside>
  </div>;
}
