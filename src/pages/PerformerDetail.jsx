import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import { useAuth } from "@/lib/AuthContext";
import { useAccessControl } from "@/lib/useAccessControl";
import SEOMeta from "@/components/SEOMeta";
import { generatePerformerTitle, generatePerformerMetaDescription, generatePerformerSEOBio } from "@/lib/performerSeoUtils";
import { schemaBuilders } from "@/lib/schemaBuilders";
import { FANCLUB_PLANS } from "@/lib/pricingConfig";
import { Loader2, ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

// New decomposed components
import PerformerHero from "@/components/public/PerformerHero";
import PerformerFeaturedScene from "@/components/public/PerformerFeaturedScene";
import PerformerVIPOffer from "@/components/public/PerformerVIPOffer";
import PerformerPromoSection from "@/components/public/PerformerPromoSection";
import PerformerVideoGrid from "@/components/public/PerformerVideoGrid";
import FanclubSupportBlock from "@/components/public/FanclubSupportBlock";
import SmartContentCta from "@/components/cta/SmartContentCta";
import { trackFanclubCtaClick } from "@/lib/analytics";

export default function PerformerDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { requireSignup } = useAccessControl();
  const [performer, setPerformer] = useState(null);
  const [performerVideos, setPerformerVideos] = useState([]);

  // Auth-gated handlers
  const handleWatchVideos = () => requireSignup('/videos');
  const handleJoinFanclub = () => {
    trackFanclubCtaClick('fanclub_monthly', slug, 'performer_detail');
    navigate(`/fanclub?performer=${slug}`);
  };

  // One public, self-hosted projection supplies only catalogue-safe fields.
  // Do not use the legacy Base44 entity client for public profile pages.
  const { data: catalogue = {} } = useQuery({
    queryKey: ['public-performer-catalogue'],
    queryFn: () => callPublicFunction('getPublicPerformers'),
    retry: 1,
  });
  const performers = catalogue.performers || [];
  const videos = catalogue.videos || [];
  const brands = catalogue.brands || [];

  useEffect(() => {
    if (performers.length > 0 && slug) {
      const found = performers.find(p => p.slug === slug);
      if (found) {
        setPerformer(found);
        setPerformerVideos(videos.filter(v => Array.isArray(v.performer_ids) && v.performer_ids.includes(found.id)));
      } else {
        setPerformer(null);
      }
    }
  }, [performers, slug, videos]);

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

  // Build complete, valid VideoObject schemas — skip any video missing thumbnailUrl or uploadDate
  const performerVideoSchemas = performerVideos
    .filter(v => v.slug && v.title)
    .slice(0, 10)
    .map(v => schemaBuilders.videoObject(v, performer?.display_name))
    .filter(Boolean); // removes null entries (missing thumbnail or uploadDate)

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
      ...(performerVideoSchemas.length > 0 && { "subjectOf": performerVideoSchemas }),
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
    // Emit top-level VideoObject items so Google's Video Enhancement parser sees them directly
    ...performerVideoSchemas,
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

  // Loading — include slug-derived SEOMeta so Googlebot sees a title before data resolves
  if (!performer) {
    const loadingTitle = slug
      ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' | FLESHLAB Studios Performer'
      : 'Performer | FLESHLAB Studios';
    const loadingDesc = slug
      ? `Watch ${slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} on FLESHLAB Studios. Verified performer profile with exclusive scenes, fanclub access, and premium video updates.`
      : 'Verified performer profile on FLESHLAB Studios with exclusive scenes and fanclub access.';
    return (
      <>
        <SEOMeta
          title={loadingTitle}
          description={loadingDesc}
          canonical={`https://fleshlab.online/performers/${slug}`}
        />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
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

        {/* B. VIP OFFER — core sales block */}
        <PerformerVIPOffer
          performerName={performer.display_name}
          isAuthenticated={isAuthenticated}
          onJoinFanclub={handleJoinFanclub}
          fanclubOrExclusive={fanclubOrExclusive}
        />

        {/* C. FEATURED SCENE */}
        <PerformerFeaturedScene
          video={featuredVideo}
          performerName={performer.display_name}
          isAuthenticated={isAuthenticated}
          onWatch={handleWatchVideos}
        />

        {/* D. PERFORMER-SPECIFIC PROMO BANNER (campaign tie-in) */}
        <PerformerPromoSection slug={performer.slug} />

        {/* E. BIOGRAPHY */}
        {performer.bio && (
          <section className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 py-4">
            <div className="relative rounded-[20px] border border-white/[0.06] bg-[#080505] overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              <div className="relative z-10 px-7 py-6 lg:px-10 lg:py-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-rose-900/40 rounded-lg flex items-center justify-center border border-rose-700/25">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">About {performer.display_name}</h2>
                </div>
                <p className="text-white/45 leading-relaxed text-sm max-w-4xl">
                  {performer.bio}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Smart CTA for non-subscribers */}
        <section className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 py-4">
          <SmartContentCta contentType="performers" user={user} hasActiveSub={false} />
        </section>

        {/* F. CONTENT GRID */}
        <PerformerVideoGrid
          performer={performer}
          performerVideos={performerVideos}
          brands={brands}
        />

        {/* G. PREMIUM MEMBERSHIP BENEFITS */}
        <section className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 py-5 pb-14">
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
