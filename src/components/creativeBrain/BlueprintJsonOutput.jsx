import { Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

function JsonBlock({ title, value }) {
  const json = JSON.stringify(value, null, 2);
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-black uppercase tracking-[0.22em] text-primary">{title}</h2>
      <pre className="max-h-[46vh] overflow-auto rounded-xl border border-border bg-black p-4 text-xs leading-relaxed text-green-100">{json}</pre>
    </section>
  );
}

export default function BlueprintJsonOutput({ pipeline }) {
  if (!pipeline) return null;
  const finalJson = JSON.stringify(pipeline.productionBlueprint, null, 2);

  const download = () => {
    const blob = new Blob([finalJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `creative-production-blueprint-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => navigator.clipboard.writeText(finalJson)} className="gap-2"><Copy className="h-4 w-4" />Copy Final Blueprint</Button>
        <Button variant="outline" onClick={download} className="gap-2"><Download className="h-4 w-4" />Download Final Blueprint</Button>
      </div>
      <JsonBlock title="PRODUCTION BLUEPRINT" value={pipeline.productionBlueprint} />
      <div className="grid gap-4 xl:grid-cols-2">
        <JsonBlock title="MODULE 1 · IMAGE FACTS" value={pipeline.imageFacts} />
        <JsonBlock title="MODULE 2 · IDENTITY FACTS" value={pipeline.identityFacts} />
        <JsonBlock title="MODULE 3 · MARKETING FACTS" value={pipeline.marketingFacts} />
        <JsonBlock title="MODULE 4 · CREATIVE DECISIONS" value={pipeline.creativeDecisions} />
      </div>
    </div>
  );
}