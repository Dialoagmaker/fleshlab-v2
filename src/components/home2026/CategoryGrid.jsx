import { Link } from "react-router-dom";
import VideoAssetImage from "@/components/video/VideoAssetImage";
import SectionHeader from "./SectionHeader";
import BrandLogo from "@/components/BrandLogo";

const categoryNames = ["ASIAN TWINKS", "SOLO", "COUPLES", "MASSAGE", "HOMEMADE", "BEHIND THE SCENES"];

const matchers = {
  "ASIAN TWINKS": ["asian", "twink", "filipino", "pinoy"],
  "SOLO": ["solo"],
  "COUPLES": ["couple", "couples", "pair", "duo"],
  "MASSAGE": ["massage"],
  "HOMEMADE": ["homemade", "amateur", "home"],
  "BEHIND THE SCENES": ["behind", "bts", "backstage", "studio"],
};

function textPool(video) {
  return [video.title, video.description, video.short_summary, ...(video.categories || []), ...(video.tags || [])].filter(Boolean).join(" ").toLowerCase();
}

function getCategoryData(videos, name) {
  const terms = matchers[name] || [];
  const matches = videos.filter((video) => terms.some((term) => textPool(video).includes(term)));
  return {
    name,
    count: matches.length,
    video: matches[0] || null,
  };
}

function BrandedPlaceholder({ name }) {
  return (
    <div className="w-full h-full bg-[#0B0B0B] flex items-center justify-center px-5">
      <div className="text-center">
        <BrandLogo className="w-[260px] h-[92px]" />
        <div className="text-[#828282] text-xs uppercase tracking-[0.25em] mt-2">{name}</div>
      </div>
    </div>
  );
}

export default function CategoryGrid({ videos = [] }) {
  const categories = categoryNames.map((name) => getCategoryData(videos, name));

  return (
    <section className="bg-[#050505] px-5 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto">
        <SectionHeader eyebrow="Explore" title="Categories" text="Browse FLESHLAB productions by real viewing mood and production style." link="/videos" linkLabel="View All" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((category) => (
            <Link key={category.name} to={`/videos?category=${encodeURIComponent(category.name)}`} className="group relative aspect-[16/10] rounded-[18px] overflow-hidden bg-[#151515] border border-white/10 transition-all duration-200 hover:-translate-y-1">
              {category.video ? (
                <VideoAssetImage video={category.video} alt={category.name} className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.03]" showLegacyBadge={false} />
              ) : (
                <BrandedPlaceholder name={category.name} />
              )}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
              <div className="absolute left-5 right-5 bottom-5">
                <h3 className="text-white text-xl md:text-[22px] font-black uppercase tracking-tight leading-tight">{category.name}</h3>
                <p className="text-[#B7B7B7] text-sm md:text-base mt-1">{category.count} videos</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}