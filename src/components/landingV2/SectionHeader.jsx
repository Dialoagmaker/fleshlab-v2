export default function SectionHeader({ eyebrow, title, text, align = "left" }) {
  return (
    <div className={`mb-10 ${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}`}>
      {eyebrow && <p className="mb-4 text-[11px] font-black uppercase tracking-[0.32em] text-[#d97d52]">{eyebrow}</p>}
      <h2 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.045em] text-white md:text-6xl">{title}</h2>
      {text && <p className="mt-5 text-base leading-7 text-white/62 md:text-lg">{text}</p>}
    </div>
  );
}