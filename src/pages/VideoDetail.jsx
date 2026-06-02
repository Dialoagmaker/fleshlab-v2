import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VideoCard from "@/components/public/VideoCard";
import SEOMeta from "@/components/SEOMeta";
import PremiumTeaserBlock from "@/components/public/PremiumTeaserBlock";
import PerformerSection from "@/components/public/PerformerSection";
import VideoRail from "@/components/public/VideoRail";
import FeaturedPerformerBlock from "@/components/public/FeaturedPerformerBlock";
import FanProductionTeaser from "@/components/public/FanProductionTeaser";
import FanclubTeaser from "@/components/public/FanclubTeaser";
import StudioVideosMiniList from "@/components/public/StudioVideosMiniList";
import { 
  Calendar, 
  Clock, 
  Film, 
  ArrowLeft, 
  Loader2,
  Tag,
  Play,
  Eye,
  Crown,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function VideoDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [detectionInfo, setDetectionInfo] = useState(null);

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

  const { data: videoPerformers = [] } = useQuery({
    queryKey: ['video-performers', slug],
    queryFn: async () => {
      if (!slug || videos.length === 0) return [];
      const foundVideo = videos.find(v => v.slug === slug);
      if (!foundVideo) return [];
      return await base44.entities.VideoPerformer.filter({ video_id: foundVideo.id });
    },
    enabled: !!slug && videos.length > 0,
  });

  useEffect(() => {
    if (videos.length > 0 && slug) {
      const foundVideo = videos.find(v => v.slug === slug);
      if (foundVideo) {
        setVideo(foundVideo);
        
        // Performer Detection with VideoPerformer priority
        let assignedPerformers = [];
        let detectedPerformer = null;
        let detectionMethod = null;
        let performerVideos = [];
        let hasFallback = false;
        let fallbackPerformer = null;

        // STRATEGY 1: VideoPerformer records (HIGHEST PRIORITY)
        if (videoPerformers && videoPerformers.length > 0) {
          const performerIds = videoPerformers.map(vp => vp.performer_id).filter(Boolean);
          assignedPerformers = performers.filter(p => performerIds.includes(p.id));
          
          if (assignedPerformers.length > 0) {
            // Use first assigned performer as primary
            detectedPerformer = assignedPerformers[0];
            detectionMethod = `videoperformer_records (${assignedPerformers.length} assigned)`;
            
            // Find other videos with same assigned performers
            const assignedIds = assignedPerformers.map(p => p.id);
            performerVideos = videos.filter(v => {
              // Check direct performer_id
              if (v.performer_id && assignedIds.includes(v.performer_id)) return true;
              // Check performer_ids array
              if (v.performer_ids && Array.isArray(v.performer_ids)) {
                return v.performer_ids.some(id => assignedIds.includes(id));
              }
              // Check performers array
              if (v.performers && Array.isArray(v.performers)) {
                return v.performers.some(p => assignedIds.includes(p.performer_id || p.id));
              }
              return false;
            }).filter(v => v.id !== foundVideo.id).slice(0, 4);
            
            hasFallback = false;
          }
        }

        // STRATEGY 2: Direct performer_id (legacy)
        if (!detectedPerformer && foundVideo.performer_id) {
          const performer = performers.find(p => p.id === foundVideo.performer_id);
          if (performer) {
            detectedPerformer = performer;
            detectionMethod = 'direct_performer_id';
            performerVideos = videos.filter(
              v => v.performer_id === foundVideo.performer_id && v.id !== foundVideo.id
            ).slice(0, 4);
          }
        }

        // STRATEGY 3: performer_ids array
        if (!detectedPerformer && foundVideo.performer_ids && Array.isArray(foundVideo.performer_ids)) {
          for (const performerId of foundVideo.performer_ids) {
            const performer = performers.find(p => p.id === performerId);
            if (performer) {
              detectedPerformer = performer;
              detectionMethod = 'performer_ids_array';
              performerVideos = videos.filter(
                v => v.performer_ids?.includes(performer.id) && v.id !== foundVideo.id
              ).slice(0, 4);
              break;
            }
          }
        }

        // STRATEGY 4: performers array
        if (!detectedPerformer && foundVideo.performers && Array.isArray(foundVideo.performers)) {
          for (const performerRef of foundVideo.performers) {
            const performerId = performerRef.performer_id || performerRef.id;
            const performer = performers.find(p => p.id === performerId);
            if (performer) {
              detectedPerformer = performer;
              detectionMethod = 'performers_array';
              performerVideos = videos.filter(
                v => v.performers?.some(p => p.performer_id === performer.id) && v.id !== foundVideo.id
              ).slice(0, 4);
              break;
            }
          }
        }

        // STRATEGY 5: Fuzzy match on title/tags
        if (!detectedPerformer) {
          const videoText = `${foundVideo.title} ${foundVideo.tags?.join(' ')}`.toLowerCase();
          for (const performer of performers) {
            const performerNames = [
              performer.display_name?.toLowerCase(),
              performer.stage_name?.toLowerCase(),
              performer.bio?.toLowerCase(),
            ].filter(Boolean);
            
            for (const name of performerNames) {
              if (videoText.includes(name)) {
                detectedPerformer = performer;
                detectionMethod = 'fuzzy_match_title_tags';
                performerVideos = videos.filter(v => {
                  const otherText = `${v.title} ${v.tags?.join(' ')}`.toLowerCase();
                  return otherText.includes(name) && v.id !== foundVideo.id;
                }).slice(0, 4);
                break;
              }
            }
            if (detectedPerformer) break;
          }
        }

        // STRATEGY 6: Fallback - featured performer from same brand
        if (!detectedPerformer && foundVideo.brand_id) {
          const featuredPerformers = performers.filter(
            p => p.featured === true && p.status === 'active'
          );
          const brandPerformer = featuredPerformers.find(p => p.brand_id === foundVideo.brand_id);
          
          if (brandPerformer) {
            detectedPerformer = brandPerformer;
            detectionMethod = 'fallback_featured_from_brand';
            performerVideos = videos.filter(
              v => v.brand_id === foundVideo.brand_id && v.id !== foundVideo.id
            ).slice(0, 4);
            hasFallback = true;
            fallbackPerformer = brandPerformer;
          }
        }

        // STRATEGY 7: Any active featured performer
        if (!detectedPerformer) {
          const featuredPerformer = performers.find(
            p => p.featured === true && p.status === 'active'
          );
          
          if (featuredPerformer) {
            detectedPerformer = featuredPerformer;
            detectionMethod = 'fallback_any_featured_performer';
            performerVideos = videos.filter(v => v.id !== foundVideo.id).slice(0, 4);
            hasFallback = true;
            fallbackPerformer = featuredPerformer;
          }
        }

        const detectionResult = {
          detectedPerformer,
          assignedPerformers,
          detectionMethod,
          performerVideos,
          hasFallback,
          fallbackPerformer,
        };
        
        setDetectionInfo(detectionResult);
        
        // Debug logging for detection path
        console.log('=== VideoDetail Performer Detection ===');
        console.log('Video ID:', foundVideo.id);
        console.log('Video Title:', foundVideo.title);
        console.log('VideoPerformer Records Found:', videoPerformers.length);
        console.log('Assigned Performer IDs:', videoPerformers.map(vp => vp.performer_id));
        console.log('Resolved Performer Names:', assignedPerformers.map(p => p.display_name));
        console.log('Detection Method:', detectionMethod || 'NONE');
        console.log('Primary Performer:', detectedPerformer?.display_name || 'NONE');
        console.log('Is Fallback:', hasFallback || false);
        console.log('Performer Videos Found:', performerVideos.length);
        console.log('========================================');
      }
    }
  }, [videos, slug, performers, videoPerformers]);

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
  const primaryPerformer = detectionInfo?.detectedPerformer || null;
  const canonicalUrl = `https://fleshlab.online/videos/${video.slug}`;

  // Related videos (same brand or tags)
  const relatedVideos = videos
    .filter(v => 
      v.id !== video.id &&
      (v.brand_id === video.brand_id ||
       v.tags?.some(t => video.tags?.includes(t)))
    )
    .slice(0, 6);

  // Studio videos
  const studioVideos = videos
    .filter(v => v.brand_id === video.brand_id && v.id !== video.id)
    .slice(0, 6);

  // Similar videos (by tags only)
  const similarVideos = videos
    .filter(v => 
      v.id !== video.id &&
      v.tags?.some(t => video.tags?.includes(t))
    )
    .slice(0, 4);

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

              {/* Performer Block - Support Multiple Assigned Performers */}
              {primaryPerformer && (
                detectionInfo?.hasFallback ? (
                  <FeaturedPerformerBlock
                    performer={primaryPerformer}
                    videoCount={detectionInfo.performerVideos.length + 1}
                    isFallback={true}
                  />
                ) : detectionInfo.assignedPerformers && detectionInfo.assignedPerformers.length > 1 ? (
                  // Multiple assigned performers from VideoPerformer
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                        Featured Performers ({detectionInfo.assignedPerformers.length})
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {detectionInfo.assignedPerformers.map((performer, idx) => (
                          <Link
                            key={performer.id}
                            to={`/performers/${performer.slug}`}
                            className="group block bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              {performer.profile_image_url ? (
                                <img
                                  src={performer.profile_image_url}
                                  alt={performer.display_name}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-border group-hover:border-primary"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                                  <Users className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                  {performer.display_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {performer.nationality || 'Performer'}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                    <PerformerSection 
                      performer={primaryPerformer}
                      videoCount={detectionInfo.performerVideos.length + 1}
                    />
                  </div>
                ) : (
                  <PerformerSection 
                    performer={primaryPerformer}
                    videoCount={detectionInfo.performerVideos.length + 1}
                  />
                )
              )}

              {/* More From This Studio - ALWAYS show if studio has videos */}
              {studioVideos.length > 0 && brand && (
                <VideoRail
                  title={`More from ${brand.name}`}
                  subtitle={`${studioVideos.length} videos available`}
                  videos={studioVideos}
                  brands={brands}
                  performers={performers}
                  viewAllLink={`/brands/${brand.slug}`}
                  viewAllText="View Studio"
                />
              )}

              {/* Similar Videos - By tags */}
              {similarVideos.length > 0 && (
                <VideoRail
                  title="Similar Videos"
                  subtitle="Based on tags"
                  videos={similarVideos}
                  brands={brands}
                  performers={performers}
                />
              )}

              {/* Fan Production Teaser */}
              <FanProductionTeaser />

              {/* Fanclub Teaser */}
              <FanclubTeaser />

              {/* Description - AFTER content discovery */}
              {video.description && (
                <div className="prose prose-invert max-w-none pt-2">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {video.description}
                  </p>
                </div>
              )}

              {/* Tags - At bottom */}
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

              {/* Related Videos - Last */}
              {relatedVideos.length > 0 && (
                <VideoRail
                  title="Related Videos"
                  videos={relatedVideos}
                  brands={brands}
                  performers={performers}
                />
              )}

              {/* Premium Teaser - Very Last */}
              <div className="pt-8">
                <PremiumTeaserBlock title="Want Full Access?" />
              </div>
            </div>

            {/* Sidebar - 1/3 */}
            <div className="space-y-4">
              {/* Featured Performer - Use First Assigned Performer */}
              {primaryPerformer ? (
                <FeaturedPerformerBlock
                  performer={primaryPerformer}
                  videoCount={detectionInfo.performerVideos.length + 1}
                  isFallback={detectionInfo.hasFallback}
                />
              ) : (
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                    Featured Performer
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Browse our featured Asian twink performers and discover exclusive content.
                  </p>
                  <Link to="/performers">
                    <Button className="w-full mt-3 bg-primary hover:bg-primary/90">
                      View All Performers
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Multiple Assigned Performers List - Sidebar */}
              {detectionInfo.assignedPerformers && detectionInfo.assignedPerformers.length > 1 && (
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                    All Performers ({detectionInfo.assignedPerformers.length})
                  </h3>
                  <div className="space-y-2">
                    {detectionInfo.assignedPerformers.map((performer, idx) => (
                      <Link
                        key={performer.id}
                        to={`/performers/${performer.slug}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
                      >
                        {performer.profile_image_url ? (
                          <img
                            src={performer.profile_image_url}
                            alt={performer.display_name}
                            className="w-10 h-10 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <Users className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {performer.display_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {performer.nationality || 'Performer'}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Fanclub Teaser - Sidebar */}
              <div className="bg-card rounded-xl p-5 border border-primary/30 bg-primary/5">
                <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-primary flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Fanclub Access
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get exclusive access to behind-the-scenes content and direct interaction with performers.
                </p>
                <Link to="/fanclub">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-sm">
                    Join Fanclub
                  </Button>
                </Link>
              </div>

              {/* Fan Production Teaser - Sidebar */}
              <div className="bg-card rounded-xl p-5 border border-purple-500/30 bg-purple-900/10">
                <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-purple-400 flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  Fan Production
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Create professional content with our performers. We provide equipment and distribution.
                </p>
                <Link to="/guest-production">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-sm">
                    Apply Now
                  </Button>
                </Link>
              </div>

              {/* More from Studio Mini List */}
              {studioVideos.length > 0 && brand && (
                <StudioVideosMiniList
                  brand={brand}
                  videos={studioVideos}
                  performers={performers}
                />
              )}

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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}