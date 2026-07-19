import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const pathCopy = {
  beginner: { title: "Beginner creator path", text: "You can start from where you are: phone, private space, confidence, and a guided first creator roadmap." },
  existing: { title: "Network creator path", text: "You may fit a growth path focused on fanclub, distribution, catalog packaging, and stronger creator positioning." },
  cam: { title: "Live-to-fanclub path", text: "You can turn live attention into repeat fans, clips, fanclub updates, and a longer-term creator business." },
  studio: { title: "Studio production path", text: "You may fit planned productions with support around setup, consent, content strategy, and publishing." },
  couple: { title: "Couple creator path", text: "You can explore a dual-consent path with shared boundaries, dual verification, and clear production planning." },
  unsure: { title: "Discovery path", text: "You do not need to know yet. FLESHLAB can review your fit and recommend the strongest next step." },
};

export default function CreatorPathResult({ path, onVerifyClick }) {
  const copy = pathCopy[path] || pathCopy.unsure;
  return (
    <div className="rounded-[1.5rem] border border-primary/35 bg-gradient-to-br from-primary/14 to-card p-6">
      <div className="mb-4 flex items-center gap-3 text-primary"><CheckCircle2 className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-[0.22em]">Creator roadmap unlocked</span></div>
      <h3 className="text-2xl font-black text-foreground">{copy.title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{copy.text}</p>
      <Button onClick={onVerifyClick} className="mt-6 h-auto min-h-12 rounded-xl bg-primary px-6 py-3 font-black uppercase tracking-wide text-primary-foreground hover:bg-primary/90">
        Continue to verification <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}