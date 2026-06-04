import { Link, useNavigate } from "react-router-dom";
import { Lock, Check, Crown, Shield, Play, Star, Zap, Eye, Film, Users, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useAccessControl, PRICING } from "@/lib/useAccessControl";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePaymentProvider } from "@/hooks/usePaymentProvider";
import CheckoutButton from "@/components/payment/CheckoutButton";

// ── Internal CTA helpers (no payment logic changes) ──────────────────────────

function FanclubCTA({ planId, className, label, isAuthenticated, requireSignup, paymentProvider }) {
  return (
    <CheckoutButton
      paymentType="fanclub"
      planId={planId}
      label={label || 'Enter Fanclub'}
      returnUrl="/fanclub"
      cancelUrl="/fanclub"
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
      paymentType="ppv"
      priceTier={priceTier}
      label={label || (isAuthenticated ? 'Unlock Scene' : 'Create Account to Unlock')}
      returnUrl="/videos"
      cancelUrl="/fanclub"
      isAuthenticated={isAuthenticated}
      onRequireAuth={() => requireSignup('/videos', 'ppv', { priceTier })}
      paymentProvider={paymentProvider}
      className={className || "w-full"}
      unavailableLabel="PPV unlock coming soon"
    />
  );
}

// ── Blurred locked-content tile (visual decoration for hero) ──────────────────
function LockedTile({ opacity = "opacity-100" }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-[#1a0a0a] border border-rose-900/30 aspect-[4/5] ${opacity}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-rose-950/40 to-black/70" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="w-10 h-10 rounded-full bg-rose-600/20 border border-rose-600/40 flex items-center justify-center">
          <Lock className="w-4 h-4 text-rose-400" />
        </div>
        <span className="text-white/50 text-xs font-medium tracking-wide">FANCLUB ONLY</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Fanclub() {
  const { isAuthenticated } = useAuth();
  const { requireSignup } = useAccessControl();
  const navigate = useNavigate();
  const paymentProvider = usePaymentProvider();

  const scrollToPPV = () => document.getElementById('ppv-section')?.scrollIntoView({ behavior: 'smooth' });

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
          "description": "Exclusive fanclub membership with full-length HD gay videos and behind-the-scenes content",
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

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 1. HERO — story-driven                                           */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 left-1/3 w-[600px] h-[600px] bg-rose-700/10 rounded-full blur-[140px]" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-rose-900/8 rounded-full blur-[100px]" />
          </div>

          <div className="relative max-w-[1280px] mx-auto px-6 py-24 w-full grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-600/30 rounded-full px-4 py-1.5 mb-8">
                <Crown className="w-4 h-4 text-rose-400" />
                <span className="text-rose-300 text-sm font-semibold tracking-widest uppercase">Fanclub Membership</span>
              </div>

              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.0] tracking-tight mb-4">
                THE PUBLIC SIDE<br />
                <span className="text-white/30">IS ONLY THE</span><br />
                <span className="text-rose-500">PREVIEW</span>
              </h1>

              <p className="text-2xl lg:text-3xl font-black text-white/80 mb-6 mt-2">
                ENTER THE FLESHLAB FANCLUB
              </p>

              <p className="text-base lg:text-lg text-white/55 leading-relaxed mb-10 max-w-lg">
                Watch the trailers, browse the performers, get a taste of the studio. But the real FLESHLAB experience starts inside the Fanclub — exclusive scenes, early releases, bonus clips, behind-the-scenes moments and member-only updates from verified performers.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <FanclubCTA
                  planId="fanclub_monthly"
                  label="Enter Fanclub — $12.99/month"
                  isAuthenticated={isAuthenticated}
                  requireSignup={requireSignup}
                  paymentProvider={paymentProvider}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-4 rounded-xl text-base h-auto shadow-xl shadow-rose-600/35 whitespace-nowrap"
                />
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToPPV}
                  className="border-white/20 text-white/80 hover:bg-white/8 hover:text-white font-semibold px-8 py-4 rounded-xl text-base h-auto whitespace-nowrap"
                >
                  <Play className="w-4 h-4 mr-2 shrink-0" />
                  Unlock One Scene
                </Button>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-white/35 text-sm">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Verified 18+ performers</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Secure crypto checkout</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Access after payment confirmation</span>
              </div>
            </div>

            {/* Right — locked content wall */}
            <div className="hidden lg:grid grid-cols-3 gap-3 relative">
              <div className="col-span-2 row-span-2">
                <LockedTile />
              </div>
              <LockedTile opacity="opacity-70" />
              <LockedTile opacity="opacity-50" />
              <LockedTile opacity="opacity-40" />
              <LockedTile opacity="opacity-60" />
              <div className="col-span-2">
                <div className="rounded-xl bg-rose-600/10 border border-rose-600/25 p-4 flex items-center gap-3">
                  <Crown className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="text-white/60 text-sm">
                    <span className="text-white font-semibold">Fanclub members</span> unlock all content above — plus early releases and member drops.
                  </span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 2. STORY — Free → PPV → Fanclub                                 */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-6 border-t border-white/6">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-3">
              FROM <span className="text-rose-500">PREVIEW</span> TO FULL ACCESS
            </h2>
            <p className="text-white/45 text-center mb-12 max-w-xl mx-auto">
              Three ways to experience FLESHLAB — from free browsing to full member access.
            </p>

            <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {/* Free */}
              <div className="bg-[#111] border border-white/8 rounded-2xl p-7">
                <div className="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center mb-5">
                  <Eye className="w-5 h-5 text-white/50" />
                </div>
                <div className="text-xs font-bold tracking-widest text-white/35 uppercase mb-2">Free Account</div>
                <h3 className="text-xl font-black text-white mb-3">Look around first.</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Browse performers, watch previews and selected free clips. Perfect if you want to explore FLESHLAB before unlocking more.
                </p>
              </div>

              {/* PPV */}
              <div className="bg-[#111] border border-white/8 rounded-2xl p-7">
                <div className="w-10 h-10 rounded-lg bg-amber-600/15 flex items-center justify-center mb-5">
                  <Film className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-xs font-bold tracking-widest text-amber-500/60 uppercase mb-2">PPV Unlock</div>
                <h3 className="text-xl font-black text-white mb-3">Want one specific scene?</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Unlock a single full scene and keep permanent access. No subscription needed.
                </p>
              </div>

              {/* Fanclub */}
              <div className="bg-gradient-to-br from-[#1a0808] to-[#0f0606] border border-rose-600/40 rounded-2xl p-7 shadow-[0_0_40px_rgba(220,38,38,0.12)]">
                <div className="w-10 h-10 rounded-lg bg-rose-600/20 flex items-center justify-center mb-5">
                  <Crown className="w-5 h-5 text-rose-400" />
                </div>
                <div className="text-xs font-bold tracking-widest text-rose-500/70 uppercase mb-2">Fanclub</div>
                <h3 className="text-xl font-black text-white mb-3">Want the full experience?</h3>
                <p className="text-white/55 text-sm leading-relaxed">
                  Join Fanclub for ongoing member access: exclusive videos, early releases, bonus clips, behind-the-scenes content, performer updates and selected member-only drops.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 3. FANCLUB VALUE — what opens inside                             */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-6 bg-gradient-to-b from-[#0f0606] to-[#080808]">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                WHAT OPENS INSIDE <span className="text-rose-500">THE FANCLUB</span>
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto text-base leading-relaxed">
                Fanclub is not just another payment option. It is the member side of FLESHLAB — where new drops, exclusive extras and performer updates live before they reach the public side.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12 max-w-5xl mx-auto">
              {[
                { icon: Film,   title: 'Exclusive fanclub videos',  desc: 'Full scenes and member-only drops not shown on the public side.' },
                { icon: Zap,    title: 'Early releases',            desc: 'See selected new content before public visitors.' },
                { icon: Star,   title: 'Bonus clips',               desc: 'Extra moments, short edits and content made for members.' },
                { icon: Eye,    title: 'Behind the scenes',         desc: 'A closer look at shoots, performers and the studio world.' },
                { icon: Users,  title: 'Performer updates',         desc: 'Follow updates from verified FLESHLAB performers.' },
                { icon: Crown,  title: 'Better value',              desc: 'One PPV starts at $12.99. Fanclub starts at $12.99/month and gives ongoing access to member content.' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div key={i} className="flex gap-4 bg-[#111] border border-white/6 rounded-2xl p-6">
                  <div className="w-9 h-9 rounded-lg bg-rose-600/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm mb-1.5">{title}</div>
                    <div className="text-white/45 text-sm leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 4. PRICING                                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                CHOOSE YOUR <span className="text-rose-500">ACCESS</span>
              </h2>
              <p className="text-white/45 text-lg max-w-xl mx-auto">
                Start free. Upgrade when you are ready for the full member experience.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">

              {/* Free */}
              <div className="bg-[#111] border border-white/8 rounded-2xl p-7 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-2">Free Account</h3>
                <div className="mb-4">
                  <span className="text-5xl font-black text-white">$0</span>
                  <span className="text-white/40 text-sm ml-1.5">forever</span>
                </div>
                <p className="text-white/45 text-sm leading-relaxed mb-6 flex-1">
                  Browse the public side, watch selected previews and decide when you are ready to unlock more.
                </p>
                <ul className="space-y-2 mb-7">
                  {PRICING.free.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/50 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-500/70 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate('/register')}
                  className="w-full bg-white/8 hover:bg-white/14 text-white font-bold rounded-xl h-auto py-3.5 border border-white/12 text-sm"
                >
                  Create Free Account
                </Button>
              </div>

              {/* Monthly — MOST POPULAR */}
              <div className="relative bg-gradient-to-br from-[#1c0909] to-[#130505] border-2 border-rose-600/55 rounded-2xl p-7 flex flex-col shadow-[0_0_55px_rgba(220,38,38,0.20)]">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge className="bg-rose-600 text-white border-0 px-4 py-1 text-[11px] font-bold tracking-widest uppercase shadow-lg">
                    MOST POPULAR
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Monthly Fanclub</h3>
                <div className="mb-4">
                  <span className="text-5xl font-black text-white">${PRICING.fanclub.monthly.price}</span>
                  <span className="text-white/40 text-sm ml-1.5">/month</span>
                </div>
                <p className="text-white/65 text-sm leading-relaxed mb-6 flex-1">
                  The easiest way into the member side of FLESHLAB. Full monthly access to exclusive fanclub content, early releases, bonus clips and performer updates.
                </p>
                <ul className="space-y-2 mb-7">
                  {PRICING.fanclub.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/70 text-xs">
                      <Check className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <FanclubCTA
                  planId="fanclub_monthly"
                  label="Enter Fanclub"
                  isAuthenticated={isAuthenticated}
                  requireSignup={requireSignup}
                  paymentProvider={paymentProvider}
                  className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl h-auto py-3.5 shadow-lg shadow-rose-600/30 text-sm"
                />
              </div>

              {/* 6 Months */}
              <div className="bg-[#111] border border-white/8 rounded-2xl p-7 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-2">6 Months</h3>
                <div className="mb-1">
                  <span className="text-5xl font-black text-white">${PRICING.fanclub.sixMonths.price}</span>
                  <span className="text-white/40 text-sm ml-1.5">/6 mo</span>
                </div>
                <div className="text-rose-400 font-bold text-base mb-4">
                  ${PRICING.fanclub.sixMonths.pricePerMonth}<span className="text-white/35 text-xs font-normal">/month</span>
                </div>
                <p className="text-white/45 text-sm leading-relaxed mb-6 flex-1">
                  Save compared to monthly. Ideal for regular fans.
                </p>
                <ul className="space-y-2 mb-7">
                  {PRICING.fanclub.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/50 text-xs">
                      <Check className="w-3.5 h-3.5 text-rose-500/60 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <FanclubCTA
                  planId="fanclub_6mo"
                  label="Enter Fanclub"
                  isAuthenticated={isAuthenticated}
                  requireSignup={requireSignup}
                  paymentProvider={paymentProvider}
                  className="w-full bg-white/8 hover:bg-white/14 text-white font-bold rounded-xl h-auto py-3.5 border border-white/12 text-sm"
                />
              </div>

              {/* 12 Months — BEST VALUE */}
              <div className="relative bg-gradient-to-br from-[#1a1200] to-[#0f0d00] border-2 border-amber-600/45 rounded-2xl p-7 flex flex-col shadow-[0_0_40px_rgba(217,119,6,0.12)]">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge className="bg-amber-600 text-white border-0 px-4 py-1 text-[11px] font-bold tracking-widest uppercase shadow-lg">
                    BEST VALUE
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">12 Months</h3>
                <div className="mb-1">
                  <span className="text-5xl font-black text-white">${PRICING.fanclub.annual.price}</span>
                  <span className="text-white/40 text-sm ml-1.5">/year</span>
                </div>
                <div className="text-amber-400 font-bold text-base mb-4">
                  ${PRICING.fanclub.annual.pricePerMonth}<span className="text-white/35 text-xs font-normal">/month</span>
                </div>
                <p className="text-white/45 text-sm leading-relaxed mb-6 flex-1">
                  The best value for regular fans. Full year access with the lowest monthly price.
                </p>
                <ul className="space-y-2 mb-7">
                  {PRICING.fanclub.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/70 text-xs">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <FanclubCTA
                  planId="fanclub_annual"
                  label="Enter Fanclub"
                  isAuthenticated={isAuthenticated}
                  requireSignup={requireSignup}
                  paymentProvider={paymentProvider}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl h-auto py-3.5 shadow-lg shadow-amber-600/25 text-sm"
                />
              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 5. WHY FANCLUB INSTEAD OF PPV                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-6 bg-[#0d0d0d] border-y border-white/5">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                WHY FANCLUB INSTEAD <span className="text-rose-500">OF PPV?</span>
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto">
                PPV is perfect when you only want one scene. Fanclub is better when you want the full FLESHLAB flow — new drops, extras, updates and ongoing member content.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* PPV column */}
              <div className="bg-[#111] border border-white/8 rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/15 flex items-center justify-center">
                    <Film className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="font-black text-white text-lg">PPV</span>
                </div>
                <ul className="space-y-3">
                  {[
                    'One selected scene',
                    'Permanent access to that scene',
                    'No subscription',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-white/55 text-sm">
                      <Check className="w-4 h-4 text-amber-500/60 shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fanclub column */}
              <div className="bg-gradient-to-br from-[#1a0808] to-[#110505] border border-rose-600/35 rounded-2xl p-7 shadow-[0_0_30px_rgba(220,38,38,0.10)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-rose-600/20 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-rose-400" />
                  </div>
                  <span className="font-black text-white text-lg">Fanclub</span>
                  <Badge className="bg-rose-600/20 text-rose-300 border-rose-600/30 text-xs ml-auto">Better value</Badge>
                </div>
                <ul className="space-y-3">
                  {[
                    'Ongoing member access',
                    'Exclusive fanclub videos',
                    'Early releases',
                    'Bonus clips',
                    'Behind-the-scenes content',
                    'Performer updates',
                    'Selected member-only scenes',
                    'Better value if you want more than one scene',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-white/65 text-sm">
                      <Check className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 6. PPV SECTION                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section id="ppv-section" className="py-24 px-6">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                ONLY WANT <span className="text-rose-500">ONE SCENE?</span>
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                Unlock a single scene with permanent access. No subscription needed.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { key: 'standard',  tier: PRICING.ppv.standard },
                { key: 'premium',   tier: PRICING.ppv.premium },
                { key: 'exclusive', tier: PRICING.ppv.exclusive },
              ].map(({ key, tier }, idx) => (
                <div key={idx} className="bg-[#111] border border-white/8 rounded-2xl p-7 text-center flex flex-col">
                  <h3 className="text-base font-bold text-white/80 mb-5">{tier.label}</h3>
                  <div className="text-6xl font-black text-rose-500 mb-1">${tier.price}</div>
                  <p className="text-white/30 text-xs mb-7">Permanent access after payment confirmation.</p>
                  <div className="mt-auto">
                    <PPVUnlockCTA
                      priceTier={key}
                      label="Unlock One Scene"
                      isAuthenticated={isAuthenticated}
                      requireSignup={requireSignup}
                      paymentProvider={paymentProvider}
                      className="w-full bg-rose-600/12 hover:bg-rose-600/22 text-rose-300 border border-rose-600/30 font-bold py-3.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 7. GUEST PRODUCTION                                              */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 bg-gradient-to-b from-[#0d0d0d] to-[#080808] border-t border-white/5">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                WANT TO GO <span className="text-rose-500">BEYOND WATCHING?</span>
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                Apply for a professional 18+ studio production with verified performers.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-[#150e0e] to-[#0d0d0d] border border-rose-600/20 rounded-3xl overflow-hidden">
                {/* top bar */}
                <div className="bg-rose-950/30 border-b border-rose-600/15 px-10 py-5 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-xs font-bold tracking-widest text-rose-500/60 uppercase mb-0.5">Guest Production</div>
                    <div className="font-black text-white text-2xl">Application Required</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/35 text-xs mb-0.5">Starting from</div>
                    <div className="text-4xl font-black text-white">$999</div>
                  </div>
                </div>

                <div className="p-10">
                  <p className="text-white/50 text-sm leading-relaxed mb-8">
                    Guest Production is application-based. Every request is reviewed by the studio and depends on compliance, performer compatibility, production scope, filming time and post-production.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 mb-10">
                    {[
                      { req: true,  label: 'Application required' },
                      { req: true,  label: 'Verified 18+ only' },
                      { req: true,  label: 'Studio approval required' },
                      { req: true,  label: 'Performer approval required' },
                      { inc: true,  label: 'Legal contracts & releases' },
                      { inc: true,  label: 'Safety protocol' },
                      { inc: true,  label: 'Professional filming' },
                      { inc: true,  label: 'Post-production included' },
                    ].map(({ req, inc, label }, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${req ? 'bg-rose-600/20' : 'bg-emerald-600/15'}`}>
                          {req
                            ? <Lock className="w-2.5 h-2.5 text-rose-400" />
                            : <Check className="w-2.5 h-2.5 text-emerald-400" />
                          }
                        </div>
                        <span className="text-white/60 text-sm">{label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    <Button
                      size="lg"
                      onClick={() => isAuthenticated ? navigate('/guest-production') : requireSignup('/guest-production')}
                      className="bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-600 hover:to-rose-700 text-white font-bold px-12 py-5 rounded-xl text-base h-auto shadow-xl shadow-rose-700/25"
                    >
                      Apply for Guest Production
                    </Button>
                    {!isAuthenticated && (
                      <p className="text-white/25 text-xs mt-3">Account required before submitting application</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 8. FINAL CTA                                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6">
          <div className="relative max-w-4xl mx-auto">
            {/* glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-rose-700/12 rounded-full blur-[80px]" />
            </div>

            <div className="relative bg-gradient-to-br from-[#1a0808] to-[#0d0808] border border-rose-600/25 rounded-3xl px-10 py-16 text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-5">
                READY TO <span className="text-rose-500">ENTER?</span>
              </h2>
              <p className="text-white/55 text-lg mb-10 max-w-xl mx-auto">
                Start free, unlock one scene, or join Fanclub for the full FLESHLAB member experience.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <FanclubCTA
                  planId="fanclub_monthly"
                  label="Enter Fanclub"
                  isAuthenticated={isAuthenticated}
                  requireSignup={requireSignup}
                  paymentProvider={paymentProvider}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-4 rounded-xl text-base h-auto shadow-xl shadow-rose-600/35 min-w-[180px]"
                />
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToPPV}
                  className="border-white/20 text-white hover:bg-white/8 font-bold px-10 py-4 rounded-xl text-base h-auto min-w-[180px]"
                >
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