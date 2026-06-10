import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAccessControl } from "@/lib/useAccessControl";
import SEOMeta from "@/components/SEOMeta";
import { generatePerformerTitle, generatePerformerMetaDescription, generatePerformerSEOBio } from "@/lib/performerSeoUtils";
import { FANCLUB_PLANS } from "@/lib/pricingConfig";
import { Loader2, ArrowLeft, Heart, Users, Film, Play, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

// New decomposed components
import PerformerHero from "@/components/public/PerformerHero";
import PerformerFeaturedScene from "@/components/public/PerformerFeaturedScene";
import PerformerPromoSection from "@/components/public/PerformerPromoSection";
import PerformerVideoGrid from "@/components/public/PerformerVideoGrid";
import FanclubSupportBlock from "@/components/public/FanclubSupportBlock";

export default function PerformerDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { requireSignup } = useAccessControl();
  const [performer, setPerformer] = useState(null);
  const [performerVideos, setPerformerVideos] = useState([]);

  // Auth-gated handlers
  const handleWatchVideos = () => requireSignup('/videos');
  const handleJoinFanclub = () => navigate(`/fanclub?performer=${slug}`);

  // Fetch all data
  const { data: performers = [] } = useQuery({
    queryKey: ['public-performers'],
    queryFn: () => base44.entities.Performer.filter({ status: 'active' }),
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['public-videos-published'],
    queryFn: () => base44.entities.Video.filter({ status: 'published' }),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['public-brands'],
    queryFn: () => base44.entities.Brand.filter({ status: 'active' }),
  });

  const { data: videoPerformers = [] } = useQuery({
    queryKey: ['video-performers'],
    queryFn: () => base44.entities.VideoPerformer.list(),
  });

  useEffect(() => {
    if (performers.length > 0 && slug && videos.length > 0) {
      const found = performers.find(p => p.slug === slug);
      if (found) {
        setPerformer(found);
        const ids = videoPerformers.filter(vp => vp.performer_id === found.id).map(vp => vp.video_id);
        setPerformerVideos(videos.filter(v => ids.includes(v.id)));
      } else {
        setPerformer(null);
      }
    }
  }, [performers, slug, videos, videoPerformers]);

  // Derived state
  const hasExclusiveVideos = performerVideos.some(v => v.is_exclusive || v.access_tier === 'fanclub' || v.access_tier === 'ppv');
  const fanclubOrExclusive = performer?.fanclub_enabled || hasExclusiveVideos;

  // Featured: prefer exclusive/fanclub, otherwise newest
  const featuredVideo = useMemo(() => {
    const sorted = [...performerVideos].sort(
      (a, b) => new Date(b.release_date || b.created_date || 0) - new Date(a.release_date || a.created_date || 0)
    );
    return sorted.find(v => v.is_exclusive || v.access_tier === 'fanclub' || v.access_tier === 'ppv') || sorted[0] || null;
  }, [performerVideos]);

  // Primary brand
  const performerBrand = useMemo(() => {
    if (!performer || !brands.length) return null;
    const counts = {};
    performerVideos.forEach(v => { if (v.brand_id) counts[v.brand_id] = (counts[v.brand_id] || 0) + 1; });
    let max = 0, primaryId = null;
    Object.entries(counts).forEach(([id, c]) => { if (c > max) { max = c; primaryId = id; } });
    return primaryId ? brands.find(b => b.id === primaryId) : null;
  }, [performer, performerVideos, brands]);

  // SEO
  const nationalityShort = performer?.nationality ? performer.nationality.split(',')[0].trim() : '';
  const identityLine = `Verified 18+ ${nationalityShort ? nationalityShort + ' performer' : 'performer'} · FLESHLAB Studios`;
  const canonicalUrl = performer ? `https://fleshlab.online/performers/${performer.slug}` : undefined;
  const seoTitle = performer?.meta_title || generatePerformerTitle(performer || {});
  const seoDescription = performer?.meta_description || generatePerformerMetaDescription(performer || {});
  const seoIntro = performer ? generatePerformerSEOBio(performer) : '';

  const performerVideoUrls = performerVideos.filter(v => v.slug).slice(0, 10).map(v => ({
    "@type": "VideoObject",
    "name": v.title,
    "url": `https://fleshlab.online/videos/${v.slug}`,
  }));

  const jsonLd = performer ? [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": performer.display_name,
      "url": canonicalUrl,
      ...(performer.profile_image_url && { "image": performer.profile_image_url }),
      "description": (performer.meta_description || generatePerformerMetaDescription(performer) || '').substring(0, 300),
      ...(performer.nationality && { "nationality": performer.nationality }),
      "worksFor": { "@type": "Organization", "name": "FLESHLAB Studios", "url": "https://fleshlab.online" },
      ...((performer.twitter_url || performer.instagram_url || performer.onlyfans_url) && {
        "sameAs": [performer.twitter_url, performer.instagram_url, performer.onlyfans_url].filter(Boolean)
      }),
      ...(performerVideoUrls.length > 0 && { "subjectOf": performerVideoUrls }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fleshlab.online/" },
        { "@type": "ListItem", "position": 2, "name": "Performers", "item": "https://fleshlab.online/performers" },
        { "@type": "ListItem", "position": 3, "name": performer.display_name, "item": canonicalUrl },
      ],
    },
  ] : undefined;

  // Not found
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
            <h1 className="text-3xl font-bold mb-4 text-white">Performer Not Found</h1>
            <p className="text-white/50 mb-6">This performer profile doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/performers')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Performers
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Loading
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

        {/* A. HERO */}
        <PerformerHero
          performer={performer}
          performerVideos={performerVideos}
          performerBrand={performerBrand}
          isAuthenticated={isAuthenticated}
          hasExclusiveVideos={hasExclusiveVideos}
          fanclubOrExclusive={fanclubOrExclusive}
          identityLine={identityLine}
          seoIntro={seoIntro}
          onWatchVideos={handleWatchVideos}
          onJoinFanclub={handleJoinFanclub}
        />

        {/* B. FEATURED SCENE */}
        <PerformerFeaturedScene
          video={featuredVideo}
          performerName={performer.display_name}
          isAuthenticated={isAuthenticated}
          onWatch={handleWatchVideos}
        />

        {/* C. PERFORMER-SPECIFIC PROMO BANNER */}
        <PerformerPromoSection slug={performer.slug} />

        {/* D. BIOGRAPHY */}
        {performer.bio && (
          <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="relative rounded-[24px] border border-white/8 bg-gradient-to-br from-[#0e0e0e] to-[#0a0a0a] overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-rose-700/5 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative z-10 p-7 lg:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-rose-600/15 rounded-xl flex items-center justify-center border border-rose-600/20">
                    <Heart className="w-4 h-4 text-rose-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">About {performer.display_name}</h2>
                </div>
                <p className="text-white/65 whitespace-pre-wrap leading-relaxed text-base lg:text-lg max-w-4xl">
                  {performer.bio}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* E. CONTENT GRID */}
        <PerformerVideoGrid
          performer={performer}
          performerVideos={performerVideos}
          brands={brands}
        />

        {/* F. FANCLUB CTA */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
          <FanclubSupportBlock
            performerName={performer.display_name}
            isAuthenticated={isAuthenticated}
            onJoin={handleJoinFanclub}
            performers={performers.filter(p => p.profile_image_url && p.id !== performer.id)}
          />
        </section>

      </div>
    </>
  );
}