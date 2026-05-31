import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Play, Clock } from "lucide-react";

function VideoCard({ video }) {
  const mins = video.duration_seconds ? Math.floor(video.duration_seconds / 60) : null;
  const secs = video.duration_seconds ? String(video.duration_seconds % 60).padStart(2, "0") : null;

  return (
    <Link to={`/videos/${video.slug}`} className="group block">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-3">
        {video.primary_thumbnail_url ? (
          <img
            src={video.primary_thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 duration-200">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
        {mins !== null && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {mins}:{secs}
          </div>
        )}
        {video.featured && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-medium">
            Featured
          </div>
        )}
      </div>
      <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
        {video.title}
      </h3>
    </Link>
  );
}

function PerformerAvatar({ performer }) {
  return (
    <Link to={`/performers/${performer.slug}`} className="group flex flex-col items-center text-center gap-2">
      <div className="w-18 h-18 rounded-full bg-muted overflow-hidden ring-2 ring-transparent group-hover:ring-primary transition-all duration-200" style={{ width: 72, height: 72 }}>
        {performer.profile_image_url ? (
          <img src={performer.profile_image_url} alt={performer.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground bg-muted">
            {performer.display_name[0]}
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1 max-w-[80px]">
        {performer.display_name}
      </span>
    </Link>
  );
}

export default function Home() {
  const { data: latestVideos = [] } = useQuery({
    queryKey: ["videos", "latest-home"],
    queryFn: () => base44.entities.Video.filter({ status: "published" }, "-release_date", 8),
  });

  const { data: featuredPerformers = [] } = useQuery({
    queryKey: ["performers", "featured-home"],
    queryFn: () => base44.entities.Performer.filter({ status: "active", featured: true }, "-created_date", 10),
  });

  const { data: latestNews = [] } = useQuery({
    queryKey: ["news", "latest-home"],
    queryFn: () => base44.entities.NewsArticle.filter({ status: "published" }, "-published_at", 3),
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-background/80 to-background" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 50%, hsl(350 73% 42%) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, hsl(350 73% 42%) 0%, transparent 60%)",
          }}
        />
        <div className="relative text-center px-4 max-w-3xl mx-auto">
          <p className="text-xs font-bold tracking-[0.5em] text-primary uppercase mb-6 opacity-80">
            Premium Studio
          </p>
          <h1 className="text-7xl sm:text-9xl font-black tracking-tight uppercase leading-none mb-6 text-foreground">
            Flesh<span className="text-primary">lab</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
            Premium adult studio content. Exclusive videos, original performers, and a growing catalog.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/videos"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-lg transition-colors text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              Browse Videos
            </Link>
            <Link
              to="/performers"
              className="inline-flex items-center gap-2 bg-transparent border border-border hover:border-foreground/50 text-foreground font-semibold px-8 py-3 rounded-lg transition-colors text-sm"
            >
              Meet the Performers
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Releases */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-foreground">Latest Releases</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Fresh from the studio</p>
          </div>
          <Link to="/videos" className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {latestVideos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {latestVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-xl py-20 text-center">
            <Play className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">Content migration pending</p>
          </div>
        )}
      </section>

      {/* Featured Performers */}
      {featuredPerformers.length > 0 && (
        <section className="bg-card border-y border-border py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-foreground">Featured Performers</h2>
                <p className="text-muted-foreground text-sm mt-0.5">The faces of Fleshlab</p>
              </div>
              <Link to="/performers" className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                All performers <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 justify-start">
              {featuredPerformers.map(p => (
                <PerformerAvatar key={p.id} performer={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest News */}
      {latestNews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-foreground">Latest News</h2>
              <p className="text-muted-foreground text-sm mt-0.5">Studio updates and announcements</p>
            </div>
            <Link to="/news" className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
              All news <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {latestNews.map(article => (
              <Link
                key={article.id}
                to={`/news/${article.slug}`}
                className="group block bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors"
              >
                {article.cover_image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.cover_image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1.5 text-sm leading-snug">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{article.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}