import VideoTile from "@/components/homeTube/VideoTile";
import PerformerPill from "@/components/homeTube/PerformerPill";

export default function DocumentaryArchive({ videos = [], performers = [] }) {
  return (
    <section className="border-t border-white/10 px-5 py-24 md:px-10 md:py-32 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">More rooms</p>
        <h2 className="mb-12 text-6xl font-black uppercase leading-[0.84] tracking-[-0.08em] text-white md:text-8xl">Don't stop now.</h2>
        <div className="grid grid-flow-col auto-cols-[86%] gap-6 overflow-x-auto pb-10 [scrollbar-width:none] sm:auto-cols-[48%] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible">
          {videos.slice(0, 8).map((video, index) => <VideoTile key={video.id || index} video={video} label={index === 0 ? "Tonight" : "Scene"} />)}
        </div>
        <div className="grid grid-flow-col auto-cols-[78%] gap-6 overflow-x-auto pb-4 [scrollbar-width:none] sm:auto-cols-[42%] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible">
          {performers.slice(0, 4).map((performer, index) => <PerformerPill key={performer.id || index} performer={performer} />)}
        </div>
      </div>
    </section>
  );
}