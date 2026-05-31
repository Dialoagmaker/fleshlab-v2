import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Play, ArrowRight, Film, Users, Crown, Sparkles } from "lucide-react";
import VideoCard from "@/components/public/VideoCard";
import PerformerCard from "@/components/public/PerformerCard";
import PremiumTeaserBlock from "@/components/public/PremiumTeaserBlock";
import StudioTrustBlock from "@/components/public/StudioTrustBlock";
import SectionHeader from "@/components/public/SectionHeader";
import ContentRail from "@/components/public/ContentRail";
import HeroVideoTeaser from "@/components/public/HeroVideoTeaser";

export default function Home() {
  const [hasVideoTeaser, setHasVideoTeaser] = useState(false);

  const { data: latestVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["public-videos-latest"],
    queryFn: () => base44.entities.Video.filter({ status: "published" }, "-release_date", 12),
  });

  const { data: featuredVideos = [] } = useQuery({
    queryKey: ["public-videos-featured"],
    queryFn: () => base44.entities.Video.filter({ status: "published", featured: true }, "-created_date", 8),
  });

  const { data: allPerformers = [] } = useQuery({
    queryKey: ["public-performers"],
    queryFn: () => base44.entities.Performer.filter({ status: "active" }, "-created_date", 20),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["public-brands"],
    queryFn: () => base44.entities.Brand.list(),
  });

  const featuredPerformers = allPerformers.filter(p => p.featured).slice(0, 8);
  const activePerformers = allPerformers.filter(p => p.status === "active").slice(0, 12);

  const { data: latestNews = [] } = useQuery({
    queryKey: ["public-news"],
    queryFn: () => base44.entities.NewsArticle.filter({ status: "published" }, "-published_at", 3),
  });

  // Get Filipino performers for dedicated rail
  const filipinoPerformers = allPerformers.filter(p => 
    p.nationality && p.nationality.toLowerCase().includes('filipino')
  ).slice(0, 8);

  // Get videos with Filipino performers (simplified - would need VideoPerformer data)
  const filipinoVideos = latestVideos.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Rotating Video Teaser */}
      <section className="relative min-h-[60vh] md:min-h-[65vh] flex items-center justify-center overflow-hidden border-b border-border">
        <HeroVideoTeaser onVideosLoaded={(count) => setHasVideoTeaser(count > 0)} />
      </section>

      {/* Latest Releases - Above the fold */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <SectionHeader
          title="Latest Asian Twink Videos"
          subtitle="Fresh from the studio - new releases every week"
          viewAllLink="/videos"
          viewAllText="View All Videos"
        />
        
        {videosLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-video bg-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : latestVideos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {latestVideos.map(video => (
              <VideoCard key={video.id} video={video} brands={brands} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-xl py-20 text-center">
            <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-sm">Videos coming soon</p>
          </div>
        )}
      </section>

      {/* FLESHLAB Asia Originals */}
      <ContentRail
        title="FLESHLAB Asia Originals"
        subtitle="Our most popular exclusive scenes"
        videos={featuredVideos}
        brands={brands}
        viewAllLink="/videos"
        viewAllText="View All Originals"
      />

      {/* Filipino Twink Picks */}
      <ContentRail
        title="Filipino Twink Picks"
        subtitle="Hottest performers from the Philippines"
        videos={filipinoVideos}
        brands={brands}
        viewAllLink="/videos"
        viewAllText="Browse All Videos"
      />

      {/* Premium Teaser Block */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <PremiumTeaserBlock title="Want Full Access?" />
      </section>

      {/* Featured Performers */}
      {featuredPerformers.length > 0 && (
        <section className="bg-card/50 border-y border-border py-12">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader
              title="Featured Performers"
              subtitle="The hottest Asian twinks in the industry"
              viewAllLink="/performers"
              viewAllText="All Performers"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {featuredPerformers.map(performer => (
                <PerformerCard key={performer.id} performer={performer} brands={brands} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Active Performers Rail */}
      {activePerformers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <SectionHeader
            title="All Active Performers"
            subtitle={`Browse ${activePerformers.length} performers`}
            viewAllLink="/performers"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {activePerformers.map(performer => (
              <PerformerCard key={performer.id} performer={performer} brands={brands} />
            ))}
          </div>
        </section>
      )}

      {/* Trust Block */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Why FLESHLAB Asia?</h2>
          <p className="text-muted-foreground">Premium studio experience built for fans</p>
        </div>
        <StudioTrustBlock />
      </section>

      {/* Latest News */}
      {latestNews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12 border-t border-border">
          <SectionHeader
            title="Studio News"
            subtitle="Updates, announcements, and behind-the-scenes"
            viewAllLink="/news"
          />
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
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-tight">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{article.excerpt}</p>
                  )}
                  {article.published_at && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(article.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="bg-gradient-to-b from-card to-background border-t border-border py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Experience Premium Content?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of fans getting exclusive access to full scenes, early releases, 
            and direct interaction with Asian twink performers.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/videos"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3.5 rounded-lg transition-colors shadow-lg shadow-primary/20"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Watching
            </Link>
            <Link
              to="/performers"
              className="inline-flex items-center gap-2 bg-transparent border border-border hover:border-primary/50 text-foreground font-semibold px-8 py-3.5 rounded-lg transition-colors"
            >
              Browse Performers
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}