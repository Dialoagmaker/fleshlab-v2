const CATALOG_MONTHS = [
  { month: "Month 1", videos: 20, bar: 20 },
  { month: "Month 2", videos: 40, bar: 40 },
  { month: "Month 3", videos: 60, bar: 60 },
  { month: "Month 4", videos: 80, bar: 80 },
  { month: "Month 5", videos: 100, bar: 100 },
];

const VIDEO_FACTORS = [
  "Face visible",
  "Strong sexual energy",
  "Real reactions / moaning / body language",
  "Clear fantasy or story",
  "Good cumshot / clear climax",
  "Clickable title and thumbnail",
  "Solo content with personality or story",
  "Partner content with sexual variety",
  "Strong niche appeal",
  "Viewer retention",
];

const GROWTH_LEVELS = [
  { label: "Starter", videos: "4–8", desc: "Full videos per month" },
  { label: "Growth", videos: "10–15", desc: "Full videos per month" },
  { label: "Build-up", videos: "Up to 20", desc: "Full videos per month" },
];

export default function BPCatalogGrowth() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-[#0d0505] to-[#080808] border-t border-white/6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">
            ONE VIDEO IS A CHANCE.<br />
            <span className="text-rose-500">A CATALOG IS A MARKET PRESENCE.</span>
          </h2>
          <p className="text-white/45 text-lg max-w-2xl mx-auto">
            Videos can earn very differently. Quality, story, sexual energy, thumbnail, viewer demand and platform performance all decide what a video earns.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mb-14">
          {/* Catalog growth chart */}
          <div className="bg-[#111] border border-white/8 rounded-2xl p-7">
            <div className="text-white/35 text-xs font-black uppercase tracking-widest mb-5">Catalog size over time</div>
            <div className="space-y-3">
              {CATALOG_MONTHS.map(({ month, videos, bar }) => (
                <div key={month} className="flex items-center gap-3">
                  <div className="w-16 text-white/40 text-xs shrink-0">{month}</div>
                  <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-700 to-rose-500 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${bar}%` }}
                    >
                      <span className="text-white text-[10px] font-black">{videos}</span>
                    </div>
                  </div>
                  <div className="w-20 text-white/25 text-xs shrink-0">{videos} videos</div>
                </div>
              ))}
            </div>
            <p className="text-white/25 text-xs mt-5 leading-relaxed">
              Each month, your new content adds to your existing catalog. Older videos keep generating views, sales and fan interest while new videos go online.
            </p>
            <div className="mt-4 bg-rose-600/8 border border-rose-600/20 rounded-xl px-4 py-3">
              <p className="text-rose-400/80 text-sm font-semibold">A full video = at least 20 minutes of content.</p>
            </div>
          </div>

          {/* Right side */}
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-black text-xl mb-4">What makes videos earn more</h3>
              <div className="grid grid-cols-2 gap-2">
                {VIDEO_FACTORS.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/50 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500/60 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <p className="text-white/35 text-xs mt-4 leading-relaxed italic">
                You do not earn just because a video exists. You earn when your content attracts viewers, keeps them watching and makes them want more.
              </p>
            </div>

            <div>
              <h3 className="text-white font-black text-xl mb-4">Recommended content output</h3>
              <div className="space-y-3">
                {GROWTH_LEVELS.map(({ label, videos, desc }, i) => (
                  <div key={i} className="flex items-center gap-4 bg-[#111] border border-white/8 rounded-xl px-4 py-3">
                    <div className="w-16 text-rose-400 font-black text-sm shrink-0">{label}</div>
                    <div className="text-white font-bold text-lg">{videos}</div>
                    <div className="text-white/35 text-xs">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-rose-600/10 to-transparent border border-rose-600/20 rounded-2xl px-7 py-5 text-center">
          <p className="text-white font-bold text-lg">
            You can earn from the first video we produce and publish —
            <span className="text-rose-400"> and every new scene adds another chance to grow.</span>
          </p>
        </div>
      </div>
    </section>
  );
}