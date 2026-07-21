import { Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

function JsonBlock({ title, value, open = false }) {
  const json = JSON.stringify(value, null, 2);
  return <details open={open} className="rounded-xl border border-border bg-card"><summary className="cursor-pointer px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-primary">{title}</summary><pre className="max-h-[46vh] overflow-auto border-t border-border bg-black p-4 text-xs leading-relaxed text-green-100">{json}</pre></details>;
}

export default function BlueprintJsonOutput({ pipeline }) {
  if (!pipeline) return null;
  const finalJson = JSON.stringify(pipeline.productionBlueprint, null, 2);
  const download = () => { const blob = new Blob([finalJson], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `creative-production-blueprint-${Date.now()}.json`; link.click(); URL.revokeObjectURL(url); };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => navigator.clipboard.writeText(finalJson)} className="gap-2"><Copy className="h-4 w-4" />Copy Final Blueprint</Button><Button variant="outline" onClick={download} className="gap-2"><Download className="h-4 w-4" />Download Final Blueprint</Button></div>
      <JsonBlock title="Final Production Blueprint" value={pipeline.productionBlueprint} open />
      <JsonBlock title="1 · Technical Image Facts" value={pipeline.technicalFacts} />
      <JsonBlock title="2 · Semantic Image Facts" value={pipeline.semanticFacts} />
      <JsonBlock title="3 · Unified Image Facts" value={pipeline.unifiedFacts} />
      <JsonBlock title="4 · Identity Facts" value={pipeline.identityFacts} />
      <JsonBlock title="5 · Marketing Facts" value={pipeline.marketingFacts} />
      <JsonBlock title="6 · Creative Decisions" value={pipeline.creativeDecisions} />
      <JsonBlock title="Validation" value={pipeline.validation} />
    </div>
  );
}