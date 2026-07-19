import { CheckCircle2, FileText, HandHeart, Lock, ShieldCheck, UserCheck } from "lucide-react";

const icons = { id: ShieldCheck, privacy: Lock, consent: HandHeart, contracts: FileText, control: UserCheck, approval: CheckCircle2 };

export const TRUST_ITEMS = {
  id: { title: "Why ID verification exists", text: "It protects every creator and confirms everyone involved is legally 18+ before production or publishing." },
  privacy: { title: "Your privacy matters", text: "Your real identity is reviewed privately and is never used as public promotion." },
  consent: { title: "Consent comes first", text: "Boundaries, content approval and performer comfort are part of the process before anything moves forward." },
  contracts: { title: "Contracts protect you", text: "Rights, revenue, publishing approval and responsibilities are clarified before public release." },
  control: { title: "You stay in control", text: "FLESHLAB is content production — no escorting, no dating, no private pressure." },
  approval: { title: "Nothing goes live without approval", text: "Private review material is used to evaluate fit. Publishing requires verification, contract and consent." },
};

export default function RecruitmentTrustCard({ type = "privacy", compact = false }) {
  const item = TRUST_ITEMS[type] || TRUST_ITEMS.privacy;
  const Icon = icons[type] || Lock;
  return (
    <div className={`rounded-2xl border border-primary/20 bg-primary/8 ${compact ? "p-4" : "p-5"}`}>
      <div className="mb-2 flex items-center gap-2 text-primary"><Icon className="h-4 w-4" /><h4 className="text-xs font-black uppercase tracking-[0.18em]">{item.title}</h4></div>
      <p className="text-xs leading-6 text-muted-foreground">{item.text}</p>
    </div>
  );
}