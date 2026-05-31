import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VideoCard from "@/components/public/VideoCard";
import SEOMeta from "@/components/SEOMeta";
import PremiumTeaserBlock from "@/components/public/PremiumTeaserBlock";
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

  // Fetch video by slug
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['public-videos'],
    queryFn: () => base44.entities.Video.list(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['public-brands'],
    queryFn: () => base44.entities.Brand.list(),
  });

  useEffect(() => {
    if (videos.length > 0 && slug) {
      const foundVideo = videos.find(v => v.slug === slug);
      if (foundVideo) {
        setVideo(foundVideo);
        
        // Find related videos (same brand or tags)
        const related = videos
          .filter(v => 
            v.id !== foundVideo.id &&
            (v.brand_id === foundVideo.brand_id ||
             v.tags?.some(t => foundVideo.tags?.includes(t)))
          )
          .slice(0, 6);
        setRelatedVideos(related);
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
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Large Video Player */}
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

              {/* Video Title and Metadata */}
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                  {video.title}
                </h1>

                {/* Stats Bar */}
                <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border">
                  {video.release_date && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(video.release_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  )}
                  {video.duration_seconds && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                    </span>
                  )}
                  {video.view_count !== undefined && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      {video.view_count.toLocaleString()} views
                    </span>
                  )}
                </div>

                {/* Brand Link */}
                {brand && (
                  <Link
                    to={`/brands/${brand.slug}`}
                    className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full hover:bg-primary/20 transition-colors font-medium"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {brand.name}
                  </Link>
                )}

                {/* Tags */}
                {video.tags && video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
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
                  <div className="prose prose-invert max-w-none pt-4">
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {video.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Premium Teaser */}
              <div className="pt-8">
                <PremiumTeaserBlock title="Want Full Access?" />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Access Tier Badge */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Access Level</h3>
                <Badge 
                  className={
                    video.access_tier === 'free' ? 'bg-green-500/10 text-green-500 text-sm px-4 py-2' :
                    video.access_tier === 'fanclub' ? 'bg-purple-500/10 text-purple-500 text-sm px-4 py-2' :
                    'bg-primary/10 text-primary text-sm px-4 py-2'
                  }
                >
                  {video.access_tier === 'free' ? 'Free to Watch' :
                   video.access_tier === 'fanclub' ? 'Fanclub Exclusive' :
                   video.access_tier === 'ppv' ? 'Premium PPV' : video.access_tier}
                </Badge>
              </div>

              {/* Categories */}
              {video.categories && video.categories.length > 0 && (
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.categories.map((cat, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* More from Studio */}
              {brand && (
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">More from {brand.name}</h3>
                  <Link
                    to={`/brands/${brand.slug}`}
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    View all videos
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Related Videos */}
          {relatedVideos.length > 0 && (
            <div className="mt-16 pt-8 border-t border-border">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Related Videos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedVideos.map(v => (
                  <VideoCard key={v.id} video={v} brands={brands} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}