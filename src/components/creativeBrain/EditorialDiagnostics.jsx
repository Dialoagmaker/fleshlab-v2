function getDiagnostics(output) {
  const providerPlan = output?.renderMetadata?.provider_intelligence || output?.details?.provider_intelligence || output?.details?.providerData?.provider_intelligence || {};
  const editorialIntent = providerPlan.editorialIntent || output?.renderMetadata?.editorial_intent || null;
  const policyClassification = providerPlan.policyClassification || providerPlan.contentClassification || output?.details?.providerData?.contentClassification || null;
  const providerDecision = output?.details?.providerData?.code || output?.details?.providerData?.providerDecision || output?.code || (output?.ok ? "PROVIDER_REQUEST_SUCCEEDED" : null);
  return { editorialIntent, policyClassification, providerDecision };
}

export default function EditorialDiagnostics({ output }) {
  const { editorialIntent, policyClassification, providerDecision } = getDiagnostics(output);
  if (!editorialIntent && !policyClassification && !providerDecision) return null;

  return (
    <div className="mt-4 grid gap-4 rounded-xl border border-border bg-secondary/20 p-4 text-xs md:grid-cols-2">
      <div>
        <p className="font-black uppercase tracking-[0.18em] text-primary">Editorial Intent</p>
        <dl className="mt-3 grid gap-2 text-muted-foreground">
          <div><dt className="font-bold text-foreground">Domain</dt><dd>{editorialIntent?.editorialDomain || "Not classified"}</dd></div>
          <div><dt className="font-bold text-foreground">Purpose</dt><dd>{editorialIntent?.creativePurpose || "Not classified"}</dd></div>
          <div><dt className="font-bold text-foreground">Genre</dt><dd>{editorialIntent?.visualGenre || "Not classified"}</dd></div>
          <div><dt className="font-bold text-foreground">Style</dt><dd>{editorialIntent?.photographicStyle || "Not classified"}</dd></div>
        </dl>
      </div>
      <div className="border-t border-border pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
        <p className="font-black uppercase tracking-[0.18em] text-primary">Policy Classification</p>
        <dl className="mt-3 grid gap-2 text-muted-foreground">
          <div><dt className="font-bold text-foreground">Canonical</dt><dd>{policyClassification?.canonicalCategory || policyClassification?.category || "Not evaluated"}</dd></div>
          <div><dt className="font-bold text-foreground">Risk</dt><dd>{policyClassification?.policyRisk || "Not evaluated"}</dd></div>
          <div><dt className="font-bold text-foreground">Provider decision</dt><dd>{providerDecision || "Pending"}</dd></div>
        </dl>
      </div>
    </div>
  );
}