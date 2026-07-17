import SectionHeader from "./SectionHeader";
import MediaImage from "@/components/homeTube/MediaImage";
import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";

const worlds = ["Hotel Sessions", "Beach Escape", "Student Life", "Massage", "Gym", "Home"];
const fallbackImages = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
];

export default function ProductionWorlds({ videos = [], text }) {
  return (
    <section id="worlds" className="px-5 py-24 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeader eyebrow="For fans" title={text.worldsTitle} text={text.worldsSub} />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {worlds.map((world, index) => { const video = videos[index]; const image = getVideoThumbnailUrl(video) || fallbackImages[index]; return <a key={world} href={video?.slug ? `/videos/${video.slug}` : "/videos"} className="group relative min-h-[360px] overflow-hidden rounded-[32px] bg-[#111]"><MediaImage src={image} alt={world} className="absolute inset-0 h-full w-full object-cover opacity-78 transition duration-700 group-hover:scale-105 group-hover:opacity-92" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" /><div className="absolute bottom-0 p-7"><p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#d97d52]">Original world</p><h3 className="text-4xl font-black uppercase leading-none tracking-[-0.05em] text-white">{world}</h3></div></a>; })}
        </div>
      </div>
    </section>
  );
}