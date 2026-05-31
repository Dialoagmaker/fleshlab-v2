import { Play, Film } from "lucide-react";
import { Link } from "react-router-dom";

export default function ContentRail({ title, subtitle, videos = [], brands = [] }) {
  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <section className="py-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {videos.slice(0, 12).map((video) => {
            const brand = brands.find(b => b.id === video.brand_id);
            const mins = video.duration_seconds ? Math.floor(video.duration_seconds / 60) : null;
            const secs = video.duration_seconds ? String(video.duration_seconds % 60).padStart(2, '0') : null;
            
            return (
              <Link
                key={video.id}
                to={`/videos/${video.slug}`}
                className="group block"
              >
                <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden mb-2">
                  {video.primary_thumbnail_url ? (
                    <img
                      src={video.primary_thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Play className="w-6 h-6 opacity-50" />
                    </div>
                  )}
                  
                  {mins !== null && (
                    <div className="absolute bottom-1 right-1 bg-black/90 text-white text-xs px-1.5 py-0.5 rounded">
                      {mins}:{secs}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-foreground text-xs line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                  {video.title}
                </h3>
                {brand && (
                  <p className="text-xs text-muted-foreground mt-0.5">{brand.name}</p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}