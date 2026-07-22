import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ArtDirectionDiagnostics({ campaign, visible }) {
  if (!visible || !campaign?.brandSystem?.artDirectionPlans?.length) return null;
  const plans = campaign.brandSystem.artDirectionPlans;
  const summary = campaign.brandSystem.analysisSummary || {};
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-sm">Private Art Direction Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div className="grid gap-2 md:grid-cols-4">
          <Badge variant="outline">Subject: {summary.subjectSide || "unknown"}</Badge>
          <Badge variant="outline">Complexity: {Math.round((summary.backgroundComplexity || 0) * 100)}%</Badge>
          <Badge variant="outline">Negative space: {summary.negativeSpace?.score ? Math.round(summary.negativeSpace.score * 100) : 0}%</Badge>
          <Badge variant="outline">Plans: {plans.length}</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {plans.map(plan => (
            <div key={plan.id} className="rounded-lg border border-border bg-card p-3">
              <p className="font-black uppercase tracking-widest text-primary">{plan.platformDirection.platform}</p>
              <p className="mt-1 text-foreground">{plan.layoutFamily} · {plan.strategy}</p>
              <p className="mt-2 text-muted-foreground">Title: {plan.title.lineBreakPlan.preferredLines.join(" / ")}</p>
              <p className="text-muted-foreground">Logo scale: {plan.brand.logoScale} · CTA: {plan.cta.visible ? "visible" : "hidden"}</p>
              <p className="text-muted-foreground">Weights: image {plan.composition.visualWeight.image}, type {plan.composition.visualWeight.typography}, brand {plan.composition.visualWeight.brand}</p>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-black/50 p-2 text-[10px] text-muted-foreground">{JSON.stringify(plan.selectionScores, null, 2)}</pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}