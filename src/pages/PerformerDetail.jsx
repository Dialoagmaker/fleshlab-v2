import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VideoCard from "@/components/public/VideoCard";
import SEOMeta from "@/components/SEOMeta";
import { 
  ArrowLeft, 
  Loader2, 
  Users, 
  Calendar, 
  Film,
  Verified,
  Globe
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

  useEffect(() => {
    if (performers.length > 0 && slug) {
      const foundPerformer = performers.find(p => p.slug === slug);
      if (foundPerformer) {
        setPerformer(foundPerformer);
        
        // Note: VideoPerformer links are empty (V1 export didn't include performer data)
        // So we can't show associated videos
        setPerformerVideos([]);
      }
    }
  }, [performers, slug]);

  const jsonLd = performer ? {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": performer.display_name,
    "description": performer.bio,
    "image": performer.profile_image_url,
    "nationality": performer.nationality,
  } : undefined;

  const canonicalUrl = performer ? `${window.location.origin}/performers/${performer.slug}` : undefined;

  if (!performer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const brand = brands.find(b => b.id === performer.brand_id);

  return (
    <>
      <SEOMeta
        title={performer.meta_title || `${performer.display_name} | FLESHLAB`}
        description={performer.meta_description || performer.bio?.substring(0, 160)}
        canonical={canonicalUrl}
        ogImage={performer.profile_image_url || performer.cover_image_url}
        ogType="profile"
        jsonLd={jsonLd}
      />
      <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/performers')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Performers
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Profile Image */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl overflow-hidden border border-border">
              <div className="aspect-[3/4] bg-secondary">
                {performer.profile_image_url ? (
                  <img
                    src={performer.profile_image_url}
                    alt={performer.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Users className="w-24 h-24" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{performer.display_name}</h1>
                {performer.verified && (
                  <Verified className="w-6 h-6 text-primary" />
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-muted-foreground">
                {performer.nationality && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {performer.nationality}
                  </span>
                )}
                {performer.video_count !== undefined && performer.video_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Film className="w-4 h-4" />
                    {performer.video_count} videos
                  </span>
                )}
              </div>
            </div>

            {/* Brand */}
            {brand && (
              <Link
                to={`/brands/${brand.slug}`}
                className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full hover:bg-primary/20 transition-colors"
              >
                {brand.name}
              </Link>
            )}

            {/* Bio */}
            {performer.bio && (
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {performer.bio}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {performer.fanclub_enabled && (
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold mb-1">Fanclub</h3>
                  <Badge className="bg-purple-500/10 text-purple-500">
                    Available
                  </Badge>
                </div>
              )}
              {performer.video_count !== undefined && (
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold mb-1">Videos</h3>
                  <p className="text-2xl font-bold">{performer.video_count}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Videos */}
        {performerVideos.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Videos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {performerVideos.map(video => (
                <VideoCard key={video.id} video={video} brands={brands} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl p-8 border border-border text-center">
            <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No videos available</h3>
            <p className="text-muted-foreground">
              Videos for this performer will be added soon.
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}