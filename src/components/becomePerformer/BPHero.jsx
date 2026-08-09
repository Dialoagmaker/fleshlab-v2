import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Lock, Film } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const EARNINGS_STEPS = [0, 50, 200, 500, 1000, 2000];
const isAtMax = (idx) => idx >= EARNINGS_STEPS.length - 1;

export default function BPHero({ onApplyClick, onEarnClick }) {
  const [earningsIdx, setEarningsIdx] = useState(0);
  const [displayVal, setDisplayVal] = useState(0);
  const [showPlus, setShowPlus] = useState(false);

  const handleApplyClick = () => {
    trackEvent('performer_apply_click', {
      cta_label: 'Start application',
      cta_location: 'hero',
      landing_page_type: 'become_performer',
    });
    if (onApplyClick) onApplyClick();
  };

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
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-fl-background">
      <img
        src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-fl-background via-fl-background/92 to-fl-background/52" />
      <div className="absolute inset-0 bg-gradient-to-t from-fl-background via-transparent to-fl-background/45" />
      <div className="absolute bottom-0 left-0 h-[300px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative mx-auto w-full max-w-[1280px] px-6 py-28">
        <div className="max-w-[680px]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
            <Film className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">FLESHLAB Performer Casting — Now Open</span>
          </div>

          <h1 className="mb-6 text-5xl font-black leading-[0.92] tracking-tighter text-foreground sm:text-6xl md:text-8xl">
            MAKE MONEY<br />
            <span className="text-primary">WITH YOUR</span><br />
            BODY.
          </h1>

          <p className="mb-3 max-w-[560px] text-lg leading-relaxed text-foreground/72 md:text-xl">
            Become a verified 18+ gay/adult content creator or performer. FLESHLAB helps turn your body, confidence and energy into paid scenes, fanclub access, PPV sales, livecam and distribution.
          </p>
          <p className="mb-8 max-w-[480px] text-base leading-relaxed text-muted-foreground">
            One video can become the start of a performer brand.
          </p>

          <div className="mb-9">
            <div className="inline-flex flex-col items-start rounded-2xl border border-primary/20 bg-fl-overlay/50 px-6 py-4 backdrop-blur-sm">
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Income can grow to</div>
              <div className="flex items-baseline gap-1">
                <span className="tabular-nums text-5xl font-black text-primary transition-all">
                  ${displayVal.toLocaleString()}
                </span>
                <span className={`text-4xl font-black text-primary transition-opacity duration-300 ${showPlus ? "opacity-100" : "opacity-0"}`}>+</span>
                <span className="ml-1 text-sm text-muted-foreground">/ month</span>
              </div>
              <div className="mt-2 flex gap-1.5">
                {EARNINGS_STEPS.map((v, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= earningsIdx % EARNINGS_STEPS.length ? "w-5 bg-primary" : "w-3 bg-border"}`} />
                ))}
              </div>
              <p className="mt-2 max-w-[280px] text-[10px] leading-relaxed text-muted-foreground/70">
                Earnings depend on content, activity and audience demand.
              </p>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={handleApplyClick} className="h-auto min-h-14 rounded-xl bg-primary px-10 py-5 text-base font-black uppercase tracking-wide text-primary-foreground shadow-xl shadow-primary/35 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary">
              Start private intake
            </Button>
            <Button size="lg" variant="outline" onClick={onEarnClick} className="h-auto min-h-14 rounded-xl border-border px-8 py-5 text-base font-semibold text-foreground hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary/50">
              See how you earn
            </Button>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 shrink-0 text-primary" />Verified 18+ only</span>
            <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 shrink-0 text-primary" />Contracts included</span>
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 shrink-0 text-primary" />Private data handling</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 shrink-0 text-primary" />No escort · No dating</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {["Scenes", "Fanclub", "PPV", "Livecam", "Platform distribution"].map(f => (
              <span key={f} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">{f}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}