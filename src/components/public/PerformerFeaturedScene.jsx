import React from "react";
import { Link } from "react-router-dom";
import { Play, Lock, Crown, Star, Clock, Calendar, Zap, Flame } from "lucide-react";
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
  const isFanclub = video.access_tier === 'fanclub';
  const isPPV = video.access_tier === 'ppv';
  const isExclusive = video.is_exclusive;

  const accessLabel = isFanclub
    ? { text: 'FANCLUB EXCLUSIVE', color: 'from-purple-600 to-purple-800', icon: Crown }
    : isPPV
    ? { text: 'PREMIUM RENTAL', color: 'from-amber-600 to-amber-800', icon: Star }
    : isExclusive
    ? { text: 'EXCLUSIVE', color: 'from-rose-600 to-rose-800', icon: Zap }
    : { text: 'FREE TO WATCH', color: 'from-emerald-600 to-emerald-800', icon: Play };

  const AccessIcon = accessLabel.icon;

  return (
    <section className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
      {/* Section divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="flex items-center gap-2 bg-[#0f0808] border border-rose-700/30 rounded-full px-5 py-2">
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">Featured Scene</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      </div>

      {/* Main card */}
      <div className="relative rounded-[28px] overflow-hidden border border-white/[0.08] bg-[#080505] shadow-[0_30px_80px_rgba(80,0,20,0.4)]">
        {/* Glows */}
        <div className="absolute top-0 left-0 w-[500px] h-[400px] bg-rose-950/50 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-amber-950/30 rounded-full blur-[120px] pointer-events-none" />
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-600/40 to-transparent" />

        <div className="relative z-10 grid lg:grid-cols-[1.65fr_1fr] gap-0">
          {/* LEFT — cinematic thumbnail */}
          <div className="relative group">
            <Link to={`/videos/${video.slug}`} className="block">
              <div className="aspect-video lg:aspect-auto lg:h-full min-h-[340px] relative overflow-hidden">
                {video.primary_thumbnail_url || video.cover_image_url ? (
                  <img
                    src={video.primary_thumbnail_url || video.cover_image_url}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1a0808] to-[#0a0505] flex items-center justify-center">
                    <Play className="w-20 h-20 text-white/6" />
                  </div>
                )}

                {/* Dark vignette overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#080505]/80 hidden lg:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080505]/90 via-[#080505]/20 to-transparent" />
                {/* Locked overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-[#080505]/30 backdrop-blur-[0.5px]" />
                )}

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                  <div className="relative">
                    <div className="absolute inset-0 bg-rose-600/50 rounded-full blur-[20px] scale-150" />
                    <div className="relative w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-700 rounded-full flex items-center justify-center shadow-2xl shadow-rose-900/70 scale-90 group-hover:scale-105 transition-transform duration-400">
                      {isLocked ? (
                        <Lock className="w-8 h-8 text-white" />
                      ) : (
                        <Play className="w-9 h-9 text-white fill-current ml-1" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Access badge — top left */}
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${accessLabel.color} text-white text-[10px] font-black uppercase tracking-[0.15em] px-3.5 py-2 rounded-xl shadow-xl`}>
                    <AccessIcon className="w-3 h-3" />
                    {accessLabel.text}
                  </span>
                </div>

                {/* Duration — bottom right */}
                {mins !== null && (
                  <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md text-white text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-white/[0.08] flex items-center gap-1.5 shadow-lg">
                    <Clock className="w-3 h-3 text-white/50" /> {mins}:{secs}
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* RIGHT — details & CTA */}
          <div className="flex flex-col justify-between p-7 lg:p-10 gap-5">
            <div className="space-y-4">
              {/* Performer line */}
              <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em]">{performerName}</p>

              {/* Title */}
              <h3 className="text-xl xl:text-2xl font-black text-white leading-tight">
                {video.title}
              </h3>

              {/* Summary */}
              {(video.short_summary || video.description) && (
                <p className="text-white/40 text-sm leading-relaxed line-clamp-3">
                  {video.short_summary || video.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-3 text-[11px] text-white/25 font-medium">
                {video.release_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(video.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {mins !== null && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {mins} min
                  </span>
                )}
              </div>

              {/* Tags */}
              {video.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {video.tags.slice(0, 4).map((tag, i) => (
                    <span key={i} className="bg-white/[0.04] text-white/30 text-[10px] px-2.5 py-1 rounded-full border border-white/[0.06] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="space-y-2.5">
              {/* If locked — show locked state with premium CTA */}
              {isLocked ? (
                <>
                  <div className="flex items-center gap-2 text-amber-500/70 text-xs font-semibold mb-3">
                    <Lock className="w-3.5 h-3.5" />
                    {isFanclub ? 'Fanclub members only' : isPPV ? 'Premium rental required' : 'Exclusive content'}
                  </div>
                  <Button
                    onClick={onWatch}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-amber-600 to-rose-700 hover:from-amber-500 hover:to-rose-600 text-white h-13 font-black text-sm shadow-xl shadow-rose-900/50 gap-2.5 rounded-xl group py-4"
                  >
                    <Crown className="w-5 h-5" />
                    {isAuthenticated ? 'Unlock — Join Fanclub' : 'Unlock VIP Access'}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onWatch}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white h-13 font-black text-sm shadow-xl shadow-rose-900/50 gap-2.5 rounded-xl group py-4"
                >
                  <Play className="w-5 h-5 fill-current" />
                  {isAuthenticated ? 'Watch Now' : 'Watch Free — Create Account'}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Button>
              )}
              <Link to={`/videos/${video.slug}`}>
                <Button
                  variant="outline"
                  className="w-full border-white/[0.08] bg-white/[0.02] text-white/40 hover:bg-white/[0.07] hover:text-white/80 h-10 text-xs font-semibold rounded-xl"
                >
                  View Full Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}