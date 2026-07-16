import StoryPoster from "./StoryPoster";

export default function DocumentaryRail({ videos = [], performers = [] }) {
  const releases = videos.slice(0, 6);
  if (!releases.length) return null;

  return (
    <section id="episodes" className="px-5 py-24 md:px-10 md:py-32 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">Featured releases</p>
        <h2 className="mb-12 text-4xl font-black uppercase leading-[0.88] tracking-[-0.055em] text-white md:text-6xl">FLESHLAB releases.</h2>
        <div className="grid grid-flow-col auto-cols-[82%] gap-6 overflow-x-auto pb-5 [scrollbar-width:none] sm:auto-cols-[46%] lg:auto-cols-[31%]">
          {releases.map((video, index) => {
            const performer = performers[index % Math.max(performers.length, 1)];
            return <StoryPoster key={video.id || video.slug || index} title={video.title || "FLESHLAB RELEASE"} label={performer?.display_name || "FLESHLAB"} video={video} href={video?.slug ? `/videos/${video.slug}` : "/videos"} />;
          })}
        </div>
      </div>
    </section>
  );
}