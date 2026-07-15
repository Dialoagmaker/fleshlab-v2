export default function RecruitmentSection({ eyebrow, title, intro, children, className = "" }) {
  return (
    <section className={`mx-auto max-w-[1440px] px-5 py-14 md:px-10 lg:px-14 lg:py-20 ${className}`}>
      <div className="mb-10 max-w-4xl">
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">{eyebrow}</p>
        <h2 className="text-4xl font-black uppercase leading-[0.88] tracking-[-0.06em] text-white md:text-6xl">{title}</h2>
        {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/64">{intro}</p>}
      </div>
      {children}
    </section>
  );
}