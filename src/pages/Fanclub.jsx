import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, Check, Crown, Shield, Play, Zap, Eye, Film, Users, Tag } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useAccessControl } from "@/lib/useAccessControl";
import { PRICING } from "@/lib/pricingConfig";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePaymentProvider } from "@/hooks/usePaymentProvider";
import CheckoutButton from "@/components/payment/CheckoutButton";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { trackFanclubCtaClick } from "@/lib/analytics";
import PerformerFanclubHero from "@/components/fanclub/PerformerFanclubHero";
import FleshlabMembershipUpsell from "@/components/fanclub/FleshlabMembershipUpsell";
import PerformerFanclubComingSoon from "@/components/fanclub/PerformerFanclubComingSoon";
import PerformerFanclubBenefits from "@/components/fanclub/PerformerFanclubBenefits";

// Read performer slug from ?performer= query param — reactive to React Router location
function usePerformerParam() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  return params.get('performer') || null;
}

// ── Checkout helpers with auth guard + intent preservation ────────────────────
function FanclubCTA({ planId, className, label, isAuthenticated, paymentProvider, returnUrl, ctaLocation = 'default' }) {
  const navigate = useNavigate();
  const fanclubReturn = returnUrl || '/fanclub';
  // Preserve checkout intent: planId + return URL
  const registerUrl = `/register?from_url=${encodeURIComponent(fanclubReturn)}&checkout=${planId}`;

  const handleClick = () => {
    trackFanclubCtaClick(planId, null, ctaLocation);
  };

  return (
    <CheckoutButton
      paymentType="fanclub" planId={planId}
      label={label || 'Enter Fanclub'}
      returnUrl={fanclubReturn} cancelUrl="/fanclub"
      isAuthenticated={isAuthenticated}
      onRequireAuth={() => { handleClick(); navigate(registerUrl); }}
      paymentProvider={paymentProvider}
      className={className}
      unavailableLabel="Secure crypto checkout coming soon"
    />
  );
}
function PPVUnlockCTA({ priceTier, className, label, isAuthenticated, requireSignup, paymentProvider }) {
  return (
    <CheckoutButton
      paymentType="ppv" priceTier={priceTier}
      label={label || (isAuthenticated ? 'Unlock Scene' : 'Create Account to Unlock')}
      returnUrl="/videos" cancelUrl="/fanclub"
      isAuthenticated={isAuthenticated}
      onRequireAuth={() => requireSignup('/videos', 'ppv', { priceTier })}
      paymentProvider={paymentProvider}
      className={className || "w-full"}
      unavailableLabel="PPV unlock coming soon"
    />
  );
}

// ── Fallback assets (used only when DB has no images) ─────────────────────────
const FALLBACK_THUMBS = [
  { src: "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg",         label: "Fanclub Scene" },
  { src: "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/mj1.jpg",      label: "Early Release" },
  { src: "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/DialogMaxX_BI-Alex---Wanking-in-the-School-Locker-Room.jpg", label: "Bonus Clip" },
  { src: "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/DialogMaxX_Cute-Raven---hunky-Asian-twink-lying-touching-and-cumming.jpg", label: "Behind the Scenes" },
  { src: "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/DialogMaxX_Cute-Raven---hunky-asian-touches-and-shoots-in-shower.jpg", label: "Member Update" },
];

const CONTENT_LABELS = ["Fanclub Scene", "Early Release", "Bonus Clip", "Behind the Scenes", "Member Update", "Exclusive Drop"];
const PPV_LABELS = {
  standard:  { label: "Standard Scene",        badge: "PPV" },
  premium:   { label: "Premium Scene",          badge: "PREMIUM" },
  exclusive: { label: "Exclusive / Long Scene", badge: "EXCLUSIVE" },
};

