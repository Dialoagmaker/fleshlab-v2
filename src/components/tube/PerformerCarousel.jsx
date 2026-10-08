import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PerformerCarousel({ performers = [] }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollAmount = 300;

  if (performers.length === 0) return null;

  const scrollLeft = () => {
    const container = document.getElementById("performer-carousel");
    if (container) {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      setScrollPosition(scrollPosition - scrollAmount);
    }
  };

  const scrollRight = () => {
    const container = document.getElementById("performer-carousel");
    if (container) {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setScrollPosition(scrollPosition + scrollAmount);
    }
  };

  return (
    <section className="py-6 bg-gradient-to-r from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border-y border-rose-600/10">
      <div className="max-w-[1920px] mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-white tracking-tight">
              <span className="text-rose-500">FEATURED</span> PERFORMERS
            </h2>
            <div className="h-px w-24 bg-gradient-to-r from-rose-600/50 to-transparent" />
          </div>
          <Link to="/performers" className="text-xs text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-1.5 uppercase tracking-wide">
            View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        <div className="relative group">
          {/* Left Arrow - Banner-matching */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-0 z-10 w-12 h-full bg-gradient-to-r from-[#0a0a0a] to-transparent flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-rose-600/50 border-2 border-white/20 transition-all hover:scale-110">
              <ChevronLeft className="w-6 h-6 text-white" />
            </div>
          </button>

          {/* Right Arrow - Banner-matching */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-0 z-10 w-12 h-full bg-gradient-to-l from-[#0a0a0a] to-transparent flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-rose-600/50 border-2 border-white/20 transition-all hover:scale-110">
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </button>

          {/* Carousel - Custom Scrollbar Hidden */}
          <div
            id="performer-carousel"
            className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`
              #performer-carousel::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {performers.slice(0, 20).map((performer) => (
              <Link
                key={performer.id}
                to={`/performers/${performer.slug}`}
                className="flex-shrink-0 group/card snap-start"
              >
                <div className="w-32 md:w-36">
                  {/* Portrait - Darker base, Rose border on hover */}
                  <div className="aspect-[3/4] relative overflow-hidden rounded-xl bg-[#0f0f0f] border border-white/10 group-hover/card:border-rose-600/60 transition-all duration-300 group-hover/card:shadow-lg group-hover/card:shadow-rose-600/20">
                    {performer.profile_image_url ? (
                      <img
                        src={performer.profile_image_url}
                        alt={performer.display_name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-rose-900/60 to-[#0f0f0f]" />
                    )}
                    
                    {/* Fanclub Badge - Gradient */}
                    {performer.fanclub_enabled && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs w-7 h-7 rounded-full flex items-center justify-center font-bold shadow-lg shadow-rose-600/50 border border-white/20">
                        ♡
                      </div>
                    )}
                    
                    {/* Hover Overlay - Rose tint */}
                    <div className="absolute inset-0 bg-rose-600/0 group-hover/card:bg-rose-600/20 transition-colors duration-300" />
                  </div>

                  {/* Info - Compact, Stronger */}
                  <div className="mt-2.5 text-center">
                    <h3 className="text-xs font-bold text-white group-hover/card:text-rose-500 transition-colors duration-300 line-clamp-1">
                      {performer.display_name}
                    </h3>
                    {performer.nationality && (
                      <p className="text-[10px] text-white/60 font-medium mt-0.5">
                        {performer.nationality}
                      </p>
                    )}
                    {performer.video_count !== undefined && (
                      <p className="text-[10px] text-white/50 font-medium mt-0.5">
                        {performer.video_count} videos
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}