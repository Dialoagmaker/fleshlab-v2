import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FolderKanban, Loader2, RefreshCw, Users, Video } from 'lucide-react';
import SEOMeta from '@/components/SEOMeta';
import { adminCatalogue } from '@/api/fleshlabClient';

function Failure({ error, retry }) {
  return <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-200"><AlertTriangle className="mb-2 h-5 w-5" />{error?.message || 'The self-hosted catalogue could not be loaded.'}<button className="ml-3 font-bold underline" onClick={retry}>Retry</button></div>;
}

function Loading() { return <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading migrated catalogue data…</div>; }

function Status({ value }) { return <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${value === 'active' || value === 'published' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{value}</span>; }

export default function SelfHostedCatalogue({ section }) {
  const [data, setData] = useState(null); const [error, setError] = useState(null); const [query, setQuery] = useState('');
  const load = useCallback(() => { setError(null); adminCatalogue.snapshot().then(setData).catch(setError); }, []);
  useEffect(load, [load]);
  const title = section === 'creator' ? 'Creator' : section === 'library' ? 'Library' : 'Collections';
  const icon = section === 'creator' ? <Users className="h-5 w-5" /> : section === 'library' ? <Video className="h-5 w-5" /> : <FolderKanban className="h-5 w-5" />;
  const items = useMemo(() => {
    if (!data) return [];
    const source = section === 'creator' ? data.performers : section === 'library' ? data.videos : data.collections;
    const needle = query.trim().toLowerCase();
    if (!needle) return source;
    return source.filter((item) => [item.display_name, item.title, item.name, item.slug, item.description, ...(item.performer_names || [])].filter(Boolean).join(' ').toLowerCase().includes(needle));
  }, [data, section, query]);
  if (error) return <Failure error={error} retry={load} />;
  if (!data) return <Loading />;
  return <>
    <SEOMeta title={`${title} — FLESHLAB Admin`} canonical={`/admin/${section}`} noIndex />
    <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 md:flex-row md:items-end md:justify-between">
      <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-primary">{icon} Self-hosted catalogue</p><h1 className="mt-2 text-3xl font-black text-foreground">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Live PostgreSQL records imported from the reviewed Base44 catalogue snapshot. No Base44 request is made from this screen.</p></div>
      <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"><RefreshCw className="h-4 w-4" />Refresh</button>
    </header>
    <div className="mt-5 grid gap-3 sm:grid-cols-4">
      {Object.entries(data.counts).map(([label, value]) => <div className="rounded-xl border border-border bg-card px-4 py-3" key={label}><p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black text-foreground">{value}</p></div>)}
    </div>
    <label className="mt-5 block"><span className="sr-only">Filter {title}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Filter ${title.toLowerCase()}…`} className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground" /></label>
    <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
      {!items.length && <p className="p-5 text-sm text-muted-foreground">No matching migrated records.</p>}
      {section === 'creator' && items.map((item) => <article key={item.id} className="border-b border-border p-4 last:border-b-0"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-foreground">{item.display_name}</h2><p className="mt-1 text-sm text-muted-foreground">{item.video_count} linked video{item.video_count === 1 ? '' : 's'}{item.nationality ? ` · ${item.nationality}` : ''}</p></div><Status value={item.status} /></div></article>)}
      {section === 'library' && items.map((item) => <article key={item.id} className="border-b border-border p-4 last:border-b-0"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-foreground">{item.title}</h2><p className="mt-1 text-sm text-muted-foreground">{item.performer_names.join(', ') || 'No linked performer'} · {item.access_tier}</p></div><Status value={item.status} /></div></article>)}
      {section === 'collections' && items.map((item) => <article key={item.id} className="border-b border-border p-4 last:border-b-0"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-foreground">{item.title}</h2><p className="mt-1 text-sm text-muted-foreground">{item.video_count} videos · {item.type}</p></div><span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Derived</span></div></article>)}
    </section>
  </>;
}
