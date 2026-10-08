import { useState, useMemo } from "react";

const OPTION_CLASS = "px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors";
const SELECTED = "border-rose-600/60 bg-rose-600/15 text-rose-300";
const UNSELECTED = "border-white/10 bg-white/3 text-white/50 hover:border-white/25 hover:text-white/70";

function OptionGroup({ label, options, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="text-white/50 text-xs font-black uppercase tracking-widest">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`${OPTION_CLASS} ${value === opt.value ? SELECTED : UNSELECTED}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BPCalculator() {
  const [inputs, setInputs] = useState({
    cam_hours: "0",
    videos_month: "4",
    partner_month: "0",
    fanclub: "none",
    cam_exp: "beginner",
    intensity: "explicit_solo",
    quality: "good",
  });

  const set = (key, val) => setInputs(prev => ({ ...prev, [key]: val }));

  const estimate = useMemo(() => {
    // Livecam base (per week * 4 weeks)
    const camHoursMap = { "0": 0, "2": 2, "5": 5, "10": 10, "20": 20 };
    const camHours = camHoursMap[inputs.cam_hours] || 0;
    // sessions ~ 3h each
    const sessionsMonth = Math.ceil((camHours * 4) / 3);

    const expMult = { beginner: 1, some: 1.4, confident: 2 }[inputs.cam_exp] || 1;
    const intensityMult = {
      soft_tease: 0.4,
      explicit_solo: 1,
      fetish: 1.6,
      partner_show: 1.8,
      strong_niche: 2.2,
    }[inputs.intensity] || 1;

    const camLow = sessionsMonth * 8 * expMult * intensityMult;
    const camMid = sessionsMonth * 22 * expMult * intensityMult;
    const camHigh = sessionsMonth * 55 * expMult * intensityMult;

    // Video base
    const videosMap = { "0": 0, "1": 1, "4": 4, "8": 8, "15": 15, "20": 20 };
    const videos = videosMap[inputs.videos_month] || 0;
    const qMult = { basic: 0.3, good: 1, strong: 2 }[inputs.quality] || 1;
    const partnerMap = { "0": 1, "1": 1.3, "2": 1.6, "4": 2 };
    const pMult = partnerMap[inputs.partner_month] || 1;

    const vidLow = videos * 1 * qMult * pMult;
    const vidMid = videos * 5 * qMult * pMult;
    const vidHigh = videos * 15 * qMult * pMult;

    // Fanclub
    const fcMap = {
      none: [0, 0, 0],
      starter: [0, 15, 40],
      growing: [20, 60, 150],
      strong: [80, 200, 500],
    };
    const [fcLow, fcMid, fcHigh] = fcMap[inputs.fanclub] || [0, 0, 0];

    const low = Math.round(camLow + vidLow + fcLow);
    const mid = Math.round(camMid + vidMid + fcMid);
    const high = Math.round(camHigh + vidHigh + fcHigh);

    return {
      conservative: `$${low}–$${Math.round(low * 1.5)}`,
      realistic: `$${mid}–$${Math.round(mid * 1.4)}`,
      strong: `$${high}–$${Math.round(high * 1.6)}+`,
    };
  }, [inputs]);

  return (
    <section id="calculator" className="py-24 px-6 bg-gradient-to-b from-[#080808] to-[#0d0505] border-t border-white/6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-3 text-white">
            ESTIMATE YOUR<br />
            <span className="text-rose-500">EARNING POTENTIAL</span>
          </h2>
          <p className="text-white/40 text-base">Not guaranteed. Based on typical scenario ranges.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Inputs */}
          <div className="bg-[#111] border border-white/8 rounded-2xl p-7 space-y-6">
            <OptionGroup
              label="Livecam hours per week"
              options={[
                { value: "0", label: "None" },
                { value: "2", label: "2 hrs" },
                { value: "5", label: "5 hrs" },
                { value: "10", label: "10 hrs" },
                { value: "20", label: "20+ hrs" },
              ]}
              value={inputs.cam_hours}
              onChange={v => set("cam_hours", v)}
            />
            <OptionGroup
              label="Full videos per month (20+ min)"
              options={[
                { value: "0", label: "None" },
                { value: "1", label: "1" },
                { value: "4", label: "4" },
                { value: "8", label: "8" },
                { value: "15", label: "15" },
                { value: "20", label: "20+" },
              ]}
              value={inputs.videos_month}
              onChange={v => set("videos_month", v)}
            />
            <OptionGroup
              label="Partner productions per month"
              options={[
                { value: "0", label: "None" },
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "4", label: "4+" },
              ]}
              value={inputs.partner_month}
              onChange={v => set("partner_month", v)}
            />
            <OptionGroup
              label="Fanclub activity"
              options={[
                { value: "none", label: "Not yet" },
                { value: "starter", label: "Starter" },
                { value: "growing", label: "Growing" },
                { value: "strong", label: "Strong" },
              ]}
              value={inputs.fanclub}
              onChange={v => set("fanclub", v)}
            />
            <OptionGroup
              label="Cam experience"
              options={[
                { value: "beginner", label: "Beginner" },
                { value: "some", label: "Some" },
                { value: "confident", label: "Confident" },
              ]}
              value={inputs.cam_exp}
              onChange={v => set("cam_exp", v)}
            />
            <OptionGroup
              label="Show intensity / niche"
              options={[
                { value: "soft_tease", label: "Soft tease" },
                { value: "explicit_solo", label: "Explicit solo" },
                { value: "fetish", label: "Fetish/BDSM" },
                { value: "partner_show", label: "Partner shows" },
                { value: "strong_niche", label: "Strong niche" },
              ]}
              value={inputs.intensity}
              onChange={v => set("intensity", v)}
            />
            <OptionGroup
              label="Content quality / sales potential"
              options={[
                { value: "basic", label: "Basic" },
                { value: "good", label: "Good" },
                { value: "strong", label: "Strong" },
              ]}
              value={inputs.quality}
              onChange={v => set("quality", v)}
            />
          </div>

          {/* Output */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#111] border border-white/8 rounded-2xl p-7 flex-1 flex flex-col justify-center">
              <div className="text-white/30 text-xs font-black uppercase tracking-widest mb-6">Estimated monthly potential</div>

              <div className="space-y-5">
                <div className="bg-[#0d0d0d] border border-white/6 rounded-xl px-5 py-4">
                  <div className="text-white/30 text-xs font-bold uppercase mb-1">Conservative</div>
                  <div className="text-2xl font-black text-white/70">{estimate.conservative}</div>
                </div>
                <div className="bg-rose-600/8 border border-rose-600/25 rounded-xl px-5 py-4">
                  <div className="text-rose-400/60 text-xs font-bold uppercase mb-1">Realistic</div>
                  <div className="text-3xl font-black text-rose-400">{estimate.realistic}</div>
                </div>
                <div className="bg-gradient-to-br from-rose-700/12 to-purple-700/10 border border-purple-600/25 rounded-xl px-5 py-4">
                  <div className="text-purple-400/60 text-xs font-bold uppercase mb-1">Strong</div>
                  <div className="text-3xl font-black text-purple-300">{estimate.strong}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#0d0d0d] border border-white/6 rounded-2xl p-5">
              <p className="text-white/25 text-xs leading-relaxed mb-2">
                <strong className="text-white/40">This is not guaranteed income.</strong> Some performers start at zero. Earnings depend on viewer demand, your look, content quality, activity, niche, livecam consistency, fanclub growth and how strongly fans respond to you.
              </p>
              <p className="text-white/20 text-xs leading-relaxed">
                The more content you produce and the more consistently you work, the more opportunities you create for views, sales, subscribers and fan growth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}