import { Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlueprintJsonOutput({ blueprint }) {
  if (!blueprint) return null;
  const json = JSON.stringify(blueprint, null, 2);

  const download = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `creative-production-blueprint-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => navigator.clipboard.writeText(json)} className="gap-2"><Copy className="h-4 w-4" />Copy JSON</Button>
        <Button variant="outline" onClick={download} className="gap-2"><Download className="h-4 w-4" />Download JSON</Button>
      </div>
      <pre className="max-h-[72vh] overflow-auto rounded-xl border border-border bg-black p-4 text-xs leading-relaxed text-green-100">{json}</pre>
    </div>
  );
}