import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VideoCard from "@/components/public/VideoCard";
import SEOMeta from "@/components/SEOMeta";
import PremiumTeaserBlock from "@/components/public/PremiumTeaserBlock";
import PerformerBadges from "@/components/public/PerformerBadges";
import { generatePerformerTitle, generatePerformerMetaDescription, generatePerformerSEOBio, isFilipino, isAsian } from "@/lib/performerSeoUtils";
import { 
  ArrowLeft, 
  Loader2, 
  Users, 
  Calendar,
  Film,
  Verified,
  Globe,
  Crown,
  Play,
  Heart,
  Sparkles,
  ExternalLink,
  Star,
  Lock,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PerformerDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [performer, setPerformer] = useState(null);
  const [performerVideos, setPerformerVideos] = useState([]);

  // Fetch all data
  const { data: performers = [] } = useQuery({
    queryKey: ['public-performers'],
    queryFn: () => base44.entities.Performer.list(),
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['public-videos'],
    queryFn: () => base44.entities.Video.list(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['public-brands'],
    queryFn: () => base44.entities.Brand.list(),
  });

  const { data: videoPerformers = [] } = useQuery({
    queryKey: ['video-performers'],
    queryFn: () => base44.entities.VideoPerformer.list(),
  });

  useEffect(() => {
    if (performers.length > 0 && slug && videos.length > 0) {
      const foundPerformer = performers.find(p => p.slug === slug);
      if (foundPerformer) {
        setPerformer(foundPerformer);
        
        // Find videos assigned to this performer via VideoPerformer records (source of truth)
        const assignedVideoIds = videoPerformers
          .filter(vp => vp.performer_id === foundPerformer.id)
          .map(vp => vp.video_id);
        
        const assignedVideos = videos.filter(v => assignedVideoIds.includes(v.id));
        setPerformerVideos(assignedVideos);
      } else {
        // Performer not found - set to null explicitly
        setPerformer(null);
      }
    }
  }, [performers, slug, videos, videoPerformers]);

  const jsonLd = performer ? {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": performer.display_name || 'Verified Performer',
    "description": performer.meta_description || generatePerformerMetaDescription(performer),
    "image": performer.profile_image_url || '/placeholder-performer.jpg',
    "url": `https://fleshlab.online/performers/${performer.slug}`,
    "nationality": performer.nationality,
    "worksFor": {
      "@type": "Organization",
      "name": "FLESHLAB Studios",
      "url": "https://fleshlab.online"
    },
    "sameAs": [
      performer.twitter_url,
      performer.instagram_url,
      performer.onlyfans_url
    ].filter(Boolean)
  } : undefined;

  const canonicalUrl = performer ? `https://fleshlab.online/performers/${performer.slug}` : undefined;
  
  // Generate SEO content - NULL SAFE (only after performer exists)
  const seoTitle = performer && performer.meta_title ? performer.meta_title : generatePerformerTitle(performer || {});
  const seoDescription = performer && performer.meta_description ? performer.meta_description : generatePerformerMetaDescription(performer || {});
  const seoIntro = performer ? generatePerformerSEOBio(performer) : '';

  // Calculate performer's primary brand from public videos (VideoPerformer -> Video -> Brand)
  const performerBrand = useMemo(() => {
    if (!performer || !brands.length) return null;
    const brandCounts = {};
    performerVideos.forEach(video => {
      if (video.brand_id) {
        brandCounts[video.brand_id] = (brandCounts[video.brand_id] || 0) + 1;
      }
    });
    
    let maxCount = 0;
    let primaryBrandId = null;
    Object.entries(brandCounts).forEach(([brandId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        primaryBrandId = brandId;
      }
    });
    
    return primaryBrandId ? brands.find(b => b.id === primaryBrandId) : null;
  }, [performer, performerVideos, brands]);

  // Check for exclusive/fanclub videos
  const hasExclusiveVideos = performerVideos.some(v => v.is_exclusive || v.access_tier === 'fanclub' || v.access_tier === 'ppv');
  const fanclubOrExclusive = performer?.fanclub_enabled || hasExclusiveVideos;

  // Loading state
  // Not found state
  if (performer === null && performers.length > 0 && slug) {
    return (
      <>
        <SEOMeta
          title="Performer Not Found | FLESHLAB Studios"
          description="This performer profile does not exist. Browse verified 18+ performers on FLESHLAB Studios."
          canonical="/performers"
          noIndex={true}
        />
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold mb-4 text-foreground">Performer Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The performer profile you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/performers')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Performers
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Loading state
  if (!performer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        ogImage={performer.profile_image_url || performer.cover_image_url}
        ogType="profile"
        jsonLd={jsonLd}
      />
      
      <div className="min-h-screen bg-background">
        {/* Cinematic Hero Section */}
        <div className="relative bg-gradient-to-b from-[#0f0f0f] via-[#0a0a0a] to-background border-b border-rose-600/20 pb-8 overflow-hidden">
          {/* Subtle rose glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-rose-600/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-[1400px] mx-auto px-4 pt-8 pb-6 relative z-10">
            {/* Back Navigation */}
            <Button
              variant="ghost"
              onClick={() => navigate('/performers')}
              className="gap-2 text-white/60 hover:text-white mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Performers
            </Button>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Large Profile Image */}
              <div className="lg:col-span-1">
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-rose-900/20">
                  <div className="aspect-[3/4] bg-secondary relative group">
                    {performer.profile_image_url ? (
                      <img
                        src={performer.profile_image_url}
                        alt={performer.display_name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-secondary to-muted">
                        <Users className="w-24 h-24 opacity-50" />
                      </div>
                    )}
                    
                    {/* Verified badge */}
                    {performer.verified && (
                      <div className="absolute top-4 right-4 bg-primary text-white p-2.5 rounded-full shadow-lg shadow-rose-600/30">
                        <Verified className="w-5 h-5" />
                      </div>
                    )}
                    
                    {/* Active status */}
                    {performer.status === 'active' && (
                      <div className="absolute top-4 left-4 bg-emerald-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        ACTIVE
                      </div>
                    )}
                    
                    {/* Gradient overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Performer Info & CTAs */}
              <div className="lg:col-span-2 flex flex-col justify-center">
                <div className="space-y-6">
                  {/* Name + Verified */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">{performer.display_name}</h1>
                    {performer.verified && (
                      <div className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 rounded-full border border-primary/30">
                        <Verified className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wide">Verified 18+</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats Row */}
                  <div className="flex flex-wrap gap-4 text-white/70">
                    {performer.nationality && (
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                        <Globe className="w-4 h-4 text-rose-500" />
                        <span className="font-medium text-white text-sm">{performer.nationality}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                      <Film className="w-4 h-4 text-rose-500" />
                      <span className="font-medium text-white text-sm">{performerVideos.length} {performerVideos.length === 1 ? 'video' : 'videos'}</span>
                    </div>
                    {performerBrand && (
                      <div className="flex items-center gap-2 bg-rose-600/20 px-3 py-1.5 rounded-lg border border-rose-600/30">
                        <Crown className="w-4 h-4 text-rose-500" />
                        <span className="font-medium text-white text-sm">{performerBrand.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Short punchy intro */}
                  <p className="text-white/70 leading-relaxed text-lg max-w-2xl">
                    {seoIntro}
                  </p>

                  {/* Trust Badges */}
                  <PerformerBadges performer={performer} />

                  {/* Primary CTAs */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    {performerVideos.length > 0 ? (
                      <Link to="/videos">
                        <Button className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-6 text-base font-semibold shadow-lg shadow-rose-600/30 gap-2">
                          <Play className="w-5 h-5" />
                          Watch Videos
                        </Button>
                      </Link>
                    ) : null}
                    
                    {fanclubOrExclusive && (
                      <Link to="/fanclub">
                        <Button variant="outline" className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border-purple-600/40 px-8 py-6 text-base font-semibold gap-2">
                          <Crown className="w-5 h-5" />
                          Join Fanclub
                        </Button>
                      </Link>
                    )}
                    
                    {hasExclusiveVideos && (
                      <Link to="/videos">
                        <Button variant="outline" className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border-amber-600/40 px-6 py-6 text-base font-semibold gap-2">
                          <Star className="w-5 h-5" />
                          Exclusive Scenes
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          {/* Full Biography */}
          {performer.bio && (
            <div className="mb-10">
              <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6 lg:p-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  About {performer.display_name}
                </h2>
                <p className="text-white/70 whitespace-pre-wrap leading-relaxed text-base lg:text-lg">
                  {performer.bio}
                </p>
              </div>
            </div>
          )}

          {/* Videos Section */}
          {performerVideos.length > 0 ? (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                    Videos with {performer.display_name}
                  </h2>
                  <p className="text-white/50 text-sm">
                    {performerVideos.length} {performerVideos.length === 1 ? 'scene' : 'scenes'} available now
                  </p>
                </div>
                <Link to="/videos">
                  <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
                    Browse All Videos
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {performerVideos.map(video => (
                  <VideoCard key={video.id} video={video} brands={brands} />
                ))}
              </div>
            </div>
          ) : (
            /* Empty State - No Videos */
            <div className="mb-10">
              <div className="bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
                <div className="w-20 h-20 bg-rose-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Film className="w-10 h-10 text-rose-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Exclusive Scenes Coming Soon
                </h2>
                <p className="text-white/60 mb-8 max-w-lg mx-auto">
                  {performer.display_name}'s premium content is being added to the library. 
                  Be the first to know when new scenes drop by joining the fanclub.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link to="/videos">
                    <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
                      <Play className="w-4 h-4" />
                      Browse All Videos
                    </Button>
                  </Link>
                  <Link to="/performers">
                    <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
                      <Users className="w-4 h-4" />
                      View All Performers
                    </Button>
                  </Link>
                  {performer.fanclub_enabled && (
                    <Link to="/fanclub">
                      <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                        <Crown className="w-4 h-4" />
                        Join Fanclub
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Fanclub Promo */}
          {performer.fanclub_enabled && (
            <div className="mb-10">
              <div className="relative bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-2xl border border-purple-500/30 p-8 overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-600/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                        <Crown className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          Join {performer.display_name}'s Fanclub
                        </h3>
                        <p className="text-purple-300/80 text-sm">
                          Unlock exclusive premium content
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-3 text-white/80">
                        <div className="w-5 h-5 bg-purple-600/30 rounded-full flex items-center justify-center">
                          <Lock className="w-3 h-3 text-purple-300" />
                        </div>
                        <span>Exclusive scenes not available anywhere else</span>
                      </li>
                      <li className="flex items-center gap-3 text-white/80">
                        <div className="w-5 h-5 bg-purple-600/30 rounded-full flex items-center justify-center">
                          <Zap className="w-3 h-3 text-purple-300" />
                        </div>
                        <span>Early access to new releases before public launch</span>
                      </li>
                      <li className="flex items-center gap-3 text-white/80">
                        <div className="w-5 h-5 bg-purple-600/30 rounded-full flex items-center justify-center">
                          <Heart className="w-3 h-3 text-purple-300" />
                        </div>
                        <span>Behind the scenes content and performer updates</span>
                      </li>
                      <li className="flex items-center gap-3 text-white/80">
                        <div className="w-5 h-5 bg-purple-600/30 rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-purple-300" />
                        </div>
                        <span>Direct support for {performer.display_name}</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex lg:justify-end">
                    <Link to="/fanclub">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-purple-600/30 gap-2">
                        <Crown className="w-5 h-5" />
                        Join Fanclub Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}