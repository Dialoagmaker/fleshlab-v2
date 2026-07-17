import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import SEOMeta from "@/components/SEOMeta";
import CollectionHero from "@/components/collection/CollectionHero";
import CollectionVideoRail from "@/components/collection/CollectionVideoRail";
import CollectionVideoCard from "@/components/collection/CollectionVideoCard";
import CollectionCreatorSpotlight from "@/components/collection/CollectionCreatorSpotlight";
import { ArrowLeft, Film, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BrandDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const [brandVideos, setBrandVideos] = useState([]);

  const { data: publicData } = useQuery({
    queryKey: ['public-brands-fn'],
    queryFn: () => callPublicFunction('getPublicBrands'),
    retry: 0,
  });
  const brands = publicData?.brands || [];
  const videos = publicData?.videos || [];

  const { data: performerData } = useQuery({
    queryKey: ['public-performers-for-collection'],
    queryFn: () => callPublicFunction('getPublicPerformers'),
    retry: 0,
  });
  const performers = performerData?.performers || [];

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

  const canonicalUrl = brand ? `https://fleshlab.online/brands/${brand.slug}` : undefined;

  const jsonLd = brand ? [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": brand.name,
      "url": canonicalUrl,
      ...(brand.description && { "description": brand.description }),
      ...(brand.logo_url && { "logo": brand.logo_url }),
      ...(brand.cover_image_url && { "image": brand.cover_image_url }),
      "parentOrganization": {
        "@type": "Organization",
        "name": "FLESHLAB Studios",
        "url": "https://fleshlab.online"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fleshlab.online/" },
        { "@type": "ListItem", "position": 2, "name": "Studios", "item": "https://fleshlab.online/brands" },
        { "@type": "ListItem", "position": 3, "name": brand.name, "item": canonicalUrl }
      ]
    }
  ] : undefined;

  const latestReleases = useMemo(() => [...brandVideos].sort((a, b) => new Date(b.release_date || b.published_at || b.created_date || 0) - new Date(a.release_date || a.published_at || a.created_date || 0)).slice(0, 10), [brandVideos]);
  const mostPopular = useMemo(() => [...brandVideos].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 10), [brandVideos]);
  const recentlyAdded = useMemo(() => [...brandVideos].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)).slice(0, 10), [brandVideos]);
  const brandPerformers = useMemo(() => brand ? performers.filter((performer) => performer.brand_id === brand.id) : [], [performers, brand]);
  const featuredCreator = useMemo(() => {
    const pool = brandPerformers.length ? brandPerformers : performers;
    return pool.find((performer) => performer.featured) || [...pool].sort((a, b) => (b.video_count || 0) - (a.video_count || 0))[0];
  }, [brandPerformers, performers]);

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
        title={brand.meta_title || `${brand.name} | FLESHLAB Studios`}
        description={brand.meta_description || brand.description}
        canonical={canonicalUrl}
        ogImage={brand.cover_image_url || brand.logo_url}
        ogType="organization"
        jsonLd={jsonLd}
      />
      
      <div className="min-h-screen bg-[#040608] px-4 py-6 text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(240,24,61,0.12),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.06),transparent_24%)]" />
        <div className="relative mx-auto max-w-[1440px] space-y-12">
          <Button variant="ghost" onClick={() => navigate('/brands')} className="gap-2 text-white/54 hover:bg-white/10 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Back to Collections
          </Button>

          <CollectionHero brand={brand} heroVideo={latestReleases[0]} count={brandVideos.length} />

          {brandVideos.length > 0 ? (
            <>
              <div id="latest-releases">
                <CollectionVideoRail eyebrow="Latest Releases" title="Start with what just dropped." subtitle="Fresh productions from this collection, presented as a focused rail instead of a wall of options." videos={latestReleases} large />
              </div>
              <CollectionVideoRail eyebrow="Most Popular" title="Audience favourites." subtitle="The releases getting the strongest attention inside this collection." videos={mostPopular} />
              <CollectionCreatorSpotlight creator={featuredCreator} />
              <CollectionVideoRail eyebrow="Recently Added" title="New to the collection." subtitle="A calmer way to keep exploring without falling into an endless grid." videos={recentlyAdded} />

              <section className="space-y-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f0183d]">Browse All</p>
                  <h2 className="fl-condensed mt-2 text-[52px] uppercase leading-none tracking-[-0.02em] text-white">Complete collection.</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">The full library remains available, but with more breathing room, clearer badges and shorter titles.</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {brandVideos.map((video) => <CollectionVideoCard key={video.id} video={video} />)}
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-12 text-center">
              <Film className="w-16 h-16 mx-auto mb-4 text-white/28" />
              <h3 className="text-xl font-bold text-white">Productions Coming Soon</h3>
              <p className="mt-2 mb-6 text-white/58">{brand.name}'s curated collection is being prepared.</p>
              <Button onClick={() => navigate('/videos')} variant="outline" className="border-white/20 text-white hover:bg-white/10">Browse All Videos</Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}