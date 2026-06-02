import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function PromoBanner({ video }) {
  if (!video) {
    return (
      <div className="bg-gradient-to-r from-rose-950/30 to-[#0a0a0a] py-8">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="text-center">
            <p className="text-white/60">Featured content coming soon</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-rose-950/30 to-[#0a0a0a] py-6">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Banner (70%) */}
          <div className="lg:col-span-2 relative group cursor-pointer overflow-hidden rounded-lg">
            <Link to={`/videos/${video.slug}`}>
              <div className="aspect-video relative">
                {video.cover_image_url ? (
                  <img
                    src={video.cover_image_url}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-900/40 to-[#1a1a1a]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2">
                    {video.title}
                  </h2>
                  <p className="text-white/80 mb-4 line-clamp-1">
                    Studio Original Trailer
                  </p>
                  <div className="flex gap-3">
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white">
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      Watch Preview
                    </Button>
                    <Link to="/fanclub">
                      <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                        Join Fanclub
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Sidebar Promo (30%) */}
          <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-[#1a1a1a]">
            <Link to="/fanclub">
              <div className="aspect-video lg:aspect-auto lg:h-full relative">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-900/40 to-[#0a0a0a]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Unlock Full Scenes
                  </h3>
                  <p className="text-white/70 text-sm mb-4">
                    Join Fanclub for exclusive access
                  </p>
                  <Button className="bg-rose-600 hover:bg-rose-700 text-white w-full max-w-[200px]">
                    Join Fanclub
                  </Button>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}