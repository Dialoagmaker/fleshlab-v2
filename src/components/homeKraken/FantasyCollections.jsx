import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";
import KrakenSectionTitle from "./KrakenSectionTitle";

const allowed = [
  ["hotel", "HOTEL SESSIONS"],
  ["solo", "SOLO"],
  ["couple", "COUPLES"],
  ["massage", "MASSAGE"],
  ["twink", "TWINK"],
  ["asian", "ASIAN AMATEURS"],
];

export default function FantasyCollections({ videos = [] }) {
  const collections = allowed.map(([key, label]) => {
    const matches = videos.filter((video) => video.categories?.includes(key));
    return matches.length ? { key, label, count: matches.length, video: matches[0] } : null;
  }).filter(Boolean).slice(0, 6);
  if (!collections.length) return null;

  return (
    <section className="relative overflow-hidden bg-[#050505] px-5 py-20 text-white md:px-10 md:py-28 lg:px-14">
      <div className="relative mx-auto max-w-[1440px]">
        <KrakenSectionTitle eyebrow="Fantasy discovery" title="Choose your fantasy." copy="Supported by real FLESHLAB productions already in the catalog." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((item, index) => (
            <a key={item.key} href={`/videos?category=${encodeURIComponent(item.key)}`} className={`group relative min-h-[420px] overflow-hidden rounded-[30px] border border-white/10 bg-[#101010] ${index === 0 ? "lg:col-span-2" : ""}`}>
              <MediaImage src={getVideoThumbnailUrl(item.video)} alt={item.label} className="absolute inset-0 h-full w-full opacity-75 transition duration-1000 group-hover:scale-[1.06]" />
              <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(0,0,0,0.9),rgba(0,0,0,0.22),rgba(229,29,42,0.16))]" />
              <div className="kraken-paint-stroke absolute left-6 top-7 h-3 w-36" />
              <div className="absolute bottom-0 p-7"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#E51D2A]">{item.count} productions</p><h3 className="kraken-distressed mt-3 max-w-[9ch] text-5xl font-black uppercase leading-[0.78] tracking-[-0.08em] md:text-7xl">{item.label}</h3></div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}