import { BarChart3, CalendarDays, Clapperboard, Crown, DollarSign, Library, LayoutDashboard, Route } from "lucide-react";

const previews = [
  ["Creator Dashboard", "Next milestone", "Verification available", LayoutDashboard],
  ["Content Library", "3 drafts", "Awaiting review", Library],
  ["Analytics", "Top signal", "Completion rate", BarChart3],
  ["Revenue Tracking", "Illustration", "$0 → first payout", DollarSign],
  ["Production Planner", "This week", "2 scene ideas", CalendarDays],
  ["Creator Roadmap", "Current stage", "Private review", Route],
  ["Fanclub", "Future module", "Recurring supporters", Crown],
  ["PPV", "Future module", "Premium unlocks", Clapperboard],
];

export default function ProductPreviewCards() {
  return (
    <div className="rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/10 to-card p-6 md:p-8">
      <div className="mb-7"><p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Illustrative product preview</p><h3 className="mt-2 text-2xl font-black text-foreground">What support looks like after approval</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Example data only. These previews show the type of tools creators use once they move from review into active production.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {previews.map(([title, label, value, Icon]) => (
          <div key={title} className="rounded-2xl border border-border bg-background/45 p-4">
            <Icon className="mb-5 h-5 w-5 text-primary" />
            <h4 className="text-sm font-black text-foreground">{title}</h4>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-bold text-primary">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}