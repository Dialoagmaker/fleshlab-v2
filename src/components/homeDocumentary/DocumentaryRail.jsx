import StoryPoster from "./StoryPoster";

const titles = ["THE FIRST DAY", "BEFORE CAMERA", "AFTER WORK", "ONE NIGHT IN CEBU", "THE FIRST PAYOUT", "WHY I CAME BACK"];

export default function DocumentaryRail({ videos = [], performers = [] }) {
  return (
    <section id="episodes" className="px-5 py-16 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">Stories, not features</p>
        <h2 className="mb-8 text-5xl font-black uppercase leading-[0.84] tracking-[-0.07em] text-white md:text-7xl">Enter the world.</h2>
        <div className="grid grid-flow-col auto-cols-[82%] gap-5 overflow-x-auto pb-4 [scrollbar-width:none] sm:auto-cols-[46%] lg:auto-cols-[31%]">
          {titles.map((title, index) => {
            const performer = performers[index % Math.max(performers.length, 1)];
            const video = videos[index % Math.max(videos.length, 1)];
            return <StoryPoster key={title} title={title} label={performer?.display_name || "FLESHLAB episode"} image={performer?.cover_image_url || performer?.profile_image_url} video={video} href={performer?.slug ? `/performers/${performer.slug}` : video?.slug ? `/videos/${video.slug}` : "/become-performer"} />;
          })}
        </div>
      </div>
    </section>
  );
}