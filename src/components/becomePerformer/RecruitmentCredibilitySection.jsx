import { useState } from "react";
import { ChevronDown, Clock3, UserX, UsersRound } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import CredibilityProcess from "@/components/becomePerformer/CredibilityProcess";
import ProductPreviewCards from "@/components/becomePerformer/ProductPreviewCards";

const reviewFacts = [
  ["Who reviews applications?", "A FLESHLAB team member reviews fit, completeness, age-verification readiness, communication quality and production suitability."],
  ["Typical response time", "Most complete applications are reviewed within 48 business hours. Missing media or unclear ID materials can slow review."],
  ["Why some people are not accepted", "Common reasons include incomplete verification, unclear media, age/compliance issues, unreliable communication, location limits or poor fit for current production needs."],
  ["What happens after approval", "The next steps are contract review, consent confirmation, creator profile setup and first content planning before public publishing."],
];

const faqs = [
  ["Will my intake become public?", "No. Intake details and review materials are private. Public use requires approval, verification, contract and consent."],
  ["Do I have to upload explicit media immediately?", "No. The private intake comes first. Full verification and review media are the next milestone if you choose to continue."],
  ["Can I be rejected?", "Yes. FLESHLAB reviews for compliance, professionalism, reliability and fit. This protects creators, partners and the platform."],
  ["Are earnings guaranteed?", "No. Income depends on content, activity, demand, consistency and product fit. FLESHLAB shows opportunities, not guaranteed results."],
];

function CredibilityFaq() {
  const [open, setOpen] = useState(null);
  return <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8"><p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Objections answered</p><h3 className="mt-2 text-2xl font-black text-foreground">Questions serious creators usually ask</h3><div className="mt-6 space-y-2">{faqs.map(([q, a], i) => <button key={q} type="button" onClick={() => { setOpen(open === i ? null : i); trackEvent("recruitment_credibility_faq_opened", { faq_topic: q }); }} className="w-full rounded-2xl border border-border bg-secondary/35 p-4 text-left transition hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="flex items-center justify-between gap-4 text-sm font-black text-foreground">{q}<ChevronDown className={`h-4 w-4 text-primary transition ${open === i ? "rotate-180" : ""}`} /></span>{open === i && <p className="mt-3 text-xs leading-6 text-muted-foreground">{a}</p>}</button>)}</div></div>;
}

export default function RecruitmentCredibilitySection() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5"><Clock3 className="mb-4 h-5 w-5 text-primary" /><h3 className="font-black text-foreground">48 business hours</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Typical review target for complete applications.</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><UsersRound className="mb-4 h-5 w-5 text-primary" /><h3 className="font-black text-foreground">Personally reviewed</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Applications are checked by people, not accepted automatically.</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><UserX className="mb-4 h-5 w-5 text-primary" /><h3 className="font-black text-foreground">Not everyone is accepted</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Quality, compliance and reliability matter.</p></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{reviewFacts.map(([title, text]) => <div key={title} className="rounded-2xl border border-border bg-card p-5"><h3 className="text-sm font-black text-foreground">{title}</h3><p className="mt-2 text-xs leading-6 text-muted-foreground">{text}</p></div>)}</div>
      <CredibilityProcess />
      <ProductPreviewCards />
      <CredibilityFaq />
    </div>
  );
}