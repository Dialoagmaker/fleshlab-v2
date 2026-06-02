import React from "react";
import { Link } from "react-router-dom";
import { Play, Clock, Calendar, Crown, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FeaturedRelease({ video, brands = [] }) {
  if (!video) return null;
  const brand = brands.find(b => b.id === video.brand_id);
  const mins = video.duration_seconds ? Math.floor(video.duration_seconds / 60) : null;
  const secs = video.duration_seconds ? String(video.duration_seconds % 60).padStart(2, '0') : null;

  return (
    <section className="py-14 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="h-px w-10 bg-primary" />
          <span className="text-primary text-xs font-bold uppercase tracking-widest">Featured Release</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Poster / Thumbnail */}
          <Link to={`/videos/${video.slug}`} className="group relative block rounded-2xl overflow-hidden aspect-video shadow-2xl shadow-black/60">
            {video.primary_thumbnail_url ? (
              <img
                src={video.primary_thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-card to-secondary" />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
            {/* Play btn */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-2xl shadow-primary/50">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>
            {/* Duration */}
            {mins !== null && (
              <div className="absolute bottom-3 right-3 bg-black/90 text-white text-xs font-bold px-2.5 py-1.5 rounded flex items-center gap-1.5">
                <Clock className="w-3 h-3" />{mins}:{secs}
              </div>
            )}
          </Link>

          {/* Details */}
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {video.featured && (
                <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/30">
                  <Crown className="w-3 h-3" /> FEATURED
                </span>
              )}
              {video.access_tier && video.access_tier !== 'free' && (
                <span className={`inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full ${
                  video.access_tier === 'fanclub' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}>
                  {video.access_tier.toUpperCase()}
                </span>
              )}
            </div>

            <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight">
              {video.title}
            </h2>

            {video.short_summary && (
              <p className="text-white/60 leading-relaxed text-base line-clamp-3">
                {video.short_summary}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-white/40">
              {brand && (
                <span className="text-white/70 font-semibold">{brand.name}</span>
              )}
              {video.release_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(video.release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              {mins !== null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />{mins}:{secs}
                </span>
              )}
            </div>

            {video.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {video.tags.slice(0, 4).map((tag, i) => (
                  <span key={i} className="bg-white/[0.05] text-white/50 text-xs px-3 py-1 rounded-full border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to={`/videos/${video.slug}`}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg shadow-primary/30"
              >
                <Play className="w-4 h-4 fill-current" />
                {video.trailer_url ? 'Watch Preview' : 'View Video'}
              </Link>
              <Link
                to="/videos"
                className="inline-flex items-center gap-2 border border-white/15 hover:border-white/30 text-white/70 hover:text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200"
              >
                Browse All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}