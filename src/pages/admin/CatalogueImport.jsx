import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileJson, Loader2, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import SEOMeta from '@/components/SEOMeta';
import { catalogueImports } from '@/api/fleshlabClient';

const REQUIRED = Object.freeze([
  ['Brand', 'Brands and public brand metadata'],
  ['Performer', 'Performer profiles and catalogue fields'],
  ['Video', 'Video metadata and legacy media references'],
  ['VideoPerformer', 'Video-to-performer credits']
]);

function humanError(error) {
  if (error?.code === 'PAYLOAD_TOO_LARGE') return 'The four export files exceed the current 25 MB import request limit.';
  return error?.message || 'The catalogue import could not be checked.';
}

async function parseExport(file, expectedEntity) {
  const payload = JSON.parse(await file.text());
  if (!payload || String(payload.entity || '').toLowerCase() !== expectedEntity.toLowerCase() || !Array.isArray(payload.records) || !payload.exported_at) {
    throw new Error(`${expectedEntity} must be a Base44 data export with entity, exported_at and records.`);
  }
  return payload;
}

function Metric({ label, value }) {
  return <div className="rounded-xl border border-border bg-muted/30 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black text-foreground">{Number(value || 0).toLocaleString()}</p></div>;
}

export default function CatalogueImport() {
  const inputs = useRef({});
  const [files, setFiles] = useState({});
  const [exports, setExports] = useState({});
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  const complete = REQUIRED.every(([entity]) => exports[entity]);
  const selectedCount = Object.keys(files).length;
  const totalBytes = useMemo(() => Object.values(files).reduce((sum, file) => sum + (file?.size || 0), 0), [files]);

  const selectFile = async (entity, file) => {
    setError('');
    setReport(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError(`${entity} must be uploaded as a JSON file.`);
      return;
    }
    try {
      const parsed = await parseExport(file, entity);
      setFiles(current => ({ ...current, [entity]: file }));
      setExports(current => ({ ...current, [entity]: parsed }));
    } catch (cause) {
      setFiles(current => { const next = { ...current }; delete next[entity]; return next; });
      setExports(current => { const next = { ...current }; delete next[entity]; return next; });
      setError(cause.message || `Could not read ${entity}.`);
    }
  };

  const clear = () => {
    setFiles({}); setExports({}); setReport(null); setError('');
    Object.values(inputs.current).forEach(input => { if (input) input.value = ''; });
  };

  const dryRun = async () => {
    if (!complete) return setError('Select all four required Base44 JSON exports before checking the import.');
    setChecking(true); setError(''); setReport(null);
    try { setReport(await catalogueImports.dryRun(exports)); }
    catch (cause) { setError(humanError(cause)); }
    finally { setChecking(false); }
  };

  const execute = async () => {
    if (!report || report.dry_run !== true) return setError('Run and review the dry run before importing data.');
    if (!window.confirm('Import this reviewed catalogue snapshot into FLESHLAB now? Existing records with the same legacy IDs will be updated.')) return;
    setImporting(true); setError('');
    try { setReport(await catalogueImports.execute(exports)); }
    catch (cause) { setError(humanError(cause)); }
    finally { setImporting(false); }
  };

  return <>
    <SEOMeta title="Catalogue Import — FLESHLAB Admin" canonical="/admin/catalogue-import" noIndex />
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-primary">Controlled catalogue migration</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-4xl">Import Base44 catalogue data</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Select the four JSON exports together. FLESHLAB validates every relationship before any database record is changed.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><ShieldCheck className="h-4 w-4" /> Admin-only import</div>
        </div>
      </header>

      {error && <div role="alert" className="flex gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}

      <section className="grid gap-4 md:grid-cols-2">
        {REQUIRED.map(([entity, description]) => {
          const file = files[entity];
          return <article key={entity} className={`rounded-2xl border p-5 transition ${file ? 'border-emerald-500/45 bg-emerald-500/5' : 'border-border bg-card'}`}>
            <div className="flex items-start gap-4"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${file ? 'bg-emerald-500/15 text-emerald-600' : 'bg-primary/10 text-primary'}`}>{file ? <CheckCircle2 className="h-5 w-5" /> : <FileJson className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><h2 className="font-bold text-foreground">{entity}.json</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>{file && <p className="mt-3 truncate text-xs font-medium text-emerald-700 dark:text-emerald-300">{file.name} · {(file.size / 1024).toFixed(1)} KB · {exports[entity]?.records?.length?.toLocaleString() || 0} records</p>}</div></div>
            <div className="mt-5 flex items-center gap-3"><input ref={node => { inputs.current[entity] = node; }} id={`catalogue-${entity}`} className="sr-only" type="file" accept="application/json,.json" onChange={event => void selectFile(entity, event.target.files?.[0])} /><label htmlFor={`catalogue-${entity}`} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"><Upload className="h-4 w-4" />{file ? 'Replace file' : 'Choose JSON file'}</label>{file && <button type="button" className="text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => { setFiles(current => { const next = { ...current }; delete next[entity]; return next; }); setExports(current => { const next = { ...current }; delete next[entity]; return next; }); inputs.current[entity].value = ''; setReport(null); }}>Remove</button>}</div>
          </article>;
        })}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold text-foreground">Review before import</h2><p className="mt-1 text-sm text-muted-foreground">{selectedCount}/4 files selected · {(totalBytes / 1024 / 1024).toFixed(2)} MB total. The API accepts up to 25 MB per validated import request.</p></div><div className="flex flex-wrap gap-3"><button type="button" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={clear} disabled={!selectedCount || checking || importing}><RefreshCw className="h-4 w-4" />Clear</button><button type="button" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50" disabled={!complete || checking || importing} onClick={() => void dryRun()}>{checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}Run dry run</button></div></div>
      </section>

      {report && <section className={`rounded-2xl border p-5 md:p-6 ${report.dry_run ? 'border-amber-500/35 bg-amber-500/5' : 'border-emerald-500/35 bg-emerald-500/5'}`}><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-muted-foreground">{report.dry_run ? 'Dry run passed' : 'Import complete'}</p><h2 className="mt-1 text-xl font-black text-foreground">{report.dry_run ? 'Review this catalogue snapshot' : 'Catalogue records were imported'}</h2><p className="mt-2 text-sm text-muted-foreground">Source checksum: <code className="break-all text-xs">{report.source_sha256}</code></p></div>{report.dry_run && <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50" disabled={importing} onClick={() => void execute()}>{importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Confirm and import</button>}</div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Brands" value={report.brands} /><Metric label="Performers" value={report.performers} /><Metric label="Videos" value={report.videos} /><Metric label="Credits" value={report.credits} /></div>{report.dry_run && <p className="mt-5 text-sm leading-6 text-muted-foreground">No data has been changed. Confirm the counts and relationships, then select <b>Confirm and import</b>. Existing matching legacy IDs are updated idempotently.</p>}</section>}
    </div>
  </>;
}
