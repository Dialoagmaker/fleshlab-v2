import React from "react";
import { Link } from "react-router-dom";
import { Film, Play, Users, Crown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoCard from "@/components/public/VideoCard";

export default function PerformerVideoGrid({
  performer,
  performerVideos,
  brands,
}) {
  if (performerVideos.length === 0) {
    return (
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="relative rounded-[28px] border border-white/8 bg-gradient-to-br from-card/40 to-[#0a0a0a] overflow-hidden p-12 lg:p-20 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(225,29,72,0.06)_0%,_transparent_70%)]" />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-rose-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-600/20">
              <Film className="w-10 h-10 text-rose-500/70" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
              Exclusive Content Coming Soon
            </h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto text-base">
              {performer.display_name}'s premium scenes are being added to the library.
              Join the fanclub to be first to know when new drops go live.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/videos">
                <Button variant="outline" className="gap-2 border-white/15 text-white hover:bg-white/8 rounded-xl">
                  <Play className="w-4 h-4" /> Browse All Videos
                </Button>
              </Link>
              <Link to="/performers">
                <Button variant="outline" className="gap-2 border-white/15 text-white hover:bg-white/8 rounded-xl">
                  <Users className="w-4 h-4" /> All Performers
                </Button>
              </Link>
              {performer.fanclub_enabled && (
                <Link to="/fanclub">
                  <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                    <Crown className="w-4 h-4" /> Join Fanclub
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
    ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl'
    : performerVideos.length === 3
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <section id="videos" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Section header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-8 bg-gradient-to-b from-rose-500 to-rose-700 rounded-full" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
              All Scenes with {performer.display_name}
            </h2>
          </div>
          <p className="text-white/40 text-sm ml-3 pl-2">
            {performerVideos.length} {performerVideos.length === 1 ? 'scene' : 'scenes'} available now
          </p>
        </div>
        <Link to="/videos" className="shrink-0">
          <Button
            variant="outline"
            className="gap-2 border-white/15 text-white/70 hover:text-white hover:bg-white/8 rounded-xl h-10 text-sm"
          >
            Browse All Videos
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </Link>
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