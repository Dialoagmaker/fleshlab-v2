import { Link, useNavigate } from "react-router-dom";
import { Lock, Check, Crown, Shield, Play, Star, Zap } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useAccessControl, PRICING } from "@/lib/useAccessControl";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePaymentProvider } from "@/hooks/usePaymentProvider";
import CheckoutButton from "@/components/payment/CheckoutButton";

export default function Fanclub() {
  const { isAuthenticated } = useAuth();
  const { requireSignup } = useAccessControl();
  const navigate = useNavigate();
  const paymentProvider = usePaymentProvider();

  const FanclubCTA = ({ planId, className, label }) => (
    <CheckoutButton
      paymentType="fanclub"
      planId={planId}
      label={label || (isAuthenticated ? 'Join Fanclub' : 'Create Account to Join')}
      returnUrl="/fanclub"
      cancelUrl="/fanclub"
      isAuthenticated={isAuthenticated}
      onRequireAuth={() => requireSignup('/fanclub', 'fanclub', { planId })}
      paymentProvider={paymentProvider}
      className={className}
      unavailableLabel="Secure crypto checkout coming soon"
    />
  );

  const PPVUnlockCTA = ({ priceTier, className }) => (
    <CheckoutButton
      paymentType="ppv"
      priceTier={priceTier}
      label={isAuthenticated ? 'Unlock Scene' : 'Create Account to Unlock'}
      returnUrl="/videos"
      cancelUrl="/fanclub"
      isAuthenticated={isAuthenticated}
      onRequireAuth={() => requireSignup('/videos', 'ppv', { priceTier })}
      paymentProvider={paymentProvider}
      className={className || "w-full"}
      unavailableLabel="PPV unlock coming soon"
    />
  );

  return (
    <>
      <SEOMeta
        title="FLESHLAB Fanclub Pricing | Exclusive Gay Videos & Creator Access"
        description="Join FLESHLAB Fanclub for exclusive gay videos, full-length gay videos, premium gay content, creator access, behind-the-scenes content and exclusive studio productions. Free public previews available."
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
            "description": "Monthly membership for exclusive content access",
            "category": "Adult Entertainment",
            "availability": "https://schema.org/InStock",
            "price": "12.99",
            "priceCurrency": "USD",
            "ageRestriction": "18+"
          }
        }}
      />

      <div className="min-h-screen bg-[#080808]">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative py-28 px-4 overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-rose-600/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-600/30 rounded-full px-4 py-1.5 mb-8">
              <Crown className="w-4 h-4 text-rose-400" />
              <span className="text-rose-300 text-sm font-semibold tracking-wide uppercase">Fanclub Membership</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight">
              UNLOCK THE FULL<br />
              <span className="text-rose-500">FLESHLAB EXPERIENCE</span>
            </h1>

            <p className="text-lg md:text-xl text-white/65 max-w-2xl mx-auto mb-10 leading-relaxed">
              Get exclusive scenes, early releases, behind-the-scenes content, performer updates and member-only access from verified FLESHLAB performers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <FanclubCTA
                planId="fanclub_monthly"
                label={isAuthenticated ? 'Join Fanclub' : 'Join Fanclub'}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-4 rounded-xl text-base h-auto shadow-xl shadow-rose-600/40 min-w-[200px]"
              />
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  document.getElementById('ppv-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-white/20 text-white hover:bg-white/10 font-bold px-10 py-4 rounded-xl text-base h-auto min-w-[200px]"
              >
                <Play className="w-4 h-4 mr-2" />
                Unlock Single Scene
              </Button>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/40 text-sm">
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-rose-500/70" /> Verified 18+ performers</span>
              <span className="text-white/20 hidden sm:block">·</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-rose-500/70" /> Secure crypto checkout</span>
              <span className="text-white/20 hidden sm:block">·</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-rose-500/70" /> Instant access after payment confirmation</span>
            </div>
          </div>
        </section>

        {/* ── FANCLUB PLANS ──────────────────────────────────────────────── */}
        <section className="py-20 px-4">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                CHOOSE YOUR <span className="text-rose-500">PLAN</span>
              </h2>
              <p className="text-lg text-white/55 max-w-xl mx-auto">
                Start free. Upgrade to Fanclub for full access to exclusive content.
              </p>
            </div>

            {/* 4-column grid: Free, Monthly (featured), 6 Months, 12 Months */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">

              {/* Free */}
              <div className="bg-[#111] border border-white/8 rounded-2xl p-7 flex flex-col">
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white mb-3">Free Account</h3>
                  <div className="mb-3">
                    <span className="text-5xl font-black text-white">$0</span>
                    <span className="text-white/50 text-base ml-1">forever</span>
                  </div>
                  <p className="text-white/50 text-sm">Perfect for exploring content.</p>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {PRICING.free.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-white/65 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="w-full bg-white/8 hover:bg-white/15 text-white font-bold rounded-xl h-auto py-3.5 border border-white/15"
                >
                  Create Free Account
                </Button>
              </div>

              {/* Monthly — FEATURED */}
              <div className="relative bg-gradient-to-br from-[#1a0808] to-[#120606] border-2 border-rose-600/60 rounded-2xl p-7 flex flex-col shadow-[0_0_50px_rgba(220,38,38,0.18)]">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-rose-600 text-white border-0 px-4 py-1 text-xs font-bold tracking-wide uppercase shadow-lg">
                    MOST POPULAR
                  </Badge>
                </div>
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white mb-3">Monthly Fanclub</h3>
                  <div className="mb-3">
                    <span className="text-5xl font-black text-white">${PRICING.fanclub.monthly.price}</span>
                    <span className="text-white/50 text-base ml-1">/month</span>
                  </div>
                  <p className="text-white/60 text-sm">Best for full access without long commitment.</p>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {PRICING.fanclub.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-white/80 text-sm">
                      <Check className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <FanclubCTA
                  planId="fanclub_monthly"
                  className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl h-auto py-3.5 shadow-lg shadow-rose-600/30"
                />
              </div>

              {/* 6 Months */}
              <div className="bg-[#111] border border-white/8 rounded-2xl p-7 flex flex-col">
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white mb-3">6 Months</h3>
                  <div className="mb-1">
                    <span className="text-5xl font-black text-white">${PRICING.fanclub.sixMonths.price}</span>
                    <span className="text-white/50 text-base ml-1">/6 months</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-xl font-bold text-rose-400">${PRICING.fanclub.sixMonths.pricePerMonth}</span>
                    <span className="text-white/45 text-sm">/month</span>
                  </div>
                  <p className="text-white/50 text-sm">Save compared to monthly. Ideal for regular fans.</p>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {PRICING.fanclub.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-white/65 text-sm">
                      <Check className="w-4 h-4 text-rose-500/70 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <FanclubCTA
                  planId="fanclub_6mo"
                  className="w-full bg-white/8 hover:bg-white/15 text-white font-bold rounded-xl h-auto py-3.5 border border-white/15"
                />
              </div>

              {/* 12 Months — BEST VALUE */}
              <div className="relative bg-gradient-to-br from-[#1a1200] to-[#111] border-2 border-amber-600/50 rounded-2xl p-7 flex flex-col shadow-[0_0_40px_rgba(217,119,6,0.12)]">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-600 text-white border-0 px-4 py-1 text-xs font-bold tracking-wide uppercase shadow-lg">
                    BEST VALUE
                  </Badge>
                </div>
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white mb-3">12 Months</h3>
                  <div className="mb-1">
                    <span className="text-5xl font-black text-white">${PRICING.fanclub.annual.price}</span>
                    <span className="text-white/50 text-base ml-1">/year</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-xl font-bold text-amber-400">${PRICING.fanclub.annual.pricePerMonth}</span>
                    <span className="text-white/45 text-sm">/month</span>
                  </div>
                  <p className="text-white/50 text-sm">Best value for long-term members. Save 36%.</p>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {PRICING.fanclub.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-white/80 text-sm">
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <FanclubCTA
                  planId="fanclub_annual"
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl h-auto py-3.5 shadow-lg shadow-amber-600/25"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── BENEFITS STRIP ──────────────────────────────────────────────── */}
        <section className="py-12 px-4 border-y border-white/6">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Play,   title: 'Exclusive Videos',        desc: 'Full-length scenes unavailable anywhere else.' },
              { icon: Zap,    title: 'Early Releases',          desc: 'Get new content before it goes public.' },
              { icon: Star,   title: 'Behind the Scenes',       desc: 'Raw footage and production content.' },
              { icon: Crown,  title: 'Member-Only Updates',     desc: 'Direct performer posts and announcements.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="flex gap-4 items-start bg-[#111] border border-white/6 rounded-xl p-5">
                <div className="w-9 h-9 rounded-lg bg-rose-600/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-rose-400" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm mb-1">{title}</div>
                  <div className="text-white/50 text-xs leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PPV SECTION ──────────────────────────────────────────────────── */}
        <section id="ppv-section" className="py-24 px-4">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                UNLOCK <span className="text-rose-500">SINGLE SCENES</span>
              </h2>
              <p className="text-lg text-white/55 max-w-xl mx-auto">
                No subscription needed. Buy once and keep access permanently.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { key: 'standard',  tier: PRICING.ppv.standard },
                { key: 'premium',   tier: PRICING.ppv.premium },
                { key: 'exclusive', tier: PRICING.ppv.exclusive },
              ].map(({ key, tier }, idx) => (
                <div key={idx} className="bg-[#111] border border-white/8 rounded-2xl p-7 text-center flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-4">{tier.label}</h3>
                  <div className="text-5xl font-black text-rose-500 mb-2">${tier.price}</div>
                  <p className="text-white/40 text-xs mb-6">Permanent access after payment confirmation.</p>
                  <div className="mt-auto">
                    <PPVUnlockCTA priceTier={key} className="w-full bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-600/35 font-bold py-3.5 rounded-xl text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONVERSION CTA STRIP ──────────────────────────────────────── */}
        <section className="py-16 px-4 bg-gradient-to-r from-rose-950/40 via-[#0f0808] to-rose-950/40 border-y border-rose-600/15">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Ready to unlock more?
            </h2>
            <p className="text-white/60 text-lg mb-8">
              Join Fanclub for the best value, or unlock a single scene with permanent PPV access.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <FanclubCTA
                planId="fanclub_monthly"
                label={isAuthenticated ? 'Join Fanclub' : 'Join Fanclub'}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-4 rounded-xl text-base h-auto shadow-xl shadow-rose-600/30 min-w-[180px]"
              />
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('ppv-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-white/20 text-white hover:bg-white/10 font-bold px-10 py-4 rounded-xl text-base h-auto min-w-[180px]"
              >
                Unlock Single Scene
              </Button>
            </div>
          </div>
        </section>

        {/* ── GUEST PRODUCTION ──────────────────────────────────────────── */}
        <section className="py-24 px-4">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                GUEST <span className="text-rose-500">PRODUCTION</span>
              </h2>
              <p className="text-lg text-white/55 max-w-xl mx-auto">
                Apply to participate in a professional 18+ studio production with verified performers.
              </p>
            </div>

            <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#130d0d] to-[#0d0d0d] border border-rose-600/25 rounded-3xl p-10">
              <div className="text-center mb-10">
                <div className="flex items-baseline gap-3 justify-center mb-3">
                  <span className="text-7xl font-black text-white">$999</span>
                  <span className="text-white/50 text-2xl">starting</span>
                </div>
                <p className="text-white/55 leading-relaxed max-w-2xl mx-auto text-sm">
                  Final quote depends on production scope, compliance, filming time, performer compatibility and post-production.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-10">
                {[
                  { icon: Lock,   label: 'Application required' },
                  { icon: Shield, label: 'Verified 18+ only' },
                  { icon: Lock,   label: 'Studio approval required' },
                  { icon: Lock,   label: 'Performer approval required' },
                  { icon: Check,  label: 'Professional studio filming' },
                  { icon: Check,  label: 'Legal contracts & releases' },
                  { icon: Check,  label: 'Safety protocols' },
                  { icon: Check,  label: 'Post-production included' },
                ].map(({ icon: Icon, label }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-rose-600/20 rounded-full flex items-center justify-center shrink-0">
                      <Icon className="w-3 h-3 text-rose-400" />
                    </div>
                    <span className="text-white/70 text-sm">{label}</span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  onClick={() => requireSignup('/guest-production')}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-12 py-5 rounded-xl text-base h-auto shadow-xl shadow-rose-600/30"
                >
                  {isAuthenticated ? 'Apply for Guest Production' : 'Create Account to Apply'}
                </Button>
                {!isAuthenticated && (
                  <p className="text-white/35 text-xs mt-3">Account required before submitting application</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ──────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-[#0d0d0d] border-t border-white/6">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-14">
              COMPARE <span className="text-rose-500">ACCESS LEVELS</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full max-w-4xl mx-auto">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left py-4 px-6 text-white/50 font-medium text-sm">Feature</th>
                    <th className="text-center py-4 px-6 text-white font-bold">Free</th>
                    <th className="text-center py-4 px-6 text-rose-400 font-bold">Fanclub</th>
                    <th className="text-center py-4 px-6 text-amber-400 font-bold">PPV</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Public performer profiles',    free: true,  fanclub: true,  ppv: true  },
                    { feature: 'Free previews / trailers',     free: true,  fanclub: true,  ppv: true  },
                    { feature: 'Selected free videos',         free: true,  fanclub: true,  ppv: true  },
                    { feature: 'Fanclub exclusive videos',     free: false, fanclub: true,  ppv: false },
                    { feature: 'Early releases',               free: false, fanclub: true,  ppv: false },
                    { feature: 'Behind the scenes',            free: false, fanclub: true,  ppv: false },
                    { feature: 'PPV scene unlocks',            free: false, fanclub: false, ppv: true  },
                    { feature: 'Guest Production application', free: true,  fanclub: true,  ppv: true  },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-white/5">
                      <td className="py-4 px-6 text-white/70 text-sm">{row.feature}</td>
                      <td className="text-center py-4 px-6">
                        {row.free ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-white/20 text-lg">—</span>}
                      </td>
                      <td className="text-center py-4 px-6 bg-rose-600/4">
                        {row.fanclub ? <Check className="w-4 h-4 text-rose-500 mx-auto" /> : <span className="text-white/20 text-lg">—</span>}
                      </td>
                      <td className="text-center py-4 px-6">
                        {row.ppv ? <Check className="w-4 h-4 text-amber-500 mx-auto" /> : <span className="text-white/20 text-lg">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
        <section className="py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">
              READY TO <span className="text-rose-500">GET STARTED</span>?
            </h2>
            <p className="text-lg text-white/60 mb-10">
              Create your free account. Choose your access level. No hidden fees.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-12 py-5 rounded-full text-lg h-auto shadow-xl shadow-rose-600/40">
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}