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
    <section className="py-6 bg-[#0a0a0a] border-y border-white/5">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Featured Performers</h2>
          <Link to="/performers" className="text-sm text-rose-500 hover:text-rose-400 font-medium flex items-center gap-1">
            View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-full bg-gradient-to-r from-[#0a0a0a] to-transparent flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-8 h-8 bg-black/80 hover:bg-rose-600 rounded-full flex items-center justify-center border border-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Right Arrow */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-full bg-gradient-to-l from-[#0a0a0a] to-transparent flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-8 h-8 bg-black/80 hover:bg-rose-600 rounded-full flex items-center justify-center border border-white/10 transition-colors">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Carousel */}
          <div
            id="performer-carousel"
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {performers.slice(0, 20).map((performer) => (
              <Link
                key={performer.id}
                to={`/performers/${performer.slug}`}
                className="flex-shrink-0 group/card snap-start"
              >
                <div className="w-32 md:w-36">
                  {/* Portrait */}
                  <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-[#1a1a1a] border border-white/5 group-hover/card:border-rose-600/50 transition-colors">
                    {performer.profile_image_url ? (
                      <img
                        src={performer.profile_image_url}
                        alt={performer.display_name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-rose-900/60 to-[#1a1a1a]" />
                    )}
                    
                    {/* Fanclub Badge */}
                    {performer.fanclub_enabled && (
                      <div className="absolute top-2 right-2 bg-rose-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg">
                        ♡
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-rose-600/0 group-hover/card:bg-rose-600/20 transition-colors" />
                  </div>

                  {/* Info - Compact */}
                  <div className="mt-2 text-center">
                    <h3 className="text-xs font-semibold text-white group-hover/card:text-rose-500 transition-colors line-clamp-1">
                      {performer.display_name}
                    </h3>
                    {performer.nationality && (
                      <p className="text-[10px] text-white/50 mt-0.5">
                        {performer.nationality}
                      </p>
                    )}
                    {performer.video_count !== undefined && (
                      <p className="text-[10px] text-white/40 mt-0.5">
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