export default function BPModels() {
  return (
    <section id="performer-models" className="py-24 px-6 bg-gradient-to-b from-[#080808] to-[#0d0505] border-t border-white/6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">
            CHOOSE YOUR<br />
            <span className="text-rose-500">PERFORMER MODEL</span>
          </h2>
          <p className="text-white/40 text-base max-w-lg mx-auto">
            FLESHLAB works with different types of performers. The right model depends on what you bring and how much support you need.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* Managed */}
          <div className="relative bg-gradient-to-br from-[#1e0808] via-[#150505] to-[#0d0505] border-2 border-rose-600/50 rounded-3xl p-8 flex flex-col overflow-hidden">
            <div className="absolute -top-3.5 left-7">
              <span className="bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-rose-700/40">
                New Performers
              </span>
            </div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose-600/5 blur-3xl rounded-full" />

            <div className="mt-4 mb-6">
              <div className="text-xs font-black uppercase tracking-widest text-rose-400/50 mb-2">Managed Performer</div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-rose-500">40%</span>
                <div>
                  <div className="text-white/50 text-sm font-semibold">performer share</div>
                  <div className="text-white/20 text-xs">60% studio share</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <div className="text-rose-400/50 text-[10px] font-black uppercase tracking-widest mb-1.5">Best for</div>
                <p className="text-white/60 text-sm leading-relaxed">
                  New performers, first-time adult workers or performers starting from scratch.
                </p>
              </div>
              <div>
                <div className="text-rose-400/50 text-[10px] font-black uppercase tracking-widest mb-1.5">We support</div>
                <p className="text-white/55 text-sm leading-relaxed">
                  Production planning, filming coordination, profile setup, content strategy, platform distribution, fanclub setup, promo, compliance and ongoing management.
                </p>
              </div>
            </div>

            <p className="text-white/35 text-sm italic mt-5 border-t border-white/8 pt-4">
              You bring your look, your body, your energy and your consent. We help build you.
            </p>
          </div>

          {/* Network */}
          <div className="relative bg-gradient-to-br from-[#12101e] via-[#0e0e18] to-[#0d0d0d] border-2 border-purple-600/40 rounded-3xl p-8 flex flex-col overflow-hidden">
            <div className="absolute -top-3.5 left-7">
              <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-purple-700/40">
                Established Creators
              </span>
            </div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/5 blur-3xl rounded-full" />

            <div className="mt-4 mb-6">
              <div className="text-xs font-black uppercase tracking-widest text-purple-400/50 mb-2">Network Performer</div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-purple-400">70%</span>
                <div>
                  <div className="text-white/50 text-sm font-semibold">performer share</div>
                  <div className="text-white/20 text-xs">30% studio share</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <div className="text-purple-400/50 text-[10px] font-black uppercase tracking-widest mb-1.5">Best for</div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Creators who already have content, fanbase, livecam experience, followers or existing platform activity.
                </p>
              </div>
              <div>
                <div className="text-purple-400/50 text-[10px] font-black uppercase tracking-widest mb-1.5">FLESHLAB provides</div>
                <p className="text-white/55 text-sm leading-relaxed">
                  Platform infrastructure, SEO, distribution, fanclub tools, video sales and audience growth.
                </p>
              </div>
            </div>

            <p className="text-white/35 text-sm italic mt-5 border-t border-white/8 pt-4">
              Already creating? Use our network and keep more.
            </p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-8 max-w-2xl mx-auto">
          Revenue models are reviewed and agreed during application review. Splits apply to eligible gross revenue and may differ by product type or contract.
        </p>
      </div>
    </section>
  );
}