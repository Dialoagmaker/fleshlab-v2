import { Brain, Clock3, MessageSquare, Target, TriangleAlert } from "lucide-react";

export default function RecruiterCopilotPanel({ profile }) {
  if (!profile) return null;
  return (
    <section className="rounded-2xl border border-primary/25 bg-card p-5 shadow-xl shadow-primary/5">
      <div className="mb-5 flex items-center gap-3"><Brain className="h-5 w-5 text-primary" /><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Recruiter co-pilot</p><h2 className="text-xl font-black text-foreground">Recommended decision support</h2></div></div>
      <div className="grid gap-3 sm:grid-cols-3"><Score label="Confidence" value={profile.score} /><Score label="Approval likelihood" value={profile.approvalLikelihood} /><Score label="Production likelihood" value={profile.productionLikelihood} /></div>
      <div className="mt-4 grid gap-3"><Info Icon={Target} label="Next action" value={profile.nextAction} /><Info Icon={MessageSquare} label="Recommended tone" value={profile.tone} /><Info Icon={Clock3} label="Follow-up timing" value={profile.followUp} /><Info Icon={TriangleAlert} label="Concerns" value={profile.concerns.length ? profile.concerns.join(" · ") : "No major concern detected."} /><Info Icon={TriangleAlert} label="Missing information" value={profile.missing.length ? profile.missing.join(" · ") : "No critical missing information."} /></div>
      <div className="mt-4 rounded-xl border border-border bg-background/35 p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Suggested follow-up</p><p className="mt-2 text-sm leading-6 text-foreground">Hi {profile.name.split(" ")[0]}, thanks for starting with FLESHLAB. The next useful step is: {profile.nextAction} If you have privacy or verification concerns, I can explain exactly what is reviewed before anything moves forward.</p></div>
    </section>
  );
}

function Score({ label, value }) {
  return <div className="rounded-xl border border-border bg-background/35 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black text-primary">{value}%</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} /></div></div>;
}

function Info({ Icon, label, value }) {
  return <div className="flex gap-3 rounded-xl border border-border bg-background/35 p-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-sm leading-5 text-foreground">{value}</p></div></div>;
}