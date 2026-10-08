const OFFERS = [
  "Performer profile setup",
  "Content planning",
  "Scene and boundary planning",
  "Solo and partner production planning",
  "Remote production support",
  "Thumbnails, titles and descriptions",
  "Promo assets",
  "Fanclub setup",
  "PPV / premium video sales",
  "FapHouse and partner platform distribution",
  "Livecam strategy and promotion",
  "Contracts and releases",
  "18+ compliance and ID verification",
  "Earnings tracking",
];

export default function BPWhatIsFleshlab() {
  return (
    <section className="py-24 px-6 border-t border-white/6">
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-14 items-start">
        <div>
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
            WHAT IS<br />
            <span className="text-rose-500">FLESHLAB?</span>
          </h2>
          <div className="space-y-4 text-white/55 text-lg leading-relaxed">
            <p>FLESHLAB is an adult studio and performer network for verified 18+ performers.</p>
            <p>We help performers build professional adult profiles, produce content, publish scenes, launch fanclubs, sell videos, distribute content across partner platforms and track earnings.</p>
            <p className="text-white/35 text-sm italic border-l-2 border-rose-800/50 pl-4">
              We are not an escort, dating or private meeting service. FLESHLAB is about adult content production, performer development, fanclub access, PPV, platform distribution and monetization.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">
            WHAT WE DO<br />
            <span className="text-rose-500">FOR YOU</span>
          </h2>
          <p className="text-white/45 text-base mb-6">
            You bring the body, the performance and the willingness to work. We help build the structure around you.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {OFFERS.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#111] border border-white/6 rounded-lg px-3 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500/70 shrink-0" />
                <span className="text-white/60 text-xs">{item}</span>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-rose-600/12 to-transparent border border-rose-600/25 rounded-xl px-5 py-4">
            <p className="text-rose-300/80 font-bold text-base">
              You perform. We help turn it into a monetized adult performer brand.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}