import StoryPerformerCard from "@/components/public/StoryPerformerCard";

export default function PerformerDiscoverySection({ eyebrow, title, subtitle, performers = [], badge, featured = false }) {
  if (!performers.length) return null;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f0183d]">{eyebrow}</p>}
          <h2 className="fl-condensed mt-2 text-[52px] uppercase leading-none tracking-[-0.02em] text-white">{title}</h2>
          {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">{subtitle}</p>}
        </div>
      </div>
      <div className={featured ? "grid grid-cols-1" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"}>
        {performers.map((performer, index) => <StoryPerformerCard key={performer.id} performer={performer} badge={badge} featured={featured} imageVariant={index} />)}
      </div>
    </section>
  );
}