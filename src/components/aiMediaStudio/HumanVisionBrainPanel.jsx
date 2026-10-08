import { Brain, Eye, FileText, Flame, GitBranch, ListChecks, Radar, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHumanVisionBrain } from "@/hooks/useHumanVisionBrain";

function MiniStat({ label, value }) {
  return <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs text-muted-foreground">{label}</p><b className="text-lg text-foreground">{value}</b></div>;
}

function FrameworkList({ items, fields }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">Framework container missing.</p>;
  return <div className="space-y-2">{items.map(item => <div key={item.id} className="rounded-lg border border-border bg-card p-3 text-sm"><Badge variant="secondary">{item.status}</Badge><p className="mt-2 text-muted-foreground">Version {item.version}</p>{fields.map(field => <p key={field} className="mt-1 text-xs text-muted-foreground">{field}: {String(item[field] ?? "waiting")}</p>)}</div>)}</div>;
}

export default function HumanVisionBrainPanel() {
  const brain = useHumanVisionBrain();

  return (
    <div className="space-y-4 rounded-xl border border-border bg-background/70 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><p className="flex items-center gap-2 font-black text-foreground"><Brain className="h-5 w-5 text-primary" />Human Vision Brain · Version 1.0</p><p className="text-sm text-muted-foreground">Understanding how humans visually perceive still images. No image analysis or design decisions are installed yet.</p></div>
        <Badge variant="secondary">Training</Badge>
      </div>
      {brain.error && <p className="text-sm text-destructive">{brain.error}</p>}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <MiniStat label="Installed Knowledge" value={brain.coverage.approvedRecords} />
        <MiniStat label="Missing Knowledge" value={brain.coverage.missingCategories} />
        <MiniStat label="Coverage" value={`${brain.coverage.coverageScore}%`} />
        <MiniStat label="Records" value={brain.coverage.recordCount} />
        <MiniStat label="Certification" value={brain.coverage.certified ? "Active" : "Exam required"} />
      </div>

      <Tabs defaultValue="overview" className="space-y-3">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {["overview", "categories", "records", "reasoning", "attention", "heatmap", "reports", "tests", "certification", "history"].map(tab => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="overview" className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Human Vision is the root dependency for future creative reasoning. It can only predict attention after explicit records are installed, tested, and approved.</TabsContent>
        <TabsContent value="categories" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{brain.categories.map(category => <div key={category.category_slug} className="rounded-lg border border-border bg-card p-3"><p className="font-semibold text-foreground">{category.title}</p><p className="text-xs text-muted-foreground">{category.status} · {category.record_count || 0} records</p></div>)}</TabsContent>
        <TabsContent value="records" className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">{brain.records.length ? `${brain.records.length} knowledge records installed.` : "No knowledge records installed yet. Records will expose WHAT, WHY, WHEN, WHEN NOT, and attention effect."}</TabsContent>
        <TabsContent value="reasoning"><FrameworkList items={brain.reasoning} fields={["predicts_first_attention", "predicts_second_attention", "predicts_third_attention", "explanation_required", "decision_scope"]} /></TabsContent>
        <TabsContent value="attention"><FrameworkList items={brain.attention} fields={["primary_attention_area", "secondary_attention_area", "third_attention_area", "ignored_areas", "distracting_areas", "visual_flow", "attention_path"]} /></TabsContent>
        <TabsContent value="heatmap"><FrameworkList items={brain.heatmap} fields={["rules_editable", "explanation_required"]} /></TabsContent>
        <TabsContent value="reports"><FrameworkList items={brain.reports} fields={["explanation_required"]} /></TabsContent>
        <TabsContent value="tests" className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground"><ListChecks className="mb-2 h-4 w-4 text-primary" />{brain.exams.length ? `${brain.exams.length} examination framework installed. Questions not installed.` : "No examination framework found."}</TabsContent>
        <TabsContent value="certification" className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground"><ShieldCheck className="mb-2 h-4 w-4 text-primary" />Certification cannot be automatic. Human Vision remains Training until it passes an exam.</TabsContent>
        <TabsContent value="history" className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground"><GitBranch className="mb-2 h-4 w-4 text-primary" />{brain.versions.length ? brain.versions.map(v => <p key={v.id}>{v.version}: {v.summary}</p>) : "No version entries yet."}</TabsContent>
      </Tabs>
    </div>
  );
}