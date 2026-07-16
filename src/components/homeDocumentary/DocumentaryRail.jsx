import StoryPoster from "./StoryPoster";

const titles = ["FIRST TIME", "HOTEL 302", "AFTER WORK", "MASSAGE ROOM", "LATE CHECK-IN", "SECRET HOOKUPS"];

export default function DocumentaryRail({ videos = [], performers = [] }) {
  return (
    <section id="episodes" className="px-5 py-24 md:px-10 md:py-32 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">Private invitations</p>
        <h2 className="mb-12 text-6xl font-black uppercase leading-[0.84] tracking-[-0.08em] text-white md:text-8xl">Choose the fantasy.</h2>
        <div className="grid grid-flow-col auto-cols-[82%] gap-6 overflow-x-auto pb-5 [scrollbar-width:none] sm:auto-cols-[46%] lg:auto-cols-[31%]">
          {titles.map((title, index) => {
            const performer = performers[index % Math.max(performers.length, 1)];
            const video = videos[index % Math.max(videos.length, 1)];
            return <StoryPoster key={title} title={title} label={performer?.display_name || "real amateur"} image={performer?.cover_image_url || performer?.profile_image_url} video={video} href={performer?.slug ? `/performers/${performer.slug}` : video?.slug ? `/videos/${video.slug}` : "/become-performer"} />;
          })}
        </div>
      </div>
    </section>
  );
}