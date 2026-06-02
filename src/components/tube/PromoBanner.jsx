import { Play, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function PromoBanner({ video, performers = [] }) {
  // Always show banner - use first video or hide gracefully
  if (!video) {
    return null;
  }

  const featuredPerformer = performers.find(p => p.featured) || performers[0];

  return (
    <div className="relative py-4 bg-[#0a0a0a]">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Banner (70%) - Featured Video */}
          <div className="lg:col-span-2 relative group cursor-pointer overflow-hidden rounded-lg border border-white/10">
            <Link to={`/videos/${video.slug}`}>
              <div className="aspect-video relative">
                {/* Background Image */}
                {video.cover_image_url || video.primary_thumbnail_url ? (
                  <img
                    src={video.cover_image_url || video.primary_thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-900/60 to-[#1a1a1a]" />
                )}
                
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {video.featured && (
                    <div className="bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      FEATURED
                    </div>
                  )}
                  {video.access_tier === 'fanclub' && (
                    <div className="bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded">
                      FANCLUB
                    </div>
                  )}
                  {video.is_exclusive && (
                    <div className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                      EXCLUSIVE
                    </div>
                  )}
                  {!video.featured && video.access_tier === 'free' && (
                    <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                      PREVIEW
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-lg line-clamp-2">
                    {video.title}
                  </h2>
                  <p className="text-white/90 text-sm mb-4 line-clamp-1">
                    {video.short_summary || "Studio Original Production"}
                  </p>
                  <div className="flex gap-2">
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm h-9 px-4">
                      <Play className="w-4 h-4 mr-1.5 fill-current" />
                      Watch Preview
                    </Button>
                    {video.access_tier !== 'free' && (
                      <Link to="/fanclub">
                        <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 font-semibold text-sm h-9 px-4">
                          <Lock className="w-4 h-4 mr-1.5" />
                          Unlock Full
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Sidebar (30%) - Fanclub or Performer Promo */}
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-rose-950/40 to-[#0a0a0a]">
            <Link to="/fanclub" className="block h-full">
              <div className="aspect-video lg:aspect-auto lg:h-full relative">
                {/* Background Image if performer available */}
                {featuredPerformer?.profile_image_url && (
                  <img
                    src={featuredPerformer.profile_image_url}
                    alt={featuredPerformer.display_name}
                    className="w-full h-full object-cover opacity-60"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-950/60 to-black" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <div className="mb-3">
                    <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center mx-auto mb-2">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Unlock Full Scenes
                  </h3>
                  <p className="text-white/80 text-xs mb-3">
                    Join Fanclub for exclusive access to full-length videos
                  </p>
                  <Button className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm h-9 w-full max-w-[180px]">
                    Join Fanclub
                  </Button>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-3 right-3">
                  <div className="bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded">
                    PREMIUM
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}