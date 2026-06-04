import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAccessControl } from "@/lib/useAccessControl";
import VideoCard from "@/components/public/VideoCard";
import SEOMeta from "@/components/SEOMeta";
import PremiumTeaserBlock from "@/components/public/PremiumTeaserBlock";
import PerformerBadges from "@/components/public/PerformerBadges";
import FanclubSupportBlock from "@/components/public/FanclubSupportBlock";
import { generatePerformerTitle, generatePerformerMetaDescription, generatePerformerSEOBio } from "@/lib/performerSeoUtils";
import { 
  ArrowLeft, 
  Loader2, 
  Users, 
  Film,
  Verified,
  Crown,
  Play,
  Heart,
  Star,
  Lock,
  Zap,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PerformerDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { requireSignup } = useAccessControl();
  const [performer, setPerformer] = useState(null);
  const [performerVideos, setPerformerVideos] = useState([]);
  
  // Auth-gated handlers - safe, no performer access
  const handleWatchVideos = () => {
    requireSignup('/videos');
  };
  
  const handleJoinFanclub = () => {
    requireSignup('/fanclub');
  };

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
        
        const assignedVideoIds = videoPerformers
          .filter(vp => vp.performer_id === foundPerformer.id)
          .map(vp => vp.video_id);
        
        const assignedVideos = videos.filter(v => assignedVideoIds.includes(v.id));
        setPerformerVideos(assignedVideos);
      } else {
        setPerformer(null);
      }
    }
  }, [performers, slug, videos, videoPerformers]);

  // Check for exclusive/fanclub videos - safe
  const hasExclusiveVideos = performerVideos.some(v => v.is_exclusive || v.access_tier === 'fanclub' || v.access_tier === 'ppv');
  const fanclubOrExclusive = performer?.fanclub_enabled || hasExclusiveVideos;
  
  // Get featured video
  const featuredVideo = performerVideos.find(v => v.is_exclusive || v.access_tier === 'fanclub' || v.access_tier === 'ppv') || performerVideos[0];

  // Calculate performer's primary brand - NULL SAFE
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

  // Identity line for hero - NULL SAFE (moved BEFORE loading check)
  const nationalityShort = performer?.nationality ? performer.nationality.split(',')[0].trim() : '';
  const identityLine = `Verified 18+ ${nationalityShort ? nationalityShort + ' performer' : 'performer'} · FLESHLAB Studios`;
  
  // JSON-LD - NULL SAFE
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
  
  // Generate SEO content - NULL SAFE
  const seoTitle = performer?.meta_title || generatePerformerTitle(performer || {});
  const seoDescription = performer?.meta_description || generatePerformerMetaDescription(performer || {});
  const seoIntro = performer ? generatePerformerSEOBio(performer) : '';

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

  // Performer exists - render page
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
        {/* Two-Column Sales Hero */}
        <div className="relative bg-gradient-to-b from-[#0a0a0a] via-[#0d0d0d] to-background border-b border-rose-600/20 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-rose-600/5 rounded-full blur-[140px] pointer-events-none" />
          
          <div className="max-w-[1400px] mx-auto px-4 pt-6 pb-10 relative z-10">
            {/* Back Navigation */}
            <Button
              variant="ghost"
              onClick={() => navigate('/performers')}
              className="gap-2 text-white/50 hover:text-white mb-6 -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Performers</span>
            </Button>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left: Large Profile Image */}
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <div className="bg-gradient-to-br from-rose-600/20 to-purple-600/20 rounded-3xl p-1 shadow-2xl shadow-rose-900/30">
                    <div className="bg-[#0a0a0a] rounded-[22px] overflow-hidden">
                      <div className="aspect-[4/5] relative group">
                        {performer.profile_image_url ? (
                          <img
                            src={performer.profile_image_url}
                            alt={performer.display_name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
                            <Users className="w-32 h-32 opacity-30" />
                          </div>
                        )}
                        
                        {/* Overlay badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          {performer.verified && (
                            <div className="bg-primary/95 backdrop-blur-sm text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-1.5">
                              <Verified className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase">Verified 18+</span>
                            </div>
                          )}
                          {performer.status === 'active' && (
                            <div className="bg-emerald-500/95 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              ACTIVE
                            </div>
                          )}
                        </div>
                        
                        {/* Studio badge */}
                        {performerBrand && (
                          <div className="absolute bottom-4 left-4 bg-rose-600/95 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
                            <Crown className="w-4 h-4" />
                            <span className="text-sm font-bold">{performerBrand.name}</span>
                          </div>
                        )}
                        
                        {/* Video count badge */}
                        {performerVideos.length > 0 && (
                          <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
                            <Film className="w-4 h-4 text-rose-500" />
                            <span className="text-sm font-bold">{performerVideos.length} {performerVideos.length === 1 ? 'Scene' : 'Scenes'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Sales Content & CTAs */}
              <div className="order-1 lg:order-2 space-y-6">
                {/* Name + Identity */}
                <div>
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight mb-3">
                    {performer.display_name}
                  </h1>
                  <p className="text-white/60 text-lg mb-4">{identityLine}</p>
                  
                  {/* Fanclub/Exclusive badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {performer.fanclub_enabled && (
                      <div className="bg-purple-600/20 text-purple-400 border border-purple-600/40 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5" />
                        FANCLUB AVAILABLE
                      </div>
                    )}
                    {hasExclusiveVideos && (
                      <div className="bg-amber-600/20 text-amber-400 border border-amber-600/40 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5" />
                        EXCLUSIVE SCENES
                      </div>
                    )}
                  </div>
                </div>

                {/* Short seductive intro */}
                <p className="text-white/70 text-lg leading-relaxed line-clamp-2">
                  {seoIntro}
                </p>

                {/* Primary CTA Row */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {performerVideos.length > 0 && (
                    <Button onClick={handleWatchVideos} className="w-full bg-rose-600 hover:bg-rose-700 text-white px-8 py-7 text-lg font-bold shadow-xl shadow-rose-600/30 gap-2.5 rounded-xl">
                      <Play className="w-6 h-6" />
                      {isAuthenticated ? 'Watch Videos' : 'Create Account to Watch'}
                    </Button>
                  )}
                  
                  {fanclubOrExclusive && (
                    <Button onClick={handleJoinFanclub} variant="outline" className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border-purple-600/40 px-8 py-7 text-lg font-bold gap-2.5 rounded-xl">
                      <Crown className="w-6 h-6" />
                      {isAuthenticated ? 'Join Fanclub — $12.99/month' : 'Create Account to Join Fanclub'}
                    </Button>
                  )}
                </div>

                {/* Secondary CTA - Exclusive Scenes */}
                {hasExclusiveVideos && performerVideos.length > 0 && (
                  <Link to="/videos">
                    <Button variant="outline" className="w-full sm:w-auto bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border-amber-600/30 px-6 py-4 font-semibold gap-2 rounded-xl">
                      <Lock className="w-4 h-4" />
                      Unlock Exclusive Scenes
                    </Button>
                  </Link>
                )}

                {/* Trust Badges */}
                <div className="pt-4">
                  <PerformerBadges performer={performer} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Scene */}
        {featuredVideo && (
          <div className="max-w-[1400px] mx-auto px-4 py-10">
            <div className="bg-gradient-to-br from-rose-900/20 via-rose-800/10 to-transparent rounded-3xl border border-rose-600/30 p-6 lg:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-rose-600/20 rounded-xl flex items-center justify-center">
                    <Play className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white">Featured Scene</h2>
                    <p className="text-white/50 text-sm">Watch {performer.display_name}'s latest release</p>
                  </div>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-6 items-center">
                  <div className="relative group">
                    <Link to={`/videos/${featuredVideo.slug}`}>
                      <div className="aspect-video bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                        <img
                          src={featuredVideo.primary_thumbnail_url || featuredVideo.cover_image_url}
                          alt={featuredVideo.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-lg">
                            <Play className="w-8 h-8 text-white ml-1" />
                          </div>
                        </div>
                        {(featuredVideo.is_exclusive || featuredVideo.access_tier === 'fanclub' || featuredVideo.access_tier === 'ppv') && (
                          <div className="absolute top-3 right-3 bg-amber-600/95 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            EXCLUSIVE
                          </div>
                        )}
                        {featuredVideo.duration_seconds && (
                          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-xs font-bold">
                            {Math.floor(featuredVideo.duration_seconds / 60)}:{String(featuredVideo.duration_seconds % 60).padStart(2, '0')}
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">{featuredVideo.title}</h3>
                      <p className="text-white/60 text-sm line-clamp-2">{featuredVideo.short_summary || featuredVideo.description}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {featuredVideo.access_tier === 'free' && (
                        <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/40">
                          Free to Watch
                        </Badge>
                      )}
                      {featuredVideo.access_tier === 'fanclub' && (
                        <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/40">
                          Fanclub Only
                        </Badge>
                      )}
                      {featuredVideo.access_tier === 'ppv' && (
                        <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/40">
                          Premium Rental
                        </Badge>
                      )}
                      {featuredVideo.is_exclusive && (
                        <Badge className="bg-rose-600/20 text-rose-400 border-rose-600/40">
                          Exclusive
                        </Badge>
                      )}
                    </div>
                    
                    <Button onClick={handleWatchVideos} className="w-full bg-rose-600 hover:bg-rose-700 text-white px-6 py-6 text-base font-bold shadow-lg shadow-rose-600/30 gap-2 rounded-xl">
                      <Play className="w-5 h-5" />
                      {isAuthenticated ? (featuredVideo.access_tier === 'free' ? 'Watch Scene' : 'Unlock Scene') : 'Create Account to Watch'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Sections */}
        <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-10">
          {/* Biography */}
          {performer.bio && (
            <div>
              <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6 lg:p-10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-rose-500" />
                  About {performer.display_name}
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-white/70 whitespace-pre-wrap leading-relaxed text-base lg:text-lg max-w-3xl">
                    {performer.bio}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Videos Section */}
          {performerVideos.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-white mb-1">
                    All Scenes with {performer.display_name}
                  </h2>
                  <p className="text-white/50 text-sm">
                    {performerVideos.length} {performerVideos.length === 1 ? 'exclusive scene' : 'exclusive scenes'} available now
                  </p>
                </div>
                <Link to="/videos">
                  <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 rounded-xl">
                    Browse All Videos
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              
              <div className={`grid gap-6 ${performerVideos.length === 1 ? 'grid-cols-1 max-w-3xl' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {performerVideos.map(video => (
                  <VideoCard key={video.id} video={video} brands={brands} />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm rounded-3xl border border-white/10 p-12 lg:p-16 text-center">
                <div className="w-24 h-24 bg-rose-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Film className="w-12 h-12 text-rose-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Exclusive Scenes Coming Soon
                </h2>
                <p className="text-white/60 mb-8 max-w-lg mx-auto text-lg">
                  {performer.display_name}'s premium content is being added to the library. 
                  Be the first to know when new scenes drop by joining the fanclub.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link to="/videos">
                    <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 rounded-xl">
                      <Play className="w-4 h-4" />
                      Browse All Videos
                    </Button>
                  </Link>
                  <Link to="/performers">
                    <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 rounded-xl">
                      <Users className="w-4 h-4" />
                      View All Performers
                    </Button>
                  </Link>
                  {performer.fanclub_enabled && (
                    <Link to="/fanclub">
                      <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                        <Crown className="w-4 h-4" />
                        Join Fanclub
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fanclub Support Block — always show, passes all performers for visual row */}
          <FanclubSupportBlock
            performerName={performer.display_name}
            isAuthenticated={isAuthenticated}
            onJoin={handleJoinFanclub}
            performers={performers.filter(p => p.profile_image_url && p.id !== performer.id)}
          />
        </div>
      </div>
    </>
  );
}