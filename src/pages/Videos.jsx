import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { callPublicFunction } from "@/lib/publicApi";
import VideoCard from "@/components/public/VideoCard";
import VideoCollectionRail from "@/components/public/VideoCollectionRail";
import CinematicFeaturedProduction from "@/components/platform/CinematicFeaturedProduction";
import CreatorHeroRail from "@/components/platform/CreatorHeroRail";
import SEOMeta from "@/components/SEOMeta";
import { Film, AlertCircle } from "lucide-react";

async function fetchCollections() {
  return callPublicFunction("getPublicCollections", {});
}

export default function Videos() {
  const [searchParams] = useSearchParams();
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const { data, isLoading, error } = useQuery({ queryKey: ["public-video-collections"], queryFn: fetchCollections, retry: 0 });
  const collections = data?.collections || [];
  const performers = data?.performers || [];
  const allVideos = collections.flatMap((c) => c.videos || []);
  const uniqueVideos = Array.from(new Map(allVideos.map((v) => [v.id, v])).values());
  const visibleVideos = search ? uniqueVideos.filter((v) => [v.title, v.description, ...(v.tags || [])].join(" ").toLowerCase().includes(search)) : uniqueVideos;
  const featuredVideo = uniqueVideos.find((video) => video.featured) || uniqueVideos[0];

  return (
    <>
      <SEOMeta title="FLESHLAB Video Library | Curated Series and Collections" description="Browse FLESHLAB productions by curated series, settings, formats and archive collections." canonical="/videos" jsonLd={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "FLESHLAB Video Library" }} />
      <div className="min-h-screen bg-[#040608] px-4 py-8 text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(240,24,61,0.12),transparent_30%),radial-gradient(circle_at_85%_22%,rgba(255,255,255,0.06),transparent_24%)]" />
        <div className="relative mx-auto max-w-[1440px] space-y-12">
          {isLoading ? (
            <div className="space-y-8"><div className="h-[560px] animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.035]" /><div className="h-72 animate-pulse rounded-[2rem] bg-white/[0.035]" /></div>
          ) : error ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-10 text-center"><AlertCircle className="mx-auto mb-3 h-10 w-10 text-[#f0183d]" />Could not load the video library.</div>
          ) : uniqueVideos.length ? (
            <>
              <CinematicFeaturedProduction video={featuredVideo} />
              {search ? (
                <section className="space-y-5">
                  <div><p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#f0183d]">Search results</p><h1 className="fl-condensed mt-2 text-[58px] uppercase leading-none tracking-[-0.02em]">Matching productions</h1></div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleVideos.map((video) => <VideoCard key={video.id} video={video} performers={performers} />)}</div>
                </section>
              ) : (
                <section id="collections" className="space-y-12">
                  <div className="max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#f0183d]">Curated library</p><h1 className="fl-condensed mt-2 text-[58px] uppercase leading-none tracking-[-0.02em]">Productions, series and archive worlds.</h1><p className="mt-3 text-base leading-7 text-white/52">The catalogue is organized around recognizable FLESHLAB formats and settings, not just performer profiles.</p></div>
                  {collections.map((collection) => <VideoCollectionRail key={`${collection.type}-${collection.slug}`} collection={collection} performers={performers} />)}
                </section>
              )}
              <CreatorHeroRail performers={performers} />
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-16 text-center"><Film className="mx-auto mb-4 h-12 w-12 text-white/30" /><h2 className="text-xl font-bold">No public collections yet</h2><p className="mt-2 text-white/50">Approved category assignments will appear here automatically.</p></div>
          )}
        </div>
      </div>
    </>
  );
}
