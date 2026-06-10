import React from "react";
import { Link } from "react-router-dom";
import { Film, Play, Users, Crown, Lock, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoCard from "@/components/public/VideoCard";

export default function PerformerVideoGrid({
  performer,
  performerVideos,
  brands,
}) {
  if (performerVideos.length === 0) {
    return (
      <section className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <div className="relative rounded-[28px] border border-white/[0.07] overflow-hidden bg-[#090606] p-14 lg:p-20 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(140,10,30,0.08)_0%,transparent_65%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-700/30 to-transparent" />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-700/30">
              <Film className="w-9 h-9 text-rose-500/50" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Exclusive Content Coming Soon</h2>
            <p className="text-white/40 mb-8 max-w-md mx-auto text-sm leading-relaxed">
              {performer.display_name}'s premium scenes are being added. Join the fanclub to be first when new drops go live.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/videos">
                <Button variant="outline" className="gap-2 border-white/12 text-white/70 hover:text-white hover:bg-white/8 rounded-xl">
                  <Play className="w-4 h-4" /> Browse All Videos
                </Button>
              </Link>
              {performer.fanclub_enabled && (
                <Link to="/fanclub">
                  <Button className="gap-2 bg-gradient-to-r from-amber-600 to-rose-700 hover:from-amber-500 hover:to-rose-600 text-white rounded-xl shadow-lg shadow-rose-900/30">
                    <Crown className="w-4 h-4" /> Join VIP Fanclub
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const gridClass = performerVideos.length === 1
    ? 'grid-cols-1 max-w-2xl'
    : performerVideos.length === 2
    ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl'
    : performerVideos.length === 3
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  const exclusiveCount = performerVideos.filter(v => v.is_exclusive || v.access_tier === 'fanclub').length;
  const freeCount = performerVideos.filter(v => v.access_tier === 'free' && !v.is_exclusive).length;

  return (
    <section id="videos" className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
      {/* Section header */}
      <div className="relative mb-8">
        {/* Divider line */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          <div className="flex items-center gap-2 bg-[#0f0808] border border-rose-700/30 rounded-full px-5 py-2">
            <Film className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">Scenes</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight">
              All Scenes with{" "}
              <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                {performer.display_name}
              </span>
            </h2>
            {/* Content breakdown chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {freeCount > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-700/30 text-emerald-400 text-[11px] font-bold px-3 py-1 rounded-full">
                  <Play className="w-3 h-3" /> {freeCount} Free
                </span>
              )}
              {exclusiveCount > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-amber-950/60 border border-amber-700/30 text-amber-400 text-[11px] font-bold px-3 py-1 rounded-full">
                  <Lock className="w-3 h-3" /> {exclusiveCount} Exclusive / Fanclub
                </span>
              )}
              {performerVideos.filter(v => v.access_tier === 'ppv').length > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-purple-950/60 border border-purple-700/30 text-purple-400 text-[11px] font-bold px-3 py-1 rounded-full">
                  <Star className="w-3 h-3" /> {performerVideos.filter(v => v.access_tier === 'ppv').length} Premium
                </span>
              )}
            </div>
          </div>
          <Link to="/videos" className="shrink-0">
            <Button
              variant="outline"
              className="border-white/10 bg-white/[0.03] text-white/50 hover:text-white hover:bg-white/[0.08] rounded-xl h-10 text-xs font-semibold"
            >
              Browse All Videos
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className={`grid gap-5 ${gridClass}`}>
        {performerVideos.map(video => (
          <VideoCard key={video.id} video={video} brands={brands} />
        ))}
      </div>
    </section>
  );
}