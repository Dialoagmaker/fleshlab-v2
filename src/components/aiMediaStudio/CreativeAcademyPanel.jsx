import { AlertTriangle, BookOpen, CheckCircle2, CircleDashed, GraduationCap, Library, Network, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CREATIVE_ACADEMY_SYSTEMS } from "@/lib/aiMediaStudio/creativeAcademy";
import { useCreativeAcademy } from "@/hooks/useCreativeAcademy";
import HumanVisionBrainPanel from "./HumanVisionBrainPanel";

const statusIcons = {
  installed: CheckCircle2,
  missing: AlertTriangle,
  training: CircleDashed,
  certified: ShieldCheck
};

function StatusBadge({ status }) {
  const label = status ? status[0].toUpperCase() + status.slice(1) : "Missing";
  return <Badge variant={status === "certified" ? "outline" : "secondary"}>{label}</Badge>;
}

export default function CreativeAcademyPanel() {
  const { modules, loading, installing, error, renderingGate, installLessonZeroPlaceholders } = useCreativeAcademy();
  const counts = modules.reduce((acc, module) => ({ ...acc, [module.status]: (acc[module.status] || 0) + 1 }), {});

  return (
    <Card className="border-primary/25 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
          <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" />Creative Academy · Lesson Zero</span>
          <StatusBadge status={renderingGate.ready ? "certified" : "missing"} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-lg border border-border bg-background/70 p-4">
          <p className="font-bold text-foreground">{renderingGate.message}</p>
          <p className="mt-1 text-muted-foreground">Rendering is isolated until every required module is installed, trained, examined, and certified. No creative expertise is assumed.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">Installed {counts.installed || 0}</Badge>
            <Badge variant="secondary">Missing {counts.missing || 0}</Badge>
            <Badge variant="secondary">Training {counts.training || 0}</Badge>
            <Badge variant="secondary">Certified {counts.certified || 0}</Badge>
          </div>
        </div>

        <HumanVisionBrainPanel />

        <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map(module => {
              const Icon = statusIcons[module.status] || AlertTriangle;
              return (
                <div key={module.slug} className="rounded-lg border border-border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between gap-2"><Icon className="h-4 w-4 text-primary" /><StatusBadge status={module.status} /></div>
                  <p className="font-semibold text-foreground">{module.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">v{module.version || "0.0.0"} · {Math.round(module.training_progress || 0)}% trained</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card p-3">
            <p className="flex items-center gap-2 font-semibold text-foreground"><Library className="h-4 w-4 text-primary" />Waiting for training</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              {CREATIVE_ACADEMY_SYSTEMS.map(system => <div key={system} className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" />{system}</div>)}
            </div>
            <div className="rounded-md border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-2 font-semibold text-foreground"><Network className="h-3.5 w-3.5 text-primary" />Future lesson interface</p>
              <p className="mt-1">Lessons will install module records, references, rules, examples, exams, quality scores, dependencies, certifications, and version entries.</p>
            </div>
            <Button onClick={installLessonZeroPlaceholders} disabled={loading || installing} variant="outline" className="w-full">{installing ? "Installing..." : "Install Lesson Zero placeholders"}</Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}