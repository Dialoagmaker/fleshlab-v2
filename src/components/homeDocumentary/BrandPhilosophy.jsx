const cards = [
  ["Ordinary Men", "Students. Workers.", "Neighbors. Friends."],
  ["Private Rooms", "Hotels. Bedrooms.", "Late night messages."],
  ["No Performance", "No pornstar attitude.", "Just real lust."],
];

export default function BrandPhilosophy() {
  return (
    <section className="border-y border-white/10 bg-[#050505] px-5 py-24 text-white md:px-10 md:py-32 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <p className="mb-8 text-[11px] font-black uppercase tracking-[0.34em] text-[#E51D2A]">The whisper</p>
        <h2 className="max-w-6xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.075em] md:text-7xl lg:text-8xl">
          Real fantasy.<br />Because it really happened.
        </h2>
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {cards.map(([title, lineOne, lineTwo]) => (
            <div key={title} className="min-h-[300px] rounded-[34px] border border-white/10 bg-[#0d0d0d] p-8 transition duration-700 hover:-translate-y-1 hover:border-white/24 hover:bg-[#121212]">
              <h3 className="text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white md:text-5xl">{title}</h3>
              <p className="mt-10 text-xl leading-relaxed text-white/58">{lineOne}<br />{lineTwo}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}