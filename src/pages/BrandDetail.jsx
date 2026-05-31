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
  Building2, 
  Film, 
  Users,
  Crown,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BrandDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const [brandVideos, setBrandVideos] = useState([]);

  // Fetch all data
  const { data: brands = [] } = useQuery({
    queryKey: ['public-brands'],
    queryFn: () => base44.entities.Brand.list(),
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['public-videos'],
    queryFn: () => base44.entities.Video.list(),
  });

  useEffect(() => {
    if (brands.length > 0 && slug) {
      const foundBrand = brands.find(b => b.slug === slug);
      if (foundBrand) {
        setBrand(foundBrand);
        
        // Filter videos by brand_id
        const videosForBrand = videos.filter(v => v.brand_id === foundBrand.id);
        setBrandVideos(videosForBrand);
      }
    }
  }, [brands, videos, slug]);

  const jsonLd = brand ? {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": brand.name,
    "description": brand.description,
    "logo": brand.logo_url,
    "image": brand.cover_image_url,
  } : undefined;

  const canonicalUrl = brand ? `${window.location.origin}/brands/${brand.slug}` : undefined;

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title={brand.meta_title || `${brand.name} | FLESHLAB Asia`}
        description={brand.meta_description || brand.description}
        canonical={canonicalUrl}
        ogImage={brand.cover_image_url || brand.logo_url}
        ogType="organization"
        jsonLd={jsonLd}
      />
      
      <div className="min-h-screen bg-background">
        {/* Back Navigation */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/brands')}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Studios
            </Button>
          </div>
        </div>

        {/* Hero Banner with Cover Image */}
        {brand.cover_image_url && (
          <div className="relative h-72 md:h-96 bg-secondary overflow-hidden">
            <img
              src={brand.cover_image_url}
              alt={brand.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            
            {/* Brand logo overlay */}
            {brand.logo_url && (
              <div className="absolute bottom-8 left-8">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-card rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Brand Header */}
          <div className="space-y-4 pt-8">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-8 h-8 text-primary" />
              <h1 className="text-4xl sm:text-5xl font-black text-foreground">{brand.name}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={
                brand.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
              }>
                {brand.status === 'active' ? 'Active Studio' : brand.status}
              </Badge>
            </div>

            {/* Description */}
            {brand.description && (
              <div className="prose prose-invert max-w-none pt-4">
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-lg">
                  {brand.description}
                </p>
              </div>
            )}
          </div>

          {/* Videos Section */}
          {brandVideos.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Film className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Videos from {brand.name}</h2>
                </div>
                <Badge variant="outline" className="text-sm">
                  {brandVideos.length} {brandVideos.length === 1 ? 'video' : 'videos'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {brandVideos.map(video => (
                  <VideoCard key={video.id} video={video} brands={[brand]} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card/50 rounded-2xl p-12 border border-border text-center">
              <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-bold mb-2 text-foreground">Videos Coming Soon</h3>
              <p className="text-muted-foreground mb-6">
                {brand.name}'s library is being populated with exclusive content
              </p>
              <Button onClick={() => navigate('/videos')} variant="outline">
                Browse All Videos
              </Button>
            </div>
          )}

          {/* Premium Teaser */}
          <div className="pt-8">
            <PremiumTeaserBlock title={`Want More ${brand.name} Content?`} />
          </div>
        </div>
      </div>
    </>
  );
}