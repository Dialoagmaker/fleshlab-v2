import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VideoCard from "@/components/public/VideoCard";
import PerformerCard from "@/components/public/PerformerCard";
import SEOMeta from "@/components/SEOMeta";
import { 
  ArrowLeft, 
  Loader2, 
  Building2, 
  Film, 
  Users,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BrandDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const [brandVideos, setBrandVideos] = useState([]);
  const [brandPerformers, setBrandPerformers] = useState([]);

  // Fetch all data
  const { data: brands = [] } = useQuery({
    queryKey: ['public-brands'],
    queryFn: () => base44.entities.Brand.list(),
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['public-videos'],
    queryFn: () => base44.entities.Video.list(),
  });

  const { data: performers = [] } = useQuery({
    queryKey: ['public-performers'],
    queryFn: () => base44.entities.Performer.list(),
  });

  useEffect(() => {
    if (brands.length > 0 && slug) {
      const foundBrand = brands.find(b => b.slug === slug);
      if (foundBrand) {
        setBrand(foundBrand);
        
        // Filter videos by brand_id
        const videosForBrand = videos.filter(v => v.brand_id === foundBrand.id);
        setBrandVideos(videosForBrand);
        
        // Note: Performers don't have brand_id in current schema
        setBrandPerformers([]);
      }
    }
  }, [brands, videos, performers, slug]);

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
        title={brand.meta_title || `${brand.name} | FLESHLAB`}
        description={brand.meta_description || brand.description}
        canonical={canonicalUrl}
        ogImage={brand.cover_image_url || brand.logo_url}
        ogType="organization"
        jsonLd={jsonLd}
      />
      <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/brands')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Brands
          </Button>
        </div>
      </div>

      {/* Hero Banner */}
      {brand.cover_image_url && (
        <div className="relative h-64 md:h-80 bg-secondary overflow-hidden">
          <img
            src={brand.cover_image_url}
            alt={brand.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Logo */}
          {brand.logo_url && (
            <div className="w-24 h-24 bg-card rounded-xl overflow-hidden border border-border shrink-0">
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{brand.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span className="capitalize">{brand.status}</span>
              </div>
            </div>

            {/* Description */}
            {brand.description && (
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {brand.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Videos */}
        {brandVideos.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Film className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Videos ({brandVideos.length})</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {brandVideos.map(video => (
                <VideoCard key={video.id} video={video} brands={[brand]} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl p-8 border border-border text-center">
            <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No videos available</h3>
            <p className="text-muted-foreground">
              Videos for this brand will be added soon.
            </p>
          </div>
        )}

        {/* Performers (placeholder) */}
        {brandPerformers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Performers ({brandPerformers.length})</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {brandPerformers.map(performer => (
                <PerformerCard key={performer.id} performer={performer} brands={[brand]} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}