import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Lock, Film } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const EARNINGS_STEPS = [0, 50, 200, 500, 1000, 2000];
// After reaching 2000, display "$2,000+" permanently until loop restarts
const isAtMax = (idx) => idx >= EARNINGS_STEPS.length - 1;

export default function BPHero({ onApplyClick, onEarnClick }) {
  const [earningsIdx, setEarningsIdx] = useState(0);
  const [displayVal, setDisplayVal] = useState(0);
  const [showPlus, setShowPlus] = useState(false);

  // Track apply click
  const handleApplyClick = () => {
    trackEvent('performer_apply_click', {
      cta_label: 'Apply as Performer',
      cta_location: 'hero',
      landing_page_type: 'become_performer',
    });
    if (onApplyClick) onApplyClick();
  };

  // Animate the earnings counter upward through steps, then loop
  useEffect(() => {
    let frame;
    const target = EARNINGS_STEPS[earningsIdx];
    let current = earningsIdx === 0 ? 0 : EARNINGS_STEPS[earningsIdx - 1];
    setShowPlus(false);

    const step = () => {
      const diff = target - current;
      if (Math.abs(diff) < 2) {
        setDisplayVal(target);
        if (isAtMax(earningsIdx)) setShowPlus(true);
        // Pause then advance to next step
        setTimeout(() => {
          setShowPlus(false);
          setEarningsIdx(i => (i + 1) % EARNINGS_STEPS.length);
        }, isAtMax(earningsIdx) ? 3000 : 700);
        return;
      }
      current += Math.ceil(diff * 0.12);
      setDisplayVal(Math.round(current));
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [earningsIdx]);

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png)",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#080808]/92 to-[#080808]/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/40" />

      {/* Glow */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-rose-800/10 blur-[120px] rounded-full" />

      <div className="relative max-w-[1280px] mx-auto px-6 py-28 w-full">
        <div className="max-w-[680px]">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-rose-600/12 border border-rose-600/30 rounded-full px-4 py-1.5 mb-7">
            <Film className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-rose-300 text-xs font-bold uppercase tracking-widest">FLESHLAB Performer Casting — Now Open</span>
          </div>

          {/* H1 */}
          <h1 className="text-6xl md:text-8xl font-black leading-[0.92] tracking-tighter mb-6 text-white">
            MAKE MONEY<br />
            <span className="text-rose-500">WITH YOUR</span><br />
            BODY.
          </h1>

          <p className="text-lg md:text-xl text-white/65 leading-relaxed mb-3 max-w-[540px]">
            You bring the body, the performance and the sexual energy. FLESHLAB helps you turn it into paid adult content, fanclub access, PPV sales, livecam opportunities and platform distribution.
          </p>
          <p className="text-base text-white/40 leading-relaxed mb-8 max-w-[480px]">
            Start with your first published video. Grow with every scene, fan and subscriber.
          </p>

          {/* Earnings animation */}
          <div className="mb-9">
            <div className="inline-flex flex-col items-start bg-black/50 border border-rose-600/20 rounded-2xl px-6 py-4 backdrop-blur-sm">
              <div className="text-white/30 text-xs font-bold uppercase tracking-widest mb-1">Monthly earning potential</div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-rose-400 tabular-nums transition-all">
                  ${displayVal.toLocaleString()}
                </span>
                <span className={`text-4xl font-black text-rose-400 transition-opacity duration-300 ${showPlus ? "opacity-100" : "opacity-0"}`}>+</span>
                <span className="text-white/30 text-sm ml-1">/ month</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {EARNINGS_STEPS.map((v, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i <= earningsIdx % EARNINGS_STEPS.length
                        ? "bg-rose-500 w-5"
                        : "bg-white/10 w-3"
                    }`}
                  />
                ))}
              </div>
              <p className="text-white/20 text-[10px] mt-2 max-w-[280px] leading-relaxed">
                Some earn less. Some earn more. Earnings depend on content, activity and audience demand.
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button
              size="lg"
              onClick={handleApplyClick}
              className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black px-10 py-5 rounded-xl h-auto shadow-xl shadow-rose-700/40 text-base uppercase tracking-wide"
            >
              Apply as Performer
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onEarnClick}
              className="border-white/20 text-white hover:bg-white/8 font-semibold px-8 py-5 rounded-xl h-auto text-base"
            >
              How you earn money
            </Button>
          </div>

          {/* Trust line */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-white/30 text-xs">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-rose-500/50 shrink-0" />Verified 18+ only</span>
            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-rose-500/50 shrink-0" />Contracts included</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-rose-500/50 shrink-0" />Private data handling</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-rose-500/50 shrink-0" />No escort · No dating</span>
          </div>

          {/* Micro features */}
          <div className="flex flex-wrap gap-2 mt-5">
            {["Scenes", "Fanclub", "PPV", "Livecam", "Platform distribution"].map(f => (
              <span key={f} className="bg-white/5 border border-white/8 rounded-full px-3 py-1 text-white/40 text-xs font-medium">{f}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}