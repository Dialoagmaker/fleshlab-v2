import VideoTile from "@/components/homeTube/VideoTile";
import PerformerPill from "@/components/homeTube/PerformerPill";

export default function DocumentaryArchive({ videos = [], performers = [], articles = [] }) {
  return (
    <section className="border-t border-white/10 px-5 py-16 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">Archive</p>
        <h2 className="mb-8 text-5xl font-black uppercase leading-[0.84] tracking-[-0.07em] text-white md:text-7xl">Keep scrolling.</h2>
        <div className="grid grid-flow-col auto-cols-[82%] gap-5 overflow-x-auto pb-8 [scrollbar-width:none] sm:auto-cols-[45%] lg:grid-flow-row lg:grid-cols-5 lg:overflow-visible">
          {videos.slice(0, 5).map((video, index) => <VideoTile key={video.id || index} video={video} label={index === 0 ? "Featured" : "Episode"} />)}
        </div>
        <div className="grid grid-flow-col auto-cols-[76%] gap-5 overflow-x-auto pb-8 [scrollbar-width:none] sm:auto-cols-[42%] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible">
          {performers.slice(0, 4).map((performer, index) => <PerformerPill key={performer.id || index} performer={performer} />)}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {articles.slice(0, 3).map((article) => <a key={article.id || article.slug} href={`/news/${article.slug}`} className="group min-h-[220px] border border-white/10 bg-[#0d0d0d] p-6 transition hover:border-[#E51D2A]/50"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#E51D2A]">Studio journal</p><h3 className="mt-4 text-3xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-white">{article.title}</h3></a>)}
        </div>
      </div>
    </section>
  );
}