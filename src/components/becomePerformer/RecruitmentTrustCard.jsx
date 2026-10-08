import { CheckCircle2, FileText, HandHeart, Lock, ShieldCheck, UserCheck } from "lucide-react";

const icons = { id: ShieldCheck, privacy: Lock, consent: HandHeart, contracts: FileText, control: UserCheck, approval: CheckCircle2 };

export const TRUST_ITEMS = {
  id: { title: "Why ID verification exists", text: "ID is checked before approval to confirm 18+ compliance and keep every production legally protected." },
  privacy: { title: "Your privacy matters", text: "Intake details, ID and review media stay private unless a later contract and publishing approval say otherwise." },
  consent: { title: "Consent comes first", text: "Boundaries are discussed before production and publishing requires explicit agreement." },
  contracts: { title: "Contracts protect you", text: "Contracts define rights, revenue share, publishing approval and responsibilities before release." },
  control: { title: "You stay in control", text: "FLESHLAB is content production only — no escorting, no dating and no private pressure." },
  approval: { title: "Nothing goes live without approval", text: "Review media is used for fit evaluation. Public publishing requires verification, contract and consent." },
};

export default function RecruitmentTrustCard({ type = "privacy", compact = false }) {
  const item = TRUST_ITEMS[type] || TRUST_ITEMS.privacy;
  const Icon = icons[type] || Lock;
  return (
    <div className={`rounded-2xl border border-primary/20 bg-primary/10 ${compact ? "p-4" : "p-5"}`}>
      <div className="mb-2 flex items-center gap-2 text-primary"><Icon className="h-4 w-4" /><h4 className="text-xs font-black uppercase tracking-[0.18em]">{item.title}</h4></div>
      <p className="text-xs leading-6 text-muted-foreground">{item.text}</p>
    </div>
  );
}