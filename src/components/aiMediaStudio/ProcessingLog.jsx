export default function ProcessingLog({ entries }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-bold text-foreground">Processing Log</p>
      <div className="max-h-72 space-y-1 overflow-auto rounded-lg bg-background p-3 font-mono text-xs text-muted-foreground">
        {entries.length ? entries.map((entry, index) => <div key={`${entry}-${index}`}>{entry}</div>) : <div>No processing events yet.</div>}
      </div>
    </div>
  );
}