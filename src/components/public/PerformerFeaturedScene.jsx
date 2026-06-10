import React from "react";
import { Link } from "react-router-dom";
import { Play, Lock, Crown, Star, Clock, Calendar, Zap, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PerformerFeaturedScene({
  video,
  performerName,
  isAuthenticated,
  onWatch,
}) {
  if (!video) return null;

  const mins = video.duration_seconds ? Math.floor(video.duration_seconds / 60) : null;
  const secs = video.duration_seconds ? String(video.duration_seconds % 60).padStart(2, '0') : null;
  const isLocked = video.access_tier === 'fanclub' || video.access_tier === 'ppv' || video.is_exclusive;

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-rose-600/60 to-transparent" />
        <div className="flex items-center gap-2.5 bg-rose-600/15 border border-rose-600/30 rounded-full px-4 py-1.5">
          <Film className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-rose-300 text-xs font-bold uppercase tracking-widest">Featured Scene</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-rose-600/60 to-transparent" />
      </div>

      {/* Card */}
      <div className="relative rounded-[28px] overflow-hidden border border-rose-600/20 bg-gradient-to-br from-[#120808] via-[#0f0808] to-[#0a0a0a] shadow-2xl shadow-rose-900/20">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-rose-700/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-700/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 grid lg:grid-cols-[1.4fr_1fr] gap-0">
          {/* Left: large thumbnail */}
          <div className="relative group">
            <Link to={`/videos/${video.slug}`} className="block">
              <div className="aspect-video lg:aspect-auto lg:h-full min-h-[260px] relative overflow-hidden">
                {video.primary_thumbnail_url || video.cover_image_url ? (
                  <img
                    src={video.primary_thumbnail_url || video.cover_image_url}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1a0808] to-[#0a0a0a] flex items-center justify-center">
                    <Play className="w-16 h-16 text-white/10" />
                  </div>
                )}

                {/* Cinematic overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0f0808]/70 hidden lg:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0808]/80 via-transparent to-transparent" />

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-20 h-20 bg-rose-600 rounded-full flex items-center justify-center shadow-2xl shadow-rose-600/50 scale-90 group-hover:scale-100 transition-transform duration-300">
                    <Play className="w-9 h-9 text-white fill-current ml-1" />
                  </div>
                </div>

                {/* Top badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 bg-amber-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg">
                      <Lock className="w-3 h-3" />
                      {video.access_tier === 'fanclub' ? 'FANCLUB' : video.access_tier === 'ppv' ? 'PREMIUM' : 'EXCLUSIVE'}
                    </span>
                  )}
                  {!isLocked && (
                    <span className="inline-flex items-center gap-1 bg-emerald-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg">
                      Free to Watch
                    </span>
                  )}
                </div>

                {/* Duration */}
                {mins !== null && (
                  <div className="absolute bottom-4 right-4 bg-black/85 backdrop-blur-sm text-white text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {mins}:{secs}
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Right: details & CTA */}
          <div className="p-7 lg:p-10 flex flex-col justify-center space-y-5">
            {/* Access badges */}
            <div className="flex flex-wrap gap-2">
              {video.access_tier === 'free' && (
                <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 rounded-full">
                  Free to Watch
                </Badge>
              )}
              {video.access_tier === 'fanclub' && (
                <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30 rounded-full">
                  <Crown className="w-3 h-3 mr-1" /> Fanclub Only
                </Badge>
              )}
              {video.access_tier === 'ppv' && (
                <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30 rounded-full">
                  <Star className="w-3 h-3 mr-1" /> Premium Rental
                </Badge>
              )}
              {video.is_exclusive && (
                <Badge className="bg-rose-600/20 text-rose-400 border-rose-600/30 rounded-full">
                  <Zap className="w-3 h-3 mr-1" /> Exclusive
                </Badge>
              )}
            </div>

            {/* Title */}
            <div>
              <h3 className="text-2xl xl:text-3xl font-black text-white leading-tight mb-2">
                {video.title}
              </h3>
              {(video.short_summary || video.description) && (
                <p className="text-white/55 text-sm leading-relaxed line-clamp-3">
                  {video.short_summary || video.description}
                </p>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 text-xs text-white/35">
              {video.release_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(video.release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              {mins !== null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {mins} min
                </span>
              )}
            </div>

            {/* Tags */}
            {video.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {video.tags.slice(0, 5).map((tag, i) => (
                  <span key={i} className="bg-white/[0.06] text-white/40 text-[11px] px-2.5 py-1 rounded-full border border-white/8">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={onWatch}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white h-12 px-7 text-sm font-bold shadow-lg shadow-rose-700/30 gap-2 rounded-xl flex-1"
              >
                <Play className="w-4 h-4 fill-current" />
                {isAuthenticated
                  ? isLocked ? 'Unlock Scene' : 'Watch Scene'
                  : 'Create Account to Watch'}
              </Button>
              <Link to={`/videos/${video.slug}`}>
                <Button
                  variant="outline"
                  className="border-white/15 text-white/70 hover:bg-white/8 hover:text-white h-12 px-6 text-sm font-semibold gap-2 rounded-xl w-full"
                >
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}