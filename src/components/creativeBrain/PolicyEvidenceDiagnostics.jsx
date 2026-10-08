function getAudit(output) {
  return output?.policyEvidenceAudit || output?.renderMetadata?.policy_evidence_audit || output?.details?.policy_evidence_audit || output?.details?.provider_intelligence?.policyEvidenceAudit || null;
}

export default function PolicyEvidenceDiagnostics({ output }) {
  const audit = getAudit(output);
  if (!audit) return null;

  return (
    <details className="mt-4 rounded-xl border border-border bg-secondary/20" open>
      <summary className="cursor-pointer p-4 text-xs font-black uppercase tracking-[0.18em] text-primary">Policy Evidence Audit</summary>
      <div className="grid gap-4 p-4 pt-0 text-xs text-muted-foreground">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-background/60 p-3"><b className="block text-foreground">Winning category</b>{audit.classification}</div>
          <div className="rounded-lg bg-background/60 p-3"><b className="block text-foreground">Final confidence</b>{audit.confidence}</div>
          <div className="rounded-lg bg-background/60 p-3"><b className="block text-foreground">Flags</b>{audit.decisionTrace?.flags?.join(", ") || "None"}</div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-background/70 text-foreground"><tr><th className="p-2">Type</th><th className="p-2">Signal</th><th className="p-2">Weight</th><th className="p-2">Confidence</th><th className="p-2">Reason</th></tr></thead>
            <tbody>{audit.evidence?.map(item => <tr key={item.id} className="border-t border-border"><td className="p-2">{item.type}{item.diagnosticOnly ? " · diagnostic" : ""}</td><td className="p-2 text-foreground">{item.signal}</td><td className="p-2">{item.weight}</td><td className="p-2">{item.confidence}</td><td className="p-2">{item.reason}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          {Object.entries(audit.alternativeClassifications || {}).map(([category, score]) => <div key={category} className="rounded-lg bg-background/60 p-3"><b className="block text-foreground">{category}</b>{score}</div>)}
        </div>
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <b className="block text-foreground">Counterfactual results</b>
          <div className="mt-2 grid gap-1">{audit.counterfactualResults?.map((item, index) => <p key={`${item.without}-${index}`}>Without “{item.without}” → {item.recalculatedCategory} ({item.recalculatedConfidence})</p>)}</div>
        </div>
      </div>
    </details>
  );
}