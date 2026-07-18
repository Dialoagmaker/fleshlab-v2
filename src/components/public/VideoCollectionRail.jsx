import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import VideoCard from "@/components/public/VideoCard";

export default function VideoCollectionRail({ collection, performers = [] }) {
  if (!collection?.videos?.length) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f0183d]">Collection</p>
          <h2 className="fl-condensed mt-1 text-[42px] uppercase leading-none tracking-[-0.02em] md:text-[58px]">{collection.title}</h2>
          {collection.description && <p className="mt-2 text-sm leading-6 text-white/52 md:text-base">{collection.description}</p>}
        </div>
        <Link to={`/watch/collections/${collection.slug}`} className="hidden shrink-0 items-center gap-2 rounded-full border border-white/14 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white/72 transition hover:border-[#f0183d]/60 hover:text-white md:inline-flex">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:mx-0 md:px-0">
        <div className="flex gap-4 md:gap-5">
          {collection.videos.map((video) => <div key={video.id} className="w-[78vw] max-w-[340px] shrink-0 sm:w-[330px] lg:w-[300px] xl:w-[320px]"><VideoCard video={video} performers={performers} /></div>)}
          <Link to={`/watch/collections/${collection.slug}`} className="flex min-h-[260px] w-[190px] shrink-0 flex-col justify-end rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-white/70 transition hover:border-[#f0183d]/60 hover:text-white">
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">View all</span>
            <ArrowRight className="mt-3 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}