export default function KrakenSectionTitle({ eyebrow, title, copy }) {
  return (
    <div className="mb-10 flex flex-col gap-5 md:mb-14 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && <p className="text-[11px] font-black uppercase tracking-[0.34em] text-[#E51D2A]">{eyebrow}</p>}
        <h2 className="kraken-distressed mt-3 max-w-5xl text-6xl font-black uppercase leading-[0.78] tracking-[-0.085em] text-white md:text-8xl">{title}</h2>
      </div>
      {copy && <p className="max-w-md text-base font-semibold uppercase leading-relaxed tracking-[0.06em] text-white/58">{copy}</p>}
    </div>
  );
}