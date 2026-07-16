import VideoTile from "@/components/homeTube/VideoTile";
import PerformerPill from "@/components/homeTube/PerformerPill";
import MediaImage from "@/components/homeTube/MediaImage";

export default function DocumentaryArchive({ videos = [], performers = [], articles = [] }) {
  return (
    <section className="border-t border-white/10 px-5 py-24 md:px-10 md:py-32 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">Archive</p>
        <h2 className="mb-12 text-6xl font-black uppercase leading-[0.84] tracking-[-0.08em] text-white md:text-8xl">Keep scrolling.</h2>
        <div className="grid grid-flow-col auto-cols-[86%] gap-6 overflow-x-auto pb-10 [scrollbar-width:none] sm:auto-cols-[48%] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible">
          {videos.slice(0, 8).map((video, index) => <VideoTile key={video.id || index} video={video} label={index === 0 ? "Featured" : "Episode"} />)}
        </div>
        <div className="grid grid-flow-col auto-cols-[78%] gap-6 overflow-x-auto pb-12 [scrollbar-width:none] sm:auto-cols-[42%] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible">
          {performers.slice(0, 4).map((performer, index) => <PerformerPill key={performer.id || index} performer={performer} />)}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <a key={article.id || article.slug} href={`/news/${article.slug}`} className="group overflow-hidden rounded-[30px] border border-white/10 bg-[#0d0d0d] transition duration-700 hover:-translate-y-1 hover:border-[#E51D2A]/50">
              <div className="aspect-[16/11] overflow-hidden bg-[#141414]">
                <MediaImage src={article.cover_image_url} alt={article.title} className="h-full w-full opacity-82 transition duration-1000 ease-out group-hover:scale-[1.06] group-hover:opacity-68" />
              </div>
              <div className="p-7">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#E51D2A]">Studio journal</p>
                <h3 className="mt-5 text-3xl font-black uppercase leading-[0.9] tracking-[-0.055em] text-white md:text-4xl">{article.title}</h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}