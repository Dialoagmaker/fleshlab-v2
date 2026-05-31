import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VideoCard from "@/components/public/VideoCard";
import SEOMeta from "@/components/SEOMeta";
import PremiumTeaserBlock from "@/components/public/PremiumTeaserBlock";
import PerformerSection from "@/components/public/PerformerSection";
import VideoRail from "@/components/public/VideoRail";
import { 
  Calendar, 
  Clock, 
  Film, 
  ArrowLeft, 
  Loader2,
  Tag,
  Play,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function VideoDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [performerVideos, setPerformerVideos] = useState([]);
  const [studioVideos, setStudioVideos] = useState([]);

  // Fetch all data
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['public-videos'],
    queryFn: () => base44.entities.Video.list(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['public-brands'],
    queryFn: () => base44.entities.Brand.list(),
  });

  const { data: performers = [] } = useQuery({
    queryKey: ['public-performers'],
    queryFn: () => base44.entities.Performer.list(),
  });

  useEffect(() => {
    if (videos.length > 0 && slug) {
      const foundVideo = videos.find(v => v.slug === slug);
      if (foundVideo) {
        setVideo(foundVideo);
        
        // Related videos (same brand or tags)
        const related = videos
          .filter(v => 
            v.id !== foundVideo.id &&
            (v.brand_id === foundVideo.brand_id ||
             v.tags?.some(t => foundVideo.tags?.includes(t)))
          )
          .slice(0, 6);
        setRelatedVideos(related);

        // More from performer
        if (foundVideo.performer_id) {
          const performerVids = videos
            .filter(v => v.performer_id === foundVideo.performer_id && v.id !== foundVideo.id)
            .slice(0, 4);
          setPerformerVideos(performerVids);
        }

        // More from studio
        const studioVids = videos
          .filter(v => v.brand_id === foundVideo.brand_id && v.id !== foundVideo.id)
          .slice(0, 4);
        setStudioVideos(studioVids);
      }
    }
  }, [videos, slug]);

  // Build JSON-LD structured data
  const jsonLd = video ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.short_summary || video.description,
    "thumbnailUrl": video.primary_thumbnail_url,
    "uploadDate": video.release_date || video.created_date,
    "duration": video.duration_seconds ? `PT${video.duration_seconds}S` : undefined,
    "contentUrl": video.source_video_url,
    "embedUrl": video.trailer_url,
    "author": brands.find(b => b.id === video.brand_id) ? {
      "@type": "Organization",
      "name": brands.find(b => b.id === video.brand_id).name
    } : undefined,
  } : undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold mb-2 text-foreground">Video Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The video you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/videos')} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Videos
          </Button>
        </div>
      </div>
    );
  }

  const brand = brands.find(b => b.id === video.brand_id);
  const primaryPerformer = performers.find(p => p.id === video.performer_id);
  const canonicalUrl = `${window.location.origin}/videos/${video.slug}`;

  return (
    <>
      <SEOMeta
        title={video.meta_title || `${video.title} | FLESHLAB`}
        description={video.meta_description || video.short_summary || video.description}
        canonical={canonicalUrl}
        ogImage={video.primary_thumbnail_url || video.cover_image_url}
        ogType="video.object"
        jsonLd={jsonLd}
      />
      
      <div className="min-h-screen bg-background">
        {/* Back Navigation */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/videos')}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Video Player - Full width */}
          <div className="mb-8">
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
              <div className="aspect-video">
                {video.trailer_url ? (
                  <iframe
                    src={video.trailer_url}
                    title={video.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : video.source_video_url ? (
                  <video
                    controls
                    className="w-full h-full"
                    poster={video.primary_thumbnail_url}
                  >
                    <source src={video.source_video_url} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-secondary to-muted">
                    <div className="text-center">
                      <Play className="w-20 h-20 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Video not available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tube-Style Layout */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content - 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Quick Stats */}
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {video.title}
              </h1>

              {/* Stats Bar - Compact */}
              <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border text-sm">
                {video.release_date && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(video.release_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                )}
                {video.duration_seconds && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                  </span>
                )}
                {video.view_count !== undefined && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    {video.view_count.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Performer Section - Priority placement */}
              {primaryPerformer && (
                <PerformerSection 
                  performer={primaryPerformer}
                  videoCount={performerVideos.length + 1}
                />
              )}

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {video.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1.5 px-3 py-1">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Description */}
              {video.description && (
                <div className="prose prose-invert max-w-none pt-2">
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {video.description}
                  </p>
                </div>
              )}

              {/* Related Videos - Above conversion */}
              {relatedVideos.length > 0 && (
                <VideoRail
                  title="Related Videos"
                  videos={relatedVideos}
                  brands={brands}
                  performers={performers}
                />
              )}

              {/* More From This Performer */}
              {performerVideos.length > 0 && primaryPerformer && (
                <VideoRail
                  title={`More from ${primaryPerformer.display_name}`}
                  subtitle={`Browse ${performerVideos.length} more videos`}
                  videos={performerVideos}
                  brands={brands}
                  performers={performers}
                  viewAllLink={`/performers/${primaryPerformer.slug}`}
                  viewAllText="View Profile"
                />
              )}

              {/* More From This Studio */}
              {studioVideos.length > 0 && brand && (
                <VideoRail
                  title={`More from ${brand.name}`}
                  subtitle={`Browse ${studioVideos.length} more videos`}
                  videos={studioVideos}
                  brands={brands}
                  performers={performers}
                  viewAllLink={`/brands/${brand.slug}`}
                  viewAllText="View Studio"
                />
              )}

              {/* Premium Teaser - Last */}
              <div className="pt-8">
                <PremiumTeaserBlock title="Want Full Access?" />
              </div>
            </div>

            {/* Sidebar - 1/3 */}
            <div className="space-y-4">
              {/* Access Tier */}
              <div className="bg-card rounded-xl p-5 border border-border">
                <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-muted-foreground">Access Level</h3>
                <Badge 
                  className={
                    video.access_tier === 'free' ? 'bg-green-500/10 text-green-500 text-sm px-3 py-1.5' :
                    video.access_tier === 'fanclub' ? 'bg-purple-500/10 text-purple-500 text-sm px-3 py-1.5' :
                    'bg-primary/10 text-primary text-sm px-3 py-1.5'
                  }
                >
                  {video.access_tier === 'free' ? 'Free to Watch' :
                   video.access_tier === 'fanclub' ? 'Fanclub Exclusive' :
                   video.access_tier === 'ppv' ? 'Premium PPV' : video.access_tier}
                </Badge>
              </div>

              {/* Categories */}
              {video.categories && video.categories.length > 0 && (
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-muted-foreground">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.categories.map((cat, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured Performer Sidebar */}
              {primaryPerformer && (
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-muted-foreground">Featured Performer</h3>
                  <Link to={`/performers/${primaryPerformer.slug}`} className="block group">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden mb-3">
                      {primaryPerformer.profile_image_url ? (
                        <img
                          src={primaryPerformer.profile_image_url}
                          alt={primaryPerformer.display_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <span className="text-4xl">👤</span>
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                      {primaryPerformer.display_name}
                    </p>
                    {primaryPerformer.nationality && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {primaryPerformer.nationality}
                      </p>
                    )}
                  </Link>
                </div>
              )}

              {/* Studio Link */}
              {brand && (
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-muted-foreground">Studio</h3>
                  <Link
                    to={`/brands/${brand.slug}`}
                    className="flex items-center gap-3 group"
                  >
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="w-12 h-12 object-contain bg-secondary rounded-lg p-2"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                        <Film className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                        {brand.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        View all videos →
                      </p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}