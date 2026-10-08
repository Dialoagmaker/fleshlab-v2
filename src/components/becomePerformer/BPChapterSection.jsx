export default function BPChapterSection({ number, eyebrow, question, answer, children, tone = "primary" }) {
  const labelClasses = tone === "amber"
    ? "border-warning/25 bg-warning/10 text-warning"
    : "border-primary/30 bg-primary/10 text-primary";

  return (
    <section className="relative overflow-hidden border-t border-border bg-[radial-gradient(circle_at_86%_6%,hsl(var(--primary)/0.12),transparent_28%),linear-gradient(180deg,hsl(var(--fl-background)),hsl(var(--fl-surface)))] px-5 py-28 md:px-6 md:py-32">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="pointer-events-none absolute right-4 top-8 hidden text-[140px] font-black leading-none text-foreground/[0.025] lg:block">{number}</div>
      <div className="relative mx-auto max-w-[1280px]">
        <div className="mb-14 grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className={`mb-6 inline-flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.24em] ${labelClasses}`}>
              <span>Chapter {number}</span>
              <span>{eyebrow}</span>
            </div>
            <h2 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-tight text-foreground md:text-6xl">
              {question}
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground lg:ml-auto">
            {answer}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}