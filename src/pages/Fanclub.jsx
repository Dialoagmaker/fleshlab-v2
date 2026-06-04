import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Check, Crown, Shield, Play, Star, Zap, Eye, Film, Users, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useAccessControl, PRICING } from "@/lib/useAccessControl";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePaymentProvider } from "@/hooks/usePaymentProvider";
import CheckoutButton from "@/components/payment/CheckoutButton";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// ── Checkout helpers (no payment logic changes) ───────────────────────────────
function FanclubCTA({ planId, className, label, isAuthenticated, requireSignup, paymentProvider }) {
  return (
    <CheckoutButton
      paymentType="fanclub" planId={planId}
      label={label || 'Enter Fanclub'}
      returnUrl="/fanclub" cancelUrl="/fanclub"
      isAuthenticated={isAuthenticated}
      onRequireAuth={() => requireSignup('/fanclub', 'fanclub', { planId })}
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
function LockedImageCard({ src, label, className = "", large = false }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-rose-900/30 ${className}`}>
      <img src={src} alt={label} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      {/* lock badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-rose-600/40 rounded-full px-2 py-1">
        <Lock className="w-2.5 h-2.5 text-rose-400" />
        <span className="text-rose-300 text-[10px] font-bold uppercase tracking-wide">Members</span>
      </div>
      {/* bottom label */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-3">
        <span className="text-white text-xs font-bold tracking-wide">{label}</span>
      </div>
    </div>
  );
}

// ── PPV card with image background ───────────────────────────────────────────
function PPVCard({ thumb, tier, priceTierKey, isAuthenticated, requireSignup, paymentProvider }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 flex flex-col">
      {/* image */}
      <div className="relative aspect-video">
        <img src={thumb} alt={tier.label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
          {PPV_LABELS[priceTierKey]?.badge || "PPV"}
        </div>
      </div>
      {/* info */}
      <div className="bg-[#111] p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-baseline justify-between">
          <h3 className="font-bold text-white text-sm">{tier.label}</h3>
          <span className="text-2xl font-black text-rose-400">${tier.price}</span>
        </div>
        <p className="text-white/40 text-xs">Permanent access after payment confirmation.</p>
        <PPVUnlockCTA
          priceTier={priceTierKey}
          label="Unlock One Scene"
          isAuthenticated={isAuthenticated}
          requireSignup={requireSignup}
          paymentProvider={paymentProvider}
          className="w-full bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-600/30 font-bold py-3 rounded-xl text-sm"
        />
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

  const scrollToPPV = () => document.getElementById('ppv-section')?.scrollIntoView({ behavior: 'smooth' });

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

  // Performers with a profile image
  const performersWithImage = useMemo(
    () => performers.filter(p => p.profile_image_url && p.status !== 'inactive').slice(0, 6),
    [performers]
  );

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

  // Value section: 6 image cards
  const valueCards = useMemo(() => {
    const defs = [
      { title: 'Exclusive fanclub videos', desc: 'Full scenes not shown on the public side.', badge: 'Members Only' },
      { title: 'Early releases',           desc: 'New content before public visitors see it.', badge: 'Early Access' },
      { title: 'Bonus clips',              desc: 'Short edits and extras made for members.', badge: 'Bonus' },
      { title: 'Behind the scenes',        desc: 'Shoots, performers and the studio world.', badge: 'BTS' },
      { title: 'Performer updates',        desc: 'Updates from verified FLESHLAB performers.', badge: 'Updates' },
      { title: 'Better value',             desc: 'Fanclub = ongoing access from $12.99/month.', badge: 'Best Value' },
    ];
    return defs.map((d, i) => ({
      ...d,
      src: publishedVideos[i]?.primary_thumbnail_url || publishedVideos[i]?.cover_image_url || FALLBACK_THUMBS[i % FALLBACK_THUMBS.length].src,
    }));
  }, [publishedVideos]);

  // PPV cards: assign a real thumbnail per tier
  const ppvTierThumb = useMemo(() => {
    const byTier = { standard: null, premium: null, exclusive: null };
    const keys = Object.keys(byTier);
    keys.forEach((k, i) => {
      byTier[k] = publishedVideos[i + 3]?.primary_thumbnail_url || FALLBACK_THUMBS[i % FALLBACK_THUMBS.length].src;
    });
    return byTier;
  }, [publishedVideos]);

  // Props bundle (avoids repetition)
  const ctaProps = { isAuthenticated, requireSignup, paymentProvider };

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

          <div className="relative max-w-[1400px] mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-600/30 rounded-full px-4 py-1.5 mb-7">
                <Crown className="w-4 h-4 text-rose-400" />
                <span className="text-rose-300 text-sm font-bold tracking-widest uppercase">Fanclub Membership</span>
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-[1.0] tracking-tight mb-3">
                THE PUBLIC SIDE<br />
                <span className="text-white/25">IS ONLY THE</span><br />
                <span className="text-rose-500">PREVIEW</span>
              </h1>
              <p className="text-2xl md:text-3xl font-black text-white/75 mt-3 mb-6">
                ENTER THE FLESHLAB FANCLUB
              </p>

              <p className="text-lg text-white/55 leading-relaxed mb-10 max-w-xl">
                Browse the trailers, meet the performers and get a taste of FLESHLAB. The real experience starts inside the Fanclub — exclusive scenes, early releases, bonus clips, behind-the-scenes moments and member-only updates from verified performers.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <FanclubCTA
                  planId="fanclub_monthly"
                  label="Enter Fanclub — $12.99/month"
                  {...ctaProps}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-4 rounded-xl text-base h-auto shadow-xl shadow-rose-600/35"
                />
                <Button size="lg" variant="outline" onClick={scrollToPPV}
                  className="border-white/20 text-white hover:bg-white/8 font-semibold px-8 py-4 rounded-xl h-auto text-base">
                  <Play className="w-4 h-4 mr-2 shrink-0" />Unlock One Scene
                </Button>
              </div>

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
            2. FROM PREVIEW TO FULL ACCESS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 px-6 border-t border-white/6">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-3">
              FROM <span className="text-rose-500">PREVIEW</span> TO FULL ACCESS
            </h2>
            <p className="text-white/45 text-center mb-10 text-base max-w-xl mx-auto">
              Three ways to experience FLESHLAB — from free browsing to full member access.
            </p>

            <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {/* Free */}
              <div className="bg-[#111] border border-white/8 rounded-2xl p-7 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white/45" />
                </div>
                <div className="text-xs font-bold tracking-widest text-white/30 uppercase">Free Account</div>
                <h3 className="text-xl font-black text-white">Look around first.</h3>
                <p className="text-white/50 text-base leading-relaxed">
                  Browse performers, watch previews and selected free clips. Perfect if you want to explore FLESHLAB before unlocking more.
                </p>
              </div>

              {/* PPV */}
              <div className="bg-[#111] border border-white/8 rounded-2xl p-7 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-600/15 flex items-center justify-center">
                  <Film className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-xs font-bold tracking-widest text-amber-500/60 uppercase">PPV Unlock</div>
                <h3 className="text-xl font-black text-white">Want one specific scene?</h3>
                <p className="text-white/50 text-base leading-relaxed">
                  Unlock a single full scene and keep permanent access. No subscription needed.
                </p>
              </div>

              {/* Fanclub */}
              <div className="bg-gradient-to-br from-[#1a0808] to-[#0f0606] border border-rose-600/40 rounded-2xl p-7 flex flex-col gap-3 shadow-[0_0_40px_rgba(220,38,38,0.12)]">
                <div className="w-10 h-10 rounded-lg bg-rose-600/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-rose-400" />
                </div>
                <div className="text-xs font-bold tracking-widest text-rose-500/70 uppercase">Fanclub</div>
                <h3 className="text-xl font-black text-white">Want the full experience?</h3>
                <p className="text-white/60 text-base leading-relaxed">
                  Join Fanclub for ongoing member access: exclusive videos, early releases, bonus clips, behind-the-scenes content, performer updates and selected member-only drops.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            3. WHY JOIN FANCLUB — 3 strong value cards
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 px-6 bg-gradient-to-b from-[#0f0606] to-[#080808]">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black mb-3">
                WHY JOIN <span className="text-rose-500">FANCLUB?</span>
              </h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">
                One PPV unlocks one scene. Fanclub unlocks the ongoing member side of FLESHLAB.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {[
                {
                  img: publishedVideos[0]?.primary_thumbnail_url || FALLBACK_THUMBS[0].src,
                  title: "See more of your favorite performers",
                  desc: "Fanclub gives you ongoing access to content from all FLESHLAB performers — not just one scene.",
                },
                {
                  img: publishedVideos[1]?.primary_thumbnail_url || FALLBACK_THUMBS[1].src,
                  title: "Get early and exclusive drops",
                  desc: "Member content and early releases land in Fanclub before they reach the public side.",
                },
                {
                  img: performersWithImage[0]?.profile_image_url || FALLBACK_THUMBS[2].src,
                  title: "Better value if you want more than one scene",
                  desc: "One PPV starts at $12.99. Fanclub starts at $12.99/month with ongoing member access.",
                },
              ].map(({ img, title, desc }, i) => (
                <div key={i} className="relative overflow-hidden rounded-2xl">
                  <div className="aspect-video">
                    <img src={img} alt={title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-black text-white text-base mb-2 leading-tight">{title}</h3>
                    <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
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
                  Like what you see? Join Fanclub to unlock member-only content and support the performers you want to see more of.
                </p>
                <p className="text-white/40 text-base leading-relaxed mb-8">
                  Fanclub helps FLESHLAB keep producing, promoting and building performer brands — while you unlock the member side of the platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <FanclubCTA
                    planId="fanclub_monthly"
                    label="Enter Fanclub — $12.99/month"
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
                        onJoin={() => isAuthenticated ? null : requireSignup('/fanclub', 'fanclub', { planId: 'fanclub_monthly' })}
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
            6. PRICING — Monthly as dominant card
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-6">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black mb-3">
                CHOOSE YOUR <span className="text-rose-500">ACCESS</span>
              </h2>
              <p className="text-white/45 text-lg max-w-xl mx-auto">
                Start free. Upgrade when you are ready for the full member experience.
              </p>
            </div>

            {/* Monthly as hero card, others as secondary row */}
            <div className="max-w-5xl mx-auto space-y-5">

              {/* Monthly HERO card — full width on its own row */}
              <div className="relative bg-gradient-to-br from-[#1c0909] via-[#160606] to-[#0d0404] border-2 border-rose-600/55 rounded-2xl p-8 md:p-10 shadow-[0_0_70px_rgba(220,38,38,0.22)]">
                <div className="absolute -top-4 left-8">
                  <Badge className="bg-rose-600 text-white border-0 px-5 py-1.5 text-xs font-black tracking-widest uppercase shadow-lg">
                    MOST POPULAR
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-black text-white mb-1">Monthly Fanclub</h3>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-6xl font-black text-white">${PRICING.fanclub.monthly.price}</span>
                      <span className="text-white/45 text-xl">/month</span>
                    </div>
                    <p className="text-white/65 text-base leading-relaxed mb-6">
                      The easiest way into the member side of FLESHLAB. Full monthly access to exclusive fanclub content, early releases, bonus clips and performer updates.
                    </p>
                    <FanclubCTA
                      planId="fanclub_monthly"
                      label="Enter Fanclub — $12.99"
                      {...ctaProps}
                      className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-4 rounded-xl h-auto shadow-xl shadow-rose-600/30 text-base"
                    />
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRICING.fanclub.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-white/70 text-sm">
                        <Check className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Free / 6 Months / 12 Months — 3 column row */}
              <div className="grid sm:grid-cols-3 gap-5">

                {/* Free */}
                <div className="bg-[#111] border border-white/8 rounded-2xl p-7 flex flex-col">
                  <h3 className="text-base font-bold text-white mb-2">Free Account</h3>
                  <div className="mb-3">
                    <span className="text-4xl font-black text-white">$0</span>
                    <span className="text-white/40 text-sm ml-1.5">forever</span>
                  </div>
                  <p className="text-white/45 text-sm leading-relaxed mb-5 flex-1">
                    Browse the public side, watch previews and decide when you are ready.
                  </p>
                  <Button onClick={() => navigate('/register')}
                    className="w-full bg-white/8 hover:bg-white/14 text-white font-bold rounded-xl h-auto py-3 border border-white/12 text-sm">
                    Create Free Account
                  </Button>
                </div>

                {/* 6 Months */}
                <div className="bg-[#111] border border-white/8 rounded-2xl p-7 flex flex-col">
                  <h3 className="text-base font-bold text-white mb-2">6 Months</h3>
                  <div className="mb-1">
                    <span className="text-4xl font-black text-white">${PRICING.fanclub.sixMonths.price}</span>
                    <span className="text-white/40 text-sm ml-1.5">/6 mo</span>
                  </div>
                  <div className="text-rose-400 font-bold text-sm mb-3">
                    ${PRICING.fanclub.sixMonths.pricePerMonth}<span className="text-white/30 text-xs font-normal">/month</span>
                  </div>
                  <p className="text-white/45 text-sm leading-relaxed mb-5 flex-1">
                    Save compared to monthly. Ideal for regular fans.
                  </p>
                  <FanclubCTA planId="fanclub_6mo" label="Enter Fanclub" {...ctaProps}
                    className="w-full bg-white/8 hover:bg-white/14 text-white font-bold rounded-xl h-auto py-3 border border-white/12 text-sm" />
                </div>

                {/* 12 Months */}
                <div className="relative bg-gradient-to-br from-[#1a1200] to-[#0f0d00] border-2 border-amber-600/45 rounded-2xl p-7 flex flex-col shadow-[0_0_35px_rgba(217,119,6,0.10)]">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <Badge className="bg-amber-600 text-white border-0 px-3 py-1 text-[10px] font-black tracking-widest uppercase">BEST VALUE</Badge>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">12 Months</h3>
                  <div className="mb-1">
                    <span className="text-4xl font-black text-white">${PRICING.fanclub.annual.price}</span>
                    <span className="text-white/40 text-sm ml-1.5">/year</span>
                  </div>
                  <div className="text-amber-400 font-bold text-sm mb-3">
                    ${PRICING.fanclub.annual.pricePerMonth}<span className="text-white/30 text-xs font-normal">/month</span>
                  </div>
                  <p className="text-white/45 text-sm leading-relaxed mb-5 flex-1">
                    Best value for regular fans. Save 36%.
                  </p>
                  <FanclubCTA planId="fanclub_annual" label="Get Best Value" {...ctaProps}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl h-auto py-3 shadow-lg shadow-amber-600/20 text-sm" />
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            7. PPV — image-backed cards
        ══════════════════════════════════════════════════════════════════ */}
        <section id="ppv-section" className="py-20 px-6 bg-[#0d0d0d] border-t border-white/5">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black mb-3">
                ONLY WANT <span className="text-rose-500">ONE SCENE?</span>
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                Unlock a single scene with permanent access. No subscription needed.
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
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            8. GUEST PRODUCTION
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-6 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black mb-3">
                WANT TO GO <span className="text-rose-500">BEYOND WATCHING?</span>
              </h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">
                Apply for a professional 18+ studio production with verified performers.
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#150e0e] to-[#0d0d0d] border border-rose-600/20 rounded-3xl overflow-hidden">
              <div className="bg-rose-950/30 border-b border-rose-600/15 px-8 py-5 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs font-bold tracking-widest text-rose-500/60 uppercase mb-0.5">Guest Production</div>
                  <div className="font-black text-white text-xl">Application Required</div>
                </div>
                <div className="text-right">
                  <div className="text-white/30 text-xs mb-0.5">Starting from</div>
                  <div className="text-4xl font-black text-white">$999</div>
                </div>
              </div>
              <div className="p-8">
                <p className="text-white/50 text-sm leading-relaxed mb-6">
                  Guest Production is application-based. Every request is reviewed by the studio and depends on compliance, performer compatibility, production scope, filming time and post-production.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mb-8">
                  {[
                    { req: true,  label: 'Application required' },
                    { req: true,  label: 'Verified 18+ only' },
                    { req: true,  label: 'Studio approval required' },
                    { req: true,  label: 'Performer approval required' },
                    { inc: true,  label: 'Legal contracts & releases' },
                    { inc: true,  label: 'Safety protocol' },
                    { inc: true,  label: 'Professional filming' },
                    { inc: true,  label: 'Post-production included' },
                  ].map(({ req, label }, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${req ? 'bg-rose-600/20' : 'bg-emerald-600/15'}`}>
                        {req ? <Lock className="w-2.5 h-2.5 text-rose-400" /> : <Check className="w-2.5 h-2.5 text-emerald-400" />}
                      </div>
                      <span className="text-white/60 text-sm">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <Button size="lg"
                    onClick={() => isAuthenticated ? navigate('/guest-production') : requireSignup('/guest-production')}
                    className="bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-600 hover:to-rose-700 text-white font-bold px-12 py-5 rounded-xl h-auto shadow-xl shadow-rose-700/25 text-base">
                    Apply for Guest Production
                  </Button>
                  {!isAuthenticated && <p className="text-white/25 text-xs mt-3">Account required before submitting application</p>}
                </div>
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
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-rose-700/12 rounded-full blur-[80px]" />
            </div>
            <div className="relative bg-gradient-to-br from-[#1a0808] to-[#0d0808] border border-rose-600/25 rounded-3xl px-10 py-16 text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                READY TO <span className="text-rose-500">ENTER?</span>
              </h2>
              <p className="text-white/55 text-lg mb-10 max-w-xl mx-auto">
                Start free, unlock one scene, or join Fanclub for the full FLESHLAB member experience.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <FanclubCTA planId="fanclub_monthly" label="Enter Fanclub" {...ctaProps}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-4 rounded-xl h-auto shadow-xl shadow-rose-600/35 min-w-[180px] text-base" />
                <Button size="lg" variant="outline" onClick={scrollToPPV}
                  className="border-white/20 text-white hover:bg-white/8 font-bold px-10 py-4 rounded-xl h-auto min-w-[180px] text-base">
                  Unlock One Scene
                </Button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}