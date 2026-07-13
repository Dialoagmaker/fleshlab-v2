import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import VideoAssetImage from "@/components/video/VideoAssetImage";
import BrandLogo from "@/components/BrandLogo";

function Media({ performer, video }) {
  if (performer?.profile_image_url) {
    return <img src={performer.profile_image_url} alt={performer.display_name} loading="lazy" className="w-full h-full object-cover object-center" />;
  }
  if (video) {
    return <VideoAssetImage video={video} alt={video.title} className="w-full h-full object-cover object-center" showLegacyBadge={false} />;
  }
  return (
    <div className="w-full h-full bg-[#0B0B0B] flex items-center justify-center">
      <BrandLogo className="w-[300px] h-[110px]" />
    </div>
  );
}

export default function PerformerCTA({ performer, video }) {
  return (
    <section className="bg-[#050505] px-5 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto min-h-[380px] rounded-[24px] bg-[#121212] border border-white/10 p-7 md:p-10 lg:p-14 grid lg:grid-cols-[55%_45%] gap-8 lg:gap-10 items-center overflow-hidden">
        <div>
          <p className="text-[#E51D2A] text-sm font-black uppercase tracking-[0.3em] mb-5">BECOME PERFORMER</p>
          <h2 className="text-white text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-[-0.06em] leading-[0.9] mb-6">
            MAKE MONEY.<br />BE YOURSELF.
          </h2>
          <p className="text-[#B7B7B7] text-lg md:text-xl leading-relaxed max-w-2xl mb-7">
            Join a studio built around authentic amateur productions, clear agreements and performer-first support.
          </p>
          <Link to="/become-performer" className="h-[52px] px-6 rounded-xl bg-[#E51D2A] text-white text-base md:text-lg font-black uppercase tracking-wide inline-flex items-center justify-center gap-2 hover:bg-[#c71924] transition-colors duration-200">
            Apply Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <div className="relative aspect-[4/3] lg:aspect-[5/4] rounded-[20px] overflow-hidden bg-[#151515] border border-white/10">
          <Media performer={performer} video={video} />
        </div>
      </div>
    </section>
  );
}