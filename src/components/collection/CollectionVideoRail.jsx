import CollectionVideoCard from "@/components/collection/CollectionVideoCard";

export default function CollectionVideoRail({ eyebrow, title, subtitle, videos = [], large = false }) {
  if (!videos.length) return null;

  return (
    <section className="space-y-5">
      <div>
        {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f0183d]">{eyebrow}</p>}
        <h2 className="fl-condensed mt-2 text-[50px] uppercase leading-none tracking-[-0.02em] text-white">{title}</h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">{subtitle}</p>}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videos.map((video) => <CollectionVideoCard key={video.id} video={video} large={large} />)}
      </div>
    </section>
  );
}