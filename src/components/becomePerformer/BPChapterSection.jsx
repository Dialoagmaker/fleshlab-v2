export default function BPChapterSection({ number, eyebrow, question, answer, children, tone = "rose" }) {
  const toneClasses = tone === "purple"
    ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
    : tone === "amber"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-rose-500/30 bg-rose-500/10 text-rose-300";

  const sectionBg = tone === "purple"
    ? "bg-[radial-gradient(circle_at_86%_8%,rgba(168,85,247,0.12),transparent_28%),linear-gradient(180deg,#090909,#0d0710)]"
    : tone === "amber"
      ? "bg-[radial-gradient(circle_at_12%_0%,rgba(245,158,11,0.11),transparent_28%),linear-gradient(180deg,#080808,#100909)]"
      : "bg-[radial-gradient(circle_at_88%_0%,rgba(244,63,94,0.12),transparent_30%),linear-gradient(180deg,#080808,#0b0b0b)]";

  return (
    <section className={`relative overflow-hidden border-t border-white/10 px-5 py-28 md:px-6 md:py-32 ${sectionBg}`}>
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/24 to-transparent" />
      <div className="pointer-events-none absolute right-4 top-8 hidden text-[140px] font-black leading-none text-white/[0.025] lg:block">{number}</div>
      <div className="relative mx-auto max-w-[1280px]">
        <div className="mb-14 grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className={`mb-6 inline-flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.24em] ${toneClasses}`}>
              <span>Chapter {number}</span>
              <span>{eyebrow}</span>
            </div>
            <h2 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-tight text-white md:text-6xl">
              {question}
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-relaxed text-white/58 lg:ml-auto">
            {answer}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}