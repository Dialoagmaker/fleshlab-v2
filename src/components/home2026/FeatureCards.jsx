import { Link } from "react-router-dom";
import { Film, Search, Star } from "lucide-react";
import VideoAssetImage from "@/components/video/VideoAssetImage";
import BrandLogo from "@/components/BrandLogo";

const cardMeta = [
  {
    title: "WATCH VIDEOS",
    text: "Browse real FLESHLAB productions and new releases.",
    href: "/videos",
    Icon: Film,
    type: "video",
  },
  {
    title: "BECOME PERFORMER",
    text: "Apply to create authentic amateur productions with the studio.",
    href: "/become-performer",
    Icon: Star,
    type: "performer",
  },
  {
    title: "EXPLORE CATEGORIES",
    text: "Find solo, couples, homemade and behind-the-scenes scenes.",
    href: "/videos?category=all",
    Icon: Search,
    type: "category",
  },
];

function BrandedPlaceholder({ title }) {
  return (
    <div className="w-full h-full bg-[#0B0B0B] flex items-center justify-center px-6">
      <div className="text-center">
        <BrandLogo className="w-[230px] h-[82px]" />
        <div className="text-[#828282] text-xs uppercase tracking-[0.25em] mt-2">{title}</div>
      </div>
    </div>
  );
}

function CardMedia({ card, video, performer }) {
  if (card.type === "performer" && performer?.profile_image_url) {
    return <img src={performer.profile_image_url} alt={performer.display_name} loading="lazy" className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.03]" />;
  }

  if (video) {
    return <VideoAssetImage video={video} alt={video.title} className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.03]" showLegacyBadge={false} />;
  }

  return <BrandedPlaceholder title={card.title} />;
}

export default function FeatureCards({ videos = [], performers = [] }) {
  const mediaVideos = [videos[0], videos[1] || videos[0], videos.find((video) => video.categories?.length) || videos[2] || videos[0]];
  const performer = performers[0];

  return (
    <section className="bg-[#050505] px-5 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto grid md:grid-cols-3 gap-5">
        {cardMeta.map((card, index) => (
          <Link key={card.title} to={card.href} className="group block h-auto md:h-[320px] rounded-[20px] overflow-hidden bg-[#151515] border border-white/10 transition-all duration-200 hover:-translate-y-1">
            <div className="h-[198px] md:h-[62%] overflow-hidden bg-[#0B0B0B]">
              <CardMedia card={card} video={mediaVideos[index]} performer={performer} />
            </div>
            <div className="h-auto md:h-[38%] p-5 md:p-6 flex flex-col justify-center">
              <card.Icon className="w-5 h-5 text-[#E51D2A] mb-3" strokeWidth={2} />
              <h3 className="text-white text-[22px] font-black uppercase tracking-tight leading-none mb-2">{card.title}</h3>
              <p className="text-[#B7B7B7] text-sm md:text-base leading-snug line-clamp-2">{card.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}