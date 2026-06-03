import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VideoCard from "@/components/public/VideoCard";
import SEOMeta from "@/components/SEOMeta";
import PremiumTeaserBlock from "@/components/public/PremiumTeaserBlock";
import { 
  ArrowLeft, 
  Loader2, 
  Users, 
  Calendar, 
  Film,
  Verified,
  Globe,
  MapPin,
  Crown
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
      }
    }
  }, [performers, slug, videos, videoPerformers]);

  const jsonLd = performer ? {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": performer.display_name,
    "description": performer.meta_description || performer.bio?.substring(0, 160),
    "image": performer.profile_image_url,
    "nationality": performer.nationality,
    "birthDate": performer.date_of_birth,
    "sameAs": [
      performer.twitter_url,
      performer.instagram_url,
      performer.onlyfans_url
    ].filter(Boolean)
  } : undefined;

  const canonicalUrl = performer ? `https://fleshlab.online/performers/${performer.slug}` : undefined;

  if (!performer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const brand = brands.find(b => b.id === performer.brand_id);
  
  // Calculate age if DOB available
  const age = performer.date_of_birth ? 
    Math.floor((new Date() - new Date(performer.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25)) : null;

  return (
    <>
      <SEOMeta
        title={performer.meta_title || `${performer.display_name} | FLESHLAB Studios`}
        description={performer.meta_description || (performer.bio ? performer.bio.substring(0, 157) + '...' : `Meet ${performer.display_name}, verified 18+ Asian gay performer with FLESHLAB Studios.`)}
        canonical={canonicalUrl}
        ogImage={performer.profile_image_url || performer.cover_image_url}
        ogType="profile"
        jsonLd={jsonLd}
      />
      
      <div className="min-h-screen bg-background">
        {/* Back Navigation */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/performers')}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Performers
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Large Profile Image */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-xl">
                <div className="aspect-[3/4] bg-secondary relative">
                  {performer.profile_image_url ? (
                    <img
                      src={performer.profile_image_url}
                      alt={performer.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-secondary to-muted">
                      <Users className="w-24 h-24 opacity-50" />
                    </div>
                  )}
                  
                  {/* Verified badge */}
                  {performer.verified && (
                    <div className="absolute top-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg">
                      <Verified className="w-6 h-6" />
                    </div>
                  )}
                  
                  {/* Status badge */}
                  {performer.status === 'active' && (
                    <div className="absolute top-4 left-4 bg-green-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      ACTIVE
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl sm:text-5xl font-black text-foreground">{performer.display_name}</h1>
                  {performer.verified && (
                    <Verified className="w-7 h-7 text-primary" />
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-muted-foreground pb-4 border-b border-border">
                  {performer.nationality && (
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      <span className="font-medium text-foreground">{performer.nationality}</span>
                    </span>
                  )}
                  {age && age >= 18 && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium text-foreground">{age} years old</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Film className="w-4 h-4" />
                    <span className="font-medium text-foreground">{performerVideos.length} {performerVideos.length === 1 ? 'video' : 'videos'}</span>
                  </span>
                </div>
              </div>

              {/* Brand */}
              {brand && (
                <Link
                  to={`/brands/${brand.slug}`}
                  className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full hover:bg-primary/20 transition-colors font-medium"
                >
                  <Crown className="w-4 h-4" />
                  {brand.name}
                </Link>
              )}

              {/* Bio */}
              {performer.bio && (
                <div className="prose prose-invert max-w-none pt-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Biography</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {performer.bio}
                  </p>
                </div>
              )}

              {/* Fanclub CTA */}
              <div className="pt-6">
                {performer.fanclub_enabled ? (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Crown className="w-6 h-6 text-purple-500" />
                      <h3 className="font-bold text-foreground">Fanclub Available</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">
                      Get exclusive access to {performer.display_name}'s premium content
                    </p>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      Fanclub Coming Soon
                    </Button>
                  </div>
                ) : (
                  <PremiumTeaserBlock title={`Follow ${performer.display_name}?`} />
                )}
              </div>
            </div>
          </div>

          {/* Videos Section */}
          {performerVideos.length > 0 ? (
            <div className="pt-8 border-t border-border">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Videos with {performer.display_name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {performerVideos.map(video => (
                  <VideoCard key={video.id} video={video} brands={brands} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card/50 rounded-2xl p-12 border border-border text-center">
              <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-bold mb-2 text-foreground">Videos Coming Soon</h3>
              <p className="text-muted-foreground mb-6">
                {performer.display_name}'s scenes are being added to the library
              </p>
              <Button onClick={() => navigate('/videos')} variant="outline">
                Browse Other Videos
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}