import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Flame, ShieldCheck, Star, UserCheck } from "lucide-react";

const iconByBucket = {
  "High potential": Flame,
  "Becoming cold": Clock3,
  "Ready for verification": ShieldCheck,
  "Ready for production": CheckCircle2,
  "Reject / archive": AlertTriangle,
  "Review queue": UserCheck,
};

export default function RecruiterCommandCenter({ profiles, selectedId, onSelect }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-wider text-primary">Recruiter Command Center</p><h2 className="mt-1 text-2xl font-black text-foreground">Who needs me today?</h2></div>
        <Star className="h-6 w-6 text-primary" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {profiles.length ? profiles.map((profile) => {
          const Icon = iconByBucket[profile.bucket] || UserCheck;
          return (
            <button key={profile.id} onClick={() => onSelect(profile.id)} className={`rounded-xl border p-4 text-left transition hover:border-primary/50 ${selectedId === profile.id ? "border-primary bg-primary/10" : "border-border bg-background/35"}`}>
              <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div><div><h3 className="font-bold text-foreground">{profile.name}</h3><p className="text-xs text-muted-foreground">{profile.country} · {profile.path}</p></div></div><span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-black text-primary">{profile.score}</span></div>
              <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{profile.bucket}</span><span className="rounded-full border border-border px-2 py-1 text-[10px] text-muted-foreground">{profile.staleDays}d since update</span></div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{profile.nextAction}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">Select applicant <ArrowRight className="h-3 w-3" /></span>
            </button>
          );
        }) : <p className="rounded-xl border border-border bg-background/35 p-5 text-sm text-muted-foreground">No urgent recruiter actions in this range.</p>}
      </div>
    </section>
  );
}