import { Check, Crown } from "lucide-react";
import { FANCLUB_PLANS } from "@/lib/pricingConfig";

const BENEFITS = [
  "Unlock full scenes",
  "Early releases",
  "Behind the scenes",
  "Exclusive creator updates",
];

export default function OnboardingFanclubBenefits() {
  const price = FANCLUB_PLANS.fanclub_monthly.price;

  return (
    <section className="relative bg-gradient-to-br from-[#1c0808] to-[#0d0505] border border-rose-600/30 rounded-2xl p-6 md:p-8 overflow-hidden">
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[300px] h-[200px] bg-rose-700/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 bg-rose-600/15 border border-rose-600/30 rounded-full px-3 py-1 mb-3">
            <Crown className="w-3 h-3 text-rose-400" />
            <span className="text-rose-300 text-[10px] font-bold uppercase tracking-widest">Fanclub</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white mb-3">
            Unlock 80+ exclusive scenes
          </h3>
          <p className="text-white/50 text-sm mb-3">Watch everything without limits — early releases and creator updates included.</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2 text-white/60 text-sm">
                <Check className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0 flex flex-col items-center md:items-end gap-2">
          <div className="text-white/40 text-xs">from ${price}/month</div>
          <a
            href="/fanclub"
            className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-lg shadow-rose-600/25 transition-all whitespace-nowrap"
          >
            Join Fanclub
          </a>
        </div>
      </div>
    </section>
  );
}