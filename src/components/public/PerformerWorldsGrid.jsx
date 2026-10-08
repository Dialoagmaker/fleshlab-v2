import { Link } from "react-router-dom";
import { Video } from "lucide-react";
import { isPublicImageUrl } from "@/lib/seoValidation";

/**
 * PerformerWorldsGrid - Immersive performer panels (4 featured)
 * Layout: 2x2 grid on desktop, single column on mobile
 */
export default function PerformerWorldsGrid({ performers = [] }) {
  // Take first 4 performers
  const featuredPerformers = performers.slice(0, 4);

  if (featuredPerformers.length === 0) {
    return (
      <section className="py-16 px-4 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2">Performer Worlds</h2>
          <p className="text-[#F5F5F5]/60 mb-8">Enter their universe</p>
          <div className="text-center py-20 bg-[#0F0F0F] rounded-xl border border-white/[0.05]">
            <p className="text-[#F5F5F5]/40">No performers available</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Performer Worlds</h2>
          <p className="text-[#F5F5F5]/60">Enter their universe</p>
        </div>

        {/* Desktop: 2x2 grid */}
        <div className="hidden md:grid grid-cols-2 gap-6">
          {featuredPerformers.map((performer) => (
            <PerformerWorldPanel
              key={performer.id}
              performer={performer}
            />
          ))}
        </div>

        {/* Mobile: Single column */}
        <div className="md:hidden space-y-6">
          {featuredPerformers.map((performer) => (
            <PerformerWorldPanel
              key={performer.id}
              performer={performer}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PerformerWorldPanel({ performer }) {
  const hasValidImage = isPublicImageUrl(performer.profile_image_url);

  return (
    <Link
      to={`/performers/${performer.slug}`}
      className="group relative block aspect-[3/4] rounded-lg overflow-hidden bg-[#0F0F0F] border border-white/[0.05] hover:border-rose-600/30 transition-all"
    >
      {/* Portrait */}
      {hasValidImage ? (
        <img
          src={performer.profile_image_url}
          alt={performer.display_name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
          <span className="text-6xl text-[#F5F5F5]/20 font-serif">
            {performer.display_name.charAt(0)}
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        {/* Name */}
        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-rose-500 transition-colors">
          {performer.display_name}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {performer.nationality && (
            <span className="text-sm text-[#F5F5F5]/80">
              {performer.nationality}
            </span>
          )}
          {performer.video_count > 0 && (
            <>
              <span className="text-[#F5F5F5]/40">•</span>
              <span className="text-sm text-[#F5F5F5]/80">
                {performer.video_count} {performer.video_count === 1 ? "drop" : "drops"}
              </span>
            </>
          )}
        </div>

        {/* Bio excerpt */}
        {performer.bio && (
          <p className="text-sm text-[#F5F5F5]/60 mb-4 line-clamp-2">
            {performer.bio}
          </p>
        )}

        {/* CTA */}
        <div className="flex items-center gap-2 text-rose-500 font-medium group-hover:text-rose-400 transition-colors">
          <span>Explore World</span>
          <Video className="w-4 h-4" />
        </div>

        {/* Fanclub badge */}
        {performer.fanclub_enabled && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded bg-rose-600/90 text-xs font-medium text-white">
            Fanclub Available
          </div>
        )}
      </div>
    </Link>
  );
}