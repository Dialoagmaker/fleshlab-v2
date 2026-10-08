import { CheckCircle2 } from "lucide-react";

const BENEFITS = [
  "Unlimited access to exclusive performer content",
  "Behind-the-scenes videos not available anywhere else",
  "Early access to new releases",
  "Direct interaction with performers",
  "Exclusive photos and updates",
  "Cancel anytime — no long-term commitment",
];

export default function FanclubBenefits({ compact = false }) {
  if (compact) {
    return (
      <div className="space-y-2">
        {BENEFITS.slice(0, 4).map((benefit, i) => (
          <div key={i} className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-white/55 text-xs">{benefit}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {BENEFITS.map((benefit, i) => (
        <div key={i} className="flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-white/60 text-sm">{benefit}</span>
        </div>
      ))}
    </div>
  );
}