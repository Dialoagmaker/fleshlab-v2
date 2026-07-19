import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SEOMeta from "@/components/SEOMeta";
import ExecutiveRecruitmentOverview from "@/components/admin/recruitment/ExecutiveRecruitmentOverview";
import RecruiterCommandCenter from "@/components/admin/recruitment/RecruiterCommandCenter";
import ApplicantTimeline from "@/components/admin/recruitment/ApplicantTimeline";
import RecruiterCopilotPanel from "@/components/admin/recruitment/RecruiterCopilotPanel";
import PipelineHealth from "@/components/admin/recruitment/PipelineHealth";
import LearningFramework from "@/components/admin/recruitment/LearningFramework";
import { buildRecruitmentWorkspace, parseEventMeta } from "@/lib/recruiterIntelligence";
import { AlertCircle, Brain, Loader2 } from "lucide-react";

export default function RecruitmentIntelligence() {
  const [days, setDays] = useState(30);
  const [selectedId, setSelectedId] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["recruiter-command-center", days],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - days * 86400000).toISOString();
      const [eventsRaw, applicationsRaw, performersRaw] = await Promise.all([
        base44.asServiceRole.entities.ConversionEvent.list("-created_date", 5000),
        base44.asServiceRole.entities.GuestProductionApplication.list("-created_date", 1000),
        base44.asServiceRole.entities.Performer.list("-created_date", 1000),
      ]);
      const events = eventsRaw.filter(e => e.created_date >= cutoff && (e.event_name?.startsWith("recruitment_") || e.event_name?.startsWith("application_"))).map(e => ({ ...e, meta: parseEventMeta(e) }));
      const applications = applicationsRaw.filter(a => a.created_date >= cutoff && (a.request_type === "performer_application" || String(a.source_page || "").includes("performer") || String(a.source_page || "").includes("creator")));
      const performers = performersRaw.filter(p => p.created_date >= cutoff || p.updated_date >= cutoff);
      return { workspace: buildRecruitmentWorkspace(applications, events, performers), dateRange: `${new Date(cutoff).toLocaleDateString()} → ${new Date().toLocaleDateString()}` };
    },
    refetchInterval: 60000,
  });

  const workspace = data?.workspace;
  const selectedProfile = useMemo(() => {
    if (!workspace?.profiles?.length) return null;
    return workspace.profiles.find(p => p.id === selectedId) || workspace.attention[0] || workspace.profiles[0];
  }, [workspace, selectedId]);

  return (
    <>
      <SEOMeta title="Recruiter Command Center — FLESHLAB Admin" noIndex={true} />
      <div className="max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Recruiter Intelligence 8.0</p>
            <h1 className="mt-1 flex items-center gap-2 text-3xl font-black text-foreground"><Brain className="h-7 w-7 text-primary" />Recruiter Operating System</h1>
            <p className="mt-1 text-sm text-muted-foreground">Decision workspace for creator acquisition · {data ? data.dateRange : "Loading..."}</p>
          </div>
          <div className="flex gap-2">{[7, 30, 90].map(d => <button key={d} onClick={() => setDays(d)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${days === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>{d}d</button>)}</div>
        </div>

        {isLoading && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
        {error && <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive"><AlertCircle className="h-5 w-5" />{error.message}</div>}

        {workspace && (
          <>
            <ExecutiveRecruitmentOverview metrics={workspace.metrics} />
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <RecruiterCommandCenter profiles={workspace.attention.length ? workspace.attention : workspace.profiles.slice(0, 10)} selectedId={selectedProfile?.id} onSelect={setSelectedId} />
              <RecruiterCopilotPanel profile={selectedProfile} />
            </div>
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <ApplicantTimeline profile={selectedProfile} />
              <PipelineHealth workspace={workspace} />
            </div>
            <LearningFramework />
          </>
        )}
      </div>
    </>
  );
}