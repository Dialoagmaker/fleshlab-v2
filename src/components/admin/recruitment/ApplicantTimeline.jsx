import { CalendarClock, Circle } from "lucide-react";

const toneClass = {
  success: "text-green-400 border-green-500/30 bg-green-500/10",
  warning: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  danger: "text-red-400 border-red-500/30 bg-red-500/10",
  info: "text-primary border-primary/30 bg-primary/10",
  neutral: "text-muted-foreground border-border bg-muted/20",
};

export default function ApplicantTimeline({ profile }) {
  if (!profile) return null;
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-5 flex items-center gap-3"><CalendarClock className="h-5 w-5 text-primary" /><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Applicant timeline</p><h2 className="text-xl font-black text-foreground">{profile.name}</h2></div></div>
      <div className="space-y-3">
        {profile.timeline.length ? profile.timeline.map((item) => <div key={`${item.label}-${item.date}`} className="grid grid-cols-[20px_1fr] gap-3"><div className="pt-1"><Circle className={`h-3 w-3 rounded-full ${toneClass[item.tone] || toneClass.neutral}`} /></div><div className="rounded-xl border border-border bg-background/35 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-foreground">{item.label}</h3><time className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</time></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p></div></div>) : <p className="text-sm text-muted-foreground">No timeline events yet.</p>}
      </div>
    </section>
  );
}