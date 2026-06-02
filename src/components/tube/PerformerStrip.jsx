import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PerformerStrip({ performers = [] }) {
  if (performers.length === 0) return null;

  return (
    <section className="py-8 bg-[#0a0a0a] border-y border-white/10">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Featured Performers</h2>
          <Link to="/performers" className="text-sm text-rose-500 hover:text-rose-400 font-medium">
            View All →
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {performers.slice(0, 12).map((performer) => (
            <Link
              key={performer.id}
              to={`/performers/${performer.slug}`}
              className="flex-shrink-0 group"
            >
              <div className="w-32 md:w-40">
                {/* Portrait */}
                <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-[#1a1a1a] mb-2">
                  {performer.profile_image_url ? (
                    <img
                      src={performer.profile_image_url}
                      alt={performer.display_name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-rose-900/40 to-[#1a1a1a]" />
                  )}
                  
                  {/* Fanclub Badge */}
                  {performer.fanclub_enabled && (
                    <div className="absolute top-2 right-2 bg-rose-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      ♡
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="text-center">
                  <h3 className="text-sm font-medium text-white group-hover:text-rose-500 transition-colors line-clamp-1">
                    {performer.display_name}
                  </h3>
                  {performer.nationality && (
                    <p className="text-xs text-white/60 line-clamp-1 mb-1">
                      {performer.nationality}
                    </p>
                  )}
                  {performer.video_count !== undefined && (
                    <p className="text-xs text-white/50 mb-2">
                      {performer.video_count} videos
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-xs border-white/20 text-white/70 hover:border-rose-600 hover:text-rose-500"
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}