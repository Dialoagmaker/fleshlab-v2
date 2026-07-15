import { Badge } from "@/components/ui/badge";
import { getPrivacyFacts } from "@/lib/aiMediaStudio/privacyGuard";

export default function PrivacyVerification({ outputCount }) {
  const facts = getPrivacyFacts(outputCount);
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
      <p className="mb-3 text-sm font-bold text-foreground">Privacy Verification</p>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {facts.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
            <span className="text-xs text-muted-foreground">{label}</span>
            <Badge variant={value === "NO" ? "default" : "outline"}>{value}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}