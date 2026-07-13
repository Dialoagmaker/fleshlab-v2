import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import VideoAssetImage from "@/components/video/VideoAssetImage";

function FeaturedFallback() {
  return (
    <div className="w-full h-full bg-[#151515] flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-3xl md:text-5xl font-black tracking-[-0.04em]">FLESHLAB</div>
        <div className="text-[#828282] text-xs uppercase tracking-[0.35em] mt-3">Featured Production</div>
      </div>
    </div>
  );
}

export default function HomeHero({ video }) {
  return (
    <section className="bg-[#050505] px-5 md:px-8 lg:px-12 pt-0">
      <div className="max-w-[1440px] mx-auto min-h-[620px] max-h-[720px] py-12 md:py-16 lg:py-20 grid lg:grid-cols-[42%_58%] gap-10 lg:gap-12 items-center">
        <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div>
            <p className="text-[#E51D2A] text-sm font-black uppercase tracking-[0.32em] mb-5">FLESHLAB STUDIOS</p>
            <h1 className="text-white font-black uppercase tracking-[-0.065em] leading-[0.88] text-[clamp(64px,6vw,104px)]">
              REAL<br />AMATEURS.<br />AMATEUR<br />WINS.
            </h1>
          </div>
          <p className="text-[#B7B7B7] text-lg md:text-xl leading-relaxed max-w-xl">
            Authentic productions. Real people. Homemade moments.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link to="/videos" className="h-[52px] px-6 rounded-xl bg-[#E51D2A] text-white text-base md:text-lg font-black uppercase tracking-wide inline-flex items-center justify-center gap-2 hover:bg-[#c71924] transition-colors duration-200">
              Explore Videos <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/become-performer" className="h-[52px] px-6 rounded-xl border border-white/25 text-white text-base md:text-lg font-black uppercase tracking-wide inline-flex items-center justify-center hover:bg-white/10 transition-colors duration-200">
              Become Performer
            </Link>
          </div>
        </div>

        <Link to={video?.slug ? `/videos/${video.slug}` : "/videos"} className="group block animate-in fade-in duration-300">
          <div className="relative aspect-video rounded-[20px] overflow-hidden bg-[#151515] border border-white/10 shadow-2xl shadow-black/50 transition-transform duration-300 group-hover:scale-[1.01]">
            {video ? (
              <VideoAssetImage video={video} alt={video.title} className="w-full h-full object-cover object-center" showLegacyBadge={false} />
            ) : (
              <FeaturedFallback />
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute left-5 md:left-6 right-5 md:right-6 bottom-5 md:bottom-6 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[#E51D2A] text-xs font-black uppercase tracking-[0.24em] mb-2">Featured Production</p>
                <h2 className="text-white text-xl md:text-3xl font-black tracking-tight line-clamp-2 leading-tight">{video?.title || "FLESHLAB Production"}</h2>
              </div>
              <span className="hidden sm:inline-flex h-11 px-5 rounded-xl bg-[#E51D2A] text-white text-sm font-black uppercase items-center justify-center whitespace-nowrap">Watch</span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}