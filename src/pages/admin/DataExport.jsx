import { useState } from 'react';
import JSZip from 'jszip';
import { Download, FileJson, Loader2, Package } from 'lucide-react';
import SEOMeta from '@/components/SEOMeta';
import { adminDataExports } from '@/api/fleshlabClient';

const ITEMS = [
  ['Brand', 'Brand records and public metadata'],
  ['Performer', 'Creator profiles and catalogue fields'],
  ['Video', 'Video metadata, status and catalogue references'],
  ['VideoPerformer', 'Video-to-performer relationships']
];

function stamp() { return new Date().toISOString().slice(0, 10); }
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const element = document.createElement('a');
  element.href = url; element.download = filename;
  document.body.appendChild(element); element.click(); element.remove();
  URL.revokeObjectURL(url);
}
function jsonBlob(value) { return new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' }); }

export default function DataExport() {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [counts, setCounts] = useState({});

  async function one(entity) {
    setBusy(entity); setError('');
    try {
      const exports = await adminDataExports.get(entity);
      const payload = exports[entity];
      setCounts((current) => ({ ...current, [entity]: payload.count }));
      download(jsonBlob(payload), `${entity}_export_${stamp()}.json`);
    } catch (cause) { setError(cause?.message || 'The self-hosted export could not be created.'); }
    finally { setBusy(''); }
  }
  async function all() {
    setBusy('all'); setError('');
    try {
      const exports = await adminDataExports.get('all');
      const archive = new JSZip();
      for (const [entity] of ITEMS) archive.file(`${entity}_export_${stamp()}.json`, JSON.stringify(exports[entity], null, 2));
      setCounts(Object.fromEntries(ITEMS.map(([entity]) => [entity, exports[entity].count])));
      download(await archive.generateAsync({ type: 'blob' }), `FLESHLAB_catalogue_export_${stamp()}.zip`);
    } catch (cause) { setError(cause?.message || 'The self-hosted ZIP export could not be created.'); }
    finally { setBusy(''); }
  }

  return <>
    <SEOMeta title="Data Export — FLESHLAB Admin" canonical="/admin/data-export" noIndex />
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <p className="text-xs font-black uppercase tracking-[.2em] text-primary">Self-hosted data export</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-4xl">Catalogue JSON exports</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Export the live PostgreSQL catalogue. No Base44 API or storage request is made. Relationship exports contain the current self-hosted associations.</p>
      </header>
      {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">{error}</div>}
      <div className="flex justify-end"><button type="button" disabled={Boolean(busy)} onClick={() => void all()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">{busy === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}Export all as ZIP</button></div>
      <section className="grid gap-4 md:grid-cols-2">
        {ITEMS.map(([entity, description]) => <article key={entity} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start justify-between gap-4"><div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><FileJson className="h-5 w-5" /></div><span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">JSON</span></div><h2 className="mt-5 text-xl font-black text-foreground">{entity}</h2><p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{description}</p><div className="mt-5 flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{counts[entity] === undefined ? 'Export to read current count' : `${counts[entity]} current record${counts[entity] === 1 ? '' : 's'}`}</p><button type="button" disabled={Boolean(busy)} onClick={() => void one(entity)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-50">{busy === entity ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Export</button></div></article>)}
      </section>
    </div>
  </>;
}

