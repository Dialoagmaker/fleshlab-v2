const steps = [
  ["01", "Apply"],
  ["02", "Verification"],
  ["03", "First Shoot"],
  ["04", "Earn Together"],
];

export default function CreatorJourney() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-32 lg:px-14">
      <div className="rounded-[42px] border border-white/10 bg-[#0d0d0d] p-8 md:p-12 lg:p-16">
        <p className="mb-5 text-[11px] font-black uppercase tracking-[0.34em] text-[#E51D2A]">Creator journey</p>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-6xl font-black uppercase leading-[0.82] tracking-[-0.08em] text-white md:text-8xl">Your story<br />starts here.</h2>
          <a href="/become-performer" className="inline-flex h-14 w-fit items-center justify-center rounded-full bg-[#E51D2A] px-8 text-sm font-black uppercase tracking-wide text-white transition duration-500 hover:scale-[1.02] hover:bg-[#c91822]">Become a Creator</a>
        </div>
        <div className="mt-14 grid gap-4 lg:grid-cols-4">
          {steps.map(([number, title], index) => (
            <div key={title} className="group flex min-h-[190px] flex-col justify-between rounded-[28px] border border-white/10 bg-[#050505] p-7 transition duration-700 hover:-translate-y-1 hover:border-[#E51D2A]/40">
              <div className="flex items-center justify-between text-white/42"><span className="text-sm font-black tracking-[0.22em]">{number}</span>{index < steps.length - 1 && <span className="text-3xl transition duration-700 group-hover:translate-x-1">↓</span>}</div>
              <h3 className="text-3xl font-black uppercase leading-none tracking-[-0.05em] text-white md:text-4xl">{title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}