import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VideoCard from "@/components/public/VideoCard";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";

const labels = { newest: "Newest", oldest: "Oldest", "most-viewed": "Most viewed", longest: "Longest", shortest: "Shortest" };

async function fetchCollection(slug, sort, page) {
  const res = await base44.functions.invoke("getPublicCollectionDetail", { slug, sort, page, limit: 24 });
  return res.data;
}

export default function CollectionDetail() {
  const { slug } = useParams();
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({ queryKey: ["collection-detail", slug, sort, page], queryFn: () => fetchCollection(slug, sort, page), retry: 0 });
  const collection = data?.collection;
  const videos = data?.videos || [];
  const performers = data?.performers || [];

  if (isLoading) return <div className="min-h-screen bg-[#040608] p-6 text-white"><div className="mx-auto h-[520px] max-w-[1360px] animate-pulse rounded-[2rem] bg-white/[0.035]" /></div>;
  if (error || !collection) return <div className="min-h-screen bg-[#040608] p-6 text-white"><div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.035] p-8">Collection not found.</div></div>;

  return (
    <>
      <SEOMeta title={collection.seo_title || `${collection.title} | FLESHLAB Collections`} description={collection.seo_description || collection.description || "FLESHLAB curated video collection"} canonical={`/watch/collections/${slug}`} noIndex={false} />
      <div className="min-h-screen bg-[#040608] px-4 py-8 text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(240,24,61,0.15),transparent_32%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.06),transparent_24%)]" />
        <div className="relative mx-auto max-w-[1360px] space-y-8">
          <section className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b0d] p-7 md:p-10">
            {collection.cover_image && <img src={collection.cover_image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/76 to-black/20" />
            <div className="relative flex min-h-[340px] max-w-3xl flex-col justify-end">
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#f0183d]">FLESHLAB Collection</p>
              <h1 className="fl-condensed mt-3 text-[64px] uppercase leading-[0.86] tracking-[-0.03em] md:text-[104px]">{collection.title}</h1>
              {collection.description && <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 md:text-lg">{collection.description}</p>}
              <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-white/45">{collection.video_count} videos{collection.performers?.length ? ` · ${collection.performers.map((p) => p.display_name).slice(0, 4).join(", ")}` : ""}</p>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(data?.sorting_options || ["newest", "oldest"]).map((option) => <button key={option} onClick={() => { setSort(option); setPage(1); }} className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-wide ${sort === option ? "border-[#f0183d] bg-[#f0183d] text-white" : "border-white/12 text-white/58 hover:text-white"}`}>{labels[option]}</button>)}
            </div>
            <p className="text-sm text-white/45">Only published public videos are shown.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => <VideoCard key={video.id} video={video} performers={performers} />)}
          </div>
          {data?.hasMore && <div className="text-center"><Button onClick={() => setPage((p) => p + 1)} className="bg-[#f0183d] hover:bg-[#ff3152]">Load more</Button></div>}
        </div>
      </div>
    </>
  );
}