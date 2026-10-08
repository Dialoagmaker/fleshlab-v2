const SUCCESS_FACTORS = [
  "How often you produce content",
  "How interesting your scenes are",
  "How viewers react to your look and performance",
  "How open and reliable you are",
  "How fast your followers grow",
  "Whether you build a clear niche",
  "How well you use livecam, fanclub and collaborations",
];

export default function BPRealityCheck() {
  return (
    <section className="py-24 px-6 border-t border-white/6">
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-14 items-start">
        <div>
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-white leading-tight">
            NOT EVERY PERFORMER<br />
            <span className="text-rose-500">BECOMES A PORN STAR.</span>
          </h2>
          <p className="text-white/55 text-lg leading-relaxed mb-5">
            This is adult entertainment, not magic money. Some performers start at zero. Some make $25–$30 in a 3-hour livecam show. Others need time to prove themselves, learn the camera and build followers.
          </p>
          <p className="text-white/55 text-lg leading-relaxed mb-5">
            FLESHLAB can position you, promote you, publish your content and help you monetize — but we cannot guarantee big earnings.
          </p>

          <h3 className="text-white font-black text-lg mb-4 uppercase tracking-wide">Your success depends on:</h3>
          <ul className="space-y-3">
            {SUCCESS_FACTORS.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-600/15 border border-rose-600/25 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-rose-400 text-[10px] font-black">{i + 1}</span>
                </div>
                <span className="text-white/60 text-base">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gradient-to-br from-[#1a0a0a] to-[#0f0505] border border-rose-800/30 rounded-3xl p-8">
          <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-600/25 rounded-full px-3 py-1 mb-5">
            <span className="text-rose-300 text-xs font-bold uppercase tracking-widest">Studio Tip</span>
          </div>
          <p className="text-white/70 text-lg leading-relaxed mb-6">
            Sexual openness, fantasy, confidence and reliability are a big plus. You do not need to do everything — your boundaries matter.
          </p>
          <p className="text-white font-semibold text-lg leading-relaxed">
            But performers who are sexually open, creative with scene ideas and consistent usually have stronger chances to grow.
          </p>

          <div className="mt-8 space-y-4">
            <div className="bg-rose-600/10 border border-rose-600/25 rounded-xl p-4">
              <div className="text-rose-400 font-black text-xl mb-1">20+ full videos / month</div>
              <div className="text-white/55 text-sm leading-relaxed">Minimum 20 minutes each — with story, sexual energy and viewer appeal.</div>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              In the first months, serious performers should build aggressively: 20+ full productions per month, minimum 20 minutes each. Every video adds another chance for views, sales, fanclub subscribers and platform reach.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: "$25–30", label: "typical 3h livecam for starters" },
                { val: "Month 3+", label: "when catalog starts to compound" },
              ].map(({ val, label }, i) => (
                <div key={i} className="bg-black/40 border border-white/8 rounded-xl p-3 text-center">
                  <div className="text-rose-400 font-black text-lg">{val}</div>
                  <div className="text-white/30 text-[10px] mt-1 leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}