export default function BPChapterSection({ number, eyebrow, question, answer, children, tone = "rose" }) {
  const toneClasses = tone === "purple"
    ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
    : tone === "amber"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-rose-500/30 bg-rose-500/10 text-rose-300";

  return (
    <section className="relative overflow-hidden border-t border-white/10 px-6 py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-rose-900/10 blur-[100px]" />
      <div className="relative mx-auto max-w-[1280px]">
        <div className="mb-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className={`mb-5 inline-flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.24em] ${toneClasses}`}>
              <span>{number}</span>
              <span>{eyebrow}</span>
            </div>
            <h2 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-tight text-white md:text-6xl">
              {question}
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-relaxed text-white/55 lg:ml-auto">
            {answer}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}