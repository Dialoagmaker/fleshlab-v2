import { Link, useNavigate } from "react-router-dom";

import { Lock, Check, Crown } from "lucide-react";
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

  // Fanclub CTA — planId determines which plan; monthly excluded from NOWPayments
  const FanclubCTA = ({ planId, className }) => (
    <CheckoutButton
      paymentType="fanclub"
      planId={planId}
      label={isAuthenticated ? 'Join Fanclub' : 'Create Account to Join'}
      returnUrl="/fanclub"
      cancelUrl="/fanclub"
      isAuthenticated={isAuthenticated}
      onRequireAuth={() => requireSignup('/fanclub', 'fanclub', { planId })}
      paymentProvider={paymentProvider}
      className={className}
      unavailableLabel="Secure crypto/card checkout coming soon"
    />
  );

  // PPV CTA — shown on fanclub page as tier preview
  const PPVUnlockCTA = ({ priceTier }) => (
    <CheckoutButton
      paymentType="ppv"
      priceTier={priceTier}
      label={isAuthenticated ? 'Unlock Scene' : 'Create Account to Unlock'}
      returnUrl="/videos"
      cancelUrl="/fanclub"
      isAuthenticated={isAuthenticated}
      onRequireAuth={() => requireSignup('/videos', 'ppv', { priceTier })}
      paymentProvider={paymentProvider}
      className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-600/40 font-bold py-4 rounded-xl"
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
            "eligibleRegion": {
              "@type": "Country",
              "name": "Worldwide"
            },
            "price": "12.99",
            "priceCurrency": "USD",
            "ageRestriction": "18+"
          }
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
        {/* Hero */}
        <section className="relative py-20 px-4 border-b border-white/8">
          <div className="max-w-[1280px] mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-600/50">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
              FANCLUB <span className="text-rose-500">MEMBERSHIP</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
              Choose your access level. Create a free account to get started.
            </p>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="py-20 px-4">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-4">
              CHOOSE YOUR <span className="text-rose-500">PLAN</span>
            </h2>
            <p className="text-xl text-white/60 text-center mb-12">
              Start with a free account. Upgrade to Fanclub for exclusive content.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Free Plan */}
              <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-8 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Free Account</h3>
                  <div className="mb-4">
                    <span className="text-5xl font-black text-white">$0</span>
                    <span className="text-white/60 text-lg"> forever</span>
                  </div>
                  <p className="text-white/60 text-sm">Perfect for exploring content</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {PRICING.free.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-white/80">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/register')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-6 rounded-xl text-base h-auto border border-white/20"
                >
                  Create Free Account
                </Button>
              </div>

              {/* Monthly Plan */}
              <div className="bg-gradient-to-br from-rose-900/20 to-rose-800/10 border border-rose-600/30 rounded-3xl p-8 flex flex-col relative">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Monthly</h3>
                  <div className="mb-4">
                    <span className="text-5xl font-black text-white">${PRICING.fanclub.monthly.price}</span>
                    <span className="text-white/60 text-lg">/month</span>
                  </div>
                  <p className="text-white/60 text-sm">{PRICING.fanclub.monthly.sublabel}</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {PRICING.fanclub.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-white/80">
                      <Check className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <FanclubCTA planId="fanclub_6mo" className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-6 rounded-xl text-base h-auto shadow-xl shadow-rose-600/50" />
              </div>

              {/* Annual Plan - Best Value */}
              <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-2 border-amber-600/40 rounded-3xl p-8 flex flex-col relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-600 text-white border-0 px-4 py-1.5 text-sm font-bold">
                    BEST VALUE
                  </Badge>
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">12 Months</h3>
                  <div className="mb-2">
                    <span className="text-5xl font-black text-white">${PRICING.fanclub.annual.price}</span>
                    <span className="text-white/60 text-lg">/year</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-amber-400">${PRICING.fanclub.annual.pricePerMonth}</span>
                    <span className="text-white/60 text-sm">/month</span>
                  </div>
                  <p className="text-white/60 text-sm">{PRICING.fanclub.annual.sublabel} — Save 36%</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {PRICING.fanclub.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-white/80">
                      <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <FanclubCTA planId="fanclub_annual" className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold px-8 py-6 rounded-xl text-base h-auto shadow-xl shadow-amber-600/50" />
              </div>
            </div>

            {/* 6-Month Plan - Secondary Row */}
            <div className="mt-8 max-w-md mx-auto">
              <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">6 Months</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-black text-white">${PRICING.fanclub.sixMonths.price}</span>
                    <span className="text-white/60 text-lg">/6 months</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-rose-400">${PRICING.fanclub.sixMonths.pricePerMonth}</span>
                    <span className="text-white/60 text-sm">/month</span>
                  </div>
                  <p className="text-white/60 text-sm">{PRICING.fanclub.sixMonths.sublabel} — Save 23%</p>
                </div>
                <FanclubCTA planId="fanclub_6mo" className="w-full bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-6 rounded-xl text-base h-auto border border-white/20" />
              </div>
            </div>
          </div>
        </section>

        {/* PPV Pricing */}
        <section className="py-20 px-4 bg-[#0f0f0f] border-y border-white/8">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-4">
              PREMIUM <span className="text-rose-500">PPV UNLOCKS</span>
            </h2>
            <p className="text-xl text-white/60 text-center mb-12">
              Purchase individual scenes. Permanent access after unlock.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { key: 'short_solo', tier: PRICING.ppv.short_solo },
                { key: 'standard',   tier: PRICING.ppv.standard },
                { key: 'premium',    tier: PRICING.ppv.premium },
              ].map(({ key, tier }, idx) => (
                <div key={idx} className="bg-[#0a0a0a] border border-white/8 rounded-2xl p-6 text-center">
                  <h3 className="text-lg font-bold text-white mb-3">{tier.label}</h3>
                  <div className="text-4xl font-black text-rose-500 mb-4">${tier.price}</div>
                  <PPVUnlockCTA priceTier={key} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guest Production */}
        <section className="py-20 px-4">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-4">
              GUEST <span className="text-rose-500">PRODUCTION</span>
            </h2>
            <p className="text-xl text-white/60 text-center mb-12">
              Professional 18+ studio productions with verified performers.
            </p>
            
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-rose-900/20 to-rose-800/10 border border-rose-600/30 rounded-3xl p-10">
              <div className="text-center mb-8">
                <div className="flex items-baseline gap-3 justify-center mb-4">
                  <span className="text-6xl font-black text-white">$999</span>
                  <span className="text-white/60 text-2xl">starting</span>
                </div>
                <p className="text-white/70 leading-relaxed max-w-2xl mx-auto">
                  Final quote depends on production scope, compliance, filming time, performer compatibility and post-production.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  {[
                    'Application required',
                    'Verified 18+ only',
                    'Studio approval required',
                    'Performer approval required'
                  ].map((req, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-rose-600/30 rounded-full flex items-center justify-center">
                        <Lock className="w-3 h-3 text-rose-400" />
                      </div>
                      <span className="text-white/80 text-sm">{req}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[
                    'Professional studio filming',
                    'Legal contracts & releases',
                    'Safety protocols',
                    'Post-production included'
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-rose-600/30 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-rose-400" />
                      </div>
                      <span className="text-white/80 text-sm">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  size="lg"
                  onClick={() => requireSignup('/guest-production')}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-6 rounded-xl text-lg h-auto shadow-xl shadow-rose-600/50"
                >
                  {isAuthenticated ? 'Request Guest Production Quote' : 'Create Account to Apply'}
                </Button>
                {!isAuthenticated && (
                  <p className="text-white/50 text-sm mt-4">
                    Account required before application
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 px-4 bg-[#0f0f0f] border-y border-white/8">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-12">
              COMPARE <span className="text-rose-500">ACCESS LEVELS</span>
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full max-w-4xl mx-auto">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left py-4 px-6 text-white/60 font-medium">Feature</th>
                    <th className="text-center py-4 px-6 text-white font-bold">Free</th>
                    <th className="text-center py-4 px-6 text-rose-400 font-bold">Fanclub</th>
                    <th className="text-center py-4 px-6 text-amber-400 font-bold">PPV</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Public performer profiles', free: true, fanclub: true, ppv: true },
                    { feature: 'Free previews/trailers', free: true, fanclub: true, ppv: true },
                    { feature: 'Selected free videos', free: true, fanclub: true, ppv: true },
                    { feature: 'Fanclub videos', free: false, fanclub: true, ppv: false },
                    { feature: 'Early releases', free: false, fanclub: true, ppv: false },
                    { feature: 'Behind the scenes', free: false, fanclub: true, ppv: false },
                    { feature: 'PPV scene unlocks', free: false, fanclub: false, ppv: true },
                    { feature: 'Guest Production application', free: true, fanclub: true, ppv: true }
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-white/5">
                      <td className="py-4 px-6 text-white/80">{row.feature}</td>
                      <td className="text-center py-4 px-6">
                        {row.free ? (
                          <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="text-center py-4 px-6 bg-rose-600/5">
                        <Check className="w-5 h-5 text-rose-500 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-6">
                        {row.ppv ? (
                          <Check className="w-5 h-5 text-amber-500 mx-auto" />
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              READY TO <span className="text-rose-500">GET STARTED</span>?
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Create your free account. Choose your access level.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-6 rounded-full text-lg h-auto shadow-xl shadow-rose-600/50">
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}