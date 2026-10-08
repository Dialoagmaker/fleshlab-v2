import { ArrowRight, BarChart3, ClipboardCheck, FileCheck2, LineChart, Route, ShieldCheck, Sparkles, UserCheck } from "lucide-react";

const steps = [
  ["Private Intake", "Your basic fit check is saved privately.", UserCheck],
  ["Review", "A team member checks completeness, location and fit.", ClipboardCheck],
  ["Recommendation", "You receive the likely creator path before deeper verification.", Route],
  ["Verification", "ID, consent and review media are checked before approval.", ShieldCheck],
  ["Creator Plan", "The first content direction is planned around fit and boundaries.", Sparkles],
  ["Publishing", "Nothing goes live without contract and approval.", FileCheck2],
  ["Analytics", "Performance is reviewed after content starts working.", BarChart3],
  ["Growth", "The next plan is based on what performs, not guessing.", LineChart],
];

export default function CredibilityProcess() {
  return (
    <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
      <div className="mb-7 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Process transparency</p><h3 className="mt-2 text-2xl font-black text-foreground">What happens after you start</h3></div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">This is the actual review path. Some steps only unlock after the previous one is complete.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {steps.map(([title, text, Icon], index) => (
          <div key={title} className="relative rounded-2xl border border-border bg-secondary/35 p-4">
            <div className="mb-4 flex items-center justify-between"><Icon className="h-5 w-5 text-primary" /><span className="text-xs font-black text-primary">{index + 1}</span></div>
            <h4 className="text-sm font-black text-foreground">{title}</h4>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
            {index < steps.length - 1 && <ArrowRight className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-primary md:block" />}
          </div>
        ))}
      </div>
    </div>
  );
}