import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import VideoAssetImage from "@/components/video/VideoAssetImage";

export default function HomeHero({ video }) {
  return (
    <section className="min-h-screen bg-[#070707] px-6 pt-28 pb-20 md:px-10 lg:px-16 flex items-center">
      <div className="w-full max-w-[1600px] mx-auto grid lg:grid-cols-[45%_55%] gap-12 lg:gap-16 items-center">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="space-y-5">
            <p className="text-[#D81F26] text-sm md:text-base font-black uppercase tracking-[0.35em]">FLESHLAB Studios</p>
            <h1 className="text-white font-black uppercase tracking-[-0.06em] leading-[0.86] text-[58px] sm:text-[74px] xl:text-[96px]">
              Real amateurs.<br />Amateur wins.
            </h1>
          </div>
          <p className="text-[#B0B0B0] text-lg md:text-xl leading-relaxed max-w-xl">
            Authentic productions. Real people. Homemade moments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link to="/videos" className="h-[52px] px-6 rounded-[14px] bg-[#D81F26] text-white text-lg font-black inline-flex items-center justify-center gap-2 hover:bg-[#b91b21] transition-colors duration-200">
              Explore Videos <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/become-performer" className="h-[52px] px-6 rounded-[14px] border border-white/25 text-white text-lg font-black inline-flex items-center justify-center hover:bg-white/10 transition-colors duration-200">
              Become Performer
            </Link>
          </div>
        </div>

        <Link to={video?.slug ? `/videos/${video.slug}` : "/videos"} className="group block animate-in fade-in duration-300">
          <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden bg-[#121212] border border-white/[0.08] shadow-2xl shadow-black/60 transition-transform duration-300 group-hover:scale-[1.01]">
            {video ? (
              <VideoAssetImage video={video} alt={video.title} className="w-full h-full object-cover" showLegacyBadge={false} />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80"
                alt="Cinematic studio camera setup"
                className="w-full h-full object-cover"
                loading="eager"
              />
            )}
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute left-6 right-6 bottom-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-white/65 text-xs font-black uppercase tracking-[0.25em] mb-2">Featured Production</p>
                <h2 className="text-white text-2xl md:text-3xl font-black tracking-tight line-clamp-2">{video?.title || "Authentic studio moments"}</h2>
              </div>
              <span className="hidden sm:inline-flex h-12 px-5 rounded-full bg-[#D81F26] text-white text-sm font-black items-center justify-center whitespace-nowrap">Watch</span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}