import { CheckCircle2 } from "lucide-react";

import { CheckCircle2 } from "lucide-react";

export default function RevenueModelsSection() {
  return (
    <section className="py-16 md:py-20 border-b border-white/6 bg-[#0a0505]">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-4 text-center">
          Choose the Model That Fits You
        </h2>
        <p className="text-white/50 text-center max-w-2xl mx-auto mb-12">
          Two revenue-share models designed for different creator needs and experience levels.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Management Model */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 relative">
            <div className="absolute top-4 right-4 text-[10px] font-bold bg-white/10 text-white/60 px-2 py-1 rounded-full uppercase tracking-wider">
              Studio-Managed
            </div>
            <h3 className="text-xl font-black text-white mb-2">Management / Build-Up Model</h3>
            <p className="text-white/50 text-sm mb-6">
              For creators who want FLESHLAB to help with management, production coordination, distribution, positioning, and growth support.
            </p>
            <div className="bg-rose-600/10 border border-rose-600/20 rounded-lg p-4 mb-6">
              <div className="text-3xl font-black text-rose-400 mb-1">60% / 40%</div>
              <div className="text-white/60 text-sm">Studio / Performer revenue split</div>
            </div>
            <ul className="space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>Full management support</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>Production coordination</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>Distribution strategy</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>Growth & positioning support</span>
              </li>
            </ul>
          </div>

          {/* Network Model */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 relative">
            <div className="absolute top-4 right-4 text-[10px] font-bold bg-rose-600/20 text-rose-400 px-2 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="text-xl font-black text-white mb-2">Network / Distribution Model</h3>
            <p className="text-white/50 text-sm mb-6">
              For creators who already have a fanbase or content workflow and mainly want network/distribution support.
            </p>
            <div className="bg-emerald-600/10 border border-emerald-600/20 rounded-lg p-4 mb-6">
              <div className="text-3xl font-black text-emerald-400 mb-1">70% / 30%</div>
              <div className="text-white/60 text-sm">Performer / Studio revenue split</div>
            </div>
            <ul className="space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Network distribution support</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Keep majority of revenue</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Use existing content workflow</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Leverage existing fanbase</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}