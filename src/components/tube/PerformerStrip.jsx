import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PerformerStrip({ performers = [] }) {
  if (performers.length === 0) return null;

  return (
    <section className="py-6 bg-[#0a0a0a] border-y border-white/5">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Featured Performers</h2>
          <Link to="/performers" className="text-sm text-rose-500 hover:text-rose-400 font-medium flex items-center gap-1">
            View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {performers.slice(0, 16).map((performer) => (
            <Link
              key={performer.id}
              to={`/performers/${performer.slug}`}
              className="flex-shrink-0 group"
            >
              <div className="w-28 md:w-32">
                {/* Portrait */}
                <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-[#1a1a1a] border border-white/5 group-hover:border-rose-600/50 transition-colors">
                  {performer.profile_image_url ? (
                    <img
                      src={performer.profile_image_url}
                      alt={performer.display_name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-rose-900/60 to-[#1a1a1a]" />
                  )}
                  
                  {/* Fanclub Badge */}
                  {performer.fanclub_enabled && (
                    <div className="absolute top-1.5 right-1.5 bg-rose-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg">
                      ♡
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-rose-600/0 group-hover:bg-rose-600/20 transition-colors" />
                </div>

                {/* Info - Compact */}
                <div className="mt-2 text-center">
                  <h3 className="text-xs font-semibold text-white group-hover:text-rose-500 transition-colors line-clamp-1">
                    {performer.display_name}
                  </h3>
                  {performer.video_count !== undefined && (
                    <p className="text-[10px] text-white/50 mt-0.5">
                      {performer.video_count} videos
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}