// ── Image card with lock overlay ──────────────────────────────────────────────
function LockedImageCard({ src, label, className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-rose-900/30 ${className}`}>
      <img src={src} alt={label} className="w-full h-full object-cover object-center" style={{ objectPosition: 'center 20%' }} />
      {/* stronger gradient so label is always readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      {/* lock badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm border border-rose-600/40 rounded-full px-2 py-1">
        <Lock className="w-2.5 h-2.5 text-rose-400" />
        <span className="text-rose-300 text-[10px] font-bold uppercase tracking-wide">Members</span>
      </div>
      {/* bottom label — stronger background strip */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
        <span className="text-white text-xs font-bold tracking-wide drop-shadow-sm">{label}</span>
      </div>
    </div>
  );
}

// ── PPV card with image background ───────────────────────────────────────────
const PPV_TIER_LABELS = {
  standard:  { name: "Starter Scene",   badge: "PPV",       color: "bg-rose-600" },
  premium:   { name: "Premium Scene",   badge: "PREMIUM",   color: "bg-amber-500" },
  exclusive: { name: "Exclusive Scene", badge: "EXCLUSIVE", color: "bg-purple-600" },
};

function PPVCard({ thumb, tier, priceTierKey, isAuthenticated, requireSignup, paymentProvider }) {
  const meta = PPV_TIER_LABELS[priceTierKey] || { name: tier.label, badge: "PPV", color: "bg-rose-600" };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 flex flex-col bg-[#0e0e0e] group">
      {/* Thumbnail — fixed 16:10 aspect for all cards */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
        <img
          src={thumb}
          alt={meta.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        {/* Badge top-left */}
        <div className={`absolute top-3 left-3 ${meta.color} text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-lg`}>
          {meta.badge}
        </div>
        {/* Price overlay bottom-right of image */}
        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-1.5 text-right">
          <div className="text-rose-400 font-black text-xl leading-none">${tier.price}</div>
          <div className="text-white/35 text-[9px] font-medium mt-0.5">one-time</div>
        </div>
      </div>

      {/* Info block — fixed structure, no flex-1 growth */}
      <div className="p-5 flex flex-col gap-4">
        {/* Tier name */}
        <div>
          <h3 className="font-black text-white text-base leading-tight">{meta.name}</h3>
          <p className="text-white/40 text-xs mt-1 leading-relaxed">Pay once. Unlock this scene permanently.</p>
        </div>

        {/* Benefit pills */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-white/35 bg-white/5 border border-white/8 rounded-full px-2.5 py-1 font-medium">No subscription</span>
          <span className="text-[10px] text-white/35 bg-white/5 border border-white/8 rounded-full px-2.5 py-1 font-medium">Permanent access</span>
        </div>

        {/* CTA */}
        <PPVUnlockCTA
          priceTier={priceTierKey}
          label="Unlock This Scene"
          isAuthenticated={isAuthenticated}
          requireSignup={requireSignup}
          paymentProvider={paymentProvider}
          className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black py-3 rounded-xl text-sm shadow-lg shadow-rose-700/30 border-0 transition-all duration-200"
        />
        <p className="text-white/20 text-[10px] text-center -mt-1">Access confirmed after payment</p>
      </div>
    </div>
  );
}

// ── Performer support card ────────────────────────────────────────────────────
function PerformerSupportCard({ performer, onJoin }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl aspect-[3/4] border border-white/8 cursor-pointer" onClick={onJoin}>
      <img
        src={performer.profile_image_url}
        alt={performer.display_name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      {/* hover overlay */}
      <div className="absolute inset-0 bg-rose-600/0 group-hover:bg-rose-600/15 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          See more in Fanclub
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="text-white font-bold text-sm truncate">{performer.display_name}</div>
        <div className="inline-flex items-center gap-1 bg-rose-600/30 border border-rose-600/50 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
          <Crown className="w-2.5 h-2.5" />
          More in Fanclub
        </div>
      </div>
    </div>
  );
}

// ── Content value card (image-based) ─────────────────────────────────────────
function ContentValueCard({ src, title, desc, badge }) {
  return (
    <div className="relative overflow-hidden rounded-2xl aspect-video group">
      <img src={src} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
      <div className="absolute top-3 left-3">
        <div className="bg-rose-600/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide">
          {badge}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="font-black text-white text-sm mb-1">{title}</div>
        <div className="text-white/60 text-xs leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function Fanclub() {
  const { isAuthenticated } = useAuth();
  const { requireSignup } = useAccessControl();
  const navigate = useNavigate();
  const paymentProvider = usePaymentProvider();
  const performerSlug = usePerformerParam();
  
  // Read ?checkout= param to resume checkout after auth
  const location = useLocation();
  const checkoutParam = new URLSearchParams(location.search).get('checkout');

  const scrollToPPV = () => document.getElementById('ppv-section')?.scrollIntoView({ behavior: 'smooth' });

  // ── Auto-resume checkout after auth (if ?checkout= param present) ───────────
  useEffect(() => {
    if (checkoutParam && isAuthenticated && paymentProvider.configured) {
      // User returned after auth with checkout intent — auto-resume after short delay
      const timer = setTimeout(() => {
        console.log('[Fanclub] Auto-resuming checkout after auth:', checkoutParam);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [checkoutParam, isAuthenticated, paymentProvider.configured]);

  // ── Fetch real data ────────────────────────────────────────────────────────
  const { data: videos = [] } = useQuery({
    queryKey: ['fanclub-videos'],
    queryFn: () => base44.entities.Video.list('-published_at', 30),
  });
  const { data: performers = [] } = useQuery({
    queryKey: ['fanclub-performers'],
    queryFn: () => base44.entities.Performer.list('-created_date', 20),
  });

  // Published videos with a thumbnail
  const publishedVideos = useMemo(
    () => videos.filter(v => (v.status === 'published' || v.primary_thumbnail_url) && (v.primary_thumbnail_url || v.cover_image_url)),
    [videos]
  );

  // Performers with a profile image — pin Fitmaster + Jameson first
  const PINNED_SLUGS = ['the-fitmaster', 'jameson'];
  const performersWithImage = useMemo(() => {
    const withImg = performers.filter(p => p.profile_image_url && p.status !== 'inactive');
    const pinned = PINNED_SLUGS.map(slug => withImg.find(p => p.slug === slug)).filter(Boolean);
    const rest = withImg.filter(p => !PINNED_SLUGS.includes(p.slug));
    return [...pinned, ...rest].slice(0, 6);
  }, [performers]);

  // Hero collage: 1 large + 2 small video thumbs + 2 performer images
  const heroImages = useMemo(() => {
    const result = [];
    const vids = publishedVideos.slice(0, 3);
    const perfs = performersWithImage.slice(0, 2);

    vids.forEach((v, i) => result.push({
      src: v.primary_thumbnail_url || v.cover_image_url,
      label: CONTENT_LABELS[i] || "Fanclub Scene",
      type: 'video',
    }));
    perfs.forEach((p, i) => result.push({
      src: p.profile_image_url,
      label: i === 0 ? "Performer Update" : "Member Content",
      type: 'performer',
    }));

    // Fill with fallbacks if needed
    while (result.length < 5) {
      const fb = FALLBACK_THUMBS[result.length];
      if (fb) result.push({ src: fb.src, label: fb.label, type: 'fallback' });
      else break;
    }
    return result.slice(0, 5);
  }, [publishedVideos, performersWithImage]);

  // Value section: 6 image cards — use videos 6–11 so they differ from hero + why-join
  const valueCards = useMemo(() => {
    const defs = [
      { title: 'Exclusive fanclub videos', desc: 'Full scenes not shown on the public side.', badge: 'Members Only' },
      { title: 'Early releases',           desc: 'New content before public visitors see it.', badge: 'Early Access' },
      { title: 'Bonus clips',              desc: 'Short edits and extras made for members.', badge: 'Bonus' },
      { title: 'Behind the scenes',        desc: 'Shoots, performers and the studio world.', badge: 'BTS' },
      { title: 'Performer updates',        desc: 'Updates from verified FLESHLAB performers.', badge: 'Updates' },
      { title: 'Better value',             desc: 'Fanclub = ongoing access from $20.99/month. 3-month bundle $49.99.', badge: 'Best Value' },
    ];
    // Offset by 6 so these images are distinct from hero (0-4) and why-join (0-2 + performer 0)
    return defs.map((d, i) => {
      const vid = publishedVideos[6 + i];
      const src = vid?.primary_thumbnail_url || vid?.cover_image_url
        || publishedVideos[i]?.primary_thumbnail_url
        || FALLBACK_THUMBS[i % FALLBACK_THUMBS.length].src;
      return { ...d, src };
    });
  }, [publishedVideos]);

  // PPV cards: use videos 12–14 so they differ from all previous sections
  const ppvTierThumb = useMemo(() => {
    const keys = ['standard', 'premium', 'exclusive'];
    const result = {};
    keys.forEach((k, i) => {
      const vid = publishedVideos[12 + i] || publishedVideos[i + 3];
      result[k] = vid?.primary_thumbnail_url || vid?.cover_image_url || FALLBACK_THUMBS[i % FALLBACK_THUMBS.length].src;
    });
    return result;
  }, [publishedVideos]);

  // Resolve featured performer from query param
  const featuredPerformer = useMemo(
    () => performerSlug ? performers.find(p => p.slug === performerSlug) : null,
    [performers, performerSlug]
  );

  // Return URL preserves performer context for post-register redirect
  const fanclubReturnUrl = performerSlug ? `/fanclub?performer=${performerSlug}` : '/fanclub';

  // Props bundle (avoids repetition)
  const ctaProps = { isAuthenticated, paymentProvider, returnUrl: fanclubReturnUrl };

  // ── Performer-specific layout ──────────────────────────────────────────────
  if (performerSlug) {
    // Still loading performers
    if (performers.length === 0) {
      return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
          <div className="text-white/30 text-sm">Loading...</div>
        </div>
      );
    }

    // Performer not found
    if (!featuredPerformer) {
      return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-white/30 text-sm mb-4">Performer not found</div>
            <Button onClick={() => navigate('/fanclub')} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-6 py-3 h-auto font-bold">
              Browse FLESHLAB Membership
            </Button>
          </div>
        </div>
      );
    }

    const performerCTA = (
      <FanclubCTA
        planId="fanclub_monthly"
        label={`Join ${featuredPerformer.display_name} Fanclub`}
        {...ctaProps}
        className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-4 rounded-xl text-base h-auto shadow-xl shadow-rose-600/35 w-full"
      />
    );

    return (
      <>
        <SEOMeta
          title={`${featuredPerformer.display_name} Fanclub | FLESHLAB`}
          description={`Join ${featuredPerformer.display_name}'s Fanclub on FLESHLAB. Exclusive performer content, updates, selected scenes and member-only drops.`}
          canonical={`/fanclub`}
          ogImage={featuredPerformer.profile_image_url || featuredPerformer.cover_image_url}
        />
        <div className="min-h-screen bg-[#080808] text-white">

          {/* fanclub_enabled must be explicitly false to show coming soon; undefined/null = active */}
          {featuredPerformer.fanclub_enabled === false ? (
            <>
              <PerformerFanclubComingSoon performer={featuredPerformer} relatedVideos={publishedVideos.slice(0, 3)} />
              <FleshlabMembershipUpsell performerName={featuredPerformer.display_name} isFanclubComingSoon={true} />
            </>
          ) : (
            <>
              {/* Personalized performer fanclub hero */}
              <PerformerFanclubHero performer={featuredPerformer} ctaSlot={performerCTA} />

              {/* What you unlock — benefits section */}
              <PerformerFanclubBenefits performer={featuredPerformer} ctaSlot={performerCTA} />

              {/* Pricing decision box */}
              <section className="py-16 px-6 bg-[#060404] border-t border-white/5">
                <div className="max-w-[600px] mx-auto">
                  <div className="relative bg-gradient-to-br from-[#1c0808] to-[#0d0505] border-2 border-rose-600/50 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(220,38,38,0.18)]">
                    {/* Top bar */}
                    <div className="bg-rose-600/15 border-b border-rose-600/20 px-8 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-rose-400/60 text-[10px] font-black uppercase tracking-widest">Performer Fanclub</p>
                        <p className="text-white font-black text-base">{featuredPerformer.display_name} Fanclub</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-white">$20.99</span>
                          <span className="text-white/35 text-base">/mo</span>
                        </div>
                        <p className="text-white/35 text-xs font-bold">Crypto-safe pricing</p>
                      </div>
                    </div>
                    {/* Includes */}
                    <div className="px-8 py-6">
                      <p className="text-white/30 text-xs font-black uppercase tracking-widest mb-4">Includes</p>
                      <div className="space-y-2.5 mb-7">
                        {[
                          "Member-only scenes",
                          "Performer updates and private drops",
                          "Selected early releases",
                          `Supports ${featuredPerformer.display_name} directly`,
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span className="text-white/60 text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                      {performerCTA}
                      <p className="text-white/15 text-xs text-center mt-4">
                        $20.99/month unless cancelled. Cancel anytime. Crypto-safe pricing.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* FLESHLAB Membership — secondary upsell */}
              <FleshlabMembershipUpsell
                performerName={featuredPerformer.display_name}
                isFanclubComingSoon={false}
                ctaSlot={performerCTA}
              />

              {/* Footer CTA */}
              <section className="py-16 px-6 border-t border-white/6">
                <div className="max-w-[700px] mx-auto">
                  <div className="relative bg-gradient-to-br from-[#1a0808] to-[#0d0808] border border-rose-600/25 rounded-3xl px-8 py-14 text-center overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-rose-700/12 rounded-full blur-[80px] pointer-events-none" />
                    <div className="relative z-10">
                      <h2 className="text-3xl md:text-4xl font-black mb-3">
                        JOIN <span className="text-rose-500">{featuredPerformer.display_name.toUpperCase()} FANCLUB</span>
                      </h2>
                      <p className="text-white/50 text-base mb-8 max-w-md mx-auto">
                        Unlock selected member-only scenes, raw extras and updates. Support {featuredPerformer.display_name} directly.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                        <div className="w-full sm:w-auto sm:min-w-[260px]">
                          {performerCTA}
                        </div>
                      </div>
                      <p className="text-white/20 text-xs mt-4">
                        $20.99/month unless cancelled. Cancel anytime.
                      </p>
                      <p className="text-white/15 text-xs mt-2">
                        Want more than one performer?{" "}
                        <button
                          onClick={() => navigate('/fanclub')}
                          className="underline hover:text-white/30 transition-colors"
                        >
                          Explore FLESHLAB Membership
                        </button>
                        .
                      </p>
                    </div>
                  </div>
                  <p className="text-white/12 text-xs text-center mt-5 leading-relaxed max-w-lg mx-auto">
                    FLESHLAB memberships provide access to digital adult content and fanclub features only. Memberships do not include dating, escorting, private meetings or offline services.
                  </p>
                </div>
              </section>

            </>
          )}
        </div>
      </>
    );
  }

  // ── Generic platform fanclub layout (no performer param) ──────────────────
  return (
    <>
      <SEOMeta
        title="FLESHLAB Fanclub | Exclusive Gay Videos & Member Access"
        description="Join FLESHLAB Fanclub for exclusive gay videos, early releases, behind-the-scenes content, performer updates and member-only access from verified FLESHLAB performers."
        canonical="/fanclub"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "FLESHLAB Fanclub",
          "hasPart": {
            "@type": "Offer",
            "name": "FLESHLAB Fanclub Membership",
            "category": "Adult Entertainment",
            "availability": "https://schema.org/InStock",
            "price": "12.99",
            "priceCurrency": "USD",
            "ageRestriction": "18+"
          }
        }}
      />

      <div className="min-h-screen bg-[#080808] text-white">

        {/* ══════════════════════════════════════════════════════════════════
            1. HERO — real content collage
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-rose-700/10 rounded-full blur-[140px]" />
          </div>

          <div className="relative max-w-[1400px] mx-auto px-6 py-14 lg:py-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-600/30 rounded-full px-4 py-1.5 mb-7">
                <Crown className="w-4 h-4 text-rose-400" />
                <span className="text-rose-300 text-sm font-bold tracking-widest uppercase">Fanclub Membership</span>
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-[1.0] tracking-tight mb-3">
                THE PUBLIC PREVIEW<br />
                <span className="text-white/25">IS ONLY THE</span><br />
                <span className="text-rose-500">BEGINNING</span>
              </h1>
              <p className="text-xl md:text-2xl font-black text-white/80 mt-4 mb-6 max-w-2xl">
                Unlock the Full FLESHLAB Fanclub
              </p>

              <p className="text-lg text-white/55 leading-relaxed mb-10 max-w-xl">
                Get closer to FLESHLAB Studios with exclusive videos, performer updates, behind-the-scenes content and early access to selected releases. Support independent adult creators while unlocking member-only access.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <FanclubCTA
                  planId="fanclub_monthly"
                  label="Join the Fanclub"
                  {...ctaProps}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-4 rounded-xl text-base h-auto shadow-xl shadow-rose-600/35 min-w-[200px]"
                />
                <Link to="/videos">
                  <Button size="lg" variant="outline"
                    className="border-white/20 text-white hover:bg-white/8 font-semibold px-8 py-4 rounded-xl h-auto text-base">
                    <Film className="w-4 h-4 mr-2 shrink-0" />Browse Latest Videos
                  </Button>
                </Link>
              </div>
              <p className="text-white/40 text-xs mb-6">$20.99/month · $49.99 for 3 months · Cancel anytime.</p>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-white/35 text-sm">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Verified 18+ performers</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Secure crypto checkout</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Access after payment confirmation</span>
              </div>
            </div>

            {/* Right — real image collage */}
            <div className="hidden lg:block">
              {heroImages.length > 0 ? (
                <div className="grid grid-cols-3 grid-rows-3 gap-2 h-[520px]">
                  {/* Large featured card — 2 cols, 2 rows */}
                  <div className="col-span-2 row-span-2">
                    <LockedImageCard
                      src={heroImages[0]?.src || FALLBACK_THUMBS[0].src}
                      label={heroImages[0]?.label || "Fanclub Scene"}
                      className="h-full"
                    />
                  </div>
                  {/* Small top right */}
                  <LockedImageCard
                    src={heroImages[1]?.src || FALLBACK_THUMBS[1].src}
                    label={heroImages[1]?.label || "Early Release"}
                    className="h-full"
                  />
                  {/* Small mid right */}
                  <LockedImageCard
                    src={heroImages[2]?.src || FALLBACK_THUMBS[2].src}
                    label={heroImages[2]?.label || "Bonus Clip"}
                    className="h-full"
                  />
                  {/* Bottom left performer */}
                  <LockedImageCard
                    src={heroImages[3]?.src || FALLBACK_THUMBS[3].src}
                    label={heroImages[3]?.label || "Behind the Scenes"}
                    className="h-full"
                  />
                  {/* Bottom mid performer */}
                  <LockedImageCard
                    src={heroImages[4]?.src || FALLBACK_THUMBS[4].src}
                    label={heroImages[4]?.label || "Member Update"}
                    className="h-full"
                  />
                  {/* Bottom right — member banner */}
                  <div className="col-span-1 h-full bg-gradient-to-br from-rose-900/40 to-[#0f0505] border border-rose-600/25 rounded-xl flex flex-col items-center justify-center gap-2 p-3">
                    <Crown className="w-6 h-6 text-rose-400" />
                    <span className="text-white/60 text-[11px] text-center font-medium leading-snug">Members unlock all of this</span>
                  </div>
                </div>
              ) : (
                /* Fallback grid while loading */
                <div className="grid grid-cols-3 grid-rows-3 gap-2 h-[520px]">
                  {FALLBACK_THUMBS.map((fb, i) => (
                    <LockedImageCard key={i} src={fb.src} label={fb.label}
                      className={`h-full ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            2. PUBLIC PREVIEW — EXPLANATION
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-10 px-6 border-t border-white/6">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-3">
              THE <span className="text-rose-500">PUBLIC PREVIEW</span>
            </h2>
            <p className="text-white/45 text-center mb-10 text-base max-w-3xl mx-auto">
              Public pages show only a preview of FLESHLAB. The Fanclub unlocks deeper access, exclusive updates and selected member content.
            </p>

            <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {/* Free */}
              <div className="bg-[#111] border border-white/8 rounded-2xl p-7 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white/45" />
                </div>
                <div className="text-xs font-bold tracking-widest text-white/40 uppercase">Free Account</div>
                <h3 className="text-xl font-black text-white">Browse the public side</h3>
                <p className="text-white/65 text-base leading-relaxed">
                  Browse performers, watch previews and selected free clips. Perfect if you want to explore FLESHLAB before unlocking more.
                </p>
              </div>

              {/* PPV */}
              <div className="bg-[#111] border border-amber-700/20 rounded-2xl p-7 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-600/15 flex items-center justify-center">
                  <Film className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-xs font-bold tracking-widest text-amber-500/80 uppercase">Single Scene · One-Time</div>
                <h3 className="text-xl font-black text-white">Only want one scene?</h3>
                <p className="text-white/65 text-base leading-relaxed">
                  Unlock a single full scene and keep permanent access. No subscription. Pay once, own it forever.
                </p>
                <p className="text-amber-400 font-bold text-sm">from $20.99 one-time</p>
              </div>

              {/* Fanclub */}
              <div className="bg-gradient-to-br from-[#1a0808] to-[#0f0606] border border-rose-600/40 rounded-2xl p-7 flex flex-col gap-3 shadow-[0_0_40px_rgba(220,38,38,0.12)]">
                <div className="w-10 h-10 rounded-lg bg-rose-600/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-rose-400" />
                </div>
                <div className="text-xs font-bold tracking-widest text-rose-400 uppercase">Fanclub Membership</div>
                <h3 className="text-xl font-black text-white">Want ongoing access?</h3>
                <p className="text-white/65 text-base leading-relaxed">
                  Join Fanclub for ongoing member access: exclusive videos, early releases, bonus clips, behind-the-scenes content and selected member-only drops.
                </p>
                <p className="text-rose-400 font-bold text-sm">$20.99/month &nbsp;·&nbsp; $49.99 / 3 months</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            3. FANCLUB BENEFITS — What you unlock
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-10 px-6 bg-gradient-to-b from-[#0f0606] to-[#080808]">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black mb-3">
                FANCLUB <span className="text-rose-500">BENEFITS</span>
              </h2>
              <p className="text-white/50 text-base max-w-2xl mx-auto">
                Exclusive member updates, behind-the-scenes content, early access to selected releases and direct support for independent adult creators.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {[
              {
                img: publishedVideos[3]?.primary_thumbnail_url || publishedVideos[3]?.cover_image_url || FALLBACK_THUMBS[0].src,
                title: "Exclusive member updates",
                desc: "Fanclub gives you ongoing access to content from all FLESHLAB performers, not just one scene.",
              },
              {
                img: publishedVideos[4]?.primary_thumbnail_url || publishedVideos[4]?.cover_image_url || FALLBACK_THUMBS[1].src,
                title: "Early access to selected releases",
                desc: "Member content and early releases land in Fanclub before they reach the public side.",
              },
              {
              img: performersWithImage[1]?.profile_image_url || publishedVideos[5]?.primary_thumbnail_url || FALLBACK_THUMBS[2].src,
              title: "Support independent performers",
              desc: "Your Fanclub membership helps support independent performers, new productions and future FLESHLAB releases.",
              },
              ].map(({ img, title, desc }, i) => (
                <div key={i} className="relative overflow-hidden rounded-2xl">
                  <div className="aspect-video">
                    <img src={img} alt={title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-black text-white text-base mb-2 leading-tight">{title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            4. WHAT OPENS INSIDE FANCLUB — image-based cards
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 px-6">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black mb-3">
                WHAT OPENS INSIDE <span className="text-rose-500">THE FANCLUB</span>
              </h2>
              <p className="text-white/45 text-base max-w-2xl mx-auto">
                Fanclub is the member side of FLESHLAB — where new drops, exclusive extras and performer updates live before they reach the public side.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {valueCards.map((card, i) => (
                <ContentValueCard key={i} src={card.src} title={card.title} desc={card.desc} badge={card.badge} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            5. SUPPORT YOUR FAVORITE PERFORMERS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 px-6 bg-gradient-to-b from-[#0d0d0d] to-[#080808] border-y border-white/5">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Copy */}
              <div>
                <h2 className="text-3xl md:text-4xl font-black mb-4">
                  SUPPORT YOUR <span className="text-rose-500">FAVORITE PERFORMERS</span>
                </h2>
                <p className="text-white/55 text-lg leading-relaxed mb-4">
                  Your Fanclub membership helps support independent performers, new productions and future FLESHLAB releases.
                </p>
                <ul className="space-y-2 mb-8">
                  {[
                    "Support creator-led adult productions",
                    "Help fund new scenes and performer shoots",
                    "Get closer to the studio's release pipeline",
                    "Discover new performers early",
                    "Enable more diverse content creation"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/60 text-sm">
                      <Check className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                  <FanclubCTA
                    planId="fanclub_monthly"
                    label="Join Fanclub — $20.99/month"
                    {...ctaProps}
                    className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-4 rounded-xl h-auto shadow-lg shadow-rose-600/30 text-base"
                  />
                  <Link to="/performers">
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/8 px-6 py-4 rounded-xl h-auto font-semibold text-base">
                      <Users className="w-4 h-4 mr-2" />Browse Performers
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Performer image cards */}
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                {performersWithImage.length > 0
                  ? performersWithImage.slice(0, 6).map((p, i) => (
                      <PerformerSupportCard
                        key={p.id || i}
                        performer={p}
                        onJoin={() => {
                          if (!isAuthenticated) navigate(`/register?next=${encodeURIComponent(fanclubReturnUrl)}`);
                        }}
                      />
                    ))
                  : FALLBACK_THUMBS.slice(0, 3).map((fb, i) => (
                      <div key={i} className="relative overflow-hidden rounded-2xl aspect-[3/4] border border-white/8">
                        <img src={fb.src} alt="Performer" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                        <div className="absolute bottom-3 left-3">
                          <div className="inline-flex items-center gap-1 bg-rose-600/30 border border-rose-600/50 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <Crown className="w-2.5 h-2.5" />More in Fanclub
                          </div>
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            6. PRICING — Clear membership tiers
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-6">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black mb-3">
                CHOOSE YOUR <span className="text-rose-500">ACCESS</span>
              </h2>
              <p className="text-white/55 text-lg max-w-2xl mx-auto">
                Clear options: Fanclub for ongoing access, single scenes for one-time unlocks, premium for deeper content.
              </p>
            </div>

            {/* Pricing cards grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">

              {/* Fanclub Monthly */}
              <div className="relative bg-gradient-to-br from-[#1c0909] via-[#160606] to-[#0d0404] border-2 border-rose-600/55 rounded-2xl p-8 flex flex-col shadow-[0_0_50px_rgba(220,38,38,0.18)]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge className="bg-rose-600 text-white border-0 px-4 py-1.5 text-xs font-black tracking-widest uppercase shadow-lg">
                    FANCLUB ACCESS
                  </Badge>
                </div>

                <h3 className="text-2xl font-black text-white mb-2 mt-2">Fanclub Access</h3>
                <p className="text-white/50 text-base mb-6">For fans who want ongoing FLESHLAB updates and member content.</p>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-white">$20.99</span>
                  <span className="text-white/45 text-lg">/month</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Exclusive member-only scenes",
                    "Early access to selected releases",
                    "Behind-the-scenes content",
                    "Performer updates and drops",
                    "Support independent creators",
                    "Cancel anytime"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-base text-white/60">
                      <Check className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <FanclubCTA planId="fanclub_monthly" label="Join Fanclub" {...ctaProps}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-5 rounded-xl h-auto shadow-xl shadow-rose-600/30 text-lg w-full" />
              </div>

              {/* Single Scene */}
              <div className="relative bg-gradient-to-br from-[#1a1a0f] via-[#16160a] to-[#0d0d08] border-2 border-amber-600/45 rounded-2xl p-8 flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.12)]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge className="bg-amber-600 text-white border-0 px-4 py-1.5 text-xs font-black tracking-widest uppercase shadow-lg">
                    SINGLE SCENE
                  </Badge>
                </div>

                <h3 className="text-xl font-black text-white mb-1 mt-2">One-Time Unlock</h3>
                <p className="text-white/40 text-sm mb-4">Only want one scene? Buy selected videos individually.</p>

                {/* Price range */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-black text-white">$20.99</span>
                  <span className="text-amber-400/70 text-base font-bold">one-time</span>
                </div>
                <p className="text-white/30 text-xs -mt-1 mb-3">No subscription. Permanent access.</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Unlock one full scene",
                    "Permanent access",
                    "No subscription needed",
                    "Watch anytime",
                    "Selected releases only"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-base text-white/60">
                      <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-base">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button onClick={scrollToPPV}
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold px-8 py-5 rounded-xl h-auto shadow-xl shadow-amber-600/20 text-lg w-full">
                  Browse Single Scenes
                </Button>
              </div>

              {/* Premium Monthly */}
              <div className="relative bg-gradient-to-br from-[#12101c] via-[#0e0c18] to-[#080808] border-2 border-purple-600/45 rounded-2xl p-8 flex flex-col shadow-[0_0_50px_rgba(147,51,234,0.12)]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge className="bg-purple-600 text-white border-0 px-4 py-1.5 text-xs font-black tracking-widest uppercase shadow-lg">
                    PREMIUM ACCESS
                  </Badge>
                </div>

                <h3 className="text-xl font-black text-white mb-1 mt-2">Premium Membership</h3>
                <p className="text-white/40 text-sm mb-4">Get deeper access to selected premium releases or bundles.</p>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-black text-white">$29.99</span>
                  <span className="text-white/45 text-lg">/month</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Everything in Fanclub",
                    "Premium-tier content",
                    "Priority drops",
                    "Extended access to exclusives",
                    "Cancel anytime"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-base text-white/60">
                      <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                      <span className="text-base">{item}</span>
                    </li>
                  ))}
                </ul>

                <FanclubCTA planId="premium_monthly" label="Join Premium" {...ctaProps}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold px-8 py-5 rounded-xl h-auto shadow-xl shadow-purple-600/20 text-lg w-full" />
              </div>

            </div>

            {/* 3-month bundle */}
            <div className="max-w-3xl mx-auto mt-8">
              <div className="bg-gradient-to-br from-[#0f1c19] via-[#0c1814] to-[#080808] border-2 border-emerald-600/45 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_50px_rgba(16,185,129,0.12)]">
                <div>
                  <div className="inline-flex items-center gap-2 bg-emerald-600/20 border border-emerald-600/40 rounded-full px-3 py-1 mb-3">
                    <Badge className="bg-emerald-600 text-white border-0 px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">
                      BEST VALUE
                    </Badge>
                  </div>
                  <h3 className="text-xl font-black text-white mb-1">Fanclub 3-Month Access</h3>
                  <p className="text-white/40 text-sm">Save $10 compared to monthly billing</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-black text-white">$49.99</span>
                    <span className="text-white/45 text-base">/3 months</span>
                  </div>
                </div>
                <FanclubCTA planId="fanclub_3mo" label="Get 3-Month Access" {...ctaProps}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold px-8 py-4 rounded-xl h-auto shadow-xl shadow-emerald-600/20 text-base shrink-0" />
              </div>
            </div>

            {/* Free account row */}
            <div className="max-w-3xl mx-auto mt-8">
              <div className="bg-[#111] border border-white/8 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white mb-0.5">Free Account</h3>
                  <p className="text-white/40 text-sm">Browse the public side, watch previews and decide when you're ready.</p>
                </div>
                <Button onClick={() => navigate('/register')}
                  className="shrink-0 bg-white/8 hover:bg-white/14 text-white font-bold rounded-xl h-auto py-3 px-6 border border-white/12 text-sm">
                  Create Free Account
                </Button>
              </div>
            </div>

            {/* Compliance notice */}
            <div className="max-w-3xl mx-auto mt-8 space-y-3 text-center">
              <p className="text-white/15 text-xs leading-relaxed">
                FLESHLAB memberships provide access to digital adult content and fanclub features only. Memberships do not include dating, escorting, private meetings, offline services, or user-to-user paid services.
              </p>
              <p className="text-white/20 text-xs leading-relaxed">
                Crypto payments require minimum amounts. All prices shown are set safely above NOWPayments minimums for reliable checkout.
              </p>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            7. SINGLE SCENE ALTERNATIVE (PPV)
        ══════════════════════════════════════════════════════════════════ */}
        <section id="ppv-section" className="relative py-20 px-6 border-t border-white/5 overflow-hidden bg-[#080808]">
          {/* Subtle radial glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-rose-950/40 rounded-full blur-[120px]" />
          </div>

          <div className="relative max-w-[1280px] mx-auto">
            <div className="text-center mb-12">
              {/* Label */}
              <div className="inline-flex items-center gap-2 bg-amber-600/12 border border-amber-700/25 rounded-full px-4 py-1.5 mb-5">
                <Film className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300/80 text-[11px] font-black uppercase tracking-widest">Single Scene · No Subscription</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-3">
                ONLY WANT <span className="text-amber-500">ONE SCENE?</span>
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                Buy selected videos individually without joining the monthly fanclub. Pay once, own it permanently.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {(['standard', 'premium', 'exclusive']).map((key) => (
                <PPVCard
                  key={key}
                  priceTierKey={key}
                  tier={PRICING.ppv[key]}
                  thumb={ppvTierThumb[key]}
                  {...ctaProps}
                />
              ))}
            </div>

            {/* Crypto payment notice */}
            <div className="max-w-2xl mx-auto mt-8">
              <div className="bg-[#111] border border-amber-900/30 rounded-2xl p-5 text-center">
                <p className="text-amber-400/70 text-xs font-bold mb-1 uppercase tracking-wider">Crypto Payment Notice</p>
                <p className="text-white/40 text-xs leading-relaxed">
                  Crypto checkout requires minimum payment amounts. All prices shown are set safely above NOWPayments minimums for reliable checkout with USDT TRC20, BTC, and other supported coins.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            8. FAN PRODUCTIONS TEASER
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-12 px-6 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-[#130808] to-[#0d0d0d] border border-rose-900/30 rounded-2xl px-8 py-8 flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-1">
                <div className="text-xs font-black text-rose-500/60 uppercase tracking-widest mb-2">Fan Productions</div>
                <h3 className="font-black text-white text-xl mb-2">Want to become part of a FLESHLAB production?</h3>
                <p className="text-white/45 text-sm leading-relaxed">
                  Fan Productions are official homemade-style FLESHLAB productions where approved verified 18+ fans may apply to participate as guest performers. Application required. Studio approval required. Performer approval required.
                </p>
              </div>
              <div className="shrink-0">
                <Link to="/fan-productions">
                  <Button className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/35 font-bold px-6 py-3 rounded-xl h-auto text-sm whitespace-nowrap">
                    Learn About Fan Productions
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            9. FINAL CTA
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-6">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-rose-700/15 rounded-full blur-[80px]" />
            </div>
            <div className="relative bg-gradient-to-br from-[#1a0808] to-[#0d0808] border border-rose-600/35 rounded-3xl px-10 py-16 text-center shadow-[0_0_60px_rgba(220,38,38,0.15)]">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Ready to Unlock the <span className="text-rose-500">Full Fanclub?</span>
              </h2>
              <p className="text-white/65 text-lg mb-8 max-w-2xl mx-auto">
                Join the FLESHLAB Fanclub for member updates, selected exclusive releases, early access and direct support for independent performers.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                <FanclubCTA planId="fanclub_monthly" label="Join the Fanclub" {...ctaProps}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-4 rounded-xl h-auto shadow-xl shadow-rose-600/35 min-w-[200px] text-base" />
                <Link to="/videos">
                  <Button size="lg" variant="outline"
                    className="border-white/20 text-white hover:bg-white/8 font-bold px-10 py-4 rounded-xl h-auto min-w-[200px] text-base">
                    <Film className="w-4 h-4 mr-2" />Browse Latest Videos
                  </Button>
                </Link>
              </div>
              <p className="text-white/40 text-sm mb-1">$20.99/month &nbsp;·&nbsp; $49.99 / 3 months &nbsp;·&nbsp; Cancel anytime.</p>
              <p className="text-white/20 text-xs">Your membership supports independent performers, new productions and future FLESHLAB releases.</p>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}