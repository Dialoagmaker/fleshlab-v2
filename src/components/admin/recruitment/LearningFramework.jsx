import { GraduationCap, ListChecks } from "lucide-react";

const learningSignals = ["Accepted applicants who later published successfully", "Rejected applicants who later would have qualified", "Follow-up timing that restarted cold applicants", "Message tone that increased verification completion", "Creator paths that produced active creators", "Traffic sources that produced revenue-generating creators"];
const backlog = ["Connect recruiter actions to applicant outcomes", "Record follow-up channel, timing and tone", "Add production-scheduled and first-publication events", "Compare approval decisions against 30/90-day creator retention", "Train scoring weights from historical outcomes", "Add monthly recommendation digest for recruiting leadership"];

export default function LearningFramework() {
  return <section className="grid gap-6 lg:grid-cols-2"><Panel icon={GraduationCap} title="Learning framework" items={learningSignals} /><Panel icon={ListChecks} title="Production implementation backlog" items={backlog} /></section>;
}

function Panel({ icon: Icon, title, items }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><h2 className="font-black text-foreground">{title}</h2></div><ul className="space-y-2">{items.map(item => <li key={item} className="text-sm leading-6 text-muted-foreground">• {item}</li>)}</ul></div>;
}